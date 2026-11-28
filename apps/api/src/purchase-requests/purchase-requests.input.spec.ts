import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  parseCreatePurchaseRequestBody,
  parseListPurchaseRequestsQuery,
  parsePurchaseRequestActionBody,
  parseRejectPurchaseRequestBody,
  requirePurchaseRequestIdempotencyKey,
} from './purchase-requests.input';

const recordId = '11111111-1111-4111-8111-111111111111';
const materialId = '22222222-2222-4222-8222-222222222222';

describe('purchase requests input', () => {
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

  it('uses a safe default page size and parses a status filter', () => {
    expect(parseListPurchaseRequestsQuery({ status: 'submitted' })).toEqual({
      limit: 20,
      status: 'submitted',
    });
  });

  it('rejects an unsupported status and invalid page size', () => {
    expect(() => parseListPurchaseRequestsQuery({ status: 'pending' })).toThrow(
      BadRequestException,
    );
    expect(() => parseListPurchaseRequestsQuery({ limit: '101' })).toThrow(
      UnprocessableEntityException,
    );
  });

  it('parses and rejects purchase request cursors', () => {
    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: '2026-11-28T10:00:00.123456+00:00',
        id: recordId,
      }),
      'utf8',
    ).toString('base64url');

    expect(parseListPurchaseRequestsQuery({ cursor })).toMatchObject({
      limit: 20,
      cursor: { id: recordId },
    });
    expect(() => parseListPurchaseRequestsQuery({ cursor: 'broken' })).toThrow(
      UnprocessableEntityException,
    );
  });
});
