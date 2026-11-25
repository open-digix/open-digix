import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppAuthorizationService } from './app-authorization.service';
import {
  AppRoleAssignmentConflictError,
  AppRoleManagementRepository,
} from './app-role-management.repository';
import { AppRoleManagementService } from './app-role-management.service';

describe('AppRoleManagementService', () => {
  const input = {
    tenantId: 'tenant-a',
    applicationId: 'app-a',
    membershipId: 'membership-b',
    roleCode: 'designer',
    assignedByMembershipId: 'membership-admin',
  };

  let authorization: { requireApplication: jest.Mock };
  let repository: {
    hasActiveMembership: jest.Mock;
    findRole: jest.Mock;
    assignRole: jest.Mock;
    revokeRole: jest.Mock;
  };
  let service: AppRoleManagementService;

  beforeEach(() => {
    authorization = {
      requireApplication: jest.fn().mockResolvedValue({
        id: input.applicationId,
        status: 'draft',
      }),
    };
    repository = {
      hasActiveMembership: jest.fn().mockResolvedValue(true),
      findRole: jest
        .fn()
        .mockResolvedValue({ id: 'role-designer', code: 'designer' }),
      assignRole: jest.fn().mockResolvedValue(undefined),
      revokeRole: jest.fn().mockResolvedValue(true),
    };
    service = new AppRoleManagementService(
      authorization as unknown as AppAuthorizationService,
      repository as unknown as AppRoleManagementRepository,
    );
  });

  it('assigns a configured app role to an active membership', async () => {
    await expect(service.assign(input)).resolves.toEqual({
      applicationId: input.applicationId,
      membershipId: input.membershipId,
      roleCode: 'designer',
      status: 'assigned',
    });
    expect(repository.assignRole).toHaveBeenCalledWith({
      ...input,
      roleId: 'role-designer',
    });
  });

  it('rejects assignments to a missing membership', async () => {
    repository.hasActiveMembership.mockResolvedValue(false);

    await expect(service.assign(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findRole).not.toHaveBeenCalled();
  });

  it('maps duplicate assignments to a conflict', async () => {
    repository.assignRole.mockRejectedValue(
      new AppRoleAssignmentConflictError(),
    );

    await expect(service.assign(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('revokes an existing app role assignment', async () => {
    await expect(service.revoke(input)).resolves.toMatchObject({
      applicationId: input.applicationId,
      membershipId: input.membershipId,
      roleCode: 'designer',
      status: 'revoked',
    });
    expect(repository.revokeRole).toHaveBeenCalledWith({
      tenantId: input.tenantId,
      applicationId: input.applicationId,
      membershipId: input.membershipId,
      roleId: 'role-designer',
    });
  });

  it('rejects revoking an assignment that does not exist', async () => {
    repository.revokeRole.mockResolvedValue(false);

    await expect(service.revoke(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
