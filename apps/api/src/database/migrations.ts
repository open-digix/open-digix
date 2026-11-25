import { initialSchemaMigration } from './migrations/0001-initial-schema';
import { builderDraftsMigration } from './migrations/0002-builder-drafts';
import { appAclMigration } from './migrations/0003-app-acl';

export interface Migration {
  id: string;
  sql: string;
}

// Migrations are append-only. Once applied, an id and its SQL must not change.
export const migrations: readonly Migration[] = [
  initialSchemaMigration,
  builderDraftsMigration,
  appAclMigration,
];
