import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import type { IdempotencyScope } from '../idempotency/idempotency.types';
import { OptimisticVersionService } from '../versioning/optimistic-version.service';
import { PurchaseRequestsRepository } from './purchase-requests.repository';
import { PurchaseRequestWorkflowService } from './purchase-request-workflow.service';
import type {
  CreatePurchaseRequestBody,
  PurchaseRequestListCursor,
  PurchaseRequestListResult,
  PurchaseRequestRecord,
  PurchaseRequestTaskListResult,
  PurchaseRequestStatus,
} from './purchase-requests.types';

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly repository: PurchaseRequestsRepository,
    private readonly idempotency: IdempotencyService,
    private readonly optimisticVersion: OptimisticVersionService,
    private readonly workflow: PurchaseRequestWorkflowService,
    private readonly audit: AuditService,
  ) {}

  async create(input: {
    tenantId: string;
    applicationId: string;
    actorMembershipId: string;
    idempotencyKey: string;
    body: CreatePurchaseRequestBody;
  }): Promise<PurchaseRequestRecord> {
    await this.requireFeature(input.tenantId, input.applicationId);

    const scope = this.scope(
      input,
      'erp.purchase_requests.requests.create',
      input.idempotencyKey,
    );
    const payload = { applicationId: input.applicationId, ...input.body };
    const claim = await this.idempotency.claim(scope, payload);
    if (claim.kind === 'replay')
      return claim.responseBody as PurchaseRequestRecord;

    try {
      const request = await this.repository.create({
        tenantId: input.tenantId,
        applicationId: input.applicationId,
        requesterMembershipId: input.actorMembershipId,
        body: input.body,
      });
      if (!request) {
        throw new ConflictException({
          error: {
            code: 'PURCHASE_REQUEST_CONTEXT_INVALID',
            message:
              'The business record must belong to the published application version.',
          },
        });
      }

      await this.idempotency.complete(scope, payload, 201, request);
      return request;
    } catch (error) {
      await this.completeFailure(scope, payload, error);
      throw error;
    }
  }

  async get(input: {
    tenantId: string;
    applicationId: string;
    purchaseRequestId: string;
  }): Promise<PurchaseRequestRecord> {
    await this.requireFeature(input.tenantId, input.applicationId);
    const request = await this.repository.findById(
      input.tenantId,
      input.applicationId,
      input.purchaseRequestId,
    );
    if (!request) {
      throw new NotFoundException({
        error: {
          code: 'PURCHASE_REQUEST_NOT_FOUND',
          message:
            'The purchase request was not found in the selected application.',
        },
      });
    }
    return request;
  }

  async list(input: {
    tenantId: string;
    applicationId: string;
    limit: number;
    status?: PurchaseRequestStatus;
    cursor?: PurchaseRequestListCursor;
  }): Promise<PurchaseRequestListResult> {
    await this.requireFeature(input.tenantId, input.applicationId);
    return this.repository.list(input);
  }

  async history(input: {
    tenantId: string;
    applicationId: string;
    purchaseRequestId: string;
  }) {
    await this.get(input);
    return this.audit.findByResource(
      input.tenantId,
      'purchase_request',
      input.purchaseRequestId,
    );
  }

  async listTasks(input: {
    tenantId: string;
    applicationId: string;
    membershipId: string;
  }): Promise<PurchaseRequestTaskListResult> {
    await this.requireFeature(input.tenantId, input.applicationId);
    return this.workflow.listOpenPurchaseRequestTasks(input);
  }

  async submit(
    input: PurchaseRequestActionInput,
  ): Promise<PurchaseRequestRecord> {
    return this.transition(input, {
      action: 'erp.purchase_requests.requests.submit',
      fromStatus: 'draft',
      toStatus: 'submitted',
    });
  }

  async approve(
    input: PurchaseRequestActionInput,
  ): Promise<PurchaseRequestRecord> {
    return this.transition(input, {
      action: 'erp.purchase_requests.requests.approve',
      fromStatus: 'submitted',
      toStatus: 'approved',
      requiresDifferentApprover: true,
    });
  }

  async reject(
    input: PurchaseRequestActionInput & { reason: string },
  ): Promise<PurchaseRequestRecord> {
    return this.transition(input, {
      action: 'erp.purchase_requests.requests.reject',
      fromStatus: 'submitted',
      toStatus: 'rejected',
      requiresDifferentApprover: true,
      rejectionReason: input.reason,
    });
  }

  private async transition(
    input: PurchaseRequestActionInput,
    config: {
      action: string;
      fromStatus: PurchaseRequestRecord['status'];
      toStatus: PurchaseRequestRecord['status'];
      requiresDifferentApprover?: boolean;
      rejectionReason?: string;
    },
  ): Promise<PurchaseRequestRecord> {
    await this.requireFeature(input.tenantId, input.applicationId);
    const scope = this.scope(input, config.action, input.idempotencyKey);
    const payload = {
      applicationId: input.applicationId,
      purchaseRequestId: input.purchaseRequestId,
      expectedVersion: input.expectedVersion,
      ...(config.rejectionReason ? { reason: config.rejectionReason } : {}),
    };
    const claim = await this.idempotency.claim(scope, payload);
    if (claim.kind === 'replay') {
      return claim.responseBody as PurchaseRequestRecord;
    }

    try {
      const current = await this.repository.findById(
        input.tenantId,
        input.applicationId,
        input.purchaseRequestId,
      );
      if (!current) {
        throw new NotFoundException({
          error: {
            code: 'PURCHASE_REQUEST_NOT_FOUND',
            message:
              'The purchase request was not found in the selected application.',
          },
        });
      }
      if (current.status !== config.fromStatus) {
        throw new ConflictException({
          error: {
            code: 'INVALID_PURCHASE_REQUEST_STATUS',
            message: `The request must be ${config.fromStatus} before it can be ${config.toStatus}.`,
          },
        });
      }
      if (
        config.requiresDifferentApprover &&
        current.requesterMembershipId === input.actorMembershipId
      ) {
        throw new ForbiddenException({
          error: {
            code: 'PURCHASE_REQUEST_SELF_APPROVAL',
            message:
              'The requester cannot approve or reject their own request.',
          },
        });
      }

      if (config.requiresDifferentApprover) {
        await this.workflow.completeDecisionIfConfigured({
          tenantId: input.tenantId,
          applicationId: input.applicationId,
          applicationVersionId: current.applicationVersionId,
          purchaseRequestId: current.id,
          businessRecordId: current.businessRecordId,
          requesterMembershipId: current.requesterMembershipId,
          actorMembershipId: input.actorMembershipId,
          decision: config.toStatus === 'approved' ? 'approved' : 'rejected',
          ...(config.rejectionReason
            ? { rejectionReason: config.rejectionReason }
            : {}),
        });
      }

      const updated = await this.optimisticVersion.update({
        expectedVersion: input.expectedVersion,
        updateIfVersionMatches: (expectedVersion) =>
          this.repository.transitionIfVersionMatches({
            tenantId: input.tenantId,
            applicationId: input.applicationId,
            purchaseRequestId: input.purchaseRequestId,
            expectedVersion,
            fromStatus: config.fromStatus,
            toStatus: config.toStatus,
            approverMembershipId: config.requiresDifferentApprover
              ? input.actorMembershipId
              : undefined,
            rejectionReason: config.rejectionReason,
          }),
        getCurrentVersion: () =>
          this.repository.currentVersion(
            input.tenantId,
            input.applicationId,
            input.purchaseRequestId,
          ),
      });
      if (config.toStatus === 'submitted') {
        await this.workflow.startIfConfigured({
          tenantId: input.tenantId,
          applicationId: input.applicationId,
          applicationVersionId: updated.applicationVersionId,
          purchaseRequestId: updated.id,
          businessRecordId: updated.businessRecordId,
          requesterMembershipId: updated.requesterMembershipId,
        });
      }
      await this.idempotency.complete(scope, payload, 200, updated);
      return updated;
    } catch (error) {
      await this.completeFailure(scope, payload, error);
      throw error;
    }
  }

  private async requireFeature(
    tenantId: string,
    applicationId: string,
  ): Promise<void> {
    const status = await this.repository.getPublishedFeatureStatus(
      tenantId,
      applicationId,
    );
    if (status === 'missing') {
      throw new ConflictException({
        error: {
          code: 'APP_VERSION_NOT_PUBLISHED',
          message: 'A published application version is required.',
        },
      });
    }
    if (status === 'disabled') {
      throw new ConflictException({
        error: {
          code: 'FEATURE_NOT_ENABLED',
          message:
            'The erp.purchase_requests feature is not enabled in the published application version.',
        },
      });
    }
  }

  private scope(
    input: {
      tenantId: string;
      applicationId: string;
      actorMembershipId: string;
    },
    action: string,
    idempotencyKey: string,
  ): IdempotencyScope {
    return {
      tenantId: input.tenantId,
      applicationId: input.applicationId,
      actorMembershipId: input.actorMembershipId,
      action,
      idempotencyKey,
    };
  }

  private async completeFailure(
    scope: IdempotencyScope,
    payload: unknown,
    error: unknown,
  ): Promise<void> {
    const exception = error as {
      getStatus?: () => number;
      getResponse?: () => unknown;
    };
    const status = exception.getStatus?.() ?? 500;
    const response = exception.getResponse?.() ?? {
      error: { code: 'INTERNAL_ERROR', message: 'Request failed.' },
    };
    await this.idempotency.fail(scope, payload, status, response);
  }
}

interface PurchaseRequestActionInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly actorMembershipId: string;
  readonly purchaseRequestId: string;
  readonly idempotencyKey: string;
  readonly expectedVersion: number;
}
