export interface Migration {
  id: string;
  sql: string;
}

// Migrations are append-only. Once applied, an id and its SQL must not change.
// The initial DigiX schema will be added in the next implementation checkpoint.
export const migrations: readonly Migration[] = [];
