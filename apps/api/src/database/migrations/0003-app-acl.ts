import type { Migration } from '../migrations';

export const appAclMigration: Migration = {
  id: '0003_app_acl',
  sql: String.raw`
    CREATE TABLE application_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      code varchar(64) NOT NULL,
      name varchar(120) NOT NULL,
      description text,
      is_system boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT application_roles_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT application_roles_code_format
        CHECK (code ~ '^[a-z][a-z0-9_-]{1,63}$'),
      CONSTRAINT application_roles_tenant_app_code_unique
        UNIQUE (tenant_id, application_id, code),
      CONSTRAINT application_roles_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id)
    );

    CREATE INDEX application_roles_app_idx
      ON application_roles (tenant_id, application_id, code);

    CREATE TABLE application_role_permissions (
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      role_id uuid NOT NULL,
      permission varchar(160) NOT NULL,
      granted_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (tenant_id, application_id, role_id, permission),
      CONSTRAINT application_role_permissions_role_fk
        FOREIGN KEY (tenant_id, application_id, role_id)
        REFERENCES application_roles (tenant_id, application_id, id)
        ON DELETE CASCADE,
      CONSTRAINT application_role_permissions_format
        CHECK (permission ~ '^[a-z][a-z0-9_-]{1,63}([.][a-z][a-z0-9_-]{1,63})+$')
    );

    CREATE INDEX application_role_permissions_permission_idx
      ON application_role_permissions (
        tenant_id,
        application_id,
        permission
      );

    CREATE TABLE app_membership_roles (
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      membership_id uuid NOT NULL,
      role_id uuid NOT NULL,
      assigned_by_membership_id uuid,
      assigned_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (tenant_id, application_id, membership_id, role_id),
      CONSTRAINT app_membership_roles_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT app_membership_roles_membership_fk
        FOREIGN KEY (tenant_id, membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE CASCADE,
      CONSTRAINT app_membership_roles_role_fk
        FOREIGN KEY (tenant_id, application_id, role_id)
        REFERENCES application_roles (tenant_id, application_id, id)
        ON DELETE CASCADE,
      CONSTRAINT app_membership_roles_assigned_by_fk
        FOREIGN KEY (tenant_id, assigned_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT
    );

    CREATE INDEX app_membership_roles_membership_idx
      ON app_membership_roles (tenant_id, membership_id, application_id);

    CREATE INDEX app_membership_roles_role_idx
      ON app_membership_roles (tenant_id, application_id, role_id);
  `,
};
