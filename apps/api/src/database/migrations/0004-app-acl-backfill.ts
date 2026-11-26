import type { Migration } from '../migrations';

export const appAclBackfillMigration: Migration = {
  id: '0004_app_acl_backfill',
  sql: String.raw`
    INSERT INTO application_roles (
      tenant_id,
      application_id,
      code,
      name,
      description,
      is_system
    )
    SELECT
      applications.tenant_id,
      applications.id,
      roles.code,
      roles.name,
      roles.description,
      true
    FROM applications
    CROSS JOIN (
      VALUES
        ('designer', 'Designer', 'Can edit the application draft.'),
        ('publisher', 'Publisher', 'Can publish the application.')
    ) AS roles(code, name, description)
    ON CONFLICT (tenant_id, application_id, code) DO NOTHING;

    INSERT INTO application_role_permissions (
      tenant_id,
      application_id,
      role_id,
      permission
    )
    SELECT
      application_roles.tenant_id,
      application_roles.application_id,
      application_roles.id,
      permissions.permission
    FROM application_roles
    JOIN (
      VALUES
        ('designer', 'app.draft.read'),
        ('designer', 'app.draft.write'),
        ('designer', 'app.draft.validate'),
        ('designer', 'app.source.write'),
        ('publisher', 'app.draft.read'),
        ('publisher', 'app.draft.validate')
    ) AS permissions(role_code, permission)
      ON permissions.role_code = application_roles.code
    ON CONFLICT (tenant_id, application_id, role_id, permission) DO NOTHING;

    WITH application_creators AS (
      SELECT DISTINCT ON (application_versions.tenant_id, application_versions.application_id)
        application_versions.tenant_id,
        application_versions.application_id,
        application_versions.created_by_membership_id
      FROM application_versions
      ORDER BY
        application_versions.tenant_id,
        application_versions.application_id,
        application_versions.version ASC,
        application_versions.created_at ASC,
        application_versions.id ASC
    )
    INSERT INTO app_membership_roles (
      tenant_id,
      application_id,
      membership_id,
      role_id,
      assigned_by_membership_id
    )
    SELECT
      application_creators.tenant_id,
      application_creators.application_id,
      application_creators.created_by_membership_id,
      application_roles.id,
      application_creators.created_by_membership_id
    FROM application_creators
    JOIN application_roles
      ON application_roles.tenant_id = application_creators.tenant_id
      AND application_roles.application_id = application_creators.application_id
      AND application_roles.code = 'designer'
    ON CONFLICT (
      tenant_id,
      application_id,
      membership_id,
      role_id
    ) DO NOTHING;
  `,
};
