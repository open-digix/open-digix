import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppAuthorizationService } from './app-authorization.service';
import { AppPermissionGuard } from './app-permission.guard';
import type { TenantContextRequest } from './tenant-context.types';

describe('AppPermissionGuard', () => {
  const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const membershipId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const applicationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const requirement = {
    permission: 'erp.materials.read',
    appIdParam: 'appId',
  };

  let request: TenantContextRequest & { params?: Record<string, string> };
  let reflector: { getAllAndOverride: jest.Mock };
  let authorization: { requirePermission: jest.Mock };
  let guard: AppPermissionGuard;

  beforeEach(() => {
    request = {
      params: { appId: applicationId },
      tenantContext: {
        user: {
          id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          subject: 'keycloak-subject',
          email: null,
          displayName: null,
          status: 'active',
        },
        membership: {
          id: membershipId,
          status: 'active',
          tenant: {
            id: tenantId,
            slug: 'tenant-alpha',
            name: 'Tenant Alpha',
            status: 'active',
          },
          roles: ['employee'],
        },
      },
    } as unknown as TenantContextRequest & { params?: Record<string, string> };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requirement),
    };
    authorization = {
      requirePermission: jest.fn().mockResolvedValue({
        tenantId,
        applicationId,
        membershipId,
        applicationStatus: 'draft',
        roleCodes: ['designer'],
        permissions: [requirement.permission],
      }),
    };
    guard = new AppPermissionGuard(
      reflector as unknown as Reflector,
      authorization as unknown as AppAuthorizationService,
    );
  });

  function context(): ExecutionContext {
    return {
      getHandler: () => AppPermissionGuard,
      getClass: () => AppPermissionGuard,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('allows endpoints without app permission metadata', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(authorization.requirePermission).not.toHaveBeenCalled();
  });

  it('checks the selected tenant, route app and current membership', async () => {
    await expect(guard.canActivate(context())).resolves.toBe(true);

    expect(authorization.requirePermission).toHaveBeenCalledWith(
      {
        tenantId,
        applicationId,
        membershipId,
      },
      requirement.permission,
    );
  });

  it('fails closed without tenant context', async () => {
    request.tenantContext = undefined;

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(authorization.requirePermission).not.toHaveBeenCalled();
  });

  it('rejects a route without the configured app id parameter', async () => {
    request.params = {};

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('propagates the authorization denial from the app authorizer', async () => {
    authorization.requirePermission.mockRejectedValueOnce(
      new ForbiddenException({
        error: { code: 'APP_PERMISSION_REQUIRED' },
      }),
    );

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
