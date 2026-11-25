import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export interface CreateTenantAdminInput {
  readonly tenantSlug: string;
  readonly tenantName: string;
  readonly identityIssuer: string;
  readonly identitySubject: string;
  readonly email: string;
  readonly displayName: string;
}

export interface CreatedTenantAdmin {
  readonly tenantId: string;
  readonly identityUserId: string;
  readonly membershipId: string;
  readonly roleId: string;
}

export class TenantSlugConflictError extends Error {
  constructor(readonly tenantSlug: string) {
    super(`Tenant slug is already taken: ${tenantSlug}.`);
    this.name = 'TenantSlugConflictError';
  }
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('PostgreSQL is unavailable.');
    this.name = 'DatabaseUnavailableError';
  }
}

interface IdRow extends QueryResultRow {
  id: string;
}

const INSERT_TENANT_QUERY = `
  INSERT INTO tenants (slug, name, status)
  VALUES ($1, $2, 'active')
  RETURNING id
`;

const INSERT_IDENTITY_USER_QUERY = `
  INSERT INTO identity_users (
    identity_issuer,
    identity_subject,
    email,
    display_name,
    status
  )
  VALUES ($1, $2, $3, $4, 'active')
  RETURNING id
`;

const INSERT_MEMBERSHIP_QUERY = `
  INSERT INTO tenant_memberships (tenant_id, user_id, status)
  VALUES ($1, $2, 'active')
  RETURNING id
`;

const INSERT_ADMIN_ROLE_QUERY = `
  INSERT INTO tenant_roles (tenant_id, code, name, is_system)
  VALUES ($1, 'tenant_admin', 'Tenant administrator', true)
  RETURNING id
`;

const INSERT_MEMBERSHIP_ROLE_QUERY = `
  INSERT INTO membership_roles (tenant_id, membership_id, role_id)
  VALUES ($1, $2, $3)
`;

@Injectable()
export class TenantAdminRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async createTenantAdmin(
    input: CreateTenantAdminInput,
  ): Promise<CreatedTenantAdmin> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch {
      throw new DatabaseUnavailableError();
    }

    try {
      await client.query('BEGIN');
      let tenant: IdRow;
      try {
        tenant = await insertId(
          client,
          INSERT_TENANT_QUERY,
          [input.tenantSlug, input.tenantName],
          'tenant',
        );
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TenantSlugConflictError(input.tenantSlug);
        }
        throw error;
      }
      const identityUser = await insertId(
        client,
        INSERT_IDENTITY_USER_QUERY,
        [
          input.identityIssuer,
          input.identitySubject,
          input.email,
          input.displayName,
        ],
        'identity user',
      );
      const membership = await insertId(
        client,
        INSERT_MEMBERSHIP_QUERY,
        [tenant.id, identityUser.id],
        'tenant membership',
      );
      const role = await insertId(
        client,
        INSERT_ADMIN_ROLE_QUERY,
        [tenant.id],
        'tenant admin role',
      );

      await client.query(INSERT_MEMBERSHIP_ROLE_QUERY, [
        tenant.id,
        membership.id,
        role.id,
      ]);
      await client.query('COMMIT');

      return {
        tenantId: tenant.id,
        identityUserId: identityUser.id,
        membershipId: membership.id,
        roleId: role.id,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (isDatabaseUnavailable(error)) {
        throw new DatabaseUnavailableError();
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return [
    '08000',
    '08001',
    '08003',
    '08004',
    '08006',
    '08007',
    '08P01',
    '53300',
    '57P01',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
  ].includes(String(error.code));
}

async function insertId(
  client: PoolClient,
  query: string,
  values: readonly unknown[],
  entityName: string,
): Promise<IdRow> {
  const result = await client.query<IdRow>(query, [...values]);
  const row = result.rows[0];
  if (!row) {
    throw new Error(`Database did not return the created ${entityName}`);
  }
  return row;
}
