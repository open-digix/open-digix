import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { AuditLogRepository } from './audit-log.repository';

const INSERT_APPLICATION_ACL_QUERY = `
  WITH inserted_roles AS (
    INSERT INTO application_roles (
      tenant_id,
      application_id,
      code,
      name,
      description,
      is_system
    )
    VALUES
      ($1, $2, 'designer', 'Designer', 'Can edit the application draft.', true),
      ($1, $2, 'publisher', 'Publisher', 'Can publish the application.', true)
    RETURNING id, code
  )
  INSERT INTO application_role_permissions (
    tenant_id,
    application_id,
    role_id,
    permission
  )
  SELECT $1, $2, inserted_roles.id, permissions.permission
  FROM inserted_roles
  JOIN (
    VALUES
      ('designer', 'app.draft.read'),
      ('designer', 'app.draft.write'),
      ('designer', 'app.draft.validate'),
      ('designer', 'app.source.write'),
      ('publisher', 'app.draft.read'),
      ('publisher', 'app.draft.validate')
  ) AS permissions(role_code, permission)
    ON permissions.role_code = inserted_roles.code
`;

const ASSIGN_DESIGNER_QUERY = `
  INSERT INTO app_membership_roles (
    tenant_id,
    application_id,
    membership_id,
    role_id,
    assigned_by_membership_id
  )
  SELECT $1, $2, $3, id, $3
  FROM application_roles
  WHERE tenant_id = $1
    AND application_id = $2
    AND code = 'designer'
  RETURNING role_id
`;

export interface InitializeApplicationAclInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly creatorMembershipId: string;
}

@Injectable()
export class ApplicationAclBootstrapService {
  constructor(private readonly auditLogs: AuditLogRepository) {}

  async initialize(
    client: PoolClient,
    input: InitializeApplicationAclInput,
  ): Promise<void> {
    await this.auditLogs.createInTransaction(client, {
      tenantId: input.tenantId,
      actorMembershipId: input.creatorMembershipId,
      action: 'application.created',
      resourceType: 'application',
      resourceId: input.applicationId,
      result: 'success',
      metadata: {
        applicationId: input.applicationId,
        source: 'application_creation',
      },
    });

    await client.query(INSERT_APPLICATION_ACL_QUERY, [
      input.tenantId,
      input.applicationId,
    ]);

    const assignment = await client.query(ASSIGN_DESIGNER_QUERY, [
      input.tenantId,
      input.applicationId,
      input.creatorMembershipId,
    ]);

    if (assignment.rowCount !== 1) {
      throw new Error('Database did not assign the application designer role');
    }

    await this.auditLogs.createInTransaction(client, {
      tenantId: input.tenantId,
      actorMembershipId: input.creatorMembershipId,
      action: 'app_role.assign',
      resourceType: 'app_membership_role',
      resourceId: input.creatorMembershipId,
      result: 'success',
      metadata: {
        applicationId: input.applicationId,
        membershipId: input.creatorMembershipId,
        roleCode: 'designer',
        source: 'application_creation',
      },
    });
  }
}
