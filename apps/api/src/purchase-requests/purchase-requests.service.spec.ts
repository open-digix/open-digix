import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { IdempotencyService } from '../idempotency/idempotency.service';
import { PurchaseRequestsRepository } from './purchase-requests.repository';
import { PurchaseRequestsService } from './purchase-requests.service';
import type { PurchaseRequestRecord } from './purchase-requests.types';

const request: PurchaseRequestRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  applicationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  applicationVersionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  businessRecordId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  requesterMembershipId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  approverMembershipId: null,
  status: 'draft',
  rejectionReason: null,
  lockVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  submittedAt: null,
  decidedAt: null,
  lines: [],
};

describe('PurchaseRequestsService', () => {
  let service: PurchaseRequestsService;
  let repository: {
    getPublishedFeatureStatus: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    transitionIfVersionMatches: jest.Mock;
    currentVersion: jest.Mock;
  };
  let idempotency: {
    claim: jest.Mock;
    complete: jest.Mock;
    fail: jest.Mock;
  };
  let optimisticVersion: {
    update: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      getPublishedFeatureStatus: jest.fn().mockResolvedValue('enabled'),
      create: jest.fn().mockResolvedValue(request),
      findById: jest.fn().mockResolvedValue(request),
      transitionIfVersionMatches: jest.fn().mockResolvedValue({
        ...request,
        status: 'submitted',
        lockVersion: 2,
      }),
      currentVersion: jest.fn().mockResolvedValue(request.lockVersion),
    };
    idempotency = {
      claim: jest
        .fn()
        .mockResolvedValue({ kind: 'claimed', requestHash: 'hash' }),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
    };
    optimisticVersion = {
      update: jest.fn(
        (command: {
          expectedVersion: number;
          updateIfVersionMatches: (
            expectedVersion: number,
          ) => Promise<PurchaseRequestRecord | null>;
        }) => command.updateIfVersionMatches(command.expectedVersion),
      ),
    };
    service = new PurchaseRequestsService(
      repository as unknown as PurchaseRequestsRepository,
      idempotency as unknown as IdempotencyService,
      optimisticVersion,
    );
  });

  it('creates a draft request with app-scoped idempotency', async () => {
    await expect(
      service.create({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        actorMembershipId: request.requesterMembershipId,
        idempotencyKey: 'request-1',
        body: {
          businessRecordId: request.businessRecordId,
          lines: [
            { materialId: '22222222-2222-4222-8222-222222222222', quantity: 2 },
          ],
        },
      }),
    ).resolves.toBe(request);
    expect(idempotency.claim).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'erp.purchase_requests.requests.create',
      }),
      expect.any(Object),
    );
  });

  it('replays without creating a second request', async () => {
    idempotency.claim.mockResolvedValueOnce({
      kind: 'replay',
      status: 'completed',
      responseStatus: 201,
      responseBody: request,
    });
    await expect(
      service.create({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        actorMembershipId: request.requesterMembershipId,
        idempotencyKey: 'request-1',
        body: { businessRecordId: request.businessRecordId, lines: [] },
      }),
    ).resolves.toBe(request);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns not found for an inaccessible request', async () => {
    repository.findById.mockResolvedValueOnce(null);
    await expect(
      service.get({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        purchaseRequestId: request.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when the feature is disabled', async () => {
    repository.getPublishedFeatureStatus.mockResolvedValueOnce('disabled');
    await expect(
      service.get({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        purchaseRequestId: request.id,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('submits a draft with optimistic version checking', async () => {
    const response = await service.submit({
      tenantId: request.tenantId,
      applicationId: request.applicationId,
      actorMembershipId: request.requesterMembershipId,
      purchaseRequestId: request.id,
      idempotencyKey: 'submit-1',
      expectedVersion: 1,
    });

    expect(response.status).toBe('submitted');
    expect(optimisticVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({ expectedVersion: 1 }),
    );
    expect(repository.transitionIfVersionMatches).toHaveBeenCalledWith(
      expect.objectContaining({
        fromStatus: 'draft',
        toStatus: 'submitted',
        expectedVersion: 1,
      }),
    );
  });

  it('blocks the requester from approving their own request', async () => {
    const submitted = { ...request, status: 'submitted' as const };
    repository.findById.mockResolvedValueOnce(submitted);

    await expect(
      service.approve({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        actorMembershipId: request.requesterMembershipId,
        purchaseRequestId: request.id,
        idempotencyKey: 'approve-1',
        expectedVersion: 1,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(optimisticVersion.update).not.toHaveBeenCalled();
  });
});
