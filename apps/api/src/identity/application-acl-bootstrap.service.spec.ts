import type { PoolClient } from 'pg';
import { AuditService } from '../audit/audit.service';
import { ApplicationAclBootstrapService } from './application-acl-bootstrap.service';

describe('ApplicationAclBootstrapService', () => {
  it('creates app roles and assigns only designer to the creator', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rowCount: 1 }),
    };
    const audit = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ApplicationAclBootstrapService(
      audit as unknown as AuditService,
    );

    await expect(
      service.initialize(client as unknown as PoolClient, {
        tenantId: 'tenant-a',
        applicationId: 'app-a',
        creatorMembershipId: 'membership-a',
      }),
    ).resolves.toBeUndefined();

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO application_role_permissions'),
      ['tenant-a', 'app-a'],
    );
    expect(client.query).toHaveBeenNthCalledWith(2, expect.any(String), [
      'tenant-a',
      'app-a',
      'membership-a',
    ]);
    expect(audit.record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: 'application.created',
        actorMembershipId: 'membership-a',
        resourceType: 'application',
        resourceId: 'app-a',
        result: 'success',
        metadata: {
          appId: 'app-a',
          source: 'application_creation',
        },
      }),
      client,
    );
    expect(audit.record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: 'rbac.role.assigned',
        actorMembershipId: 'membership-a',
        resourceId: 'membership-a',
        metadata: {
          targetMembershipId: 'membership-a',
          roleCode: 'designer',
          scope: 'app-a',
        },
      }),
      client,
    );
  });

  it('fails when the creator designer role cannot be assigned', async () => {
    const client = {
      query: jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({
        rowCount: 0,
      }),
    };
    const audit = {
      record: jest.fn(),
    };
    const service = new ApplicationAclBootstrapService(
      audit as unknown as AuditService,
    );

    await expect(
      service.initialize(client as unknown as PoolClient, {
        tenantId: 'tenant-a',
        applicationId: 'app-a',
        creatorMembershipId: 'membership-a',
      }),
    ).rejects.toThrow('Database did not assign the application designer role');
    expect(audit.record).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'application.created',
        resourceId: 'app-a',
      }),
      client,
    );
  });
});
