import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import {
  AuditLogRepository,
  type CreateAuditLogInput,
} from './audit-log.repository';

export class AppRoleAssignmentConflictError extends Error {
  constructor() {
    super('The app role is already assigned to this membership');
    this.name = 'AppRoleAssignmentConflictError';
  }
}

interface RoleRow extends QueryResultRow {
  id: string;
  code: string;
}

const FIND_ACTIVE_MEMBERSHIP_QUERY = `
  SELECT 1
  FROM tenant_memberships
  WHERE tenant_id = $1 AND id = $2 AND status = 'active'
`;

const FIND_ROLE_QUERY = `
  SELECT id, code
  FROM application_roles
  WHERE tenant_id = $1 AND application_id = $2 AND code = $3
`;

const ASSIGN_ROLE_QUERY = `
  INSERT INTO app_membership_roles (
    tenant_id,
    application_id,
    membership_id,
    role_id,
    assigned_by_membership_id
  )
  VALUES ($1, $2, $3, $4, $5)
`;

const REVOKE_ROLE_QUERY = `
  DELETE FROM app_membership_roles
  WHERE tenant_id = $1
    AND application_id = $2
    AND membership_id = $3
    AND role_id = $4
`;

@Injectable()
export class AppRoleManagementRepository {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async hasActiveMembership(
    tenantId: string,
    membershipId: string,
  ): Promise<boolean> {
    const result = await this.pool.query(FIND_ACTIVE_MEMBERSHIP_QUERY, [
      tenantId,
      membershipId,
    ]);
    return result.rows.length > 0;
  }

  async findRole(
    tenantId: string,
    applicationId: string,
    roleCode: string,
  ): Promise<RoleRow | null> {
    const result = await this.pool.query<RoleRow>(FIND_ROLE_QUERY, [
      tenantId,
      applicationId,
      roleCode,
    ]);
    return result.rows[0] ?? null;
  }

  async assignRole(input: {
    tenantId: string;
    applicationId: string;
    membershipId: string;
    roleId: string;
    roleCode: string;
    assignedByMembershipId: string;
  }): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(ASSIGN_ROLE_QUERY, [
        input.tenantId,
        input.applicationId,
        input.membershipId,
        input.roleId,
        input.assignedByMembershipId,
      ]);

      await this.auditLogs.createInTransaction(
        client,
        createRoleAuditInput(input, 'app_role.assign'),
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        throw new AppRoleAssignmentConflictError();
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async revokeRole(input: {
    tenantId: string;
    applicationId: string;
    membershipId: string;
    roleId: string;
    roleCode: string;
    assignedByMembershipId: string;
  }): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query(REVOKE_ROLE_QUERY, [
        input.tenantId,
        input.applicationId,
        input.membershipId,
        input.roleId,
      ]);
      const revoked = result.rowCount === 1;

      if (revoked) {
        await this.auditLogs.createInTransaction(
          client,
          createRoleAuditInput(input, 'app_role.revoke'),
        );
      }

      await client.query('COMMIT');
      return revoked;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

function createRoleAuditInput(
  input: {
    tenantId: string;
    applicationId: string;
    membershipId: string;
    roleCode?: string;
    roleId?: string;
    assignedByMembershipId: string;
  },
  action: 'app_role.assign' | 'app_role.revoke',
): CreateAuditLogInput {
  return {
    tenantId: input.tenantId,
    actorMembershipId: input.assignedByMembershipId,
    action,
    resourceType: 'app_membership_role',
    resourceId: input.membershipId,
    result: 'success',
    metadata: {
      applicationId: input.applicationId,
      membershipId: input.membershipId,
      roleId: input.roleId ?? null,
      roleCode: input.roleCode ?? null,
    },
  };
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}
