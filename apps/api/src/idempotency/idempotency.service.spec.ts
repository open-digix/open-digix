import { ConflictException } from '@nestjs/common';
import { IdempotencyRepository } from './idempotency.repository';
import {
  hashIdempotencyPayload,
  IdempotencyService,
} from './idempotency.service';

const scope = {
  tenantId: 'tenant-a',
  applicationId: 'app-a',
  actorMembershipId: 'membership-a',
  action: 'purchase_requests.submit',
  idempotencyKey: 'request-1',
};

describe('IdempotencyService', () => {
  let repository: {
    createIfAbsent: jest.Mock;
    find: jest.Mock;
    complete: jest.Mock;
  };
  let service: IdempotencyService;

  beforeEach(() => {
    repository = {
      createIfAbsent: jest.fn(),
      find: jest.fn(),
      complete: jest.fn().mockResolvedValue(true),
    };
    service = new IdempotencyService(
      repository as unknown as IdempotencyRepository,
    );
  });

  it('claims a new key using a stable payload hash', async () => {
    const payload = { quantity: 2, materialId: 'material-a' };
    repository.createIfAbsent.mockResolvedValue(null);
    repository.find.mockResolvedValue(null);

    const hash = hashIdempotencyPayload(payload);
    repository.createIfAbsent.mockResolvedValueOnce({ id: 'key-a' });

    await expect(service.claim(scope, payload)).resolves.toEqual({
      kind: 'claimed',
      requestHash: hash,
    });
  });

  it('produces the same hash when object keys are reordered', () => {
    expect(hashIdempotencyPayload({ a: 1, b: 2 })).toBe(
      hashIdempotencyPayload({ b: 2, a: 1 }),
    );
  });

  it('replays a completed response for the same key and payload', async () => {
    const payload = { materialId: 'material-a' };
    repository.createIfAbsent.mockResolvedValue(null);
    repository.find.mockResolvedValue({
      requestHash: hashIdempotencyPayload(payload),
      status: 'completed',
      responseStatus: 201,
      responseBody: { id: 'request-a' },
    });

    await expect(service.claim(scope, payload)).resolves.toEqual({
      kind: 'replay',
      status: 'completed',
      responseStatus: 201,
      responseBody: { id: 'request-a' },
    });
  });

  it('rejects the same key when the payload changes', async () => {
    const payload = { materialId: 'material-a' };
    repository.createIfAbsent.mockResolvedValue(null);
    repository.find.mockResolvedValue({
      requestHash: hashIdempotencyPayload({ materialId: 'material-b' }),
      status: 'completed',
      responseStatus: 201,
      responseBody: { id: 'request-a' },
    });

    await expect(service.claim(scope, payload)).rejects.toMatchObject({
      response: { error: { code: 'IDEMPOTENCY_KEY_REUSED' } },
    } as Partial<ConflictException>);
  });

  it('rejects a duplicate while the first request is in progress', async () => {
    const payload = { materialId: 'material-a' };
    repository.createIfAbsent.mockResolvedValue(null);
    repository.find.mockResolvedValue({
      requestHash: hashIdempotencyPayload(payload),
      status: 'in_progress',
      responseStatus: null,
      responseBody: null,
    });

    await expect(service.claim(scope, payload)).rejects.toMatchObject({
      response: { error: { code: 'IDEMPOTENCY_IN_PROGRESS' } },
    } as Partial<ConflictException>);
  });

  it('finalizes a claimed request with the response', async () => {
    const payload = { materialId: 'material-a' };

    await service.complete(scope, payload, 201, { id: 'request-a' });

    expect(repository.complete).toHaveBeenCalledWith(
      scope,
      hashIdempotencyPayload(payload),
      'completed',
      201,
      { id: 'request-a' },
    );
  });
});
