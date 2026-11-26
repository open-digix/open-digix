import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { IdempotencyRepository } from './idempotency.repository';
import {
  type IdempotencyClaim,
  type IdempotencyScope,
  type IdempotencyStatus,
} from './idempotency.types';

export class IdempotencyClaimLostError extends Error {
  constructor() {
    super('The idempotency claim is no longer in progress.');
    this.name = 'IdempotencyClaimLostError';
  }
}

@Injectable()
export class IdempotencyService {
  constructor(private readonly repository: IdempotencyRepository) {}

  async claim(
    scope: IdempotencyScope,
    payload: unknown,
  ): Promise<IdempotencyClaim> {
    const requestHash = hashIdempotencyPayload(payload);
    const created = await this.repository.createIfAbsent(scope, requestHash);

    if (created) {
      return { kind: 'claimed', requestHash };
    }

    const existing = await this.repository.find(scope);
    if (!existing) {
      throw new IdempotencyClaimLostError();
    }

    if (existing.requestHash !== requestHash) {
      throw new ConflictException({
        error: {
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'The idempotency key was already used with another payload.',
        },
      });
    }

    if (existing.status === 'in_progress') {
      throw new ConflictException({
        error: {
          code: 'IDEMPOTENCY_IN_PROGRESS',
          message: 'The idempotency key is currently being processed.',
        },
      });
    }

    if (existing.responseStatus === null || existing.responseBody === null) {
      throw new IdempotencyClaimLostError();
    }

    return {
      kind: 'replay',
      status: existing.status,
      responseStatus: existing.responseStatus,
      responseBody: existing.responseBody,
    };
  }

  async complete(
    scope: IdempotencyScope,
    payload: unknown,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    await this.finalize(
      scope,
      payload,
      'completed',
      responseStatus,
      responseBody,
    );
  }

  async fail(
    scope: IdempotencyScope,
    payload: unknown,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    await this.finalize(scope, payload, 'failed', responseStatus, responseBody);
  }

  private async finalize(
    scope: IdempotencyScope,
    payload: unknown,
    status: Exclude<IdempotencyStatus, 'in_progress'>,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    const updated = await this.repository.complete(
      scope,
      hashIdempotencyPayload(payload),
      status,
      responseStatus,
      responseBody,
    );

    if (!updated) {
      throw new IdempotencyClaimLostError();
    }
  }
}

export function hashIdempotencyPayload(payload: unknown): string {
  return createHash('sha256').update(canonicalize(payload)).digest('hex');
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const primitive = JSON.stringify(value);
    if (primitive === undefined) {
      throw new TypeError('Idempotency payload must be JSON serializable.');
    }
    return primitive;
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(',')}}`;
}
