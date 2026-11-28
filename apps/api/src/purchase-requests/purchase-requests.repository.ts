import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import type {
  CreatePurchaseRequestBody,
  PurchaseRequestRecord,
} from './purchase-requests.types';

interface PurchaseRequestRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  application_id: string;
  application_version_id: string;
  business_record_id: string;
  requester_membership_id: string;
  approver_membership_id: string | null;
  status: PurchaseRequestRecord['status'];
  rejection_reason: string | null;
  lock_version: number;
  created_at: Date;
  updated_at: Date;
  submitted_at: Date | null;
  decided_at: Date | null;
}

interface PurchaseRequestLineRow extends QueryResultRow {
  id: string;
  material_id: string;
  quantity: number;
}

const REQUEST_COLUMNS = `
  id,
  tenant_id,
  application_id,
  application_version_id,
  business_record_id,
  requester_membership_id,
  approver_membership_id,
  status,
  rejection_reason,
  lock_version,
  created_at,
  updated_at,
  submitted_at,
  decided_at
`;

@Injectable()
export class PurchaseRequestsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(input: {
    tenantId: string;
    applicationId: string;
    requesterMembershipId: string;
    body: CreatePurchaseRequestBody;
  }): Promise<PurchaseRequestRecord | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const requestResult = await client.query<PurchaseRequestRow>(
        `
          INSERT INTO purchase_requests (
            tenant_id,
            application_id,
            application_version_id,
            business_record_id,
            requester_membership_id
          )
          SELECT $1, $2, v.id, br.id, $3
          FROM application_versions v
          JOIN business_records br
            ON br.tenant_id = v.tenant_id
           AND br.application_id = v.application_id
           AND br.application_version_id = v.id
           AND br.id = $4
          WHERE v.tenant_id = $1
            AND v.application_id = $2
            AND v.status = 'published'
          ORDER BY v.version DESC
          LIMIT 1
          RETURNING ${REQUEST_COLUMNS}
        `,
        [
          input.tenantId,
          input.applicationId,
          input.requesterMembershipId,
          input.body.businessRecordId,
        ],
      );

      const requestRow = requestResult.rows[0];
      if (!requestRow) {
        await client.query('ROLLBACK');
        return null;
      }

      const lines: PurchaseRequestLineRow[] = [];
      for (const line of input.body.lines) {
        const lineResult = await client.query<PurchaseRequestLineRow>(
          `
            INSERT INTO purchase_request_lines (
              tenant_id,
              application_id,
              application_version_id,
              purchase_request_id,
              material_id,
              quantity
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, material_id, quantity
          `,
          [
            input.tenantId,
            input.applicationId,
            requestRow.application_version_id,
            requestRow.id,
            line.materialId,
            line.quantity,
          ],
        );
        const lineRow = lineResult.rows[0];
        if (!lineRow)
          throw new Error('Database did not return a request line.');
        lines.push(lineRow);
      }

      await client.query('COMMIT');
      return toPurchaseRequest(requestRow, lines);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(
    tenantId: string,
    applicationId: string,
    purchaseRequestId: string,
  ): Promise<PurchaseRequestRecord | null> {
    const requestResult = await this.pool.query<PurchaseRequestRow>(
      `
        SELECT ${REQUEST_COLUMNS}
        FROM purchase_requests
        WHERE tenant_id = $1 AND application_id = $2 AND id = $3
      `,
      [tenantId, applicationId, purchaseRequestId],
    );
    const requestRow = requestResult.rows[0];
    if (!requestRow) return null;

    const linesResult = await this.pool.query<PurchaseRequestLineRow>(
      `
        SELECT id, material_id, quantity
        FROM purchase_request_lines
        WHERE tenant_id = $1
          AND application_id = $2
          AND purchase_request_id = $3
        ORDER BY id
      `,
      [tenantId, applicationId, purchaseRequestId],
    );
    return toPurchaseRequest(requestRow, linesResult.rows);
  }
}

function toPurchaseRequest(
  row: PurchaseRequestRow,
  lines: readonly PurchaseRequestLineRow[],
): PurchaseRequestRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    applicationId: row.application_id,
    applicationVersionId: row.application_version_id,
    businessRecordId: row.business_record_id,
    requesterMembershipId: row.requester_membership_id,
    approverMembershipId: row.approver_membership_id,
    status: row.status,
    rejectionReason: row.rejection_reason,
    lockVersion: row.lock_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    lines: lines.map((line) => ({
      id: line.id,
      materialId: line.material_id,
      quantity: line.quantity,
    })),
  };
}
