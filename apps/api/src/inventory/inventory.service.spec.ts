import { ConflictException, NotFoundException } from '@nestjs/common';
import type { IdempotencyService } from '../idempotency/idempotency.service';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';
import type { InventoryReceiptRecord } from './inventory.types';

const receipt: InventoryReceiptRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  applicationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  applicationVersionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  purchaseRequestId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  approvedByMembershipId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  receivedByMembershipId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  createdAt: new Date(),
  lines: [{ materialId: '22222222-2222-4222-8222-222222222222', quantity: 3 }],
};

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: {
    getPublishedFeatureStatus: jest.Mock;
    receive: jest.Mock;
    findById: jest.Mock;
    listReceipts: jest.Mock;
    listStock: jest.Mock;
  };
  let idempotency: {
    claim: jest.Mock;
    complete: jest.Mock;
    fail: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      getPublishedFeatureStatus: jest.fn().mockResolvedValue('enabled'),
      receive: jest.fn().mockResolvedValue(receipt),
      findById: jest.fn().mockResolvedValue(receipt),
      listReceipts: jest.fn().mockResolvedValue({
        items: [receipt],
        nextCursor: null,
      }),
      listStock: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    };
    idempotency = {
      claim: jest
        .fn()
        .mockResolvedValue({ kind: 'claimed', requestHash: 'hash' }),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
    };
    service = new InventoryService(
      repository as unknown as InventoryRepository,
      idempotency as unknown as IdempotencyService,
    );
  });

  const input = {
    tenantId: receipt.tenantId,
    applicationId: receipt.applicationId,
    actorMembershipId: receipt.receivedByMembershipId,
    idempotencyKey: 'receive-1',
    requestId: receipt.purchaseRequestId,
    expectedVersion: 3,
  };

  it('receives an approved request once and stores the response', async () => {
    await expect(service.receive(input)).resolves.toBe(receipt);
    expect(repository.receive).toHaveBeenCalledWith({
      tenantId: input.tenantId,
      applicationId: input.applicationId,
      requestId: input.requestId,
      expectedVersion: input.expectedVersion,
      receivedByMembershipId: input.actorMembershipId,
    });
    expect(idempotency.complete).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      201,
      receipt,
    );
  });

  it('replays a completed receive without writing again', async () => {
    idempotency.claim.mockResolvedValueOnce({
      kind: 'replay',
      status: 'completed',
      responseStatus: 201,
      responseBody: receipt,
    });

    await expect(service.receive(input)).resolves.toBe(receipt);
    expect(repository.receive).not.toHaveBeenCalled();
  });

  it('rejects an unapproved request', async () => {
    repository.receive.mockResolvedValueOnce(null);
    await expect(service.receive(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns not found for an inaccessible receipt', async () => {
    repository.findById.mockResolvedValueOnce(null);
    await expect(
      service.get({
        tenantId: receipt.tenantId,
        applicationId: receipt.applicationId,
        receiptId: receipt.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists receipts through the app-scoped repository', async () => {
    const receipts = { items: [receipt], nextCursor: null };
    repository.listReceipts.mockResolvedValue(receipts);

    await expect(
      service.listReceipts({
        tenantId: receipt.tenantId,
        applicationId: receipt.applicationId,
        limit: 20,
      }),
    ).resolves.toBe(receipts);
    expect(repository.listReceipts).toHaveBeenCalledWith({
      tenantId: receipt.tenantId,
      applicationId: receipt.applicationId,
      limit: 20,
    });
  });

  it('lists stock through the app-scoped repository', async () => {
    const stock = { items: [], nextCursor: null };
    repository.listStock.mockResolvedValue(stock);

    await expect(
      service.listStock({
        tenantId: receipt.tenantId,
        applicationId: receipt.applicationId,
        limit: 20,
        materialId: receipt.lines[0].materialId,
      }),
    ).resolves.toBe(stock);
    expect(repository.listStock).toHaveBeenCalledWith(
      receipt.tenantId,
      receipt.applicationId,
      20,
      receipt.lines[0].materialId,
      undefined,
    );
  });
});
