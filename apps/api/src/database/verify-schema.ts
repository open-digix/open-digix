import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { getDatabaseConfig } from './database.config';
import { migrationChecksum } from './migration-runner';
import { initialSchemaMigration } from './migrations/0001-initial-schema';

const REQUIRED_TABLES = [
  'application_versions',
  'applications',
  'audit_logs',
  'business_records',
  'identity_users',
  'membership_roles',
  'schema_migrations',
  'stored_files',
  'tenant_memberships',
  'tenant_roles',
  'tenants',
  'workflow_instances',
  'workflow_tasks',
] as const;

interface DatabaseError extends Error {
  code?: string;
}

export interface SchemaVerificationResult {
  requiredTableCount: number;
  rejectedCrossTenantCases: string[];
  rollbackConfirmed: boolean;
}

function asDatabaseError(error: unknown): DatabaseError {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

async function expectForeignKeyViolation(
  client: PoolClient,
  savepointNumber: number,
  caseName: string,
  sql: string,
  values: unknown[],
): Promise<void> {
  const savepoint = `verify_case_${savepointNumber}`;
  await client.query(`SAVEPOINT ${savepoint}`);

  try {
    await client.query(sql, values);
  } catch (error) {
    const databaseError = asDatabaseError(error);
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);

    if (databaseError.code !== '23503') {
      throw new Error(
        `${caseName} failed with PostgreSQL code ${databaseError.code ?? 'unknown'} instead of foreign_key_violation`,
        { cause: databaseError },
      );
    }

    return;
  }

  await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  await client.query(`RELEASE SAVEPOINT ${savepoint}`);
  throw new Error(`${caseName} unexpectedly allowed a cross-tenant reference`);
}

