import {
  TenantAdminRegistrationService,
  type TenantAdminRegistrationResult,
} from './tenant-admin-registration.service';
import type { TenantAdminRegistrationBody } from './tenant-admin-registration.input';

describe('TenantAdminRegistrationService', () => {
  const input: TenantAdminRegistrationBody = {
    tenantName: 'Acme Corporation',
    tenantSlug: 'acme_corp',
    admin: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      email: 'admin@example.com',
      username: 'admin',
      password: 'correct-horse-battery',
    },
  };
  const created: TenantAdminRegistrationResult = {
    keycloakSubject: 'keycloak-subject',
    tenantId: '11111111-1111-4111-8111-111111111111',
    tenantSlug: 'acme_corp',
    username: 'admin',
    identityUserId: '22222222-2222-4222-8222-222222222222',
    membershipId: '33333333-3333-4333-8333-333333333333',
    roleId: '44444444-4444-4444-8444-444444444444',
  };

  let createUser: jest.Mock;
  let deleteUser: jest.Mock;
  let createTenantAdmin: jest.Mock;
  let service: TenantAdminRegistrationService;

  beforeEach(() => {
    createUser = jest.fn();
    deleteUser = jest.fn();
    createTenantAdmin = jest.fn();
    service = new TenantAdminRegistrationService(
      { createUser, deleteUser },
      { createTenantAdmin },
      'http://localhost:8080/realms/digix',
    );
  });

  it('creates the Keycloak user and then persists the tenant admin', async () => {
    createUser.mockResolvedValue('keycloak-subject');
    createTenantAdmin.mockResolvedValue({
      tenantId: created.tenantId,
      identityUserId: created.identityUserId,
      membershipId: created.membershipId,
      roleId: created.roleId,
    });

    await expect(service.register(input)).resolves.toEqual(created);

    expect(createUser).toHaveBeenCalledWith({
      username: input.admin.username,
      email: input.admin.email,
      displayName: 'Nguyen Van A',
      password: input.admin.password,
    });
    expect(createTenantAdmin).toHaveBeenCalledWith({
      tenantSlug: input.tenantSlug,
      tenantName: input.tenantName,
      identityIssuer: 'http://localhost:8080/realms/digix',
      identitySubject: 'keycloak-subject',
      email: input.admin.email,
      displayName: 'Nguyen Van A',
    });
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the Keycloak user when PostgreSQL persistence fails', async () => {
    const databaseError = new Error('duplicate tenant slug');
    createUser.mockResolvedValue('keycloak-subject');
    createTenantAdmin.mockRejectedValue(databaseError);
    deleteUser.mockResolvedValue(undefined);

    await expect(service.register(input)).rejects.toBe(databaseError);
    expect(deleteUser).toHaveBeenCalledWith('keycloak-subject');
  });

  it('does not touch PostgreSQL when Keycloak user creation fails', async () => {
    createUser.mockRejectedValue(new Error('Keycloak unavailable'));

    await expect(service.register(input)).rejects.toThrow(
      'Keycloak unavailable',
    );
    expect(createTenantAdmin).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('reports a cleanup failure instead of hiding the orphaned account', async () => {
    createUser.mockResolvedValue('keycloak-subject');
    createTenantAdmin.mockRejectedValue(new Error('database unavailable'));
    deleteUser.mockRejectedValue(new Error('Keycloak delete unavailable'));

    await expect(service.register(input)).rejects.toThrow(
      'Keycloak cleanup also failed',
    );
  });
});
