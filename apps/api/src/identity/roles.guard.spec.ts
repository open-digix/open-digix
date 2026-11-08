import {
  ExecutionContext,
  ForbiddenException,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import type { TenantContextRequest } from './tenant-context.types';

describe('RolesGuard', () => {
  let request: TenantContextRequest;
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  class TestController {}

  beforeEach(() => {
    request = {
      tenantContext: {
        user: {
          id: '11111111-1111-4111-8111-111111111111',
          subject: 'keycloak-subject',
          email: null,
          displayName: null,
          status: 'active',
        },
        membership: {
          id: '22222222-2222-4222-8222-222222222222',
          status: 'active',
          tenant: {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            slug: 'tenant_alpha',
            name: 'Tenant Alpha',
            status: 'active',
          },
          roles: ['employee', 'manager'],
        },
      },
    } as TenantContextRequest;
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function context(): ExecutionContext {
    return {
      getHandler: () => TestController,
      getClass: () => TestController as Type<unknown>,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('allows an endpoint without role metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context())).toBe(true);
  });

  it('allows membership with any one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['manager', 'publisher']);

    expect(guard.canActivate(context())).toBe(true);
  });

  it('rejects membership without a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['publisher']);

    expect(() => guard.canActivate(context())).toThrow(ForbiddenException);
  });

  it('fails closed when tenant context is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['employee']);
    request.tenantContext = undefined;

    expect(() => guard.canActivate(context())).toThrow(ForbiddenException);
  });
});