async function verifyRequiredTables(client: PoolClient): Promise<void> {
  const result = await client.query<{ tablename: string }>(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  const existing = new Set(result.rows.map((row) => row.tablename));
  const missing = REQUIRED_TABLES.filter((table) => !existing.has(table));

  if (missing.length > 0) {
    throw new Error(`Missing required database tables: ${missing.join(', ')}`);
  }
}

async function verifyMigrationChecksum(client: PoolClient): Promise<void> {
  const result = await client.query<{ checksum: string }>(
    'SELECT checksum FROM schema_migrations WHERE id = $1',
    [initialSchemaMigration.id],
  );

  if (result.rowCount !== 1) {
    throw new Error(`Migration ${initialSchemaMigration.id} is not applied`);
  }

  const expected = migrationChecksum(initialSchemaMigration.sql);
  if (result.rows[0].checksum.trim() !== expected) {
    throw new Error(`Migration ${initialSchemaMigration.id} checksum mismatch`);
  }
}

export async function verifySchema(
  pool?: Pool,
): Promise<SchemaVerificationResult> {
  const activePool = pool ?? new Pool(getDatabaseConfig());
  const ownsPool = pool === undefined;
  const client = await activePool.connect();
  let transactionOpen = false;

  const tenantAlphaId = randomUUID();
  const tenantBetaId = randomUUID();
  const userAlphaId = randomUUID();
  const userBetaId = randomUUID();
  const membershipAlphaId = randomUUID();
  const membershipBetaId = randomUUID();
  const roleAlphaId = randomUUID();
  const roleBetaId = randomUUID();
  const applicationAlphaId = randomUUID();
  const applicationVersionAlphaId = randomUUID();
  const recordAlphaId = randomUUID();
  const workflowAlphaId = randomUUID();
  const rejectedCrossTenantCases: string[] = [];

  try {
    await verifyRequiredTables(client);
    await verifyMigrationChecksum(client);

    await client.query('BEGIN');
    transactionOpen = true;

    await client.query(
      `INSERT INTO tenants (id, slug, name) VALUES ($1, $2, $3), ($4, $5, $6)`,
      [
        tenantAlphaId,
        `verify-alpha-${tenantAlphaId.slice(0, 8)}`,
        'Verification Alpha',
        tenantBetaId,
        `verify-beta-${tenantBetaId.slice(0, 8)}`,
        'Verification Beta',
      ],
    );
    await client.query(
      `INSERT INTO identity_users
        (id, identity_issuer, identity_subject, display_name)
       VALUES ($1, $2, $3, $4), ($5, $2, $6, $7)`,
      [
        userAlphaId,
        'https://verification.invalid',
        `alpha-${userAlphaId}`,
        'Verification Alpha User',
        userBetaId,
        `beta-${userBetaId}`,
        'Verification Beta User',
      ],
    );
    await client.query(
      `INSERT INTO tenant_memberships (id, tenant_id, user_id)
       VALUES ($1, $2, $3), ($4, $5, $6)`,
      [
        membershipAlphaId,
        tenantAlphaId,
        userAlphaId,
        membershipBetaId,
        tenantBetaId,
        userBetaId,
      ],
    );
    await client.query(
      `INSERT INTO tenant_roles (id, tenant_id, code, name)
       VALUES ($1, $2, 'employee', 'Employee'),
              ($3, $4, 'employee', 'Employee')`,
      [roleAlphaId, tenantAlphaId, roleBetaId, tenantBetaId],
    );
    await client.query(
      `INSERT INTO membership_roles (tenant_id, membership_id, role_id)
       VALUES ($1, $2, $3)`,
      [tenantAlphaId, membershipAlphaId, roleAlphaId],
    );
    await client.query(
      `INSERT INTO applications (id, tenant_id, app_key, name)
       VALUES ($1, $2, 'verification_app', 'Verification App')`,
      [applicationAlphaId, tenantAlphaId],
    );
    await client.query(
      `INSERT INTO application_versions (
        id,
        tenant_id,
        application_id,
        version,
        schema_version,
        definition,
        definition_checksum,
        created_by_membership_id
      ) VALUES ($1, $2, $3, 1, '1.0', $4::jsonb, $5, $6)`,
      [
        applicationVersionAlphaId,
        tenantAlphaId,
        applicationAlphaId,
        JSON.stringify({ name: 'verification' }),
        'a'.repeat(64),
        membershipAlphaId,
      ],
    );
    await client.query(
      `INSERT INTO business_records (
        id,
        tenant_id,
        application_id,
        application_version_id,
        requester_membership_id,
        data
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        recordAlphaId,
        tenantAlphaId,
        applicationAlphaId,
        applicationVersionAlphaId,
        membershipAlphaId,
        JSON.stringify({ verification: true }),
      ],
    );
    await client.query(
      `INSERT INTO workflow_instances (
        id,
        tenant_id,
        record_id,
        application_version_id,
        engine_process_instance_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        workflowAlphaId,
        tenantAlphaId,
        recordAlphaId,
        applicationVersionAlphaId,
        `verify-process-${workflowAlphaId}`,
      ],
    );

    const cases: Array<{
      name: string;
      sql: string;
      values: unknown[];
    }> = [
      {
        name: 'membership cannot receive a role from another tenant',
        sql: `INSERT INTO membership_roles (tenant_id, membership_id, role_id)
              VALUES ($1, $2, $3)`,
        values: [tenantAlphaId, membershipAlphaId, roleBetaId],
      },
      {
        name: 'application version cannot use an application from another tenant',
        sql: `INSERT INTO application_versions (
                tenant_id,
                application_id,
                version,
                schema_version,
                definition,
                definition_checksum,
                created_by_membership_id
              ) VALUES ($1, $2, 2, '1.0', '{}'::jsonb, $3, $4)`,
        values: [
          tenantBetaId,
          applicationAlphaId,
          'b'.repeat(64),
          membershipBetaId,
        ],
      },
      {
        name: 'business record cannot use an application from another tenant',
        sql: `INSERT INTO business_records (
                tenant_id,
                application_id,
                application_version_id,
                requester_membership_id
              ) VALUES ($1, $2, $3, $4)`,
        values: [
          tenantBetaId,
          applicationAlphaId,
          applicationVersionAlphaId,
          membershipBetaId,
        ],
      },
      {
        name: 'workflow task cannot assign a member from another tenant',
        sql: `INSERT INTO workflow_tasks (
                tenant_id,
                workflow_instance_id,
                engine_task_id,
                role_code,
                assignee_membership_id
              ) VALUES ($1, $2, $3, 'employee', $4)`,
        values: [
          tenantAlphaId,
          workflowAlphaId,
          `verify-task-${randomUUID()}`,
          membershipBetaId,
        ],
      },
      {
        name: 'stored file cannot reference a record from another tenant',
        sql: `INSERT INTO stored_files (
                tenant_id,
                record_id,
                storage_key,
                original_name,
                content_type,
                size_bytes,
                checksum_sha256,
                created_by_membership_id
              ) VALUES ($1, $2, $3, 'verify.txt', 'text/plain', 1, $4, $5)`,
        values: [
          tenantBetaId,
          recordAlphaId,
          `verify/${randomUUID()}`,
          'c'.repeat(64),
          membershipBetaId,
        ],
      },
      {
        name: 'audit event cannot use an actor from another tenant',
        sql: `INSERT INTO audit_logs (
                tenant_id,
                actor_membership_id,
                action,
                resource_type,
                result
              ) VALUES ($1, $2, 'verify', 'schema', 'success')`,
        values: [tenantAlphaId, membershipBetaId],
      },
    ];

    for (const [index, testCase] of cases.entries()) {
      await expectForeignKeyViolation(
        client,
        index + 1,
        testCase.name,
        testCase.sql,
        testCase.values,
      );
      rejectedCrossTenantCases.push(testCase.name);
    }

    await client.query('ROLLBACK');
    transactionOpen = false;

    const remaining = await client.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM tenants WHERE id = ANY($1::uuid[])',
      [[tenantAlphaId, tenantBetaId]],
    );

    if (remaining.rows[0].count !== '0') {
      throw new Error('Verification data remained after rollback');
    }

    return {
      requiredTableCount: REQUIRED_TABLES.length,
      rejectedCrossTenantCases,
      rollbackConfirmed: true,
    };
  } catch (error) {
    if (transactionOpen) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    client.release();
    if (ownsPool) {
      await activePool.end();
    }
  }
}

if (require.main === module) {
  void verifySchema()
    .then((result) => {
      console.log(`Required tables verified: ${result.requiredTableCount}`);
      console.log(
        `Cross-tenant references rejected: ${result.rejectedCrossTenantCases.length}`,
      );
      for (const caseName of result.rejectedCrossTenantCases) {
        console.log(`- ${caseName}`);
      }
      console.log(`Rollback cleanup confirmed: ${result.rollbackConfirmed}`);
    })
    .catch((error: unknown) => {
      console.error('Database schema verification failed', error);
      process.exitCode = 1;
    });
}
