import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import type {
  InventoryReceiptRecord,
  StockItem,
  StockListCursor,
  StockListResult,
} from './inventory.types';
import { encodeStockCursor } from './inventory.cursor';

interface ReceiptRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  application_id: string;
  application_version_id: string;
  purchase_request_id: string;
  approved_by_membership_id: string;
  received_by_membership_id: string;
  created_at: Date;
}

interface ReceiptLineRow extends QueryResultRow {
  id: string;
  material_id: string;
  quantity: number;
}

interface StockRow extends QueryResultRow {
  material_id: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
}

const RECEIPT_COLUMNS = `
  id,
  tenant_id,
  application_id,
  application_version_id,
  purchase_request_id,
  approved_by_membership_id,
  received_by_membership_id,
  created_at
`;

@Injectable()
export class InventoryRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

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
        JSON.stringify({ features: [{ id: 'erp.inventory', version: 1 }] }),
      ],
    );
    const row = result.rows[0];
    if (!row) return 'missing';
    return row.feature_enabled ? 'enabled' : 'disabled';
  }

  async receive(input: {
    tenantId: string;
    applicationId: string;
    requestId: string;
    expectedVersion: number;
    receivedByMembershipId: string;
  }): Promise<InventoryReceiptRecord | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const receiptResult = await client.query<ReceiptRow>(
        `
          INSERT INTO inventory_receipts (
            tenant_id,
            application_id,
            application_version_id,
            purchase_request_id,
            approved_by_membership_id,
            received_by_membership_id
          )
          SELECT r.tenant_id,
                 r.application_id,
                 r.application_version_id,
                 r.id,
                 r.approver_membership_id,
                 $4
          FROM purchase_requests r
          WHERE r.tenant_id = $1
            AND r.application_id = $2
            AND r.id = $3
            AND r.status = 'approved'
            AND r.lock_version = $5
            AND r.approver_membership_id IS NOT NULL
          RETURNING ${RECEIPT_COLUMNS}
        `,
        [
          input.tenantId,
          input.applicationId,
          input.requestId,
          input.receivedByMembershipId,
          input.expectedVersion,
        ],
      );
      const receipt = receiptResult.rows[0];
      if (!receipt) {
        await client.query('ROLLBACK');
        return null;
      }

      const lines = await copyRequestLines(client, receipt);
      await client.query('COMMIT');
      return toReceipt(receipt, lines);
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
    receiptId: string,
  ): Promise<InventoryReceiptRecord | null> {
    const result = await this.pool.query<ReceiptRow>(
      `
        SELECT ${RECEIPT_COLUMNS}
        FROM inventory_receipts
        WHERE tenant_id = $1 AND application_id = $2 AND id = $3
      `,
      [tenantId, applicationId, receiptId],
    );
    const receipt = result.rows[0];
    if (!receipt) return null;

    const lines = await this.pool.query<ReceiptLineRow>(
      `
        SELECT id, material_id, quantity
        FROM inventory_receipt_lines
        WHERE tenant_id = $1 AND application_id = $2 AND receipt_id = $3
        ORDER BY id
      `,
      [tenantId, applicationId, receiptId],
    );
    return toReceipt(receipt, lines.rows);
  }

  async listStock(
    tenantId: string,
    applicationId: string,
    limit: number,
    materialId?: string,
    cursor?: StockListCursor,
  ): Promise<StockListResult> {
    const result = await this.pool.query<StockRow>(
      `
        SELECT m.id AS material_id,
               m.sku,
               m.name,
               m.unit,
               COALESCE(SUM(l.quantity), 0)::integer AS quantity
        FROM materials m
        LEFT JOIN inventory_receipt_lines l
          ON l.tenant_id = m.tenant_id
         AND l.application_id = m.application_id
         AND l.material_id = m.id
        WHERE m.tenant_id = $1
          AND m.application_id = $2
          AND ($3::uuid IS NULL OR m.id = $3::uuid)
          AND (
            $4::text IS NULL
            OR (m.sku, m.id) > ($4::text, $5::uuid)
          )
        GROUP BY m.id, m.sku, m.name, m.unit
        ORDER BY m.sku ASC, m.id ASC
        LIMIT $6
      `,
      [
        tenantId,
        applicationId,
        materialId ?? null,
        cursor?.sku ?? null,
        cursor?.id ?? null,
        limit + 1,
      ],
    );
    const hasNextPage = result.rows.length > limit;
    const rows = hasNextPage ? result.rows.slice(0, limit) : result.rows;
    const lastRow = rows.at(-1);
    return {
      items: rows.map(toStockItem),
      nextCursor:
        hasNextPage && lastRow
          ? encodeStockCursor({ sku: lastRow.sku, id: lastRow.material_id })
          : null,
    };
  }
}

async function copyRequestLines(
  client: PoolClient,
  receipt: ReceiptRow,
): Promise<ReceiptLineRow[]> {
  const result = await client.query<ReceiptLineRow>(
    `
      INSERT INTO inventory_receipt_lines (
        tenant_id,
        application_id,
        application_version_id,
        receipt_id,
        material_id,
        quantity
      )
      SELECT l.tenant_id,
             l.application_id,
             l.application_version_id,
             $1,
             l.material_id,
             l.quantity
      FROM purchase_request_lines l
      WHERE l.tenant_id = $2
        AND l.application_id = $3
        AND l.purchase_request_id = $4
      RETURNING id, material_id, quantity
    `,
    [
      receipt.id,
      receipt.tenant_id,
      receipt.application_id,
      receipt.purchase_request_id,
    ],
  );
  if (result.rows.length === 0) {
    throw new Error('Approved purchase request has no lines.');
  }
  return result.rows;
}

function toReceipt(
  row: ReceiptRow,
  lines: readonly ReceiptLineRow[],
): InventoryReceiptRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    applicationId: row.application_id,
    applicationVersionId: row.application_version_id,
    purchaseRequestId: row.purchase_request_id,
    approvedByMembershipId: row.approved_by_membership_id,
    receivedByMembershipId: row.received_by_membership_id,
    createdAt: row.created_at,
    lines: lines.map((line) => ({
      materialId: line.material_id,
      quantity: line.quantity,
    })),
  };
}

function toStockItem(row: StockRow): StockItem {
  return {
    materialId: row.material_id,
    sku: row.sku,
    name: row.name,
    unit: row.unit,
    quantity: row.quantity,
  };
}
