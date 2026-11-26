import type { Pool } from 'pg';
import { IdempotencyRepository } from './idempotency.repository';

const scope = {
  tenantId: 'tenant-a',
  applicationId: 'app-a',
  actorMembershipId: 'membership-a',
  action: 'purchase_requests.submit',
  idempotencyKey: 'request-1',
};

describe('IdempotencyRepository', () => {
  let query: jest.Mock;
  let repository: IdempotencyRepository;

  beforeEach(() => {
    query = jest.fn();
    repository = new IdempotencyRepository({ query } as unknown as Pool);
  });

  it('claims a key using the complete tenant/app/actor/action scope', async () => {
    query.mockResolvedValue({
      rows: [
        {
          id: 'key-a',
          tenant_id: scope.tenantId,
          application_id: scope.applicationId,
          actor_membership_id: scope.actorMembershipId,
          action: scope.action,
          idempotency_key: scope.idempotencyKey,
          request_hash: 'a'.repeat(64),
          status: 'in_progress',
          response_status: null,
          response_body: null,
        },
      ],
    });

    await expect(
      repository.createIfAbsent(scope, 'a'.repeat(64)),
    ).resolves.toMatchObject({
      id: 'key-a',
      scope,
      status: 'in_progress',
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), [
      scope.tenantId,
      scope.applicationId,
      scope.actorMembershipId,
      scope.action,
      scope.idempotencyKey,
      'a'.repeat(64),
    ]);
  });

  it('returns null when another request already owns the key', async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(
      repository.createIfAbsent(scope, 'a'.repeat(64)),
    ).resolves.toBeNull();
  });

  it('only finalizes the matching in-progress claim', async () => {
    query.mockResolvedValue({ rowCount: 1 });

    await expect(
      repository.complete(scope, 'a'.repeat(64), 'completed', 201, {
        id: 'request-a',
      }),
    ).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("AND status = 'in_progress'"),
      [
        scope.tenantId,
        scope.applicationId,
        scope.actorMembershipId,
        scope.action,
        scope.idempotencyKey,
        'completed',
        201,
        JSON.stringify({ id: 'request-a' }),
        'a'.repeat(64),
      ],
    );
  });
});
