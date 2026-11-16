import {
  builderJsonChecksum,
  canonicalizeBuilderJson,
} from './builder-checksum';

describe('Builder JSON checksum', () => {
  it('sorts object keys recursively', () => {
    expect(
      canonicalizeBuilderJson({
        z: true,
        nested: { second: 2, first: 1 },
        list: [{ b: 2, a: 1 }],
      }),
    ).toBe('{"list":[{"a":1,"b":2}],"nested":{"first":1,"second":2},"z":true}');
  });

  it('returns the same checksum regardless of object key order', () => {
    const first = {
      schemaVersion: '1.0',
      fields: [{ id: 'title', required: true }],
    };
    const second = {
      fields: [{ required: true, id: 'title' }],
      schemaVersion: '1.0',
    };

    expect(builderJsonChecksum(first)).toBe(builderJsonChecksum(second));
    expect(builderJsonChecksum(first)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps array order significant', () => {
    expect(builderJsonChecksum(['start', 'end'])).not.toBe(
      builderJsonChecksum(['end', 'start']),
    );
  });

  it.each([
    ['undefined', { value: undefined }],
    ['non-finite number', { value: Number.NaN }],
    ['non-plain object', { value: new Date('2026-11-16T00:00:00Z') }],
  ])('rejects %s', (_label, value) => {
    expect(() => builderJsonChecksum(value)).toThrow(TypeError);
  });

  it('rejects circular references', () => {
    const value: Record<string, unknown> = {};
    value.self = value;

    expect(() => builderJsonChecksum(value)).toThrow('circular references');
  });
});
