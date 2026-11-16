import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import type {
  BuilderSourceSection,
  BuilderSourceSegment,
} from './builder.types';

export type BuilderSourceSections = Readonly<
  Partial<Record<BuilderSourceSection, string>>
>;

export interface CreateBuilderSourceRevisionInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly createdByMembershipId: string;
  readonly sections: BuilderSourceSections;
  readonly segments: readonly BuilderSourceSegment[];
}

export interface BuilderSourceRevisionRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly applicationId: string;
  readonly revisionNo: number;
  readonly sections: BuilderSourceSections;
  readonly segments: readonly BuilderSourceSegment[];
  readonly createdByMembershipId: string;
  readonly createdAt: Date;
}

interface SourceRevisionRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  application_id: string;
  revision_no: number;
  sections: BuilderSourceSections;
  segments: BuilderSourceSegment[];
  created_by_membership_id: string;
  created_at: Date;
}

const LOCK_APPLICATION_QUERY = `
  SELECT id
  FROM applications
  WHERE tenant_id = $1 AND id = $2
  FOR UPDATE
`;

const CREATE_SOURCE_REVISION_QUERY = `
  INSERT INTO builder_source_revisions (
    tenant_id,
    application_id,
    revision_no,
    sections,
    segments,
    created_by_membership_id
  )
  SELECT
    $1,
    $2,
    COALESCE(MAX(revision_no), 0) + 1,
    $3::jsonb,
    $4::jsonb,
    $5
  FROM builder_source_revisions
  WHERE tenant_id = $1 AND application_id = $2
  RETURNING
    id,
    tenant_id,
    application_id,
    revision_no,
    sections,
    segments,
    created_by_membership_id,
    created_at
`;

@Injectable()
export class BuilderSourceRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async createRevision(
    input: CreateBuilderSourceRevisionInput,
  ): Promise<BuilderSourceRevisionRecord | undefined> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const application = await client.query(LOCK_APPLICATION_QUERY, [
        input.tenantId,
        input.applicationId,
      ]);
      if (!application.rows[0]) {
        await client.query('COMMIT');
        return undefined;
      }

      const revision = await insertRevision(client, input);
      await client.query('COMMIT');
      return revision;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

async function insertRevision(
  client: PoolClient,
  input: CreateBuilderSourceRevisionInput,
): Promise<BuilderSourceRevisionRecord> {
  const result = await client.query<SourceRevisionRow>(
    CREATE_SOURCE_REVISION_QUERY,
    [
      input.tenantId,
      input.applicationId,
      JSON.stringify(input.sections),
      JSON.stringify(input.segments),
      input.createdByMembershipId,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('Database did not return the created source revision');
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    applicationId: row.application_id,
    revisionNo: row.revision_no,
    sections: row.sections,
    segments: row.segments,
    createdByMembershipId: row.created_by_membership_id,
    createdAt: row.created_at,
  };
}
