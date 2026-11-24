import type { Pool } from 'pg';
import {
  TenantAdminRepository,
  type CreateTenantAdminInput,
} from './tenant-admin.repository';

describe('TenantAdminRepository', () => {
  const input: CreateTenantAdminInput = {
    tenantSlug: 'acme_corp',
    tenantName: 'Acme Corporation',
    identityIssuer: 'http://localhost:8080/realms/digix',
    identitySubject: 'keycloak-subject',
    email: 'admin@example.com',
    displayName: 'Nguyen Van A',
  };
  const ids = {
    tenant: '11111111-1111-4111-8111-111111111111',
    user: '22222222-2222-4222-8222-222222222222',
    membership: '33333333-3333-4333-8333-333333333333',
    role: '44444444-4444-4444-8444-444444444444',
  };

  let query: jest.Mock;
  let release: jest.Mock;
  let repository: TenantAdminRepository;

  beforeEach(() => {
    query = jest.fn();
    release = jest.fn();
    const pool = {
      connect: jest.fn().mockResolvedValue({ query, release }),
    };
    repository = new TenantAdminRepository(pool as unknown as Pool);
  });

  it('creates the tenant admin records in one transaction', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: ids.tenant }] })
      .mockResolvedValueOnce({ rows: [{ id: ids.user }] })
      .mockResolvedValueOnce({ rows: [{ id: ids.membership }] })
      .mockResolvedValueOnce({ rows: [{ id: ids.role }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.createTenantAdmin(input)).resolves.toEqual({
      tenantId: ids.tenant,
      identityUserId: ids.user,
      membershipId: ids.membership,
      roleId: ids.role,
    });

    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO tenants'),
      [input.tenantSlug, input.tenantName],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO identity_users'),
      [
        input.identityIssuer,
        input.identitySubject,
        input.email,
        input.displayName,
      ],
    );
    expect(query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO tenant_memberships'),
      [ids.tenant, ids.user],
    );
    expect(query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining("'tenant_admin'"),
      [ids.tenant],
    );
    expect(query).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining('INSERT INTO membership_roles'),
      [ids.tenant, ids.membership, ids.role],
    );
    expect(query).toHaveBeenNthCalledWith(7, 'COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rolls back when one record cannot be created', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error('duplicate tenant slug'))
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.createTenantAdmin(input)).rejects.toThrow(
      'duplicate tenant slug',
    );
    expect(query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
