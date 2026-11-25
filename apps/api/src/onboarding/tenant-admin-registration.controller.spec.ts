import { IS_PUBLIC_ENDPOINT } from '../auth/public.decorator';
import {
  TenantAdminRegistrationController,
  type TenantAdminRegistrationResponse,
} from './tenant-admin-registration.controller';
import type { TenantAdminRegistrationService } from './tenant-admin-registration.service';

describe('TenantAdminRegistrationController', () => {
  const input = {
    tenantName: 'Acme Corporation',
    tenantSlug: 'acme-corp',
    admin: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      email: 'admin@example.com',
      username: 'admin',
      password: 'correct-horse-battery',
    },
  };
  const serviceResult = {
    keycloakSubject: 'keycloak-subject',
    tenantId: '11111111-1111-4111-8111-111111111111',
    tenantSlug: 'acme-corp',
    username: 'admin',
    identityUserId: '22222222-2222-4222-8222-222222222222',
    membershipId: '33333333-3333-4333-8333-333333333333',
    roleId: '44444444-4444-4444-8444-444444444444',
  };

  it('is public and returns the registration result without secrets', async () => {
    const register = jest.fn().mockResolvedValue(serviceResult);
    const controller = new TenantAdminRegistrationController({
      register,
    } as unknown as TenantAdminRegistrationService);
    const handler = Object.getOwnPropertyDescriptor(
      TenantAdminRegistrationController.prototype,
      'register',
    )?.value as object;

    await expect(controller.register(input)).resolves.toEqual({
      tenantId: serviceResult.tenantId,
      tenantSlug: serviceResult.tenantSlug,
      username: serviceResult.username,
    } satisfies TenantAdminRegistrationResponse);
    expect(register).toHaveBeenCalledWith(input);
    expect(Reflect.getMetadata(IS_PUBLIC_ENDPOINT, handler)).toBe(true);
  });

  it('delegates invalid bodies to the shared parser', async () => {
    const register = jest.fn();
    const controller = new TenantAdminRegistrationController({
      register,
    } as unknown as TenantAdminRegistrationService);

    await expect(
      controller.register({ ...input, tenantSlug: 'Acme Corporation' }),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: 'VALIDATION_FAILED',
        },
      },
    });
    expect(register).not.toHaveBeenCalled();
  });
});
