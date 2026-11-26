import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { AuditAction, AuditResult } from './constants/audit-policy.constants';

describe('AuditService', () => {
  const repository = {
    insert: jest.fn(),
    findById: jest.fn(),
    findByResource: jest.fn(),
  };
  const service = new AuditService(repository as unknown as AuditRepository);

  beforeEach(() => jest.clearAllMocks());

  it('stores a scoped event without credentials or raw request data', async () => {
    repository.insert.mockResolvedValue({ id: 'event-id' });
    await service.record({
      tenantId: 'tenant-a',
      actorMembershipId: 'member-a',
      action: AuditAction.APP_PUBLISHED,
      resourceType: 'application',
      resourceId: 'app-a',
      result: AuditResult.SUCCESS,
      metadata: {
        version: '1.0',
        appId: 'app-a',
        token: 'top-secret',
        body: { password: 'top-secret' },
        environment: 'Bearer top-secret',
      },
    });
    expect(repository.insert).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-a',
        actorMembershipId: 'member-a',
        action: AuditAction.APP_PUBLISHED,
        resourceType: 'application',
        resourceId: 'app-a',
        result: AuditResult.SUCCESS,
        metadata: { version: '1.0', appId: 'app-a' },
      },
      undefined,
    );
  });

  it('passes a transaction writer to persist an event with its mutation', async () => {
    const writer = { query: jest.fn() };
    await service.record(
      {
        tenantId: 'tenant-a',
        action: AuditAction.ROLE_REVOKED,
        resourceType: 'membership',
        result: AuditResult.SUCCESS,
      },
      writer,
    );
    expect(repository.insert).toHaveBeenCalledWith(expect.any(Object), writer);
  });

  it('allows role scope but drops unapproved fields and sensitive values', async () => {
    await service.record({
      tenantId: 'tenant-a',
      actorMembershipId: 'actor-a',
      action: AuditAction.ROLE_ASSIGNED,
      resourceType: 'app_membership_role',
      resourceId: 'member-a',
      result: AuditResult.SUCCESS,
      metadata: {
        targetMembershipId: 'member-a',
        roleCode: 'designer',
        scope: 'app-a',
        applicationId: 'app-a',
        password: 'do-not-store',
        correlationId: 'Bearer do-not-store',
      },
    });
    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          targetMembershipId: 'member-a',
          roleCode: 'designer',
          scope: 'app-a',
        },
      }),
      undefined,
    );
  });

  it('requires a tenant for both reads and writes', async () => {
    await expect(
      service.record({
        tenantId: '',
        action: AuditAction.AUTH_LOGIN,
        resourceType: 'session',
        result: AuditResult.SUCCESS,
      }),
    ).rejects.toThrow();
    expect(repository.insert).not.toHaveBeenCalled();
    repository.findById.mockResolvedValue(null);
    await service.findById('tenant-b', 'event-a');
    expect(repository.findById).toHaveBeenCalledWith('tenant-b', 'event-a');
  });

  it('requires explicit tenant and record scope when listing history', async () => {
    repository.findByResource.mockResolvedValue([]);
    expect(() => service.findByResource('', 'application', 'app-a')).toThrow();
    expect(() =>
      service.findByResource('tenant-a', 'application', ''),
    ).toThrow();
    expect(repository.findByResource).not.toHaveBeenCalled();
    await service.findByResource('tenant-a', 'application', 'app-a');
    expect(repository.findByResource).toHaveBeenCalledWith(
      'tenant-a',
      'application',
      'app-a',
    );
  });
});
