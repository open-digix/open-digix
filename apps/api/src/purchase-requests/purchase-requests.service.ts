import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdempotencyService } from '../idempotency/idempotency.service';
import type { IdempotencyScope } from '../idempotency/idempotency.types';
import { PurchaseRequestsRepository } from './purchase-requests.repository';
import type {
  CreatePurchaseRequestBody,
  PurchaseRequestRecord,
} from './purchase-requests.types';

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly repository: PurchaseRequestsRepository,
    private readonly idempotency: IdempotencyService,
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
