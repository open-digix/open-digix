import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdempotencyService } from '../idempotency/idempotency.service';
import type { IdempotencyScope } from '../idempotency/idempotency.types';
import { OptimisticVersionService } from '../versioning/optimistic-version.service';
import { MaterialsRepository } from './materials.repository';
import type {
  CreateMaterialBody,
  UpdateMaterialNoteBody,
} from './materials.input';
import type {
  MaterialListCursor,
  MaterialListResult,
  MaterialRecord,
} from './materials.types';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly repository: MaterialsRepository,
    private readonly idempotency: IdempotencyService,
    private readonly optimisticVersion: OptimisticVersionService,
  ) {}

  async create(input: {
    tenantId: string;
    applicationId: string;
    actorMembershipId: string;
    idempotencyKey: string;
    body: CreateMaterialBody;
  }): Promise<MaterialRecord> {
    await this.requireFeature(input.tenantId, input.applicationId);

    const scope = this.scope(
      input,
      'erp.materials.materials.create',
      input.idempotencyKey,
    );
    const payload = { applicationId: input.applicationId, ...input.body };
    const claim = await this.idempotency.claim(scope, payload);
    if (claim.kind === 'replay') return claim.responseBody as MaterialRecord;

    try {
      const material = await this.repository.create({
        tenantId: input.tenantId,
        applicationId: input.applicationId,
        createdByMembershipId: input.actorMembershipId,
        ...input.body,
        note: input.body.note ?? null,
      });
      if (!material) {
        throw new ConflictException({
          error: {
            code: 'APP_VERSION_NOT_PUBLISHED',
            message: 'A published application version is required.',
          },
        });
      }

      await this.idempotency.complete(scope, payload, 201, material);
      return material;
    } catch (error) {
      const normalizedError = normalizeMaterialError(error);
      await this.completeFailure(scope, payload, normalizedError);
      throw normalizedError;
    }
  }

  list(input: {
    tenantId: string;
    applicationId: string;
    limit: number;
    cursor?: MaterialListCursor;
  }): Promise<MaterialListResult> {
    return this.requireFeature(input.tenantId, input.applicationId).then(() =>
      this.repository.list(
        input.tenantId,
        input.applicationId,
        input.limit,
        input.cursor,
      ),
    );
  }

  async get(input: {
    tenantId: string;
    applicationId: string;
    materialId: string;
  }): Promise<MaterialRecord> {
    await this.requireFeature(input.tenantId, input.applicationId);

    const material = await this.repository.findById(
      input.tenantId,
      input.applicationId,
      input.materialId,
    );
    if (!material) {
      throw new NotFoundException({
        error: {
          code: 'MATERIAL_NOT_FOUND',
          message: 'The material was not found in the selected application.',
        },
      });
    }
    return material;
  }

  async updateNote(input: {
    tenantId: string;
    applicationId: string;
    actorMembershipId: string;
    materialId: string;
    idempotencyKey: string;
    body: UpdateMaterialNoteBody;
  }): Promise<MaterialRecord> {
    await this.requireFeature(input.tenantId, input.applicationId);

    const scope = this.scope(
      input,
      'erp.materials.materials.update_note',
      input.idempotencyKey,
    );
    const payload = {
      applicationId: input.applicationId,
      materialId: input.materialId,
      ...input.body,
    };
    const claim = await this.idempotency.claim(scope, payload);
    if (claim.kind === 'replay') return claim.responseBody as MaterialRecord;

    try {
      const material = await this.optimisticVersion.update({
        expectedVersion: input.body.expectedVersion,
        updateIfVersionMatches: (expectedVersion) =>
          this.repository.updateNoteIfVersionMatches({
            tenantId: input.tenantId,
            applicationId: input.applicationId,
            materialId: input.materialId,
            note: input.body.note,
            expectedVersion,
          }),
        getCurrentVersion: () =>
          this.repository.currentVersion(
            input.tenantId,
            input.applicationId,
            input.materialId,
          ),
      });
      await this.idempotency.complete(scope, payload, 200, material);
      return material;
    } catch (error) {
      const normalizedError = normalizeMaterialError(error);
      await this.completeFailure(scope, payload, normalizedError);
      throw normalizedError;
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

  private async requireFeature(
    tenantId: string,
    applicationId: string,
  ): Promise<void> {
    const status = await this.repository.getPublishedFeatureStatus(
      tenantId,
      applicationId,
      'erp.materials',
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
            'The erp.materials feature is not enabled in the published application version.',
        },
      });
    }
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

function normalizeMaterialError(error: unknown): unknown {
  const databaseError = error as { code?: string; constraint?: string };
  if (
    databaseError.code === '23505' &&
    databaseError.constraint === 'materials_tenant_app_sku_unique'
  ) {
    return new ConflictException({
      error: {
        code: 'MATERIAL_SKU_TAKEN',
        message: 'The SKU is already used in the selected application.',
      },
    });
  }
  return error;
}
