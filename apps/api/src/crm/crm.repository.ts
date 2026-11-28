import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { hashIdempotencyPayload } from '../idempotency/idempotency.service';

export interface CrmScope {
  tenantId: string;
  appId: string;
  membershipId: string;
}

type Feature = 'crm.customers' | 'crm.opportunities';
type Row = Record<string, unknown>;

function missing(): never {
  throw new NotFoundException({
    error: { code: 'CRM_NOT_FOUND', message: 'Resource not found.' },
  });
}
function conflict(code: string): never {
  throw new ConflictException({
    error: { code, message: 'CRM operation conflicts with current state.' },
  });
}
function dbError(error: unknown): never {
  const constraint = (error as { constraint?: string }).constraint;
  if (constraint === 'customers_tenant_app_code_unique')
    conflict('CUSTOMER_CODE_EXISTS');
  if (constraint === 'opportunity_stage_events_version_unique')
    conflict('VERSION_CONFLICT');
  if ((error as { code?: string }).code === '23503') missing();
  throw error;
}

@Injectable()
export class CrmRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async version(
    scope: CrmScope,
    feature: Feature,
    client: PoolClient | Pool = this.pool,
  ): Promise<string> {
    const result = await client.query<{ id: string }>(
      `SELECT id FROM (
         SELECT id, schema_version, definition FROM application_versions
         WHERE tenant_id = $1 AND application_id = $2 AND status = 'published'
         ORDER BY version DESC LIMIT 1
       ) published
       WHERE schema_version = '2.5'
         AND definition->'features' @> jsonb_build_array(
           jsonb_build_object('id', $3::text, 'version', 1)
         )`,
      [scope.tenantId, scope.appId, feature],
    );
    if (!result.rows[0]) missing();
    return result.rows[0].id;
  }

  async detail(
    table: 'customers' | 'opportunities',
    scope: CrmScope,
    id: string,
  ): Promise<Row> {
    const result = await this.pool.query<Row>(
      `SELECT * FROM ${table} WHERE tenant_id = $1 AND application_id = $2 AND id = $3
       ${table === 'opportunities' ? 'AND (created_by_membership_id = $4 OR assignee_membership_id = $4)' : ''}`,
      table === 'opportunities'
        ? [scope.tenantId, scope.appId, id, scope.membershipId]
        : [scope.tenantId, scope.appId, id],
    );
    return result.rows[0] ?? missing();
  }

  async list(
    table: 'customers' | 'opportunities',
    scope: CrmScope,
    page: {
      limit: number;
      cursor: readonly [string, string] | null;
    },
    customerId?: string,
  ): Promise<{ items: Row[]; nextCursor: string | null }> {
    const values: unknown[] = [scope.tenantId, scope.appId];
    let condition = '';
    if (customerId) {
      values.push(customerId);
      condition += ` AND customer_id = $${values.length}`;
    }
    if (table === 'opportunities') {
      values.push(scope.membershipId);
      condition += ` AND (created_by_membership_id = $${values.length}
        OR assignee_membership_id = $${values.length})`;
    }
    if (page.cursor) {
      values.push(page.cursor[0], page.cursor[1]);
      condition += ` AND (created_at, id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`;
    }
    values.push(page.limit + 1);
    const result = await this.pool.query<Row>(
      `SELECT *, created_at::text AS cursor_created_at
       FROM ${table} WHERE tenant_id = $1 AND application_id = $2
       ${condition} ORDER BY created_at DESC, id DESC LIMIT $${values.length}`,
      values,
    );
    const hasMore = result.rows.length > page.limit;
    const rows = result.rows.slice(0, page.limit);
    const last = rows.at(-1);
    const items = rows.map((row) => {
      const item = { ...row };
      delete item.cursor_created_at;
      return item;
    });
    return {
      items,
      nextCursor:
        hasMore && last
          ? Buffer.from(
              JSON.stringify([last.cursor_created_at, last.id]),
            ).toString('base64url')
          : null,
    };
  }

  async contacts(
    scope: CrmScope,
    customerId: string,
    page: {
      limit: number;
      cursor: readonly [string, string] | null;
    },
  ) {
    await this.detail('customers', scope, customerId);
    const values: unknown[] = [scope.tenantId, scope.appId, customerId];
    let condition = '';
    if (page.cursor) {
      values.push(page.cursor[0], page.cursor[1]);
      condition = `AND (created_at, id) < ($4::timestamptz, $5::uuid)`;
    }
    values.push(page.limit + 1);
    const result = await this.pool.query<Row>(
      `SELECT *, created_at::text AS cursor_created_at
       FROM contacts WHERE tenant_id = $1 AND application_id = $2
       AND customer_id = $3 ${condition}
       ORDER BY created_at DESC, id DESC LIMIT $${values.length}`,
      values,
    );
    const rows = result.rows.slice(0, page.limit);
    const last = rows.at(-1);
    const items = rows.map((row) => {
      const item = { ...row };
      delete item.cursor_created_at;
      return item;
    });
    return {
      items,
      nextCursor:
        result.rows.length > page.limit && last
          ? Buffer.from(
              JSON.stringify([last.cursor_created_at, last.id]),
            ).toString('base64url')
          : null,
    };
  }

  async contact(
    scope: CrmScope,
    customerId: string,
    contactId: string,
  ): Promise<Row> {
    const result = await this.pool.query<Row>(
      `SELECT * FROM contacts
       WHERE tenant_id = $1 AND application_id = $2
         AND customer_id = $3 AND id = $4`,
      [scope.tenantId, scope.appId, customerId, contactId],
    );
    return result.rows[0] ?? missing();
  }

  async history(scope: CrmScope, id: string): Promise<Row[]> {
    const result = await this.pool.query<Row>(
      `SELECT actor_membership_id, from_stage, to_stage,
              opportunity_lock_version, application_version_id, created_at
       FROM opportunity_stage_events
       WHERE tenant_id = $1 AND application_id = $2 AND opportunity_id = $3
       ORDER BY opportunity_lock_version`,
      [scope.tenantId, scope.appId, id],
    );
    return result.rows;
  }

  // The idempotency claim, business write, and saved response commit together.
  // Concurrent identical keys serialize on the ledger's unique constraint.
  async write<T>(
    scope: CrmScope,
    action: string,
    key: string,
    payload: unknown,
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    const hash = hashIdempotencyPayload(payload);
    const values = [
      scope.tenantId,
      scope.appId,
      scope.membershipId,
      action,
      key,
    ];
    try {
      await client.query('BEGIN');
      await this.version(
        scope,
        action.startsWith('crm.opportunities')
          ? 'crm.opportunities'
          : 'crm.customers',
        client,
      );
      const claim = await client.query(
        `INSERT INTO idempotency_keys
          (tenant_id, application_id, actor_membership_id, action, idempotency_key, request_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, application_id, actor_membership_id, action, idempotency_key)
         DO NOTHING RETURNING id`,
        [...values, hash],
      );
      if (!claim.rowCount) {
        const previous = await client.query<{
          request_hash: string;
          status: string;
          response_body: T;
        }>(
          `SELECT request_hash, status, response_body FROM idempotency_keys
           WHERE tenant_id = $1 AND application_id = $2 AND actor_membership_id = $3
             AND action = $4 AND idempotency_key = $5`,
          values,
        );
        const row = previous.rows[0];
        if (!row || row.request_hash !== hash)
          conflict('IDEMPOTENCY_KEY_REUSED');
        if (row.status !== 'completed') conflict('IDEMPOTENCY_IN_PROGRESS');
        await client.query('COMMIT');
        return row.response_body;
      }
      const response = await operation(client);
      await client.query(
        `UPDATE idempotency_keys SET status = 'completed', response_status = $7,
                response_body = $6::jsonb, updated_at = now()
         WHERE tenant_id = $1 AND application_id = $2 AND actor_membership_id = $3
           AND action = $4 AND idempotency_key = $5`,
        [
          ...values,
          JSON.stringify(response),
          action.endsWith('.advance') ? 200 : 201,
        ],
      );
      await client.query('COMMIT');
      return response;
    } catch (error) {
      await client.query('ROLLBACK');
      dbError(error);
    } finally {
      client.release();
    }
  }

  async createCustomer(
    client: PoolClient,
    scope: CrmScope,
    version: string,
    input: {
      customerCode: string;
      name: string;
    },
  ): Promise<Row> {
    const result = await client.query<Row>(
      `INSERT INTO customers (tenant_id, application_id, application_version_id,
        customer_code, name, created_by_membership_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        scope.tenantId,
        scope.appId,
        version,
        input.customerCode,
        input.name,
        scope.membershipId,
      ],
    );
    return result.rows[0];
  }

  async createContact(
    client: PoolClient,
    scope: CrmScope,
    version: string,
    customerId: string,
    input: {
      name: string;
      email: string | null;
    },
  ): Promise<Row> {
    const result = await client.query<Row>(
      `INSERT INTO contacts (tenant_id, application_id, application_version_id,
        customer_id, name, email, created_by_membership_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        scope.tenantId,
        scope.appId,
        version,
        customerId,
        input.name,
        input.email,
        scope.membershipId,
      ],
    );
    return result.rows[0];
  }

  async createOpportunity(
    client: PoolClient,
    scope: CrmScope,
    version: string,
    input: {
      customerId: string;
      name: string;
      assigneeId: string | null;
    },
  ): Promise<Row> {
    const result = await client.query<Row>(
      `INSERT INTO opportunities (tenant_id, application_id, application_version_id,
        customer_id, name, created_by_membership_id, assignee_membership_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        scope.tenantId,
        scope.appId,
        version,
        input.customerId,
        input.name,
        scope.membershipId,
        input.assigneeId,
      ],
    );
    return result.rows[0];
  }

  async advance(
    client: PoolClient,
    scope: CrmScope,
    id: string,
    expectedStage: string,
    expectedVersion: number,
  ): Promise<Row> {
    if (expectedStage === 'won') {
      const existing = await client.query(
        `SELECT 1 FROM opportunities WHERE tenant_id = $1 AND application_id = $2
         AND id = $3 AND (created_by_membership_id = $4 OR assignee_membership_id = $4)`,
        [scope.tenantId, scope.appId, id, scope.membershipId],
      );
      if (!existing.rowCount) missing();
      conflict('STAGE_TERMINAL');
    }
    const next: Record<string, string> = {
      new: 'qualified',
      qualified: 'proposal',
      proposal: 'won',
    };
    const result = await client.query<Row>(
      `UPDATE opportunities SET stage = $5, lock_version = lock_version + 1,
         updated_at = now()
       WHERE tenant_id = $1 AND application_id = $2 AND id = $3
         AND (created_by_membership_id = $7 OR assignee_membership_id = $7)
         AND stage = $4 AND lock_version = $6
       RETURNING *`,
      [
        scope.tenantId,
        scope.appId,
        id,
        expectedStage,
        next[expectedStage],
        expectedVersion,
        scope.membershipId,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      const existing = await client.query(
        `SELECT 1 FROM opportunities WHERE tenant_id = $1 AND application_id = $2
         AND id = $3 AND (created_by_membership_id = $4 OR assignee_membership_id = $4)`,
        [scope.tenantId, scope.appId, id, scope.membershipId],
      );
      if (!existing.rowCount) missing();
      conflict('VERSION_CONFLICT');
    }
    await client.query(
      `INSERT INTO opportunity_stage_events
        (tenant_id, application_id, application_version_id, opportunity_id,
         actor_membership_id, from_stage, to_stage, opportunity_lock_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        scope.tenantId,
        scope.appId,
        row.application_version_id,
        id,
        scope.membershipId,
        expectedStage,
        row.stage,
        row.lock_version,
      ],
    );
    return row;
  }
}
