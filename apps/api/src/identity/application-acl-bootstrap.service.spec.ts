import type { PoolClient } from 'pg';
import { AuditLogRepository } from './audit-log.repository';
import { ApplicationAclBootstrapService } from './application-acl-bootstrap.service';

describe('ApplicationAclBootstrapService', () => {
  it('creates app roles and assigns only designer to the creator', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rowCount: 1 }),
    };
    const auditLogs = {
      createInTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ApplicationAclBootstrapService(
      auditLogs as unknown as AuditLogRepository,
    );

    await expect(
      service.initialize(client as unknown as PoolClient, {
        tenantId: 'tenant-a',
        applicationId: 'app-a',
        creatorMembershipId: 'membership-a',
      }),
    ).resolves.toBeUndefined();

    expect(client.query).toHaveBeenNthCalledWith(1, expect.any(String), [
      'tenant-a',
      'app-a',
    ]);
    expect(client.query).toHaveBeenNthCalledWith(2, expect.any(String), [
      'tenant-a',
      'app-a',
      'membership-a',
    ]);
    expect(auditLogs.createInTransaction).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        action: 'app_role.assign',
        actorMembershipId: 'membership-a',
        resourceId: 'membership-a',
        metadata: {
          applicationId: 'app-a',
          membershipId: 'membership-a',
          roleCode: 'designer',
          source: 'application_creation',
        },
      }),
    );
  });

  it('fails when the creator designer role cannot be assigned', async () => {
    const client = {
      query: jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({
        rowCount: 0,
      }),
    };
    const auditLogs = {
      createInTransaction: jest.fn(),
    };
    const service = new ApplicationAclBootstrapService(
      auditLogs as unknown as AuditLogRepository,
    );

    await expect(
      service.initialize(client as unknown as PoolClient, {
        tenantId: 'tenant-a',
        applicationId: 'app-a',
        creatorMembershipId: 'membership-a',
      }),
    ).rejects.toThrow('Database did not assign the application designer role');
    expect(auditLogs.createInTransaction).not.toHaveBeenCalled();
  });
});
