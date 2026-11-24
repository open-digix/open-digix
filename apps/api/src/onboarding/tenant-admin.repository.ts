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
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const tenant = await insertId(
        client,
        INSERT_TENANT_QUERY,
        [input.tenantSlug, input.tenantName],
        'tenant',
      );
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
      throw error;
    } finally {
      client.release();
    }
  }
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
