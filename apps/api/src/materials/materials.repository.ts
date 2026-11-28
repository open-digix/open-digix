import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import type { MaterialListResult, MaterialRecord } from './materials.types';

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
  ): Promise<MaterialListResult> {
    const result = await this.pool.query<MaterialRow>(
      `
        SELECT ${MATERIAL_COLUMNS}
        FROM materials
        WHERE tenant_id = $1 AND application_id = $2
        ORDER BY created_at DESC, id DESC
        LIMIT $3
      `,
      [tenantId, applicationId, limit],
    );
    return { items: result.rows.map(toMaterial), nextCursor: null };
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
