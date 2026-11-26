import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { AuditService } from '../audit/audit.service';
import {
  AuditAction,
  AuditResult,
} from '../audit/constants/audit-policy.constants';
import { DATABASE_POOL } from '../database/database.module';
import type {
  BuilderApplicationDefinitionV1,
  BuilderDesignMetadata,
  BuilderOpenIssue,
  BuilderSourceMapping,
  BuilderSourceSegment,
} from './builder.types';
import type { BuilderSourceRevisionRecord } from './builder-source.repository';

export class BuilderVersionConflictError extends Error {
  constructor() {
    super('Draft lock version conflict');
    this.name = 'BuilderVersionConflictError';
  }
}

export interface ApplicationVersionRecord {
  readonly applicationId: string;
  readonly appKey: string;
  readonly appName: string;
  readonly appStatus: string;
  readonly versionId: string;
  readonly version: number;
  readonly versionStatus: string;
  readonly lockVersion: number;
  readonly currentRevisionId: string | null;
}

export interface DraftDetailsRecord {
  readonly applicationId: string;
  readonly appKey: string;
  readonly appName: string;
  readonly appStatus: string;
  readonly versionId: string;
  readonly version: number;
  readonly versionStatus: string;
  readonly lockVersion: number;
  readonly revisionId: string | null;
  readonly revisionNo: number | null;
  readonly snapshotChecksum: string;
  readonly definition: BuilderApplicationDefinitionV1 | Record<string, unknown>;
  readonly sourceMappings: readonly BuilderSourceMapping[];
  readonly openIssues: readonly BuilderOpenIssue[];
  readonly createdAt: Date | null;
}

export interface SaveNormalizedDraftInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly applicationVersionId: string;
  readonly version: number;
  readonly sourceRevisionId: string;
  readonly definition: BuilderApplicationDefinitionV1;
  readonly sourceMappings: readonly BuilderSourceMapping[];
  readonly openIssues: readonly BuilderOpenIssue[];
  readonly snapshotChecksum: string;
  readonly createdByMembershipId: string;
}

export interface SavedNormalizedDraftResult {
  readonly revisionId: string;
  readonly revisionNo: number;
  readonly lockVersion: number;
  readonly snapshotChecksum: string;
  readonly createdAt: Date;
}

export interface UpdateDraftRevisionInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly applicationVersionId: string;
  readonly version: number;
  readonly lockVersion: number;
  readonly definition: BuilderApplicationDefinitionV1;
  readonly sourceMappings: readonly BuilderSourceMapping[];
  readonly openIssues: readonly BuilderOpenIssue[];
  readonly snapshotChecksum: string;
  readonly createdByMembershipId: string;
}

interface ApplicationVersionRow extends QueryResultRow {
  application_id: string;
  app_key: string;
  app_name: string;
  app_status: string;
  version_id: string;
  version: number;
  version_status: string;
  lock_version: number;
  current_revision_id: string | null;
}

interface DraftDetailsRow extends QueryResultRow {
  application_id: string;
  app_key: string;
  app_name: string;
  app_status: string;
  version_id: string;
  version: number;
  version_status: string;
  lock_version: number;
  version_definition: BuilderApplicationDefinitionV1 | Record<string, unknown>;
  version_definition_checksum: string;
  revision_id: string | null;
  revision_no: number | null;
  revision_definition: BuilderApplicationDefinitionV1 | null;
  design_metadata: BuilderDesignMetadata | null;
  snapshot_checksum: string | null;
  revision_created_at: Date | null;
}

interface SourceRevisionRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  application_id: string;
  revision_no: number;
  sections: Record<string, string>;
  segments: BuilderSourceSegment[];
  created_by_membership_id: string;
  created_at: Date;
}

