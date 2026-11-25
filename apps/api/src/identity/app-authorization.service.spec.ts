import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AppAuthorizationService } from './app-authorization.service';

describe('AppAuthorizationService', () => {
  const input = {
    tenantId: 'tenant-a',
    applicationId: 'app-a',
    membershipId: 'membership-a',
  };

  let findApplication: jest.Mock;
  let findMembershipAccess: jest.Mock;
  let service: AppAuthorizationService;

  beforeEach(() => {
    findApplication = jest.fn().mockResolvedValue({
      id: input.applicationId,
      status: 'draft',
    });
    findMembershipAccess = jest.fn().mockResolvedValue({
      roleCodes: ['designer'],
      permissions: ['app.draft.read'],
    });

    service = new AppAuthorizationService({
      findApplication,
      findMembershipAccess,
    });
  });

  it('returns an app-scoped authorization result for an assigned role', async () => {
    await expect(service.requireAppAccess(input)).resolves.toEqual({
      tenantId: input.tenantId,
      applicationId: input.applicationId,
      membershipId: input.membershipId,
      applicationStatus: 'draft',
      roleCodes: ['designer'],
      permissions: ['app.draft.read'],
    });
    expect(findApplication).toHaveBeenCalledWith(
      input.tenantId,
      input.applicationId,
    );
    expect(findMembershipAccess).toHaveBeenCalledWith(
      input.tenantId,
      input.applicationId,
      input.membershipId,
    );
  });

  it('hides an application outside the selected tenant', async () => {
    findApplication.mockResolvedValue(null);

    await expect(service.requireAppAccess(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findMembershipAccess).not.toHaveBeenCalled();
  });

  it('hides retired applications', async () => {
    findApplication.mockResolvedValue({
      id: input.applicationId,
      status: 'retired',
    });

    await expect(service.requireAppAccess(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a membership without an app role', async () => {
    findMembershipAccess.mockResolvedValue({
      roleCodes: [],
      permissions: [],
    });

    await expect(service.requireAppAccess(input)).rejects.toMatchObject({
      response: {
        error: {
          code: 'APP_ROLE_REQUIRED',
        },
      },
    });
  });

  it('checks a permission after checking app membership', async () => {
    await expect(
      service.requirePermission(input, 'app.draft.read'),
    ).resolves.toMatchObject({
      applicationId: input.applicationId,
      roleCodes: ['designer'],
    });

    await expect(
      service.requirePermission(input, 'app.publish'),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: 'APP_PERMISSION_REQUIRED',
        },
      },
    });
  });

  it('does not treat a tenant role as an app permission', async () => {
    findMembershipAccess.mockResolvedValue({
      roleCodes: [],
      permissions: [],
    });

    await expect(
      service.requirePermission(input, 'app.draft.read'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
