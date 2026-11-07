import type { Migration } from '../migrations';

export const initialSchemaMigration: Migration = {
  id: '0001_initial_schema',
  sql: String.raw`
    CREATE TABLE tenants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug varchar(64) NOT NULL UNIQUE,
      name varchar(160) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z][a-z0-9_-]{1,63}$'),
      CONSTRAINT tenants_status_valid CHECK (status IN ('active', 'suspended', 'archived'))
    );

    CREATE TABLE identity_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      identity_issuer text NOT NULL,
      identity_subject text NOT NULL,
      email text,
      display_name varchar(160),
      status varchar(20) NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT identity_users_external_identity_unique
        UNIQUE (identity_issuer, identity_subject),
      CONSTRAINT identity_users_status_valid
        CHECK (status IN ('active', 'disabled'))
    );

    CREATE TABLE tenant_memberships (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
      status varchar(20) NOT NULL DEFAULT 'active',
      joined_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT tenant_memberships_tenant_user_unique UNIQUE (tenant_id, user_id),
      CONSTRAINT tenant_memberships_tenant_id_id_unique UNIQUE (tenant_id, id),
      CONSTRAINT tenant_memberships_status_valid
        CHECK (status IN ('invited', 'active', 'suspended', 'removed'))
    );

    CREATE INDEX tenant_memberships_user_id_idx
      ON tenant_memberships (user_id);

    CREATE TABLE tenant_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      code varchar(64) NOT NULL,
      name varchar(120) NOT NULL,
      description text,
      is_system boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT tenant_roles_code_format CHECK (code ~ '^[a-z][a-z0-9_-]{1,63}$'),
      CONSTRAINT tenant_roles_tenant_code_unique UNIQUE (tenant_id, code),
      CONSTRAINT tenant_roles_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE TABLE membership_roles (
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      membership_id uuid NOT NULL,
      role_id uuid NOT NULL,
      assigned_by_membership_id uuid,
      assigned_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (tenant_id, membership_id, role_id),
      CONSTRAINT membership_roles_membership_fk
        FOREIGN KEY (tenant_id, membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE CASCADE,
      CONSTRAINT membership_roles_role_fk
        FOREIGN KEY (tenant_id, role_id)
        REFERENCES tenant_roles (tenant_id, id) ON DELETE CASCADE,
      CONSTRAINT membership_roles_assigned_by_fk
        FOREIGN KEY (tenant_id, assigned_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT
    );

    CREATE INDEX membership_roles_role_id_idx
      ON membership_roles (tenant_id, role_id);

    CREATE TABLE applications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      app_key varchar(64) NOT NULL,
      name varchar(160) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT applications_key_format CHECK (app_key ~ '^[a-z][a-z0-9_-]{1,63}$'),
      CONSTRAINT applications_status_valid CHECK (status IN ('draft', 'active', 'retired')),
      CONSTRAINT applications_tenant_key_unique UNIQUE (tenant_id, app_key),
      CONSTRAINT applications_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE TABLE application_versions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      version integer NOT NULL,
      schema_version varchar(20) NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'draft',
      definition jsonb NOT NULL,
      definition_checksum char(64) NOT NULL,
      workflow_deployment_id text,
      workflow_definition_id text,
      created_by_membership_id uuid NOT NULL,
      reviewed_by_membership_id uuid,
      published_by_membership_id uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      reviewed_at timestamptz,
      published_at timestamptz,
      CONSTRAINT application_versions_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT application_versions_created_by_fk
        FOREIGN KEY (tenant_id, created_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT application_versions_reviewed_by_fk
        FOREIGN KEY (tenant_id, reviewed_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT application_versions_published_by_fk
        FOREIGN KEY (tenant_id, published_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT application_versions_version_positive CHECK (version > 0),
      CONSTRAINT application_versions_definition_object
        CHECK (jsonb_typeof(definition) = 'object'),
      CONSTRAINT application_versions_checksum_format
        CHECK (definition_checksum ~ '^[0-9a-f]{64}$'),
      CONSTRAINT application_versions_status_valid
        CHECK (status IN (
          'draft',
          'reviewed',
          'published',
          'retired',
          'failed',
          'reconciliation_required'
        )),
      CONSTRAINT application_versions_tenant_app_version_unique
        UNIQUE (tenant_id, application_id, version),
      CONSTRAINT application_versions_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id),
      CONSTRAINT application_versions_tenant_id_id_unique
        UNIQUE (tenant_id, id)
    );

    CREATE INDEX application_versions_status_idx
      ON application_versions (tenant_id, application_id, status);

    CREATE TABLE business_records (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      requester_membership_id uuid NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'draft',
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      lock_version integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      submitted_at timestamptz,
      completed_at timestamptz,
      CONSTRAINT business_records_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT business_records_application_version_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id)
        REFERENCES application_versions (tenant_id, application_id, id) ON DELETE RESTRICT,
      CONSTRAINT business_records_requester_fk
        FOREIGN KEY (tenant_id, requester_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT business_records_data_object CHECK (jsonb_typeof(data) = 'object'),
      CONSTRAINT business_records_lock_version_positive CHECK (lock_version > 0),
      CONSTRAINT business_records_status_valid
        CHECK (status IN (
          'draft',
          'submitted',
          'in_progress',
          'changes_requested',
          'approved',
          'rejected',
          'cancelled',
          'reconciliation_required'
        )),
      CONSTRAINT business_records_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE INDEX business_records_app_status_idx
      ON business_records (tenant_id, application_id, status);

    CREATE INDEX business_records_requester_idx
      ON business_records (tenant_id, requester_membership_id, created_at DESC);

    CREATE TABLE workflow_instances (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      record_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      engine_process_instance_id text NOT NULL,
      status varchar(32) NOT NULL DEFAULT 'running',
      started_at timestamptz NOT NULL DEFAULT now(),
      completed_at timestamptz,
      CONSTRAINT workflow_instances_record_fk
        FOREIGN KEY (tenant_id, record_id)
        REFERENCES business_records (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT workflow_instances_application_version_fk
        FOREIGN KEY (tenant_id, application_version_id)
        REFERENCES application_versions (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT workflow_instances_status_valid
        CHECK (status IN ('starting', 'running', 'completed', 'failed', 'reconciliation_required')),
      CONSTRAINT workflow_instances_engine_id_unique
        UNIQUE (tenant_id, engine_process_instance_id),
      CONSTRAINT workflow_instances_record_unique UNIQUE (tenant_id, record_id),
      CONSTRAINT workflow_instances_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE INDEX workflow_instances_status_idx
      ON workflow_instances (tenant_id, status);

    CREATE TABLE workflow_tasks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      workflow_instance_id uuid NOT NULL,
      engine_task_id text NOT NULL,
      role_code varchar(64) NOT NULL,
      assignee_membership_id uuid,
      status varchar(20) NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      due_at timestamptz,
      completed_at timestamptz,
      CONSTRAINT workflow_tasks_instance_fk
        FOREIGN KEY (tenant_id, workflow_instance_id)
        REFERENCES workflow_instances (tenant_id, id) ON DELETE CASCADE,
      CONSTRAINT workflow_tasks_assignee_fk
        FOREIGN KEY (tenant_id, assignee_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT workflow_tasks_role_code_format
        CHECK (role_code ~ '^[a-z][a-z0-9_-]{1,63}$'),
      CONSTRAINT workflow_tasks_status_valid
        CHECK (status IN ('open', 'claimed', 'completed', 'cancelled')),
      CONSTRAINT workflow_tasks_engine_id_unique UNIQUE (tenant_id, engine_task_id),
      CONSTRAINT workflow_tasks_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE INDEX workflow_tasks_inbox_idx
      ON workflow_tasks (tenant_id, assignee_membership_id, status, created_at);

    CREATE INDEX workflow_tasks_role_inbox_idx
      ON workflow_tasks (tenant_id, role_code, status, created_at);

    CREATE TABLE stored_files (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      record_id uuid,
      storage_key text NOT NULL,
      original_name text NOT NULL,
      content_type text NOT NULL,
      size_bytes bigint NOT NULL,
      checksum_sha256 char(64) NOT NULL,
      scan_status varchar(20) NOT NULL DEFAULT 'pending',
      created_by_membership_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT stored_files_record_fk
        FOREIGN KEY (tenant_id, record_id)
        REFERENCES business_records (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT stored_files_created_by_fk
        FOREIGN KEY (tenant_id, created_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT stored_files_size_non_negative CHECK (size_bytes >= 0),
      CONSTRAINT stored_files_checksum_format
        CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
      CONSTRAINT stored_files_scan_status_valid
        CHECK (scan_status IN ('pending', 'clean', 'rejected', 'failed')),
      CONSTRAINT stored_files_storage_key_unique UNIQUE (tenant_id, storage_key),
      CONSTRAINT stored_files_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE INDEX stored_files_record_idx
      ON stored_files (tenant_id, record_id);

    CREATE TABLE audit_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      actor_membership_id uuid,
      action varchar(120) NOT NULL,
      resource_type varchar(80) NOT NULL,
      resource_id uuid,
      result varchar(20) NOT NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      occurred_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT audit_logs_actor_fk
        FOREIGN KEY (tenant_id, actor_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT audit_logs_result_valid CHECK (result IN ('success', 'denied', 'failed')),
      CONSTRAINT audit_logs_metadata_object CHECK (jsonb_typeof(metadata) = 'object'),
      CONSTRAINT audit_logs_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE INDEX audit_logs_resource_idx
      ON audit_logs (tenant_id, resource_type, resource_id, occurred_at DESC);

    CREATE INDEX audit_logs_actor_idx
      ON audit_logs (tenant_id, actor_membership_id, occurred_at DESC);
  `,
};
