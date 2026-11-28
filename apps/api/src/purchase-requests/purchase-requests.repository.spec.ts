import type { Pool } from 'pg';
import { PurchaseRequestsRepository } from './purchase-requests.repository';

const requestRow = {
  id: '11111111-1111-4111-8111-111111111111',
  tenant_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  application_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  application_version_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  business_record_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  requester_membership_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  approver_membership_id: null,
  status: 'draft',
  rejection_reason: null,
  lock_version: 1,
  created_at: new Date(),
  updated_at: new Date(),
  submitted_at: null,
  decided_at: null,
};

describe('PurchaseRequestsRepository', () => {
  it('creates the request and lines in one transaction', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [requestRow] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
              material_id: '22222222-2222-4222-8222-222222222222',
              quantity: 2,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };
    const pool = { connect: jest.fn().mockResolvedValue(client) };
    const repository = new PurchaseRequestsRepository(pool as unknown as Pool);

    const result = await repository.create({
      tenantId: requestRow.tenant_id,
      applicationId: requestRow.application_id,
      requesterMembershipId: requestRow.requester_membership_id,
      body: {
        businessRecordId: requestRow.business_record_id,
        lines: [
          { materialId: '22222222-2222-4222-8222-222222222222', quantity: 2 },
        ],
      },
    });

    expect(result?.status).toBe('draft');
    expect(result?.lines).toHaveLength(1);
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('lists requests with a scoped cursor and groups their lines', async () => {
    const first = {
      ...requestRow,
      id: '11111111-1111-4111-8111-111111111111',
      created_at_cursor: '2026-11-28T10:00:00.000000+00:00',
    };
    const second = {
      ...requestRow,
      id: '33333333-3333-4333-8333-333333333333',
      created_at_cursor: '2026-11-28T09:00:00.000000+00:00',
    };
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [first, second] })
        .mockResolvedValueOnce({
          rows: [
            {
              purchase_request_id: first.id,
              id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
              material_id: '22222222-2222-4222-8222-222222222222',
              quantity: 2,
            },
          ],
        }),
    };
    const repository = new PurchaseRequestsRepository(pool as unknown as Pool);

    const result = await repository.list({
      tenantId: requestRow.tenant_id,
      applicationId: requestRow.application_id,
      limit: 1,
      status: 'draft',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.lines).toHaveLength(1);
    expect(result.nextCursor).toEqual(expect.any(String));
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('AND application_id = $2'),
      expect.arrayContaining([requestRow.tenant_id, requestRow.application_id]),
    );
  });
});
