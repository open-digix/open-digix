import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export type StoredFileScanStatus = 'pending' | 'clean' | 'rejected' | 'failed';

export interface CreatePendingStoredFileInput {
  tenantId: string;
  recordId?: string;
  storageKey: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  createdByMembershipId: string;
}

export interface StoredFileMetadata {
  id: string;
  tenantId: string;
  recordId: string | null;
  storageKey: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  scanStatus: StoredFileScanStatus;
  createdByMembershipId: string;
  createdAt: Date;
}

interface StoredFileRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  record_id: string | null;
  storage_key: string;
  original_name: string;
  content_type: string;
  size_bytes: string;
  checksum_sha256: string;
  scan_status: StoredFileScanStatus;
  created_by_membership_id: string;
  created_at: Date;
}

const CREATE_PENDING_STORED_FILE_QUERY = `
  INSERT INTO stored_files (
    tenant_id,
    record_id,
    storage_key,
    original_name,
    content_type,
    size_bytes,
    checksum_sha256,
    scan_status,
    created_by_membership_id
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
  RETURNING
    id,
    tenant_id,
    record_id,
    storage_key,
    original_name,
    content_type,
    size_bytes::text AS size_bytes,
    checksum_sha256,
    scan_status,
    created_by_membership_id,
    created_at
`;

@Injectable()
export class StoredFileRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async setScanStatus(
    tenantId: string,
    id: string,
    status: Exclude<StoredFileScanStatus, 'pending'>,
  ): Promise<void> {
    const result = await this.pool.query(
      `UPDATE stored_files SET scan_status = $3
       WHERE tenant_id = $1 AND id = $2 AND scan_status = 'pending'`,
      [tenantId, id, status],
    );
    if (result.rowCount !== 1)
      throw new Error('File scan state changed unexpectedly');
  }

  // Only a record requester may read a file attached to that record in B02.
  // B03a will replace this narrow policy with app/record authorization.
  async findReadable(
    tenantId: string,
    fileId: string,
    membershipId: string,
  ): Promise<StoredFileMetadata | null> {
    const result = await this.pool.query<StoredFileRow>(
      `SELECT f.id, f.tenant_id, f.record_id, f.storage_key,
              f.original_name, f.content_type, f.size_bytes::text AS size_bytes,
              f.checksum_sha256, f.scan_status, f.created_by_membership_id, f.created_at
       FROM stored_files f
       JOIN business_records r ON r.tenant_id = f.tenant_id AND r.id = f.record_id
       WHERE f.tenant_id = $1 AND f.id = $2 AND r.requester_membership_id = $3
         AND f.scan_status = 'clean'`,
      [tenantId, fileId, membershipId],
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          tenantId: row.tenant_id,
          recordId: row.record_id,
          storageKey: row.storage_key,
          originalName: row.original_name,
          contentType: row.content_type,
          sizeBytes: Number(row.size_bytes),
          checksumSha256: row.checksum_sha256,
          scanStatus: row.scan_status,
          createdByMembershipId: row.created_by_membership_id,
          createdAt: row.created_at,
        }
      : null;
  }

  async recordOwnedBy(
    tenantId: string,
    recordId: string,
    membershipId: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM business_records
       WHERE tenant_id = $1 AND id = $2 AND requester_membership_id = $3`,
      [tenantId, recordId, membershipId],
    );
    return result.rowCount === 1;
  }

  async createPending(
    input: CreatePendingStoredFileInput,
  ): Promise<StoredFileMetadata> {
    const result = await this.pool.query<StoredFileRow>(
      CREATE_PENDING_STORED_FILE_QUERY,
      [
        input.tenantId,
        input.recordId ?? null,
        input.storageKey,
        input.originalName,
        input.contentType,
        input.sizeBytes,
        input.checksumSha256,
        input.createdByMembershipId,
      ],
    );
    const row = result.rows[0];

    if (!row) {
      throw new Error('Database did not return the created file metadata');
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      recordId: row.record_id,
      storageKey: row.storage_key,
      originalName: row.original_name,
      contentType: row.content_type,
      sizeBytes: Number(row.size_bytes),
      checksumSha256: row.checksum_sha256,
      scanStatus: row.scan_status,
      createdByMembershipId: row.created_by_membership_id,
      createdAt: row.created_at,
    };
  }
}
