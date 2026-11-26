import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export interface AuditEntry {
  id: string;
  tenantId: string;
  actorMembershipId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  result: 'success' | 'denied' | 'failed';
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

export type AuditWriter = Pick<PoolClient, 'query'>;
export type NewAuditEntry = Omit<AuditEntry, 'id' | 'occurredAt'>;

interface AuditRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  actor_membership_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  result: AuditEntry['result'];
  metadata: Record<string, unknown>;
  occurred_at: Date;
}

const columns =
  'id, tenant_id, actor_membership_id, action, resource_type, resource_id, result, metadata, occurred_at';

function mapRow(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    actorMembershipId: row.actor_membership_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    result: row.result,
    metadata: row.metadata,
    occurredAt: row.occurred_at,
  };
}

@Injectable()
export class AuditRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // Pass the caller's transaction client when the event and mutation must commit together.
  async insert(
    entry: NewAuditEntry,
    writer: AuditWriter = this.pool,
  ): Promise<AuditEntry> {
    const result = await writer.query<AuditRow>(
      `INSERT INTO audit_logs
        (tenant_id, actor_membership_id, action, resource_type, resource_id, result, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING ${columns}`,
      [
        entry.tenantId,
        entry.actorMembershipId,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.result,
        JSON.stringify(entry.metadata),
      ],
    );
    return mapRow(result.rows[0]);
  }

  async findById(tenantId: string, id: string): Promise<AuditEntry | null> {
    const result = await this.pool.query<AuditRow>(
      `SELECT ${columns} FROM audit_logs WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async findByResource(
    tenantId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<AuditEntry[]> {
    const result = await this.pool.query<AuditRow>(
      `SELECT ${columns} FROM audit_logs
       WHERE tenant_id = $1 AND resource_type = $2 AND resource_id = $3
       ORDER BY occurred_at DESC, id DESC LIMIT 100`,
      [tenantId, resourceType, resourceId],
    );
    return result.rows.map(mapRow);
  }
}
