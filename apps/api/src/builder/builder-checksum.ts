import { createHash } from 'node:crypto';

export function builderJsonChecksum(value: unknown): string {
  return createHash('sha256')
    .update(canonicalizeBuilderJson(value))
    .digest('hex');
}

export function canonicalizeBuilderJson(value: unknown): string {
  return canonicalize(value, new Set<object>());
}

function canonicalize(value: unknown, active: Set<object>): string {
  if (value === null) return 'null';

  switch (typeof value) {
    case 'string':
    case 'boolean':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isFinite(value)) {
        throw new TypeError('Builder JSON numbers must be finite');
      }
      return JSON.stringify(value);
    case 'object':
      return canonicalizeObject(value, active);
    default:
      throw new TypeError(`Builder JSON cannot contain ${typeof value}`);
  }
}

function canonicalizeObject(value: object, active: Set<object>): string {
  if (active.has(value)) {
    throw new TypeError('Builder JSON cannot contain circular references');
  }

  active.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${Array.from(value, (item) => canonicalize(item, active)).join(',')}]`;
    }

    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Builder JSON can contain only plain objects');
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError('Builder JSON cannot contain symbol keys');
    }

    const record = value as Record<string, unknown>;
    const properties = Object.keys(record)
      .sort()
      .map(
        (key) => `${JSON.stringify(key)}:${canonicalize(record[key], active)}`,
      );
    return `{${properties.join(',')}}`;
  } finally {
    active.delete(value);
  }
}