const FIND_APPLICATION_VERSION_QUERY = `
  SELECT
    a.id AS application_id,
    a.app_key,
    a.name AS app_name,
    a.status AS app_status,
    v.id AS version_id,
    v.version,
    v.status AS version_status,
    v.lock_version,
    v.current_revision_id
  FROM applications a
  JOIN application_versions v
    ON v.tenant_id = a.tenant_id AND v.application_id = a.id
  WHERE a.tenant_id = $1 AND a.id = $2 AND v.version = $3
`;

const FIND_DRAFT_DETAILS_QUERY = `
  SELECT
    a.id AS application_id,
    a.app_key,
    a.name AS app_name,
    a.status AS app_status,
    v.id AS version_id,
    v.version,
    v.status AS version_status,
    v.lock_version,
    v.definition AS version_definition,
    v.definition_checksum AS version_definition_checksum,
    r.id AS revision_id,
    r.revision_no,
    r.definition AS revision_definition,
    r.design_metadata,
    r.snapshot_checksum,
    r.created_at AS revision_created_at
  FROM applications a
  JOIN application_versions v
    ON v.tenant_id = a.tenant_id AND v.application_id = a.id
  LEFT JOIN builder_draft_revisions r
    ON r.tenant_id = v.tenant_id
   AND r.application_id = v.application_id
   AND r.application_version_id = v.id
   AND r.id = v.current_revision_id
  WHERE a.tenant_id = $1 AND a.id = $2 AND v.version = $3
`;

const FIND_LATEST_SOURCE_REVISION_QUERY = `
  SELECT
    id,
    tenant_id,
    application_id,
    revision_no,
    sections,
    segments,
    created_by_membership_id,
    created_at
  FROM builder_source_revisions
  WHERE tenant_id = $1 AND application_id = $2
  ORDER BY revision_no DESC
  LIMIT 1
`;

const FIND_SOURCE_REVISION_BY_ID_QUERY = `
  SELECT
    id,
    tenant_id,
    application_id,
    revision_no,
    sections,
    segments,
    created_by_membership_id,
    created_at
  FROM builder_source_revisions
  WHERE tenant_id = $1 AND application_id = $2 AND id = $3
`;

const LOCK_VERSION_QUERY = `
  SELECT lock_version
  FROM application_versions
  WHERE tenant_id = $1 AND application_id = $2 AND id = $3
  FOR UPDATE
`;

const GET_NEXT_REVISION_NO_QUERY = `
  SELECT COALESCE(MAX(revision_no), 0) + 1 AS next_rev
  FROM builder_draft_revisions
  WHERE tenant_id = $1 AND application_id = $2 AND application_version_id = $3
`;

const INSERT_DRAFT_REVISION_QUERY = `
  INSERT INTO builder_draft_revisions (
    tenant_id,
    application_id,
    application_version_id,
    revision_no,
    definition,
    design_metadata,
    snapshot_checksum,
    created_by_membership_id
  )
  VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)
  RETURNING id, revision_no, created_at
`;

const INSERT_REVISION_SOURCE_QUERY = `
  INSERT INTO builder_revision_sources (
    tenant_id,
    application_id,
    application_version_id,
    revision_id,
    source_revision_id
  )
  VALUES ($1, $2, $3, $4, $5)
`;

const UPDATE_APPLICATION_VERSION_QUERY = `
  UPDATE application_versions
  SET
    current_revision_id = $4,
    definition = $5::jsonb,
    definition_checksum = $6,
    lock_version = lock_version + 1
  WHERE tenant_id = $1 AND application_id = $2 AND id = $3
  RETURNING lock_version
`;

const UPDATE_APPLICATION_QUERY = `
  UPDATE applications
  SET updated_at = now()
  WHERE tenant_id = $1 AND id = $2
`;

