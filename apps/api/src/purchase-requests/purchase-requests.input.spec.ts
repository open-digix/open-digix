import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  parseCreatePurchaseRequestBody,
  parsePurchaseRequestActionBody,
  parseRejectPurchaseRequestBody,
  requirePurchaseRequestIdempotencyKey,
} from './purchase-requests.input';

const recordId = '11111111-1111-4111-8111-111111111111';
const materialId = '22222222-2222-4222-8222-222222222222';

describe('purchase request input', () => {
  it('normalizes a valid create body', () => {
    expect(
      parseCreatePurchaseRequestBody({
        businessRecordId: ` ${recordId.toUpperCase()} `,
        lines: [{ materialId, quantity: 3 }],
      }),
    ).toEqual({
      businessRecordId: recordId,
      lines: [{ materialId, quantity: 3 }],
    });
  });

  it('rejects duplicate materials and non-positive quantities', () => {
    expect(() =>
      parseCreatePurchaseRequestBody({
        businessRecordId: recordId,
        lines: [
          { materialId, quantity: 0 },
          { materialId, quantity: 2 },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('parses action and rejection bodies', () => {
    expect(parsePurchaseRequestActionBody({ expectedVersion: 2 })).toEqual({
      expectedVersion: 2,
    });
    expect(
      parseRejectPurchaseRequestBody({ expectedVersion: 2, reason: 'Budget' }),
    ).toEqual({
      expectedVersion: 2,
      reason: 'Budget',
    });
  });

  it('requires an idempotency key', () => {
    expect(() => requirePurchaseRequestIdempotencyKey(undefined)).toThrow(
      UnprocessableEntityException,
    );
  });
});
