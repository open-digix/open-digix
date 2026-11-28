import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  parseInventoryReceiptId,
  parseOptionalMaterialId,
  parseReceiptCursor,
  parseReceiptLimit,
  parseReceiveInventoryBody,
  parseStockCursor,
  parseStockLimit,
} from './inventory.input';
import { encodeReceiptCursor, encodeStockCursor } from './inventory.cursor';

describe('inventory input', () => {
  const requestId = '11111111-1111-4111-8111-111111111111';

  it('parses a receive request', () => {
    expect(
      parseReceiveInventoryBody({ requestId, expectedVersion: 2 }),
    ).toEqual({ requestId, expectedVersion: 2 });
  });

  it('rejects malformed receive input and unknown properties', () => {
    expect(() =>
      parseReceiveInventoryBody({
        requestId: 'bad',
        expectedVersion: 0,
        extra: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('parses bounded stock filters', () => {
    expect(parseStockLimit(undefined)).toBe(20);
    expect(parseStockLimit('100')).toBe(100);
    expect(parseOptionalMaterialId(requestId)).toBe(requestId);
    expect(parseInventoryReceiptId(requestId)).toBe(requestId);
    const cursor = parseStockCursor(
      encodeStockCursor({ sku: 'MAT-001', id: requestId }),
    );
    expect(cursor).toEqual({ sku: 'MAT-001', id: requestId });
  });

  it('parses bounded receipt pagination', () => {
    expect(parseReceiptLimit(undefined)).toBe(20);
    const cursor = parseReceiptCursor(
      encodeReceiptCursor({
        createdAt: '2026-11-28T10:00:00.000Z',
        id: requestId,
      }),
    );
    expect(cursor).toEqual({
      createdAt: '2026-11-28T10:00:00.000Z',
      id: requestId,
    });
  });

  it('rejects an invalid stock limit', () => {
    expect(() => parseStockLimit('101')).toThrow(UnprocessableEntityException);
  });

  it('rejects an invalid stock cursor', () => {
    expect(() => parseStockCursor('not-a-cursor')).toThrow(BadRequestException);
  });
});
