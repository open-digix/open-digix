import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export type AuditLogResult = 'success' | 'denied' | 'failed';

export interface CreateAuditLogInput {
  readonly tenantId: string;
  readonly actorMembershipId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly result: AuditLogResult;
  readonly metadata: Record<string, unknown>;
}

const INSERT_AUDIT_LOG_QUERY = `
  INSERT INTO audit_logs (
    tenant_id,
    actor_membership_id,
    action,
    resource_type,
    resource_id,
    result,
    metadata
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
`;

@Injectable()
export class AuditLogRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.pool.query(INSERT_AUDIT_LOG_QUERY, toValues(input));
  }

  async createInTransaction(
    client: PoolClient,
    input: CreateAuditLogInput,
  ): Promise<void> {
    await client.query(INSERT_AUDIT_LOG_QUERY, toValues(input));
  }
}

function toValues(input: CreateAuditLogInput): unknown[] {
  return [
    input.tenantId,
    input.actorMembershipId,
    input.action,
    input.resourceType,
    input.resourceId ?? null,
    input.result,
    JSON.stringify(input.metadata),
  ];
}
