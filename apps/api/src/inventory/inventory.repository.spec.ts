import type { Pool } from 'pg';
import { InventoryRepository } from './inventory.repository';

const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const applicationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const receiptId = '11111111-1111-4111-8111-111111111111';
const materialId = '22222222-2222-4222-8222-222222222222';

describe('InventoryRepository', () => {
  it('lists receipts with tenant/app scope and groups lines by receipt', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: receiptId,
            tenant_id: tenantId,
            application_id: applicationId,
            application_version_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            purchase_request_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            approved_by_membership_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            received_by_membership_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
            created_at: new Date('2026-11-28T10:00:00.000Z'),
            created_at_cursor: '2026-11-28T10:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ receipt_id: receiptId, material_id: materialId, quantity: 3 }],
      });
    const repository = new InventoryRepository({ query } as unknown as Pool);

    const result = await repository.listReceipts({
      tenantId,
      applicationId,
      limit: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(receiptId);
    expect(result.items[0]?.lines).toEqual([{ materialId, quantity: 3 }]);
    expect(result.nextCursor).toBeNull();
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE tenant_id = $1'),
      [tenantId, applicationId, null, null, 21],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('receipt_id = ANY($3::uuid[])'),
      [tenantId, applicationId, [receiptId]],
    );
  });
});
