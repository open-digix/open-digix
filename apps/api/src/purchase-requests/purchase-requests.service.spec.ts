import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuditService } from '../audit/audit.service';
import type { IdempotencyService } from '../idempotency/idempotency.service';
import { PurchaseRequestsRepository } from './purchase-requests.repository';
import { PurchaseRequestsService } from './purchase-requests.service';
import type { PurchaseRequestWorkflowService } from './purchase-request-workflow.service';
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
    list: jest.Mock;
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
  let workflow: {
    startIfConfigured: jest.Mock;
    completeDecisionIfConfigured: jest.Mock;
    listOpenPurchaseRequestTasks: jest.Mock;
  };
  let audit: { findByResource: jest.Mock };

  beforeEach(() => {
    repository = {
      getPublishedFeatureStatus: jest.fn().mockResolvedValue('enabled'),
      create: jest.fn().mockResolvedValue(request),
      findById: jest.fn().mockResolvedValue(request),
      list: jest.fn().mockResolvedValue({ items: [request], nextCursor: null }),
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
    workflow = {
      startIfConfigured: jest.fn().mockResolvedValue(null),
      completeDecisionIfConfigured: jest.fn().mockResolvedValue(false),
      listOpenPurchaseRequestTasks: jest.fn().mockResolvedValue({ items: [] }),
    };
    audit = { findByResource: jest.fn().mockResolvedValue([]) };
    service = new PurchaseRequestsService(
      repository as unknown as PurchaseRequestsRepository,
      idempotency as unknown as IdempotencyService,
      optimisticVersion,
      workflow as unknown as PurchaseRequestWorkflowService,
      audit as unknown as AuditService,
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

  it('lists requests only after checking the published feature', async () => {
    const result = await service.list({
      tenantId: request.tenantId,
      applicationId: request.applicationId,
      limit: 20,
      status: 'submitted',
    });

    expect(result.items).toEqual([request]);
    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        limit: 20,
        status: 'submitted',
      }),
    );
  });

  it('returns history only after checking request scope', async () => {
    const history = [{ id: 'audit-1', resourceType: 'purchase_request' }];
    audit.findByResource.mockResolvedValueOnce(history);

    await expect(
      service.history({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        purchaseRequestId: request.id,
      }),
    ).resolves.toBe(history);
    expect(audit.findByResource).toHaveBeenCalledWith(
      request.tenantId,
      'purchase_request',
      request.id,
    );
  });

  it('lists workflow tasks only for a published purchase feature', async () => {
    await expect(
      service.listTasks({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        membershipId: request.requesterMembershipId,
      }),
    ).resolves.toEqual({ items: [] });
    expect(workflow.listOpenPurchaseRequestTasks).toHaveBeenCalledWith({
      tenantId: request.tenantId,
      applicationId: request.applicationId,
      membershipId: request.requesterMembershipId,
    });
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
    expect(workflow.startIfConfigured).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseRequestId: request.id,
        businessRecordId: request.businessRecordId,
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

  it('completes the workflow task when a different member approves', async () => {
    const submitted = { ...request, status: 'submitted' as const };
    const approved = {
      ...submitted,
      status: 'approved' as const,
      approverMembershipId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      lockVersion: 2,
    };
    repository.findById.mockResolvedValueOnce(submitted);
    repository.transitionIfVersionMatches.mockResolvedValueOnce(approved);
    workflow.completeDecisionIfConfigured.mockResolvedValueOnce(true);

    await expect(
      service.approve({
        tenantId: request.tenantId,
        applicationId: request.applicationId,
        actorMembershipId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        purchaseRequestId: request.id,
        idempotencyKey: 'approve-1',
        expectedVersion: 1,
      }),
    ).resolves.toBe(approved);

    expect(workflow.completeDecisionIfConfigured).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseRequestId: request.id,
        actorMembershipId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        decision: 'approved',
      }),
    );
    expect(repository.transitionIfVersionMatches).toHaveBeenCalledWith(
      expect.objectContaining({
        fromStatus: 'submitted',
        toStatus: 'approved',
        approverMembershipId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      }),
    );
  });
});
