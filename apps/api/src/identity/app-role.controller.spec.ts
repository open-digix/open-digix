import { BadRequestException } from '@nestjs/common';
import type { TenantContext } from './identity.types';
import { AppRoleController } from './app-role.controller';
import { AppRoleManagementService } from './app-role-management.service';

describe('AppRoleController', () => {
  const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const applicationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const membershipId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const context: TenantContext = {
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      subject: 'keycloak-subject',
      email: 'admin@example.test',
      displayName: 'Tenant Admin',
      status: 'active',
    },
    membership: {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      status: 'active',
      tenant: {
        id: tenantId,
        slug: 'tenant-alpha',
        name: 'Tenant Alpha',
        status: 'active',
      },
      roles: ['tenant_admin'],
    },
  };

  let roles: {
    assign: jest.Mock;
    revoke: jest.Mock;
  };
  let controller: AppRoleController;

  beforeEach(() => {
    roles = {
      assign: jest.fn().mockResolvedValue({
        applicationId,
        membershipId,
        roleCode: 'designer',
        status: 'assigned',
      }),
      revoke: jest.fn().mockResolvedValue({
        applicationId,
        membershipId,
        roleCode: 'designer',
        status: 'revoked',
      }),
    };
    controller = new AppRoleController(
      roles as unknown as AppRoleManagementService,
    );
  });

  it('uses the selected tenant context when assigning a role', async () => {
    await expect(
      controller.assign(
        applicationId.toUpperCase(),
        membershipId.toUpperCase(),
        { roleCode: ' DESIGNER ' },
        context,
      ),
    ).resolves.toEqual({
      appId: applicationId,
      membershipId,
      roleCode: 'designer',
      status: 'assigned',
    });

    expect(roles.assign).toHaveBeenCalledWith({
      tenantId,
      applicationId,
      membershipId,
      roleCode: 'designer',
      assignedByMembershipId: context.membership.id,
    });
  });

  it('uses the selected tenant context when revoking a role', async () => {
    await expect(
      controller.revoke(
        applicationId,
        membershipId,
        { roleCode: 'designer' },
        context,
      ),
    ).resolves.toMatchObject({
      appId: applicationId,
      membershipId,
      roleCode: 'designer',
      status: 'revoked',
    });

    expect(roles.revoke).toHaveBeenCalledWith({
      tenantId,
      applicationId,
      membershipId,
      roleCode: 'designer',
      assignedByMembershipId: context.membership.id,
    });
  });

  it('rejects client-supplied tenant and app fields in the body', async () => {
    await expect(
      controller.assign(
        applicationId,
        membershipId,
        {
          tenantId,
          appId: applicationId,
          roleCode: 'designer',
        },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(roles.assign).not.toHaveBeenCalled();
  });
});
