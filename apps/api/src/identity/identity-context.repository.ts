import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import type {
  IdentityUserStatus,
  MeMembership,
  MeUser,
  MembershipStatus,
  TenantStatus,
} from './identity.types';

interface IdentityContextRow extends QueryResultRow {
  user_id: string;
  identity_subject: string;
  user_email: string | null;
  user_display_name: string | null;
  user_status: IdentityUserStatus;
  membership_id: string | null;
  membership_status: MembershipStatus | null;
  tenant_id: string | null;
  tenant_slug: string | null;
  tenant_name: string | null;
  tenant_status: TenantStatus | null;
  roles: string[];
}

export interface ResolvedIdentityContext {
  user: MeUser;
  memberships: MeMembership[];
}

const IDENTITY_CONTEXT_QUERY = `
  SELECT
    u.id AS user_id,
    u.identity_subject,
    u.email AS user_email,
    u.display_name AS user_display_name,
    u.status AS user_status,
    m.id AS membership_id,
    m.status AS membership_status,
    t.id AS tenant_id,
    t.slug AS tenant_slug,
    t.name AS tenant_name,
    t.status AS tenant_status,
    COALESCE(
      array_agg(DISTINCT r.code ORDER BY r.code)
        FILTER (WHERE r.code IS NOT NULL),
      ARRAY[]::varchar[]
    ) AS roles
  FROM identity_users u
  LEFT JOIN tenant_memberships m ON m.user_id = u.id
  LEFT JOIN tenants t ON t.id = m.tenant_id
  LEFT JOIN membership_roles mr
    ON mr.tenant_id = m.tenant_id
    AND mr.membership_id = m.id
  LEFT JOIN tenant_roles r
    ON r.tenant_id = mr.tenant_id
    AND r.id = mr.role_id
  WHERE u.identity_issuer = $1
    AND u.identity_subject = $2
  GROUP BY
    u.id,
    m.id,
    t.id
  ORDER BY t.slug NULLS LAST
`;

function mapMembership(row: IdentityContextRow): MeMembership | undefined {
  if (
    !row.membership_id ||
    !row.membership_status ||
    !row.tenant_id ||
    !row.tenant_slug ||
    !row.tenant_name ||
    !row.tenant_status
  ) {
    return undefined;
  }

  return {
    id: row.membership_id,
    status: row.membership_status,
    tenant: {
      id: row.tenant_id,
      slug: row.tenant_slug,
      name: row.tenant_name,
      status: row.tenant_status,
    },
    roles: row.roles,
  };
}

@Injectable()
export class IdentityContextRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findByExternalIdentity(
    issuer: string,
    subject: string,
  ): Promise<ResolvedIdentityContext | undefined> {
    const result = await this.pool.query<IdentityContextRow>(
      IDENTITY_CONTEXT_QUERY,
      [issuer, subject],
    );
    const firstRow = result.rows[0];

    if (!firstRow) {
      return undefined;
    }

    return {
      user: {
        id: firstRow.user_id,
        subject: firstRow.identity_subject,
        email: firstRow.user_email,
        displayName: firstRow.user_display_name,
        status: firstRow.user_status,
      },
      memberships: result.rows
        .map(mapMembership)
        .filter((membership): membership is MeMembership =>
          Boolean(membership),
        ),
    };
  }
}
