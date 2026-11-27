import type { Migration } from '../migrations';

/**
 * Tightens the rejected purchase request invariant without editing migration
 * 0007, which may already be applied in shared environments.
 */
export const erpPurchaseRequestConstraintsMigration: Migration = {
  id: '0009_erp_purchase_request_constraints',
  sql: String.raw`
    ALTER TABLE purchase_requests
      DROP CONSTRAINT purchase_requests_rejection_reason_valid;

    ALTER TABLE purchase_requests
      ADD CONSTRAINT purchase_requests_rejection_reason_valid
      CHECK (
        status <> 'rejected'
        OR (
          rejection_reason IS NOT NULL
          AND length(btrim(rejection_reason)) > 0
        )
      );
  `,
};
