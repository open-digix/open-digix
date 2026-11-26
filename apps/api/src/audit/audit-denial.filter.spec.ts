import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AuditDenialFilter } from './audit-denial.filter';
import type { AuditService } from './audit.service';

describe('AuditDenialFilter', () => {
  const record = jest.fn().mockResolvedValue(undefined);
  const filter = new AuditDenialFilter({ record } as unknown as AuditService);
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = {
    method: 'GET',
    path: '/v1/apps?access_token=do-not-store',
    tenantContext: {
      membership: {
        id: 'member-a',
        tenant: { id: 'tenant-a' },
      },
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => jest.clearAllMocks());

  it('records a forbidden request with verified tenant context', async () => {
    await filter.catch(
      new ForbiddenException({
        error: { code: 'ROLE_REQUIRED', message: 'Forbidden' },
      }),
      host,
    );
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-a',
        actorMembershipId: 'member-a',
        action: 'access.denied',
        result: 'denied',
        metadata: {
          reasonCode: 'ROLE_REQUIRED',
          method: 'GET',
          path: '/v1/apps?access_token=do-not-store',
        },
      }),
    );
    expect(status).toHaveBeenCalledWith(403);
  });

  it('does not trust an unauthenticated X-Tenant-Id for audit scope', async () => {
    const noTenant = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-tenant-id': 'tenant-a' },
          method: 'GET',
          path: '/v1/me',
        }),
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    await filter.catch(new UnauthorizedException(), noTenant);
    expect(record).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
  });
});
