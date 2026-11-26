import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import type {
  AppAuthorizationApplication,
  AppAuthorizationDataSource,
  AppAuthorizationMembership,
} from './app-authorization.types';

interface ApplicationRow extends QueryResultRow {
  id: string;
  status: string;
}

interface MembershipAccessRow extends QueryResultRow {
  role_codes: string[] | null;
  permissions: string[] | null;
}

const FIND_APPLICATION_QUERY = `
  SELECT id, status
  FROM applications
  WHERE tenant_id = $1 AND id = $2
`;

const FIND_MEMBERSHIP_ACCESS_QUERY = `
  SELECT
    COALESCE(
      array_agg(DISTINCT ar.code ORDER BY ar.code)
        FILTER (WHERE ar.id IS NOT NULL),
      ARRAY[]::text[]
    ) AS role_codes,
    COALESCE(
      array_agg(DISTINCT arp.permission ORDER BY arp.permission)
        FILTER (WHERE arp.permission IS NOT NULL),
      ARRAY[]::text[]
    ) AS permissions
  FROM tenant_memberships tm
  JOIN app_membership_roles amr
    ON amr.tenant_id = tm.tenant_id
   AND amr.membership_id = tm.id
  JOIN application_roles ar
    ON ar.tenant_id = amr.tenant_id
   AND ar.application_id = amr.application_id
   AND ar.id = amr.role_id
  LEFT JOIN application_role_permissions arp
    ON arp.tenant_id = ar.tenant_id
   AND arp.application_id = ar.application_id
   AND arp.role_id = ar.id
  WHERE tm.tenant_id = $1
    AND tm.id = $2
    AND tm.status = 'active'
    AND amr.application_id = $3
`;

@Injectable()
export class AppAuthorizationRepository implements AppAuthorizationDataSource {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findApplication(
    tenantId: string,
    applicationId: string,
  ): Promise<AppAuthorizationApplication | null> {
    const result = await this.pool.query<ApplicationRow>(
      FIND_APPLICATION_QUERY,
      [tenantId, applicationId],
    );
    const row = result.rows[0];

    return row ? { id: row.id, status: row.status } : null;
  }

  async findMembershipAccess(
    tenantId: string,
    applicationId: string,
    membershipId: string,
  ): Promise<AppAuthorizationMembership> {
    const result = await this.pool.query<MembershipAccessRow>(
      FIND_MEMBERSHIP_ACCESS_QUERY,
      [tenantId, membershipId, applicationId],
    );
    const row = result.rows[0];

    return {
      roleCodes: row?.role_codes ?? [],
      permissions: row?.permissions ?? [],
    };
  }
}
