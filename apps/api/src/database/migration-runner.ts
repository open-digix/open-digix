import { createHash } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { getDatabaseConfig } from './database.config';
import { migrations, type Migration } from './migrations';

const MIGRATION_LOCK_KEY = 20261107;
const MIGRATION_ID_PATTERN = /^\d{4}_[a-z0-9_]+$/;

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

type MigrationClient = Pick<PoolClient, 'query'>;

export function migrationChecksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

function validateMigrations(items: readonly Migration[]): void {
  const ids = new Set<string>();

  for (const migration of items) {
    if (!MIGRATION_ID_PATTERN.test(migration.id)) {
      throw new Error(
        `Invalid migration id "${migration.id}"; expected NNNN_lowercase_name`,
      );
    }

    if (ids.has(migration.id)) {
      throw new Error(`Duplicate migration id "${migration.id}"`);
    }

    if (migration.sql.trim().length === 0) {
      throw new Error(`Migration "${migration.id}" has no SQL`);
    }

    ids.add(migration.id);
  }
}

export async function applyMigrations(
  client: MigrationClient,
  items: readonly Migration[] = migrations,
): Promise<MigrationResult> {
  validateMigrations(items);

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      checksum char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const existing = await client.query<{
    id: string;
    checksum: string;
  }>('SELECT id, checksum FROM schema_migrations ORDER BY id');
  const appliedById = new Map(
    existing.rows.map((row) => [row.id, row.checksum.trim()]),
  );
  const result: MigrationResult = { applied: [], skipped: [] };

  for (const migration of items) {
    const checksum = migrationChecksum(migration.sql);
    const existingChecksum = appliedById.get(migration.id);

    if (existingChecksum !== undefined) {
      if (existingChecksum !== checksum) {
        throw new Error(
          `Migration "${migration.id}" was modified after it was applied`,
        );
      }

      result.skipped.push(migration.id);
      continue;
    }

    await client.query(migration.sql);
    await client.query(
      'INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)',
      [migration.id, checksum],
    );
    result.applied.push(migration.id);
  }

  return result;
}

export async function migrateDatabase(pool?: Pool): Promise<MigrationResult> {
  const activePool = pool ?? new Pool(getDatabaseConfig());
  const ownsPool = pool === undefined;
  let client: PoolClient | undefined;

  try {
    client = await activePool.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [
      MIGRATION_LOCK_KEY,
    ]);
    const result = await applyMigrations(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    if (client !== undefined) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    client?.release();
    if (ownsPool) {
      await activePool.end();
    }
  }
}
