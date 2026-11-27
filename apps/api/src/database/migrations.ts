import { initialSchemaMigration } from './migrations/0001-initial-schema';
import { builderDraftsMigration } from './migrations/0002-builder-drafts';
import { appAclMigration } from './migrations/0003-app-acl';
import { appAclBackfillMigration } from './migrations/0004-app-acl-backfill';
import { sharedFoundationMigration } from './migrations/0005-shared-foundation';
import { erpMaterialsMigration } from './migrations/0006-erp-materials';
import { erpPurchaseRequestsMigration } from './migrations/0007-erp-purchase-requests';
import { erpInventoryReceiptsMigration } from './migrations/0008-erp-inventory-receipts';

export interface Migration {
  id: string;
  sql: string;
}

// Migrations are append-only. Once applied, an id and its SQL must not change.
export const migrations: readonly Migration[] = [
  initialSchemaMigration,
  builderDraftsMigration,
  appAclMigration,
  appAclBackfillMigration,
  sharedFoundationMigration,
  erpMaterialsMigration,
  erpPurchaseRequestsMigration,
  erpInventoryReceiptsMigration,
];
