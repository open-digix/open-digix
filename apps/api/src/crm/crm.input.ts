import { BadRequestException } from '@nestjs/common';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(path: string): never {
  throw new BadRequestException({
    error: { code: 'INVALID_CRM_INPUT', path, message: `Invalid ${path}.` },
  });
}

export function uuid(value: unknown, path: string): string {
  if (typeof value !== 'string' || !UUID.test(value)) invalid(path);
  return value;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('body');
  return value as Record<string, unknown>;
}

function text(value: unknown, path: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    invalid(path);
  return value.trim();
}

function exact(value: Record<string, unknown>, keys: string[]): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) invalid('body');
}

export function customerInput(raw: unknown) {
  const body = object(raw);
  exact(body, ['customerCode', 'name']);
  return {
    customerCode: text(body.customerCode, 'customerCode', 64),
    name: text(body.name, 'name', 160),
  };
}

export function contactInput(raw: unknown) {
  const body = object(raw);
  exact(body, ['name', 'email']);
  const email =
    body.email === undefined ? null : text(body.email, 'email', 320);
  if (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    invalid('email');
  return { name: text(body.name, 'name', 160), email };
}

export function opportunityInput(raw: unknown) {
  const body = object(raw);
  exact(body, ['customerId', 'name', 'assigneeId']);
  return {
    customerId: uuid(body.customerId, 'customerId'),
    name: text(body.name, 'name', 160),
    assigneeId:
      body.assigneeId === undefined || body.assigneeId === null
        ? null
        : uuid(body.assigneeId, 'assigneeId'),
  };
}

export function advanceInput(raw: unknown) {
  const body = object(raw);
  exact(body, ['expectedStage', 'expectedVersion']);
  if (
    typeof body.expectedStage !== 'string' ||
    !['new', 'qualified', 'proposal', 'won'].includes(body.expectedStage)
  )
    invalid('expectedStage');
  if (
    !Number.isSafeInteger(body.expectedVersion) ||
    (body.expectedVersion as number) < 1
  )
    invalid('expectedVersion');
  return {
    expectedStage: body.expectedStage,
    expectedVersion: body.expectedVersion as number,
  };
}

export function pageInput(limitRaw?: string, cursorRaw?: string) {
  const limit = limitRaw === undefined ? 20 : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) invalid('limit');
  if (cursorRaw === undefined) return { limit, cursor: null };
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursorRaw, 'base64url').toString('utf8'),
    );
    if (!Array.isArray(parsed) || parsed.length !== 2) return invalid('cursor');
    const [createdAt, id] = parsed as unknown[];
    if (
      typeof createdAt !== 'string' ||
      !Number.isFinite(Date.parse(createdAt))
    )
      invalid('cursor');
    return { limit, cursor: [createdAt, uuid(id, 'cursor')] as const };
  } catch {
    return invalid('cursor');
  }
}

export function writeKey(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim() || raw.length > 255)
    invalid('Idempotency-Key');
  return raw;
}
