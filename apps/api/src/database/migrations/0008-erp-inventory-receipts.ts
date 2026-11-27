import type { Migration } from '../migrations';

/**
 * Immutable ERP inventory receipts. Stock is calculated from these lines;
 * there is intentionally no stored stock total in this migration.
 */
export const erpInventoryReceiptsMigration: Migration = {
  id: '0008_erp_inventory_receipts',
  sql: String.raw`
    CREATE TABLE inventory_receipts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      purchase_request_id uuid NOT NULL,
      approved_by_membership_id uuid NOT NULL,
      received_by_membership_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT inventory_receipts_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT inventory_receipts_application_version_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id)
        REFERENCES application_versions (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT inventory_receipts_request_fk
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
        ) ON DELETE RESTRICT,
      CONSTRAINT inventory_receipts_approved_by_fk
        FOREIGN KEY (tenant_id, approved_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT inventory_receipts_received_by_fk
        FOREIGN KEY (tenant_id, received_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT inventory_receipts_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id),
      CONSTRAINT inventory_receipts_tenant_app_version_id_unique
        UNIQUE (tenant_id, application_id, application_version_id, id),
      CONSTRAINT inventory_receipts_request_unique
        UNIQUE (tenant_id, application_id, purchase_request_id)
    );

    CREATE INDEX inventory_receipts_app_created_idx
      ON inventory_receipts (tenant_id, application_id, created_at DESC);

    CREATE TABLE inventory_receipt_lines (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      receipt_id uuid NOT NULL,
      material_id uuid NOT NULL,
      quantity integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT inventory_receipt_lines_receipt_fk
        FOREIGN KEY (
          tenant_id,
          application_id,
          application_version_id,
          receipt_id
        )
        REFERENCES inventory_receipts (
          tenant_id,
          application_id,
          application_version_id,
          id
        ) ON DELETE RESTRICT,
      CONSTRAINT inventory_receipt_lines_material_fk
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
      CONSTRAINT inventory_receipt_lines_quantity_positive
        CHECK (quantity > 0),
      CONSTRAINT inventory_receipt_lines_receipt_material_unique
        UNIQUE (tenant_id, application_id, receipt_id, material_id),
      CONSTRAINT inventory_receipt_lines_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id)
    );

    CREATE INDEX inventory_receipt_lines_receipt_idx
      ON inventory_receipt_lines (
        tenant_id,
        application_id,
        application_version_id,
        receipt_id
      );

    CREATE INDEX inventory_receipt_lines_material_idx
      ON inventory_receipt_lines (tenant_id, application_id, material_id);
  `,
};
