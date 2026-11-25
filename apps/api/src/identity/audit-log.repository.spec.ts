import type { Pool } from 'pg';
import { AuditLogRepository } from './audit-log.repository';

describe('AuditLogRepository', () => {
  it('writes a tenant-scoped audit event with JSON metadata', async () => {
    const pool = { query: jest.fn().mockResolvedValue({}) };
    const repository = new AuditLogRepository(pool as unknown as Pool);

    await repository.create({
      tenantId: 'tenant-a',
      actorMembershipId: 'membership-admin',
      action: 'app_role.assign',
      resourceType: 'app_membership_role',
      resourceId: 'membership-b',
      result: 'success',
      metadata: {
        applicationId: 'app-a',
        roleCode: 'designer',
      },
    });

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      'tenant-a',
      'membership-admin',
      'app_role.assign',
      'app_membership_role',
      'membership-b',
      'success',
      JSON.stringify({ applicationId: 'app-a', roleCode: 'designer' }),
    ]);
  });
});
