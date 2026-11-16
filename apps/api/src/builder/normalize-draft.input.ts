import { BadRequestException } from '@nestjs/common';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface NormalizeDraftInput {
  readonly sourceRevisionId?: string;
}

export function parseApplicationId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_APP_ID',
        message: 'appId must be a valid UUID.',
      },
    });
  }
  return normalized;
}

export function parseDraftVersion(value: string | number): number {
  const num = typeof value === 'number' ? value : parseInt(value.trim(), 10);
  if (!Number.isInteger(num) || num <= 0) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_VERSION',
        message: 'version must be a positive integer.',
      },
    });
  }
  return num;
}

export function parseNormalizeDraftBody(body: unknown): NormalizeDraftInput {
  if (
    body === undefined ||
    body === null ||
    (typeof body === 'object' && Object.keys(body).length === 0)
  ) {
    return {};
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_INPUT',
        message: 'Request body must be a JSON object.',
      },
    });
  }

  const record = body as Record<string, unknown>;
  const allowedKeys = new Set(['sourceRevisionId']);
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_INPUT',
          message: `Property '/${key}' is not allowed.`,
        },
      });
    }
  }

  if (record.sourceRevisionId !== undefined) {
    if (typeof record.sourceRevisionId !== 'string') {
      throw new BadRequestException({
        error: {
          code: 'INVALID_SOURCE_REVISION_ID',
          message: 'sourceRevisionId must be a valid UUID.',
        },
      });
    }

    const normalized = record.sourceRevisionId.trim().toLowerCase();
    if (!UUID_PATTERN.test(normalized)) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_SOURCE_REVISION_ID',
          message: 'sourceRevisionId must be a valid UUID.',
        },
      });
    }

    return { sourceRevisionId: normalized };
  }

  return {};
}
