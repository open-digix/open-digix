import type { PoolClient } from 'pg';
import { applyMigrations, migrationChecksum } from './migration-runner';
import type { Migration } from './migrations';

type MigrationClient = Pick<PoolClient, 'query'>;

function clientWithQuery(query: jest.Mock): MigrationClient {
  return { query };
}

describe('migration runner', () => {
  const migration: Migration = {
    id: '0001_initial_schema',
    sql: 'CREATE TABLE example (id integer PRIMARY KEY)',
  };

  it('calculates a stable SHA-256 checksum', () => {
    expect(migrationChecksum(migration.sql)).toHaveLength(64);
    expect(migrationChecksum(migration.sql)).toBe(
      migrationChecksum(migration.sql),
    );
  });

  it('applies and records a new migration', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      applyMigrations(clientWithQuery(query), [migration]),
    ).resolves.toEqual({
      applied: ['0001_initial_schema'],
      skipped: [],
    });
    expect(query).toHaveBeenCalledWith(migration.sql);
    expect(query).toHaveBeenLastCalledWith(
      'INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)',
      [migration.id, migrationChecksum(migration.sql)],
    );
  });

  it('skips an already applied migration with the same checksum', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          { id: migration.id, checksum: migrationChecksum(migration.sql) },
        ],
      });

    await expect(
      applyMigrations(clientWithQuery(query), [migration]),
    ).resolves.toEqual({
      applied: [],
      skipped: ['0001_initial_schema'],
    });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('rejects a migration changed after it was applied', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: migration.id, checksum: '0'.repeat(64) }],
      });

    await expect(
      applyMigrations(clientWithQuery(query), [migration]),
    ).rejects.toThrow('was modified after it was applied');
  });

  it('rejects duplicate or invalid migration definitions', async () => {
    const client = clientWithQuery(jest.fn());

    await expect(
      applyMigrations(client, [migration, migration]),
    ).rejects.toThrow('Duplicate migration id');
    await expect(
      applyMigrations(client, [{ id: 'bad-name', sql: 'SELECT 1' }]),
    ).rejects.toThrow('Invalid migration id');
    await expect(
      applyMigrations(client, [{ id: '0002_empty', sql: '  ' }]),
    ).rejects.toThrow('has no SQL');
  });
});
