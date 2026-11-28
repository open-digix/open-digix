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

export interface PurchaseRequestLineRecord extends PurchaseRequestLineInput {
  readonly id: string;
}

export interface PurchaseRequestRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly applicationId: string;
  readonly applicationVersionId: string;
  readonly businessRecordId: string;
  readonly requesterMembershipId: string;
  readonly approverMembershipId: string | null;
  readonly status: PurchaseRequestStatus;
  readonly rejectionReason: string | null;
  readonly lockVersion: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly submittedAt: Date | null;
  readonly decidedAt: Date | null;
  readonly lines: readonly PurchaseRequestLineRecord[];
}

export interface PurchaseRequestListCursor {
  readonly createdAt: string;
  readonly id: string;
}

export interface PurchaseRequestListResult {
  readonly items: readonly PurchaseRequestRecord[];
  readonly nextCursor: string | null;
}

export interface PurchaseRequestTaskSummary {
  readonly taskId: string;
  readonly purchaseRequestId: string;
  readonly businessRecordId: string;
  readonly requestStatus: PurchaseRequestStatus;
  readonly requestVersion: number;
  readonly roleCode: string;
  readonly assigneeMembershipId: string | null;
  readonly createdAt: Date;
  readonly dueAt: Date | null;
}

export interface PurchaseRequestTaskListResult {
  readonly items: readonly PurchaseRequestTaskSummary[];
}
