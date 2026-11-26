import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { getDatabaseConfig } from '../database/database.config';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditAction, AuditResult } from './constants/audit-policy.constants';

// Run against a migrated disposable DB with AUDIT_INTEGRATION_DB=1.
const integration =
  process.env.AUDIT_INTEGRATION_DB === '1' ? describe : describe.skip;

integration('AuditService PostgreSQL integration', () => {
  let pool: Pool;
  let service: AuditService;
  let tenantA: string;
  let tenantB: string;
  let memberA: string;
  const slug = `audit_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    pool = new Pool(getDatabaseConfig());
    service = new AuditService(new AuditRepository(pool));
    try {
      const a = await pool.query<{ id: string }>(
        'INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id',
        [`${slug}_a`, 'Audit test A'],
      );
      tenantA = a.rows[0].id;
      const b = await pool.query<{ id: string }>(
        'INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id',
        [`${slug}_b`, 'Audit test B'],
      );
      tenantB = b.rows[0].id;
      const user = await pool.query<{ id: string }>(
        `INSERT INTO identity_users (identity_issuer, identity_subject)
         VALUES ('audit-test', $1) RETURNING id`,
        [slug],
      );
      const member = await pool.query<{ id: string }>(
        `INSERT INTO tenant_memberships (tenant_id, user_id)
         VALUES ($1, $2) RETURNING id`,
        [tenantA, user.rows[0].id],
      );
      memberA = member.rows[0].id;
    } catch (error) {
      await pool.end();
      throw error;
    }
  });

  afterAll(async () => {
    if (!pool) return;
    try {
      await pool.query('DELETE FROM audit_logs WHERE tenant_id = $1', [
        tenantA,
      ]);
      await pool.query('DELETE FROM tenant_memberships WHERE id = $1', [
        memberA,
      ]);
      await pool.query(
        'DELETE FROM identity_users WHERE identity_issuer = $1 AND identity_subject = $2',
        ['audit-test', slug],
      );
      await pool.query('DELETE FROM tenants WHERE id = ANY($1::uuid[])', [
        [tenantA, tenantB].filter(Boolean),
      ]);
    } finally {
      await pool.end();
    }
  });

  it('persists sanitized metadata and cannot read an event in another tenant', async () => {
    const resourceId = randomUUID();
    const event = await service.record({
      tenantId: tenantA,
      actorMembershipId: memberA,
      action: AuditAction.CONFIG_UPDATED,
      resourceType: 'application',
      resourceId,
      result: AuditResult.SUCCESS,
      metadata: { changedKeys: ['name'], password: 'never-store-me' },
    });
    expect(await service.findById(tenantA, event.id)).toMatchObject({
      tenantId: tenantA,
      metadata: { changedKeys: ['name'] },
    });
    expect(await service.findById(tenantB, event.id)).toBeNull();
    expect(
      await service.findByResource(tenantA, 'application', resourceId),
    ).toEqual([event]);
    expect(
      await service.findByResource(tenantB, 'application', resourceId),
    ).toEqual([]);
    expect(
      await service.findByResource(tenantA, 'application', randomUUID()),
    ).toEqual([]);
  });

  it('rejects a membership belonging to another tenant', async () => {
    await expect(
      service.record({
        tenantId: tenantB,
        actorMembershipId: memberA,
        action: AuditAction.ACCESS_DENIED,
        resourceType: 'http_request',
        result: AuditResult.DENIED,
      }),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('commits or rolls back an audit event with its caller transaction', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const rolledBack = await service.record(
        {
          tenantId: tenantA,
          actorMembershipId: memberA,
          action: AuditAction.ROLE_ASSIGNED,
          resourceType: 'app_membership_role',
          result: AuditResult.SUCCESS,
          metadata: {
            roleCode: 'designer',
            targetMembershipId: memberA,
            password: 'never-store-me',
          },
        },
        client,
      );
      await client.query('ROLLBACK');
      expect(await service.findById(tenantA, rolledBack.id)).toBeNull();

      await client.query('BEGIN');
      const committed = await service.record(
        {
          tenantId: tenantA,
          actorMembershipId: memberA,
          action: AuditAction.ROLE_REVOKED,
          resourceType: 'app_membership_role',
          result: AuditResult.SUCCESS,
          metadata: { roleCode: 'designer', targetMembershipId: memberA },
        },
        client,
      );
      await client.query('COMMIT');
      expect(await service.findById(tenantA, committed.id)).toMatchObject({
        metadata: { roleCode: 'designer', targetMembershipId: memberA },
      });
      expect(await service.findById(tenantB, committed.id)).toBeNull();
    } finally {
      client.release();
    }
  });
});
