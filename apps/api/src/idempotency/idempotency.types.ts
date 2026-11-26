export interface IdempotencyScope {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly actorMembershipId: string;
  readonly action: string;
  readonly idempotencyKey: string;
}

export type IdempotencyStatus = 'in_progress' | 'completed' | 'failed';

export interface IdempotencyRecord {
  readonly id: string;
  readonly scope: IdempotencyScope;
  readonly requestHash: string;
  readonly status: IdempotencyStatus;
  readonly responseStatus: number | null;
  readonly responseBody: unknown;
}

export interface IdempotencyClaimed {
  readonly kind: 'claimed';
  readonly requestHash: string;
}

export interface IdempotencyReplay {
  readonly kind: 'replay';
  readonly status: IdempotencyStatus;
  readonly responseStatus: number;
  readonly responseBody: unknown;
}

export type IdempotencyClaim = IdempotencyClaimed | IdempotencyReplay;
