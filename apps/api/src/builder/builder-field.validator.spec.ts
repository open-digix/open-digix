import { validateBuilderFields } from './builder-field.validator';
import type { BuilderFieldDefinition } from './builder.types';

describe('validateBuilderFields', () => {
  it('accepts valid fields', () => {
    expect(
      validateBuilderFields([
        {
          id: 'request_title',
          type: 'string',
          required: true,
          min: 3,
          max: 120,
        },
        {
          id: 'decision',
          type: 'enum',
          required: false,
          options: ['approved', 'rejected'],
        },
      ]),
    ).toEqual([]);
  });

  it('rejects duplicate field identifiers', () => {
    const fields: BuilderFieldDefinition[] = [
      { id: 'amount', type: 'integer', required: true },
      { id: 'amount', type: 'integer', required: false },
    ];

    expect(validateBuilderFields(fields)).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_FIELD',
        path: '/fields/1/id',
      }),
    );
  });

  it('checks supported and ordered field bounds', () => {
    const fields: BuilderFieldDefinition[] = [
      { id: 'active', type: 'boolean', required: true, min: 1 },
      {
        id: 'description',
        type: 'string',
        required: true,
        min: 100,
        max: 10,
      },
    ];

    const codes = validateBuilderFields(fields).map(({ code }) => code);

    expect(codes).toEqual(
      expect.arrayContaining([
        'FIELD_BOUNDS_NOT_SUPPORTED',
        'INVALID_FIELD_BOUNDS',
      ]),
    );
  });

  it('requires options only for enum fields', () => {
    const fields: BuilderFieldDefinition[] = [
      { id: 'decision', type: 'enum', required: true },
      {
        id: 'title',
        type: 'string',
        required: true,
        options: ['unexpected'],
      },
    ];

    const codes = validateBuilderFields(fields).map(({ code }) => code);

    expect(codes).toEqual(
      expect.arrayContaining([
        'ENUM_OPTIONS_REQUIRED',
        'FIELD_OPTIONS_NOT_SUPPORTED',
      ]),
    );
  });
});
