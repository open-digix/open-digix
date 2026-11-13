import { randomUUID } from 'node:crypto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuid(value: string, name: string): string {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid UUID`);
  }

  return value.toLowerCase();
}

export function createStorageObjectKey(
  tenantId: string,
  objectId: string = randomUUID(),
): string {
  return `tenants/${uuid(tenantId, 'tenantId')}/files/${uuid(objectId, 'objectId')}`;
}
