import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  parseCreateMaterialBody,
  parseUpdateMaterialNoteBody,
  parseListMaterialsQuery,
  requireIdempotencyKey,
} from './materials.input';

describe('materials input', () => {
  it('normalizes a valid material body', () => {
    expect(
      parseCreateMaterialBody({
        sku: ' MAT-001 ',
        name: ' Laptop ',
        unit: ' piece ',
        note: ' Demo ',
      }),
    ).toEqual({ sku: 'MAT-001', name: 'Laptop', unit: 'piece', note: 'Demo' });
  });

  it('rejects unknown properties and invalid values', () => {
    expect(() =>
      parseCreateMaterialBody({
        sku: '',
        name: 'x',
        unit: 'piece',
        extra: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('requires a positive expected version', () => {
    expect(() =>
      parseUpdateMaterialNoteBody({ note: 'new', expectedVersion: '1' }),
    ).toThrow(BadRequestException);
  });

  it('validates idempotency keys and list limits', () => {
    expect(() => requireIdempotencyKey(undefined)).toThrow(
      UnprocessableEntityException,
    );
    expect(parseListMaterialsQuery({ limit: '25' })).toEqual({ limit: 25 });
    expect(() => parseListMaterialsQuery({ limit: '101' })).toThrow(
      UnprocessableEntityException,
    );
  });

  it('parses and rejects pagination cursors', () => {
    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: '2026-11-28T10:00:00.123456+00:00',
        id: '11111111-1111-4111-8111-111111111111',
      }),
      'utf8',
    ).toString('base64url');

    expect(parseListMaterialsQuery({ cursor })).toMatchObject({
      limit: 20,
      cursor: {
        id: '11111111-1111-4111-8111-111111111111',
      },
    });
    expect(() => parseListMaterialsQuery({ cursor: 'broken' })).toThrow(
      UnprocessableEntityException,
    );
  });
});
