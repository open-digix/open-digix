import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  parseInventoryReceiptId,
  parseOptionalMaterialId,
  parseReceiveInventoryBody,
  parseStockLimit,
} from './inventory.input';

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
  });

  it('rejects an invalid stock limit', () => {
    expect(() => parseStockLimit('101')).toThrow(UnprocessableEntityException);
  });
});
