import { initialSchemaMigration } from './migrations/0001-initial-schema';

export interface Migration {
  id: string;
  sql: string;
}

// Migrations are append-only. Once applied, an id and its SQL must not change.
export const migrations: readonly Migration[] = [initialSchemaMigration];
