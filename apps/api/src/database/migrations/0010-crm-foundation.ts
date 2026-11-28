import type { Migration } from '../migrations';

/**
 * CRM persistence for customers, contacts, opportunities and stage history.
 * Business transitions and authorization are implemented by B08.
 */
export const crmFoundationMigration: Migration = {
  id: '0010_crm_foundation',
  sql: String.raw`
    CREATE TABLE customers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      customer_code varchar(64) NOT NULL,
      name varchar(160) NOT NULL,
      created_by_membership_id uuid NOT NULL,
      lock_version integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT customers_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT customers_application_version_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id)
        REFERENCES application_versions (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT customers_creator_fk
        FOREIGN KEY (tenant_id, created_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT customers_code_not_blank CHECK (length(btrim(customer_code)) > 0),
      CONSTRAINT customers_name_not_blank CHECK (length(btrim(name)) > 0),
      CONSTRAINT customers_lock_version_positive CHECK (lock_version > 0),
      CONSTRAINT customers_tenant_app_code_unique
        UNIQUE (tenant_id, application_id, customer_code),
      CONSTRAINT customers_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id)
    );

    CREATE INDEX customers_app_created_idx
      ON customers (tenant_id, application_id, created_at DESC, id DESC);

    CREATE TABLE contacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      customer_id uuid NOT NULL,
      name varchar(160) NOT NULL,
      email varchar(320),
      created_by_membership_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT contacts_application_version_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id)
        REFERENCES application_versions (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT contacts_customer_fk
        FOREIGN KEY (tenant_id, application_id, customer_id)
        REFERENCES customers (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT contacts_creator_fk
        FOREIGN KEY (tenant_id, created_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT contacts_name_not_blank CHECK (length(btrim(name)) > 0),
      CONSTRAINT contacts_email_valid CHECK (
        email IS NULL OR email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    );

    CREATE INDEX contacts_customer_created_idx
      ON contacts (tenant_id, application_id, customer_id, created_at DESC, id DESC);

    CREATE TABLE opportunities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      customer_id uuid NOT NULL,
      name varchar(160) NOT NULL,
      created_by_membership_id uuid NOT NULL,
      assignee_membership_id uuid,
      stage varchar(20) NOT NULL DEFAULT 'new',
      lock_version integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT opportunities_application_version_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id)
        REFERENCES application_versions (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT opportunities_customer_fk
        FOREIGN KEY (tenant_id, application_id, customer_id)
        REFERENCES customers (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT opportunities_creator_fk
        FOREIGN KEY (tenant_id, created_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT opportunities_assignee_fk
        FOREIGN KEY (tenant_id, assignee_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT opportunities_name_not_blank CHECK (length(btrim(name)) > 0),
      CONSTRAINT opportunities_stage_valid
        CHECK (stage IN ('new', 'qualified', 'proposal', 'won')),
      CONSTRAINT opportunities_lock_version_positive CHECK (lock_version > 0),
      CONSTRAINT opportunities_tenant_app_version_id_unique
        UNIQUE (tenant_id, application_id, application_version_id, id)
    );

    CREATE INDEX opportunities_app_created_idx
      ON opportunities (tenant_id, application_id, created_at DESC, id DESC);
    CREATE INDEX opportunities_app_stage_idx
      ON opportunities (tenant_id, application_id, stage, created_at DESC, id DESC);
    CREATE INDEX opportunities_customer_idx
      ON opportunities (tenant_id, application_id, customer_id);

    CREATE TABLE opportunity_stage_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      opportunity_id uuid NOT NULL,
      actor_membership_id uuid NOT NULL,
      from_stage varchar(20) NOT NULL,
      to_stage varchar(20) NOT NULL,
      opportunity_lock_version integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT opportunity_stage_events_opportunity_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id, opportunity_id)
        REFERENCES opportunities (tenant_id, application_id, application_version_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT opportunity_stage_events_actor_fk
        FOREIGN KEY (tenant_id, actor_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT opportunity_stage_events_stages_valid CHECK (
        from_stage IN ('new', 'qualified', 'proposal')
        AND to_stage IN ('qualified', 'proposal', 'won')
        AND from_stage <> to_stage
      ),
      CONSTRAINT opportunity_stage_events_version_valid
        CHECK (opportunity_lock_version > 1),
      CONSTRAINT opportunity_stage_events_version_unique
        UNIQUE (tenant_id, application_id, opportunity_id, opportunity_lock_version)
    );

  `,
};
