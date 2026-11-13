import { createStorageObjectKey } from './storage-object-key';

describe('createStorageObjectKey', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const objectId = '22222222-2222-4222-8222-222222222222';

  it('creates a tenant-scoped key without an original file name', () => {
    expect(createStorageObjectKey(tenantId, objectId)).toBe(
      `tenants/${tenantId}/files/${objectId}`,
    );
  });

  it('normalizes UUIDs to lowercase', () => {
    expect(
      createStorageObjectKey(tenantId.toUpperCase(), objectId.toUpperCase()),
    ).toBe(`tenants/${tenantId}/files/${objectId}`);
  });

  it('generates a different random object UUID for each key', () => {
    const first = createStorageObjectKey(tenantId);
    const second = createStorageObjectKey(tenantId);

    expect(first).toMatch(
      new RegExp(
        `^tenants/${tenantId}/files/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
      ),
    );
    expect(second).not.toBe(first);
  });

  it.each([
    ['tenantId', '../another-tenant', objectId],
    ['tenantId', `${tenantId}/files`, objectId],
    ['objectId', tenantId, 'invoice.pdf'],
    ['objectId', tenantId, '../file'],
  ])('rejects an invalid %s', (name, invalidTenantId, invalidObjectId) => {
    expect(() =>
      createStorageObjectKey(invalidTenantId, invalidObjectId),
    ).toThrow(`${name} must be a valid UUID`);
  });
});
