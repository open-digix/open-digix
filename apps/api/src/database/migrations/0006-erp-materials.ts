import type { Migration } from '../migrations';

/**
 * ERP material catalog. This migration is append-only; purchase requests and
 * inventory receipts are added by later migrations.
 */
export const erpMaterialsMigration: Migration = {
  id: '0006_erp_materials',
  sql: String.raw`
    CREATE TABLE materials (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      sku varchar(64) NOT NULL,
      name varchar(160) NOT NULL,
      unit varchar(32) NOT NULL,
      note text,
      created_by_membership_id uuid NOT NULL,
      lock_version integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT materials_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT materials_application_version_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id)
        REFERENCES application_versions (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT materials_created_by_fk
        FOREIGN KEY (tenant_id, created_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT materials_sku_not_blank
        CHECK (length(btrim(sku)) > 0),
      CONSTRAINT materials_name_not_blank
        CHECK (length(btrim(name)) > 0),
      CONSTRAINT materials_unit_not_blank
        CHECK (length(btrim(unit)) > 0),
      CONSTRAINT materials_lock_version_positive
        CHECK (lock_version > 0),
      CONSTRAINT materials_tenant_app_sku_unique
        UNIQUE (tenant_id, application_id, sku),
      CONSTRAINT materials_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id)
    );

    CREATE INDEX materials_app_sku_idx
      ON materials (tenant_id, application_id, sku);

    CREATE INDEX materials_app_version_idx
      ON materials (tenant_id, application_id, application_version_id);
  `,
};
