import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export interface CreateBuilderApplicationInput {
  readonly tenantId: string;
  readonly createdByMembershipId: string;
  readonly appKey: string;
  readonly name: string;
  readonly goal?: string;
  readonly departmentRefs: readonly string[];
  readonly templateKey?: string;
  readonly schemaVersion: string;
  readonly initialDefinition: Readonly<Record<string, unknown>>;
  readonly definitionChecksum: string;
}

export interface CreatedBuilderApplication {
  readonly appId: string;
  readonly appKey: string;
  readonly name: string;
  readonly status: 'draft';
  readonly versionId: string;
  readonly version: number;
  readonly versionStatus: 'draft';
  readonly lockVersion: number;
}

interface ApplicationRow extends QueryResultRow {
  id: string;
  app_key: string;
  name: string;
  status: 'draft';
}

interface ApplicationVersionRow extends QueryResultRow {
  id: string;
  version: number;
  status: 'draft';
  lock_version: number;
}

const CREATE_APPLICATION_QUERY = `
  INSERT INTO applications (
    tenant_id,
    app_key,
    name,
    status,
    goal,
    department_refs,
    template_key
  )
  VALUES ($1, $2, $3, 'draft', $4, $5::jsonb, $6)
  RETURNING id, app_key, name, status
`;

const CREATE_APPLICATION_VERSION_QUERY = `
  INSERT INTO application_versions (
    tenant_id,
    application_id,
    version,
    schema_version,
    status,
    definition,
    definition_checksum,
    created_by_membership_id
  )
  VALUES ($1, $2, 1, $3, 'draft', $4, $5, $6)
  RETURNING id, version, status, lock_version
`;

@Injectable()
export class BuilderApplicationRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async createDraft(
    input: CreateBuilderApplicationInput,
  ): Promise<CreatedBuilderApplication> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const application = await insertApplication(client, input);
      const version = await insertApplicationVersion(
        client,
        input,
        application.id,
      );
      await client.query('COMMIT');

      return {
        appId: application.id,
        appKey: application.app_key,
        name: application.name,
        status: application.status,
        versionId: version.id,
        version: version.version,
        versionStatus: version.status,
        lockVersion: version.lock_version,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

async function insertApplication(
  client: PoolClient,
  input: CreateBuilderApplicationInput,
): Promise<ApplicationRow> {
  const result = await client.query<ApplicationRow>(CREATE_APPLICATION_QUERY, [
    input.tenantId,
    input.appKey,
    input.name,
    input.goal ?? null,
    JSON.stringify(input.departmentRefs),
    input.templateKey ?? null,
  ]);
  const row = result.rows[0];
  if (!row) throw new Error('Database did not return the created application');
  return row;
}

async function insertApplicationVersion(
  client: PoolClient,
  input: CreateBuilderApplicationInput,
  applicationId: string,
): Promise<ApplicationVersionRow> {
  const result = await client.query<ApplicationVersionRow>(
    CREATE_APPLICATION_VERSION_QUERY,
    [
      input.tenantId,
      applicationId,
      input.schemaVersion,
      input.initialDefinition,
      input.definitionChecksum,
      input.createdByMembershipId,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Database did not return the created application version');
  }
  return row;
}
