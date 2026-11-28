export type PurchaseRequestStatus =
  'draft' | 'submitted' | 'approved' | 'rejected';

export interface PurchaseRequestLineInput {
  readonly materialId: string;
  readonly quantity: number;
}

export interface CreatePurchaseRequestBody {
  readonly businessRecordId: string;
  readonly lines: readonly PurchaseRequestLineInput[];
}

export interface PurchaseRequestActionBody {
  readonly expectedVersion: number;
}

export interface RejectPurchaseRequestBody extends PurchaseRequestActionBody {
  readonly reason: string;
}
