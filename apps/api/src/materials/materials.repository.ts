import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { encodeMaterialCursor } from './materials.cursor';
import type {
  MaterialListCursor,
  MaterialListResult,
  MaterialRecord,
} from './materials.types';

interface MaterialRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  application_id: string;
  application_version_id: string;
  sku: string;
  name: string;
  unit: string;
  note: string | null;
  created_by_membership_id: string;
  lock_version: number;
  created_at: Date;
  created_at_cursor: string;
  updated_at: Date;
}

const MATERIAL_COLUMNS = `
  id,
  tenant_id,
  application_id,
  application_version_id,
  sku,
  name,
  unit,
  note,
  created_by_membership_id,
  lock_version,
  created_at,
  created_at::text AS created_at_cursor,
  updated_at
`;

@Injectable()
export class MaterialsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getPublishedFeatureStatus(
    tenantId: string,
    applicationId: string,
    featureId: string,
  ): Promise<'missing' | 'disabled' | 'enabled'> {
    const result = await this.pool.query<{ feature_enabled: boolean }>(
      `
        SELECT definition @> $3::jsonb AS feature_enabled
        FROM application_versions
        WHERE tenant_id = $1
          AND application_id = $2
          AND status = 'published'
        ORDER BY version DESC
        LIMIT 1
      `,
      [
        tenantId,
        applicationId,
        JSON.stringify({ features: [{ id: featureId, version: 1 }] }),
      ],
    );

    const row = result.rows[0];
    if (!row) return 'missing';
    return row.feature_enabled ? 'enabled' : 'disabled';
  }

  async create(input: {
    tenantId: string;
    applicationId: string;
    createdByMembershipId: string;
    sku: string;
    name: string;
    unit: string;
    note: string | null;
  }): Promise<MaterialRecord | null> {
    const result = await this.pool.query<MaterialRow>(
      `
        INSERT INTO materials (
          tenant_id,
          application_id,
          application_version_id,
          sku,
          name,
          unit,
          note,
          created_by_membership_id
        )
        SELECT $1, $2, v.id, $3, $4, $5, $6, $7
        FROM application_versions v
        WHERE v.tenant_id = $1
          AND v.application_id = $2
          AND v.status = 'published'
        ORDER BY v.version DESC
        LIMIT 1
        RETURNING ${MATERIAL_COLUMNS}
      `,
      [
        input.tenantId,
        input.applicationId,
        input.sku,
        input.name,
        input.unit,
        input.note,
        input.createdByMembershipId,
      ],
    );
    return result.rows[0] ? toMaterial(result.rows[0]) : null;
  }

  async list(
    tenantId: string,
    applicationId: string,
    limit: number,
    cursor?: MaterialListCursor,
  ): Promise<MaterialListResult> {
    const result = await this.pool.query<MaterialRow>(
      `
        SELECT ${MATERIAL_COLUMNS}
        FROM materials
        WHERE tenant_id = $1
          AND application_id = $2
          AND (
            $3::timestamptz IS NULL
            OR (created_at, id) < ($3::timestamptz, $4::uuid)
          )
        ORDER BY created_at DESC, id DESC
        LIMIT $5
      `,
      [
        tenantId,
        applicationId,
        cursor?.createdAt ?? null,
        cursor?.id ?? null,
        limit + 1,
      ],
    );
    const hasNextPage = result.rows.length > limit;
    const rows = hasNextPage ? result.rows.slice(0, limit) : result.rows;
    const lastRow = rows.at(-1);
    return {
      items: rows.map(toMaterial),
      nextCursor:
        hasNextPage && lastRow
          ? encodeMaterialCursor({
              createdAt: lastRow.created_at_cursor,
              id: lastRow.id,
            })
          : null,
    };
  }

  async findById(
    tenantId: string,
    applicationId: string,
    materialId: string,
  ): Promise<MaterialRecord | null> {
    const result = await this.pool.query<MaterialRow>(
      `
        SELECT ${MATERIAL_COLUMNS}
        FROM materials
        WHERE tenant_id = $1 AND application_id = $2 AND id = $3
      `,
      [tenantId, applicationId, materialId],
    );
    return result.rows[0] ? toMaterial(result.rows[0]) : null;
  }

  async updateNoteIfVersionMatches(input: {
    tenantId: string;
    applicationId: string;
    materialId: string;
    note: string;
    expectedVersion: number;
  }): Promise<MaterialRecord | null> {
    const result = await this.pool.query<MaterialRow>(
      `
        UPDATE materials
        SET note = $4,
            lock_version = lock_version + 1,
            updated_at = now()
        WHERE tenant_id = $1
          AND application_id = $2
          AND id = $3
          AND lock_version = $5
        RETURNING ${MATERIAL_COLUMNS}
      `,
      [
        input.tenantId,
        input.applicationId,
        input.materialId,
        input.note,
        input.expectedVersion,
      ],
    );
    return result.rows[0] ? toMaterial(result.rows[0]) : null;
  }

  async currentVersion(
    tenantId: string,
    applicationId: string,
    materialId: string,
  ): Promise<number | null> {
    const result = await this.pool.query<{ lock_version: number }>(
      `
        SELECT lock_version
        FROM materials
        WHERE tenant_id = $1 AND application_id = $2 AND id = $3
      `,
      [tenantId, applicationId, materialId],
    );
    return result.rows[0]?.lock_version ?? null;
  }
}

function toMaterial(row: MaterialRow): MaterialRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    applicationId: row.application_id,
    applicationVersionId: row.application_version_id,
    sku: row.sku,
    name: row.name,
    unit: row.unit,
    note: row.note,
    createdByMembershipId: row.created_by_membership_id,
    lockVersion: row.lock_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
