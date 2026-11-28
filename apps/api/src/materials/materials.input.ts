import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface InputIssue {
  readonly path: string;
  readonly message: string;
}

export interface CreateMaterialBody {
  readonly sku: string;
  readonly name: string;
  readonly unit: string;
  readonly note?: string;
}

export interface UpdateMaterialNoteBody {
  readonly note: string;
  readonly expectedVersion: number;
}

export interface ListMaterialsQuery {
  readonly limit: number;
}

export function parseMaterialId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_MATERIAL_ID',
        message: 'materialId must be a valid UUID.',
      },
    });
  }
  return normalized;
}

export function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim() ?? '';
  if (normalized.length < 1 || normalized.length > 255) {
    throw new UnprocessableEntityException({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key must contain 1-255 characters.',
      },
    });
  }
  return normalized;
}

export function parseCreateMaterialBody(body: unknown): CreateMaterialBody {
  const value = asRecord(body);
  const issues: InputIssue[] = [];
  collectUnknownProperties(
    value,
    new Set(['sku', 'name', 'unit', 'note']),
    issues,
  );

  const sku = requiredString(value, 'sku', 64, issues);
  const name = requiredString(value, 'name', 160, issues);
  const unit = requiredString(value, 'unit', 32, issues);
  const note = optionalString(value, 'note', 4000, issues);

  if (issues.length > 0) throw invalidInput(issues);

  return {
    sku: sku!,
    name: name!,
    unit: unit!,
    ...(note !== undefined ? { note } : {}),
  };
}

export function parseUpdateMaterialNoteBody(
  body: unknown,
): UpdateMaterialNoteBody {
  const value = asRecord(body);
  const issues: InputIssue[] = [];
  collectUnknownProperties(value, new Set(['note', 'expectedVersion']), issues);

  const note = requiredString(value, 'note', 4000, issues);
  const expectedVersion = value.expectedVersion;
  if (
    typeof expectedVersion !== 'number' ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    issues.push({
      path: '/expectedVersion',
      message: 'expectedVersion must be a positive integer.',
    });
  }

  if (issues.length > 0) throw invalidInput(issues);
  return { note: note!, expectedVersion: expectedVersion as number };
}

export function parseListMaterialsQuery(
  query: Record<string, unknown>,
): ListMaterialsQuery {
  const rawLimit = query.limit;
  if (rawLimit === undefined || rawLimit === '') return { limit: 20 };

  const limit = Number(rawLimit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new UnprocessableEntityException({
      error: {
        code: 'INVALID_LIMIT',
        message: 'limit must be an integer between 1 and 100.',
      },
    });
  }
  return { limit };
}

function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw invalidInput([{ path: '/', message: 'Body must be a JSON object.' }]);
  }
  return body as Record<string, unknown>;
}

function collectUnknownProperties(
  value: Record<string, unknown>,
  allowed: Set<string>,
  issues: InputIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issues.push({ path: `/${key}`, message: 'Property is not allowed.' });
    }
  }
}

function requiredString(
  value: Record<string, unknown>,
  key: string,
  maxLength: number,
  issues: InputIssue[],
): string | undefined {
  if (typeof value[key] !== 'string' || value[key].trim().length === 0) {
    issues.push({
      path: `/${key}`,
      message: `${key} must be a non-empty string.`,
    });
    return undefined;
  }

  const normalized = value[key].trim();
  if (normalized.length > maxLength) {
    issues.push({
      path: `/${key}`,
      message: `${key} must contain at most ${maxLength} characters.`,
    });
  }
  return normalized;
}

function optionalString(
  value: Record<string, unknown>,
  key: string,
  maxLength: number,
  issues: InputIssue[],
): string | undefined {
  if (value[key] === undefined || value[key] === null) return undefined;
  return requiredString(value, key, maxLength, issues);
}

function invalidInput(issues: readonly InputIssue[]): BadRequestException {
  return new BadRequestException({
    error: {
      code: 'INVALID_MATERIAL_INPUT',
      message: 'Material input is invalid.',
      issues,
    },
  });
}
