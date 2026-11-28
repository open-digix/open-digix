import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdempotencyService } from '../idempotency/idempotency.service';
import type { IdempotencyScope } from '../idempotency/idempotency.types';
import { InventoryRepository } from './inventory.repository';
import type {
  InventoryReceiptRecord,
  StockListCursor,
  StockListResult,
} from './inventory.types';

@Injectable()
export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly idempotency: IdempotencyService,
  ) {}

  async receive(input: {
    tenantId: string;
    applicationId: string;
    actorMembershipId: string;
    idempotencyKey: string;
    requestId: string;
    expectedVersion: number;
  }): Promise<InventoryReceiptRecord> {
    await this.requireFeature(input.tenantId, input.applicationId);
    const scope = this.scope(
      input,
      'erp.inventory.receipts.receive',
      input.idempotencyKey,
    );
    const payload = {
      applicationId: input.applicationId,
      requestId: input.requestId,
      expectedVersion: input.expectedVersion,
    };
    const claim = await this.idempotency.claim(scope, payload);
    if (claim.kind === 'replay') {
      return claim.responseBody as InventoryReceiptRecord;
    }

    try {
      const receipt = await this.repository.receive({
        tenantId: input.tenantId,
        applicationId: input.applicationId,
        requestId: input.requestId,
        expectedVersion: input.expectedVersion,
        receivedByMembershipId: input.actorMembershipId,
      });
      if (!receipt) {
        throw new ConflictException({
          error: {
            code: 'PURCHASE_REQUEST_NOT_RECEIVABLE',
            message:
              'The purchase request must be approved and use its current version before receiving.',
          },
        });
      }
      await this.idempotency.complete(scope, payload, 201, receipt);
      return receipt;
    } catch (error) {
      const normalized = normalizeInventoryError(error);
      await this.completeFailure(scope, payload, normalized);
      throw normalized;
    }
  }

  async get(input: {
    tenantId: string;
    applicationId: string;
    receiptId: string;
  }): Promise<InventoryReceiptRecord> {
    await this.requireFeature(input.tenantId, input.applicationId);
    const receipt = await this.repository.findById(
      input.tenantId,
      input.applicationId,
      input.receiptId,
    );
    if (!receipt) {
      throw new NotFoundException({
        error: {
          code: 'RECEIPT_NOT_FOUND',
          message: 'The receipt was not found in the selected application.',
        },
      });
    }
    return receipt;
  }

  async listStock(input: {
    tenantId: string;
    applicationId: string;
    limit: number;
    materialId?: string;
    cursor?: StockListCursor;
  }): Promise<StockListResult> {
    await this.requireFeature(input.tenantId, input.applicationId);
    return this.repository.listStock(
      input.tenantId,
      input.applicationId,
      input.limit,
      input.materialId,
      input.cursor,
    );
  }

  private async requireFeature(tenantId: string, applicationId: string) {
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
            'The erp.inventory feature is not enabled in the published application version.',
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
    await this.idempotency.fail(
      scope,
      payload,
      exception.getStatus?.() ?? 500,
      exception.getResponse?.() ?? {
        error: { code: 'INTERNAL_ERROR', message: 'Request failed.' },
      },
    );
  }
}

function normalizeInventoryError(error: unknown): unknown {
  const databaseError = error as { code?: string; constraint?: string };
  if (
    databaseError.code === '23505' &&
    databaseError.constraint === 'inventory_receipts_request_unique'
  ) {
    return new ConflictException({
      error: {
        code: 'RECEIPT_ALREADY_EXISTS',
        message: 'The purchase request has already been received.',
      },
    });
  }
  return error;
}
