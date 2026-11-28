import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  CreatePurchaseRequestBody,
  PurchaseRequestActionBody,
  RejectPurchaseRequestBody,
  PurchaseRequestLineInput,
} from './purchase-requests.types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface InputIssue {
  readonly path: string;
  readonly message: string;
}

export function parsePurchaseRequestId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_PURCHASE_REQUEST_ID',
        message: 'purchaseRequestId must be a valid UUID.',
      },
    });
  }
  return normalized;
}

export function parseCreatePurchaseRequestBody(
  body: unknown,
): CreatePurchaseRequestBody {
  const value = asRecord(body);
  const issues: InputIssue[] = [];
  collectUnknownProperties(
    value,
    new Set(['businessRecordId', 'lines']),
    issues,
  );

  const businessRecordId = parseUuidValue(
    value.businessRecordId,
    'businessRecordId',
    issues,
  );
  const lines = parseLines(value.lines, issues);

  if (issues.length > 0) throw invalidInput(issues);
  return { businessRecordId: businessRecordId!, lines: lines! };
}

export function parsePurchaseRequestActionBody(
  body: unknown,
): PurchaseRequestActionBody {
  const value = asRecord(body);
  const issues: InputIssue[] = [];
  collectUnknownProperties(value, new Set(['expectedVersion']), issues);
  const expectedVersion = parseExpectedVersion(value.expectedVersion, issues);

  if (issues.length > 0) throw invalidInput(issues);
  return { expectedVersion: expectedVersion! };
}

export function parseRejectPurchaseRequestBody(
  body: unknown,
): RejectPurchaseRequestBody {
  const value = asRecord(body);
  const issues: InputIssue[] = [];
  collectUnknownProperties(
    value,
    new Set(['expectedVersion', 'reason']),
    issues,
  );
  const expectedVersion = parseExpectedVersion(value.expectedVersion, issues);
  const reason = requiredString(value.reason, 'reason', 4000, issues);

  if (issues.length > 0) throw invalidInput(issues);
  return { expectedVersion: expectedVersion!, reason: reason! };
}

function parseLines(
  value: unknown,
  issues: InputIssue[],
): readonly PurchaseRequestLineInput[] | undefined {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) {
    issues.push({
      path: '/lines',
      message: 'lines must contain between 1 and 100 items.',
    });
    return undefined;
  }

  const seen = new Set<string>();
  const lines: PurchaseRequestLineInput[] = [];
  value.forEach((line, index) => {
    if (typeof line !== 'object' || line === null || Array.isArray(line)) {
      issues.push({
        path: `/lines/${index}`,
        message: 'Line must be an object.',
      });
      return;
    }

    const record = line as Record<string, unknown>;
    collectUnknownProperties(
      record,
      new Set(['materialId', 'quantity']),
      issues,
      `/lines/${index}`,
    );
    const materialId = parseUuidValue(
      record.materialId,
      'materialId',
      issues,
      `/lines/${index}`,
    );
    const quantity = record.quantity;
    if (
      typeof quantity !== 'number' ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      issues.push({
        path: `/lines/${index}/quantity`,
        message: 'quantity must be a positive integer.',
      });
    }

    if (
      materialId &&
      !seen.has(materialId) &&
      Number.isSafeInteger(quantity) &&
      quantity >= 1
    ) {
      seen.add(materialId);
      lines.push({ materialId, quantity: quantity as number });
    } else if (materialId && seen.has(materialId)) {
      issues.push({
        path: `/lines/${index}/materialId`,
        message: 'materialId must be unique within the request.',
      });
    }
  });

  return lines;
}

function parseExpectedVersion(
  value: unknown,
  issues: InputIssue[],
): number | undefined {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    issues.push({
      path: '/expectedVersion',
      message: 'expectedVersion must be a positive integer.',
    });
    return undefined;
  }
  return value;
}

function parseUuidValue(
  value: unknown,
  name: string,
  issues: InputIssue[],
  prefix = '',
): string | undefined {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    issues.push({
      path: `${prefix}/${name}`,
      message: `${name} must be a valid UUID.`,
    });
    return undefined;
  }
  return value.trim().toLowerCase();
}

function requiredString(
  value: unknown,
  name: string,
  maxLength: number,
  issues: InputIssue[],
): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push({ path: `/${name}`, message: `${name} must not be empty.` });
    return undefined;
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    issues.push({
      path: `/${name}`,
      message: `${name} must contain at most ${maxLength} characters.`,
    });
  }
  return normalized;
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
  prefix = '',
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issues.push({
        path: `${prefix}/${key}`,
        message: 'Property is not allowed.',
      });
    }
  }
}

function invalidInput(issues: readonly InputIssue[]): BadRequestException {
  return new BadRequestException({
    error: {
      code: 'INVALID_PURCHASE_REQUEST_INPUT',
      message: 'Purchase request input is invalid.',
      issues,
    },
  });
}

export function requirePurchaseRequestIdempotencyKey(
  value: string | undefined,
): string {
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
