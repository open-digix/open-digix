import { UnprocessableEntityException } from '@nestjs/common';
import type { MaterialListCursor } from './materials.types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function encodeMaterialCursor(cursor: MaterialListCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function parseMaterialCursor(
  value: string | undefined,
): MaterialListCursor | undefined {
  if (value === undefined || value.trim() === '') return undefined;

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    if (!isCursor(parsed)) throw new Error('Invalid cursor');
    return parsed;
  } catch {
    throw new UnprocessableEntityException({
      error: {
        code: 'INVALID_CURSOR',
        message: 'cursor must be a valid materials pagination cursor.',
      },
    });
  }
}

function isCursor(value: unknown): value is MaterialListCursor {
  if (typeof value !== 'object' || value === null) return false;
  const cursor = value as Record<string, unknown>;
  return (
    typeof cursor.createdAt === 'string' &&
    Number.isFinite(Date.parse(cursor.createdAt)) &&
    typeof cursor.id === 'string' &&
    UUID_PATTERN.test(cursor.id)
  );
}
