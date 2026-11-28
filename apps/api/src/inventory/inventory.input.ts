import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ReceiveInventoryBody } from './inventory.types';
import { parseReceiptCursor, parseStockCursor } from './inventory.cursor';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface InputIssue {
  readonly path: string;
  readonly message: string;
}

export function parseInventoryReceiptId(value: string): string {
  return parseUuid(value, 'receiptId');
}

export function parseReceiveInventoryBody(body: unknown): ReceiveInventoryBody {
  const value = asRecord(body);
  const issues: InputIssue[] = [];
  collectUnknownProperties(
    value,
    new Set(['requestId', 'expectedVersion']),
    issues,
  );
  const requestId = parseUuidValue(value.requestId, 'requestId', issues);
  const expectedVersion = parseExpectedVersion(value.expectedVersion, issues);

  if (issues.length > 0) throw invalidInput(issues);
  return { requestId: requestId!, expectedVersion: expectedVersion! };
}

export function parseStockLimit(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return 20;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new UnprocessableEntityException({
      error: {
        code: 'INVALID_LIMIT',
        message: 'limit must be an integer between 1 and 100.',
      },
    });
  }
  return parsed;
}

export function parseReceiptLimit(value: string | undefined): number {
  return parseStockLimit(value);
}

export function parseOptionalMaterialId(
  value: string | undefined,
): string | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  return parseUuid(value, 'materialId');
}

export { parseReceiptCursor, parseStockCursor };

function parseUuid(value: string, field: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new BadRequestException({
      error: {
        code: `INVALID_${field.toUpperCase()}`,
        message: `${field} must be a valid UUID.`,
      },
    });
  }
  return normalized;
}

function parseUuidValue(
  value: unknown,
  field: string,
  issues: InputIssue[],
): string | undefined {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    issues.push({
      path: `/${field}`,
      message: `${field} must be a valid UUID.`,
    });
    return undefined;
  }
  return value.trim().toLowerCase();
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

function invalidInput(issues: readonly InputIssue[]): BadRequestException {
  return new BadRequestException({
    error: {
      code: 'INVALID_INVENTORY_INPUT',
      message: 'Inventory input is invalid.',
      issues,
    },
  });
}
