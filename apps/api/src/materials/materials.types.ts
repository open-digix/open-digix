export interface MaterialRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly applicationId: string;
  readonly applicationVersionId: string;
  readonly sku: string;
  readonly name: string;
  readonly unit: string;
  readonly note: string | null;
  readonly createdByMembershipId: string;
  readonly lockVersion: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MaterialListResult {
  readonly items: readonly MaterialRecord[];
  readonly nextCursor: null;
}
