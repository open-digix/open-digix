import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import {
  type IdempotencyRecord,
  type IdempotencyScope,
  type IdempotencyStatus,
} from './idempotency.types';

interface IdempotencyRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  application_id: string;
  actor_membership_id: string;
  action: string;
  idempotency_key: string;
  request_hash: string;
  status: IdempotencyStatus;
  response_status: number | null;
  response_body: unknown;
}

const INSERT_QUERY = `
  INSERT INTO idempotency_keys (
    tenant_id,
    application_id,
    actor_membership_id,
    action,
    idempotency_key,
    request_hash
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (
    tenant_id,
    application_id,
    actor_membership_id,
    action,
    idempotency_key
  ) DO NOTHING
  RETURNING *
`;

const FIND_QUERY = `
  SELECT *
  FROM idempotency_keys
  WHERE tenant_id = $1
    AND application_id = $2
    AND actor_membership_id = $3
    AND action = $4
    AND idempotency_key = $5
`;

const COMPLETE_QUERY = `
  UPDATE idempotency_keys
  SET
    status = $6,
    response_status = $7,
    response_body = $8::jsonb,
    updated_at = now()
  WHERE tenant_id = $1
    AND application_id = $2
    AND actor_membership_id = $3
    AND action = $4
    AND idempotency_key = $5
    AND request_hash = $9
    AND status = 'in_progress'
`;

@Injectable()
export class IdempotencyRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async createIfAbsent(
    scope: IdempotencyScope,
    requestHash: string,
  ): Promise<IdempotencyRecord | null> {
    const result = await this.pool.query<IdempotencyRow>(INSERT_QUERY, [
      scope.tenantId,
      scope.applicationId,
      scope.actorMembershipId,
      scope.action,
      scope.idempotencyKey,
      requestHash,
    ]);

    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  async find(scope: IdempotencyScope): Promise<IdempotencyRecord | null> {
    const result = await this.pool.query<IdempotencyRow>(FIND_QUERY, [
      scope.tenantId,
      scope.applicationId,
      scope.actorMembershipId,
      scope.action,
      scope.idempotencyKey,
    ]);

    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  async complete(
    scope: IdempotencyScope,
    requestHash: string,
    status: Exclude<IdempotencyStatus, 'in_progress'>,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<boolean> {
    const result = await this.pool.query(COMPLETE_QUERY, [
      scope.tenantId,
      scope.applicationId,
      scope.actorMembershipId,
      scope.action,
      scope.idempotencyKey,
      status,
      responseStatus,
      JSON.stringify(responseBody),
      requestHash,
    ]);

    return result.rowCount === 1;
  }
}

function toRecord(row: IdempotencyRow): IdempotencyRecord {
  return {
    id: row.id,
    scope: {
      tenantId: row.tenant_id,
      applicationId: row.application_id,
      actorMembershipId: row.actor_membership_id,
      action: row.action,
      idempotencyKey: row.idempotency_key,
    },
    requestHash: row.request_hash,
    status: row.status,
    responseStatus: row.response_status,
    responseBody: row.response_body,
  };
}
