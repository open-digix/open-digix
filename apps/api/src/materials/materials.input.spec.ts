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
});
