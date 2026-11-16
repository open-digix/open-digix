import { BadRequestException } from '@nestjs/common';
import type {
  BuilderApplicationDefinitionV1,
  BuilderDesignMetadata,
} from './builder.types';

export interface PatchDraftInput {
  readonly lockVersion: number;
  readonly definition: BuilderApplicationDefinitionV1;
  readonly designMetadata?: BuilderDesignMetadata;
}

export function parsePatchDraftBody(body: unknown): PatchDraftInput {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_INPUT',
        message: 'Request body must be a JSON object.',
      },
    });
  }

  const record = body as Record<string, unknown>;

  if (record.lockVersion === undefined || record.lockVersion === null) {
    throw new BadRequestException({
      error: {
        code: 'MISSING_LOCK_VERSION',
        message: 'lockVersion is required.',
      },
    });
  }

  const rawLock = record.lockVersion;
  const lockVersion =
    typeof rawLock === 'number'
      ? rawLock
      : typeof rawLock === 'string'
        ? parseInt(rawLock.trim(), 10)
        : NaN;

  if (!Number.isInteger(lockVersion) || lockVersion <= 0) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_LOCK_VERSION',
        message: 'lockVersion must be a positive integer.',
      },
    });
  }

  if (
    record.definition === undefined ||
    record.definition === null ||
    typeof record.definition !== 'object' ||
    Array.isArray(record.definition)
  ) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_DEFINITION',
        message: 'definition must be a JSON object.',
      },
    });
  }

  let designMetadata: BuilderDesignMetadata | undefined;
  if (record.designMetadata !== undefined && record.designMetadata !== null) {
    if (
      typeof record.designMetadata !== 'object' ||
      Array.isArray(record.designMetadata)
    ) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_DESIGN_METADATA',
          message: 'designMetadata must be an object.',
        },
      });
    }
    const metaRecord = record.designMetadata as Record<string, unknown>;
    const sourceMappings = Array.isArray(metaRecord.sourceMappings)
      ? metaRecord.sourceMappings
      : [];
    const openIssues = Array.isArray(metaRecord.openIssues)
      ? metaRecord.openIssues
      : [];
    designMetadata = {
      sourceMappings,
      openIssues,
    };
  }

  return {
    lockVersion,
    definition: record.definition as unknown as BuilderApplicationDefinitionV1,
    ...(designMetadata ? { designMetadata } : {}),
  };
}
