import {
  ExecutionContext,
  UnauthorizedException,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedIdentity } from '../auth/auth.types';
import { IdentityContextService } from './identity-context.service';
import type { TenantContext } from './identity.types';
import { TenantContextGuard } from './tenant-context.guard';
import type { TenantContextRequest } from './tenant-context.types';

describe('TenantContextGuard', () => {
  const identity: AuthenticatedIdentity = {
    issuer: 'http://localhost:8080/realms/digix',
    subject: 'keycloak-subject',
    audience: ['digix-api'],
    issuedAt: 1_700_000_000,
    expiresAt: 1_700_000_300,
  };
  const tenantContext: TenantContext = {
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      subject: identity.subject,
      email: 'dung@example.test',
      displayName: 'Dung',
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
      roles: ['employee'],
    },
  };

  let request: TenantContextRequest;
  let reflector: { getAllAndOverride: jest.Mock };
  let identityContext: { resolveRequiredTenant: jest.Mock };
  let guard: TenantContextGuard;

  class TestController {}

  beforeEach(() => {
    request = {
      headers: {},
      header: jest.fn().mockReturnValue(undefined),
    } as unknown as TenantContextRequest;
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    identityContext = { resolveRequiredTenant: jest.fn() };
    guard = new TenantContextGuard(
      reflector as unknown as Reflector,
      identityContext as unknown as IdentityContextService,
    );
  });

  function context(): ExecutionContext {
    return {
      getHandler: () => TestController,
      getClass: () => TestController as Type<unknown>,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('does not query memberships for an endpoint without tenant metadata', async () => {
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(identityContext.resolveRequiredTenant).not.toHaveBeenCalled();
  });

  it('fails closed when the JWT guard did not attach an identity', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('resolves and attaches the selected tenant context', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    request.authenticatedIdentity = identity;
    (request.header as jest.Mock).mockReturnValue(
      tenantContext.membership.tenant.id,
    );
    identityContext.resolveRequiredTenant.mockResolvedValue(tenantContext);

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(identityContext.resolveRequiredTenant).toHaveBeenCalledWith(
      identity,
      tenantContext.membership.tenant.id,
    );
    expect(request.tenantContext).toEqual(tenantContext);
  });
});
