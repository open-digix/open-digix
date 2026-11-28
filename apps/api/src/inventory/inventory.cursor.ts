import { BadRequestException } from '@nestjs/common';
import type {
  InventoryReceiptListCursor,
  StockListCursor,
} from './inventory.types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function encodeReceiptCursor(
  cursor: InventoryReceiptListCursor,
): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function parseReceiptCursor(
  value: string | undefined,
): InventoryReceiptListCursor | undefined {
  if (value === undefined || value.trim() === '') return undefined;

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    const createdAt = (parsed as { createdAt?: unknown })?.createdAt;
    const id = (parsed as { id?: unknown })?.id;
    if (
      typeof createdAt !== 'string' ||
      Number.isNaN(Date.parse(createdAt)) ||
      typeof id !== 'string' ||
      !UUID_PATTERN.test(id)
    ) {
      throw new Error('invalid cursor');
    }
    return { createdAt, id: id.toLowerCase() };
  } catch {
    throw new BadRequestException({
      error: {
        code: 'INVALID_CURSOR',
        message: 'cursor must be a valid receipt cursor.',
      },
    });
  }
}

export function encodeStockCursor(cursor: StockListCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function parseStockCursor(
  value: string | undefined,
): StockListCursor | undefined {
  if (value === undefined || value.trim() === '') return undefined;

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as { sku?: unknown }).sku !== 'string' ||
      typeof (parsed as { id?: unknown }).id !== 'string' ||
      (parsed as { sku: string }).sku.length === 0 ||
      !UUID_PATTERN.test((parsed as { id: string }).id)
    ) {
      throw new Error('invalid cursor');
    }
    return {
      sku: (parsed as { sku: string }).sku,
      id: (parsed as { id: string }).id.toLowerCase(),
    };
  } catch {
    throw new BadRequestException({
      error: {
        code: 'INVALID_CURSOR',
        message: 'cursor must be a valid stock cursor.',
      },
    });
  }
}
