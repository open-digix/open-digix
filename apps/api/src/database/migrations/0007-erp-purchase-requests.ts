import type { Migration } from '../migrations';

/**
 * ERP purchase requests and their material lines. Inventory receipts are
 * added by a later append-only migration.
 */
export const erpPurchaseRequestsMigration: Migration = {
  id: '0007_erp_purchase_requests',
  sql: String.raw`
    ALTER TABLE materials
      ADD CONSTRAINT materials_tenant_app_version_id_unique
      UNIQUE (tenant_id, application_id, application_version_id, id);

    ALTER TABLE business_records
      ADD CONSTRAINT business_records_tenant_app_version_id_unique
      UNIQUE (tenant_id, application_id, application_version_id, id);

    CREATE TABLE purchase_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      business_record_id uuid NOT NULL,
      requester_membership_id uuid NOT NULL,
      approver_membership_id uuid,
      status varchar(20) NOT NULL DEFAULT 'draft',
      rejection_reason text,
      lock_version integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      submitted_at timestamptz,
      decided_at timestamptz,
      CONSTRAINT purchase_requests_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT purchase_requests_application_version_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id)
        REFERENCES application_versions (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT purchase_requests_business_record_fk
        FOREIGN KEY (
          tenant_id,
          application_id,
          application_version_id,
          business_record_id
        )
        REFERENCES business_records (
          tenant_id,
          application_id,
          application_version_id,
          id
        ) ON DELETE RESTRICT,
      CONSTRAINT purchase_requests_requester_fk
        FOREIGN KEY (tenant_id, requester_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT purchase_requests_approver_fk
        FOREIGN KEY (tenant_id, approver_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT purchase_requests_status_valid
        CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
      CONSTRAINT purchase_requests_lock_version_positive
        CHECK (lock_version > 0),
      CONSTRAINT purchase_requests_rejection_reason_valid
        CHECK (status <> 'rejected' OR length(btrim(rejection_reason)) > 0),
      CONSTRAINT purchase_requests_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id),
      CONSTRAINT purchase_requests_tenant_app_version_id_unique
        UNIQUE (tenant_id, application_id, application_version_id, id)
    );

    CREATE INDEX purchase_requests_app_status_idx
      ON purchase_requests (tenant_id, application_id, status, created_at DESC);

    CREATE INDEX purchase_requests_requester_idx
      ON purchase_requests (
        tenant_id,
        application_id,
        requester_membership_id,
        created_at DESC
      );

    CREATE TABLE purchase_request_lines (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      purchase_request_id uuid NOT NULL,
      material_id uuid NOT NULL,
      quantity integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT purchase_request_lines_request_fk
        FOREIGN KEY (
          tenant_id,
          application_id,
          application_version_id,
          purchase_request_id
        )
        REFERENCES purchase_requests (
          tenant_id,
          application_id,
          application_version_id,
          id
        ) ON DELETE CASCADE,
      CONSTRAINT purchase_request_lines_material_fk
        FOREIGN KEY (
          tenant_id,
          application_id,
          application_version_id,
          material_id
        )
        REFERENCES materials (
          tenant_id,
          application_id,
          application_version_id,
          id
        ) ON DELETE RESTRICT,
      CONSTRAINT purchase_request_lines_quantity_positive
        CHECK (quantity > 0),
      CONSTRAINT purchase_request_lines_request_material_unique
        UNIQUE (tenant_id, application_id, purchase_request_id, material_id),
      CONSTRAINT purchase_request_lines_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id)
    );

    CREATE INDEX purchase_request_lines_request_idx
      ON purchase_request_lines (
        tenant_id,
        application_id,
        application_version_id,
        purchase_request_id
      );

    CREATE INDEX purchase_request_lines_material_idx
      ON purchase_request_lines (tenant_id, application_id, material_id);
  `,
};
