import type { Migration } from '../migrations';

/**
 * Shared persistence primitives for v2.5 business modules.
 *
 * The migration is append-only. Business modules use this table through the
 * idempotency helper; they do not create their own retry ledger.
 */
export const sharedFoundationMigration: Migration = {
  id: '0005_shared_foundation',
  sql: String.raw`
    CREATE TABLE idempotency_keys (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      actor_membership_id uuid NOT NULL,
      action varchar(128) NOT NULL,
      idempotency_key varchar(255) NOT NULL,
      request_hash char(64) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'in_progress',
      response_status integer,
      response_body jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT idempotency_keys_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT idempotency_keys_actor_fk
        FOREIGN KEY (tenant_id, actor_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT idempotency_keys_action_format
        CHECK (action ~ '^[a-z][a-z0-9_.:-]{1,127}$'),
      CONSTRAINT idempotency_keys_key_not_blank
        CHECK (length(btrim(idempotency_key)) > 0),
      CONSTRAINT idempotency_keys_hash_format
        CHECK (request_hash ~ '^[0-9a-f]{64}$'),
      CONSTRAINT idempotency_keys_status_valid
        CHECK (status IN ('in_progress', 'completed', 'failed')),
      CONSTRAINT idempotency_keys_response_status_valid
        CHECK (
          response_status IS NULL OR
          response_status BETWEEN 100 AND 599
        ),
      CONSTRAINT idempotency_keys_completed_response_required
        CHECK (
          status <> 'completed' OR
          (response_status IS NOT NULL AND response_body IS NOT NULL)
        ),
      CONSTRAINT idempotency_keys_scope_unique
        UNIQUE (
          tenant_id,
          application_id,
          actor_membership_id,
          action,
          idempotency_key
        )
    );

    CREATE INDEX idempotency_keys_status_idx
      ON idempotency_keys (tenant_id, application_id, status, created_at);

    CREATE INDEX idempotency_keys_cleanup_idx
      ON idempotency_keys (updated_at);
  `,
};
