import type { Pool } from 'pg';
import { AuditRepository } from './audit.repository';

describe('AuditRepository', () => {
  const pool = { query: jest.fn() };
  const repository = new AuditRepository(pool as unknown as Pool);
  const row = {
    id: 'event-a',
    tenant_id: 'tenant-a',
    actor_membership_id: 'member-a',
    action: 'app.published',
    resource_type: 'application',
    resource_id: 'app-a',
    result: 'success',
    metadata: { version: '1' },
    occurred_at: new Date(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('writes tenant and actor using bound parameters', async () => {
    pool.query.mockResolvedValue({ rows: [row] });
    await expect(
      repository.insert({
        tenantId: 'tenant-a',
        actorMembershipId: 'member-a',
        action: 'app.published',
        resourceType: 'application',
        resourceId: 'app-a',
        result: 'success',
        metadata: { version: '1' },
      }),
    ).resolves.toMatchObject({ tenantId: 'tenant-a', id: 'event-a' });
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      'tenant-a',
      'member-a',
      'app.published',
      'application',
      'app-a',
      'success',
      '{"version":"1"}',
    ]);
  });

  it('never reads an event without tenant predicate', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await expect(
      repository.findById('tenant-b', 'event-a'),
    ).resolves.toBeNull();
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('tenant_id = $1 AND id = $2'),
      ['tenant-b', 'event-a'],
    );
  });

  it('reads resource history only within tenant and exact record scope', async () => {
    pool.query.mockResolvedValue({ rows: [row] });
    await expect(
      repository.findByResource('tenant-a', 'application', 'app-a'),
    ).resolves.toMatchObject([{ tenantId: 'tenant-a', resourceId: 'app-a' }]);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'tenant_id = $1 AND resource_type = $2 AND resource_id = $3',
      ),
      ['tenant-a', 'application', 'app-a'],
    );
  });
});
