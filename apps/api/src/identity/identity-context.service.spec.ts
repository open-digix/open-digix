import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedIdentity } from '../auth/auth.types';
import {
  IdentityContextRepository,
  type ResolvedIdentityContext,
} from './identity-context.repository';
import { IdentityContextService } from './identity-context.service';

describe('IdentityContextService', () => {
  const identity: AuthenticatedIdentity = {
    issuer: 'http://localhost:8080/realms/digix',
    subject: 'keycloak-subject',
    audience: ['digix-api'],
    issuedAt: 1_700_000_000,
    expiresAt: 1_700_000_300,
  };
  const tenantAlphaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const tenantBetaId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const resolvedContext: ResolvedIdentityContext = {
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      subject: identity.subject,
      email: 'dung@example.test',
      displayName: 'Dung',
      status: 'active',
    },
    memberships: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        status: 'active',
        tenant: {
          id: tenantAlphaId,
          slug: 'tenant_alpha',
          name: 'Tenant Alpha',
          status: 'active',
        },
        roles: ['employee', 'manager'],
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        status: 'suspended',
        tenant: {
          id: tenantBetaId,
          slug: 'tenant_beta',
          name: 'Tenant Beta',
          status: 'active',
        },
        roles: ['publisher'],
      },
    ],
  };

  let repository: { findByExternalIdentity: jest.Mock };
  let service: IdentityContextService;

  beforeEach(() => {
    repository = { findByExternalIdentity: jest.fn() };
    service = new IdentityContextService(
      repository as unknown as IdentityContextRepository,
    );
  });

  async function forbiddenResponse(
    operation: Promise<unknown>,
  ): Promise<unknown> {
    try {
      await operation;
      throw new Error('Operation unexpectedly succeeded');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      return (error as ForbiddenException).getResponse();
    }
  }

  it('returns all resolved memberships without selecting a tenant', async () => {
    repository.findByExternalIdentity.mockResolvedValue(resolvedContext);

    await expect(service.getMe(identity)).resolves.toEqual({
      ...resolvedContext,
      activeMembership: null,
    });
    expect(repository.findByExternalIdentity).toHaveBeenCalledWith(
      identity.issuer,
      identity.subject,
    );
  });

  it('selects an active membership from X-Tenant-Id', async () => {
    repository.findByExternalIdentity.mockResolvedValue(resolvedContext);

    const result = await service.getMe(identity, tenantAlphaId.toUpperCase());

    expect(result.activeMembership).toEqual(resolvedContext.memberships[0]);
  });

  it('builds a reusable tenant context for tenant-scoped endpoints', async () => {
    repository.findByExternalIdentity.mockResolvedValue(resolvedContext);

    await expect(
      service.resolveRequiredTenant(identity, tenantAlphaId),
    ).resolves.toEqual({
      user: resolvedContext.user,
      membership: resolvedContext.memberships[0],
    });
  });

  it('requires X-Tenant-Id for a tenant-scoped endpoint', async () => {
    try {
      await service.resolveRequiredTenant(identity);
      throw new Error('Operation unexpectedly succeeded');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'X-Tenant-Id is required for this endpoint.',
        },
      });
    }
    expect(repository.findByExternalIdentity).not.toHaveBeenCalled();
  });

  it('rejects an identity that is not provisioned', async () => {
    repository.findByExternalIdentity.mockResolvedValue(undefined);

    await expect(forbiddenResponse(service.getMe(identity))).resolves.toEqual({
      error: {
        code: 'USER_NOT_PROVISIONED',
        message: 'The authenticated identity is not provisioned in DigiX.',
      },
    });
  });

  it('rejects a disabled DigiX account', async () => {
    repository.findByExternalIdentity.mockResolvedValue({
      ...resolvedContext,
      user: { ...resolvedContext.user, status: 'disabled' },
    });

    await expect(forbiddenResponse(service.getMe(identity))).resolves.toEqual({
      error: {
        code: 'ACCOUNT_DISABLED',
        message: 'The DigiX account is disabled.',
      },
    });
  });

  it('rejects a malformed X-Tenant-Id before querying the repository', async () => {
    await expect(service.getMe(identity, 'not-a-uuid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.findByExternalIdentity).not.toHaveBeenCalled();
  });

  it('rejects a tenant without an active membership', async () => {
    repository.findByExternalIdentity.mockResolvedValue(resolvedContext);

    await expect(
      forbiddenResponse(
        service.getMe(identity, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
      ),
    ).resolves.toEqual({
      error: {
        code: 'TENANT_ACCESS_DENIED',
        message:
          'The user does not have an active membership in the selected tenant.',
      },
    });
  });

  it('rejects a suspended membership even when its tenant is selected', async () => {
    repository.findByExternalIdentity.mockResolvedValue(resolvedContext);

    await expect(
      forbiddenResponse(service.getMe(identity, tenantBetaId)),
    ).resolves.toMatchObject({
      error: { code: 'TENANT_ACCESS_DENIED' },
    });
  });
});
