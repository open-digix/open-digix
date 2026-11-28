import { Inject, Injectable } from '@nestjs/common';
import type { Pool, QueryResultRow } from 'pg';
import {
  AuditAction,
  AuditResult,
} from '../audit/constants/audit-policy.constants';
import { AuditService } from '../audit/audit.service';
import { DATABASE_POOL } from '../database/database.module';
import { encodePurchaseRequestCursor } from './purchase-requests.cursor';
import type {
  CreatePurchaseRequestBody,
  PurchaseRequestListCursor,
  PurchaseRequestListResult,
  PurchaseRequestRecord,
  PurchaseRequestStatus,
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
  created_at_cursor: string;
  updated_at: Date;
  submitted_at: Date | null;
  decided_at: Date | null;
}

interface PurchaseRequestLineRow extends QueryResultRow {
  purchase_request_id: string;
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
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly audit: AuditService,
  ) {}

  async getPublishedFeatureStatus(
    tenantId: string,
    applicationId: string,
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
        JSON.stringify({
          features: [{ id: 'erp.purchase_requests', version: 1 }],
        }),
      ],
    );
    const row = result.rows[0];
    if (!row) return 'missing';
    return row.feature_enabled ? 'enabled' : 'disabled';
  }

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

      await this.audit.record(
        {
          tenantId: input.tenantId,
          actorMembershipId: input.requesterMembershipId,
          action: AuditAction.PURCHASE_REQUEST_CREATED,
          resourceType: 'purchase_request',
          resourceId: requestRow.id,
          result: AuditResult.SUCCESS,
          metadata: {
            applicationVersionId: requestRow.application_version_id,
          },
        },
        client,
      );

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

  async list(input: {
    tenantId: string;
    applicationId: string;
    limit: number;
    status?: PurchaseRequestStatus;
    cursor?: PurchaseRequestListCursor;
  }): Promise<PurchaseRequestListResult> {
    const result = await this.pool.query<PurchaseRequestRow>(
      `
        SELECT ${REQUEST_COLUMNS}, created_at::text AS created_at_cursor
        FROM purchase_requests
        WHERE tenant_id = $1
          AND application_id = $2
          AND ($3::text IS NULL OR status = $3)
          AND (
            $4::timestamptz IS NULL
            OR (created_at, id) < ($4::timestamptz, $5::uuid)
          )
        ORDER BY created_at DESC, id DESC
        LIMIT $6
      `,
      [
        input.tenantId,
        input.applicationId,
        input.status ?? null,
        input.cursor?.createdAt ?? null,
        input.cursor?.id ?? null,
        input.limit + 1,
      ],
    );

    const hasNextPage = result.rows.length > input.limit;
    const rows = hasNextPage ? result.rows.slice(0, input.limit) : result.rows;
    const requestIds = rows.map((row) => row.id);
    const lines = requestIds.length
      ? await this.pool.query<PurchaseRequestLineRow>(
          `
            SELECT purchase_request_id, id, material_id, quantity
            FROM purchase_request_lines
            WHERE tenant_id = $1
              AND application_id = $2
              AND purchase_request_id = ANY($3::uuid[])
            ORDER BY purchase_request_id, id
          `,
          [input.tenantId, input.applicationId, requestIds],
        )
      : { rows: [] as PurchaseRequestLineRow[] };
    const linesByRequest = new Map<string, PurchaseRequestLineRow[]>();
    for (const line of lines.rows) {
      const requestLines = linesByRequest.get(line.purchase_request_id) ?? [];
      requestLines.push(line);
      linesByRequest.set(line.purchase_request_id, requestLines);
    }
    const lastRow = rows.at(-1);

    return {
      items: rows.map((row) =>
        toPurchaseRequest(row, linesByRequest.get(row.id) ?? []),
      ),
      nextCursor:
        hasNextPage && lastRow
          ? encodePurchaseRequestCursor({
              createdAt: lastRow.created_at_cursor,
              id: lastRow.id,
            })
          : null,
    };
  }

  async transitionIfVersionMatches(input: {
    tenantId: string;
    applicationId: string;
    purchaseRequestId: string;
    expectedVersion: number;
    fromStatus: PurchaseRequestRecord['status'];
    toStatus: PurchaseRequestRecord['status'];
    approverMembershipId?: string;
    rejectionReason?: string;
    actorMembershipId: string;
  }): Promise<PurchaseRequestRecord | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query<PurchaseRequestRow>(
        `
          UPDATE purchase_requests
          SET status = $4,
              approver_membership_id = COALESCE($5, approver_membership_id),
              rejection_reason = $6,
              lock_version = lock_version + 1,
              updated_at = now(),
              submitted_at = CASE
                WHEN $4 = 'submitted' THEN now()
                ELSE submitted_at
              END,
              decided_at = CASE
                WHEN $4 IN ('approved', 'rejected') THEN now()
                ELSE decided_at
              END
          WHERE tenant_id = $1
            AND application_id = $2
            AND id = $3
            AND lock_version = $7
            AND status = $8
          RETURNING ${REQUEST_COLUMNS}
        `,
        [
          input.tenantId,
          input.applicationId,
          input.purchaseRequestId,
          input.toStatus,
          input.approverMembershipId ?? null,
          input.rejectionReason ?? null,
          input.expectedVersion,
          input.fromStatus,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        return null;
      }

      const linesResult = await client.query<PurchaseRequestLineRow>(
        `
          SELECT id, material_id, quantity
          FROM purchase_request_lines
          WHERE tenant_id = $1
            AND application_id = $2
            AND purchase_request_id = $3
          ORDER BY id
        `,
        [input.tenantId, input.applicationId, input.purchaseRequestId],
      );
      await this.audit.record(
        {
          tenantId: input.tenantId,
          actorMembershipId: input.actorMembershipId,
          action: AuditAction.PURCHASE_REQUEST_STATUS_CHANGED,
          resourceType: 'purchase_request',
          resourceId: row.id,
          result: AuditResult.SUCCESS,
          metadata: {
            applicationVersionId: row.application_version_id,
            fromStatus: input.fromStatus,
            toStatus: input.toStatus,
            ...(input.rejectionReason
              ? { reasonCode: 'rejection_reason_provided' }
              : {}),
          },
        },
        client,
      );
      await client.query('COMMIT');
      return toPurchaseRequest(row, linesResult.rows);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async currentVersion(
    tenantId: string,
    applicationId: string,
    purchaseRequestId: string,
  ): Promise<number | null> {
    const result = await this.pool.query<{ lock_version: number }>(
      `
        SELECT lock_version
        FROM purchase_requests
        WHERE tenant_id = $1 AND application_id = $2 AND id = $3
      `,
      [tenantId, applicationId, purchaseRequestId],
    );
    return result.rows[0]?.lock_version ?? null;
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
