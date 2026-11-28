export interface ReceiveInventoryBody {
  readonly requestId: string;
  readonly expectedVersion: number;
}

export interface InventoryReceiptLine {
  readonly materialId: string;
  readonly quantity: number;
}

export interface InventoryReceiptRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly applicationId: string;
  readonly applicationVersionId: string;
  readonly purchaseRequestId: string;
  readonly approvedByMembershipId: string;
  readonly receivedByMembershipId: string;
  readonly createdAt: Date;
  readonly lines: readonly InventoryReceiptLine[];
}

export interface InventoryReceiptListCursor {
  readonly createdAt: string;
  readonly id: string;
}

export interface InventoryReceiptListResult {
  readonly items: readonly InventoryReceiptRecord[];
  readonly nextCursor: string | null;
}

export interface StockItem {
  readonly materialId: string;
  readonly sku: string;
  readonly name: string;
  readonly unit: string;
  readonly quantity: number;
}

export interface StockListCursor {
  readonly sku: string;
  readonly id: string;
}

export interface StockListResult {
  readonly items: readonly StockItem[];
  readonly nextCursor: string | null;
}
