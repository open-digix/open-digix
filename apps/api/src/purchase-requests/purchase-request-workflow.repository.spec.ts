import type { Pool } from 'pg';
import { PurchaseRequestWorkflowRepository } from './purchase-request-workflow.repository';

describe('PurchaseRequestWorkflowRepository', () => {
  it('lists only open tasks scoped to the tenant, app and membership', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            task_id: 'task-1',
            purchase_request_id: 'request-1',
            business_record_id: 'record-1',
            request_status: 'submitted',
            request_version: 2,
            role_code: 'approver',
            assignee_membership_id: null,
            created_at: new Date('2026-11-28T10:00:00.000Z'),
            due_at: null,
          },
        ],
      }),
    };
    const repository = new PurchaseRequestWorkflowRepository(
      pool as unknown as Pool,
    );

    await expect(
      repository.listOpenPurchaseRequestTasks({
        tenantId: 'tenant-1',
        applicationId: 'app-1',
        membershipId: 'membership-1',
      }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          taskId: 'task-1',
          purchaseRequestId: 'request-1',
          roleCode: 'approver',
        }),
      ],
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('av.application_id = $2'),
      ['tenant-1', 'app-1', 'membership-1'],
    );
  });
});