@Injectable()
export class BuilderDraftRepository {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly audit: AuditService,
  ) {}

  async findApplicationVersion(
    tenantId: string,
    applicationId: string,
    version: number,
  ): Promise<ApplicationVersionRecord | undefined> {
    const result = await this.pool.query<ApplicationVersionRow>(
      FIND_APPLICATION_VERSION_QUERY,
      [tenantId, applicationId, version],
    );
    const row = result.rows[0];
    if (!row) return undefined;

    return {
      applicationId: row.application_id,
      appKey: row.app_key,
      appName: row.app_name,
      appStatus: row.app_status,
      versionId: row.version_id,
      version: row.version,
      versionStatus: row.version_status,
      lockVersion: row.lock_version,
      currentRevisionId: row.current_revision_id,
    };
  }

  async findDraftDetails(
    tenantId: string,
    applicationId: string,
    version: number,
  ): Promise<DraftDetailsRecord | undefined> {
    const result = await this.pool.query<DraftDetailsRow>(
      FIND_DRAFT_DETAILS_QUERY,
      [tenantId, applicationId, version],
    );
    const row = result.rows[0];
    if (!row) return undefined;

    const definition = row.revision_definition ?? row.version_definition ?? {};
    const snapshotChecksum =
      row.snapshot_checksum ?? row.version_definition_checksum;
    const metadata = row.design_metadata ?? {
      sourceMappings: [],
      openIssues: [],
    };

    return {
      applicationId: row.application_id,
      appKey: row.app_key,
      appName: row.app_name,
      appStatus: row.app_status,
      versionId: row.version_id,
      version: row.version,
      versionStatus: row.version_status,
      lockVersion: row.lock_version,
      revisionId: row.revision_id,
      revisionNo: row.revision_no,
      snapshotChecksum,
      definition,
      sourceMappings: metadata.sourceMappings ?? [],
      openIssues: metadata.openIssues ?? [],
      createdAt: row.revision_created_at,
    };
  }

  async findSourceRevision(
    tenantId: string,
    applicationId: string,
    sourceRevisionId?: string,
  ): Promise<BuilderSourceRevisionRecord | undefined> {
    const query = sourceRevisionId
      ? FIND_SOURCE_REVISION_BY_ID_QUERY
      : FIND_LATEST_SOURCE_REVISION_QUERY;
    const params = sourceRevisionId
      ? [tenantId, applicationId, sourceRevisionId]
      : [tenantId, applicationId];

    const result = await this.pool.query<SourceRevisionRow>(query, params);
    const row = result.rows[0];
    if (!row) return undefined;

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

  async saveNormalizedDraft(
    input: SaveNormalizedDraftInput,
  ): Promise<SavedNormalizedDraftResult> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const lockRes = await client.query(LOCK_VERSION_QUERY, [
        input.tenantId,
        input.applicationId,
        input.applicationVersionId,
      ]);
      if (lockRes.rows.length === 0) {
        throw new Error('Application version not found during lock');
      }

      const revRes = await client.query<{ next_rev: number }>(
        GET_NEXT_REVISION_NO_QUERY,
        [input.tenantId, input.applicationId, input.applicationVersionId],
      );
      const revisionNo = revRes.rows[0]?.next_rev ?? 1;

      const designMetadata: BuilderDesignMetadata = {
        sourceMappings: input.sourceMappings,
        openIssues: input.openIssues,
      };

      const insertRes = await client.query<{
        id: string;
        revision_no: number;
        created_at: Date;
      }>(INSERT_DRAFT_REVISION_QUERY, [
        input.tenantId,
        input.applicationId,
        input.applicationVersionId,
        revisionNo,
        JSON.stringify(input.definition),
        JSON.stringify(designMetadata),
        input.snapshotChecksum,
        input.createdByMembershipId,
      ]);
      const createdRevision = insertRes.rows[0];
      if (!createdRevision) {
        throw new Error('Failed to insert builder draft revision');
      }

      await client.query(INSERT_REVISION_SOURCE_QUERY, [
        input.tenantId,
        input.applicationId,
        input.applicationVersionId,
        createdRevision.id,
        input.sourceRevisionId,
      ]);

      const updateVerRes = await client.query<{ lock_version: number }>(
        UPDATE_APPLICATION_VERSION_QUERY,
        [
          input.tenantId,
          input.applicationId,
          input.applicationVersionId,
          createdRevision.id,
          JSON.stringify(input.definition),
          input.snapshotChecksum,
        ],
      );
      const updatedLockVersion = updateVerRes.rows[0]?.lock_version;
      if (updatedLockVersion === undefined) {
        throw new Error(
          'Failed to update application version with new draft revision',
        );
      }

      await client.query(UPDATE_APPLICATION_QUERY, [
        input.tenantId,
        input.applicationId,
      ]);

      await this.audit.record(
        {
          tenantId: input.tenantId,
          actorMembershipId: input.createdByMembershipId,
          action: AuditAction.CONFIG_UPDATED,
          resourceType: 'application',
          resourceId: input.applicationId,
          result: AuditResult.SUCCESS,
          metadata: {
            appId: input.applicationId,
            configId: createdRevision.id,
            version: input.version,
          },
        },
        client,
      );

      await client.query('COMMIT');

      return {
        revisionId: createdRevision.id,
        revisionNo: createdRevision.revision_no,
        lockVersion: updatedLockVersion,
        snapshotChecksum: input.snapshotChecksum,
        createdAt: createdRevision.created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateDraftRevision(
    input: UpdateDraftRevisionInput,
  ): Promise<SavedNormalizedDraftResult> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const lockRes = await client.query<{ lock_version: number }>(
        LOCK_VERSION_QUERY,
        [input.tenantId, input.applicationId, input.applicationVersionId],
      );
      const currentLock = lockRes.rows[0]?.lock_version;
      if (currentLock === undefined) {
        throw new Error('Application version not found during lock');
      }

      if (currentLock !== input.lockVersion) {
        throw new BuilderVersionConflictError();
      }

      const revRes = await client.query<{ next_rev: number }>(
        GET_NEXT_REVISION_NO_QUERY,
        [input.tenantId, input.applicationId, input.applicationVersionId],
      );
      const revisionNo = revRes.rows[0]?.next_rev ?? 1;

      const designMetadata: BuilderDesignMetadata = {
        sourceMappings: input.sourceMappings,
        openIssues: input.openIssues,
      };

      const insertRes = await client.query<{
        id: string;
        revision_no: number;
        created_at: Date;
      }>(INSERT_DRAFT_REVISION_QUERY, [
        input.tenantId,
        input.applicationId,
        input.applicationVersionId,
        revisionNo,
        JSON.stringify(input.definition),
        JSON.stringify(designMetadata),
        input.snapshotChecksum,
        input.createdByMembershipId,
      ]);
      const createdRevision = insertRes.rows[0];
      if (!createdRevision) {
        throw new Error('Failed to insert builder draft revision');
      }

      const updateVerRes = await client.query<{ lock_version: number }>(
        UPDATE_APPLICATION_VERSION_QUERY,
        [
          input.tenantId,
          input.applicationId,
          input.applicationVersionId,
          createdRevision.id,
          JSON.stringify(input.definition),
          input.snapshotChecksum,
        ],
      );
      const updatedLockVersion = updateVerRes.rows[0]?.lock_version;
      if (updatedLockVersion === undefined) {
        throw new Error(
          'Failed to update application version with new draft revision',
        );
      }

      await client.query(UPDATE_APPLICATION_QUERY, [
        input.tenantId,
        input.applicationId,
      ]);

      await this.audit.record(
        {
          tenantId: input.tenantId,
          actorMembershipId: input.createdByMembershipId,
          action: AuditAction.CONFIG_UPDATED,
          resourceType: 'application',
          resourceId: input.applicationId,
          result: AuditResult.SUCCESS,
          metadata: {
            appId: input.applicationId,
            configId: createdRevision.id,
            version: input.version,
          },
        },
        client,
      );

      await client.query('COMMIT');

      return {
        revisionId: createdRevision.id,
        revisionNo: createdRevision.revision_no,
        lockVersion: updatedLockVersion,
        snapshotChecksum: input.snapshotChecksum,
        createdAt: createdRevision.created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
