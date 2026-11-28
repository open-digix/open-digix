import { ConflictException } from '@nestjs/common';
import type { IdempotencyService } from '../idempotency/idempotency.service';
import { MaterialsRepository } from './materials.repository';
import { MaterialsService } from './materials.service';
import type { MaterialRecord } from './materials.types';

const material: MaterialRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  applicationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  applicationVersionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  sku: 'MAT-001',
  name: 'Laptop',
  unit: 'piece',
  note: null,
  createdByMembershipId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  lockVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MaterialsService', () => {
  let service: MaterialsService;
  let repository: {
    create: jest.Mock;
    list: jest.Mock;
    findById: jest.Mock;
    updateNoteIfVersionMatches: jest.Mock;
    currentVersion: jest.Mock;
  };
  let idempotency: { claim: jest.Mock; complete: jest.Mock; fail: jest.Mock };
  let optimisticVersion: { update: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(material),
      list: jest.fn(),
      findById: jest.fn().mockResolvedValue(material),
      updateNoteIfVersionMatches: jest.fn().mockResolvedValue(material),
      currentVersion: jest.fn().mockResolvedValue(1),
    };
    idempotency = {
      claim: jest
        .fn()
        .mockResolvedValue({ kind: 'claimed', requestHash: 'hash' }),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
    };
    optimisticVersion = { update: jest.fn().mockResolvedValue(material) };
    service = new MaterialsService(
      repository as unknown as MaterialsRepository,
      idempotency as unknown as IdempotencyService,
      optimisticVersion,
    );
  });

  it('creates a material with an app-scoped idempotency key', async () => {
    await expect(
      service.create({
        tenantId: material.tenantId,
        applicationId: material.applicationId,
        actorMembershipId: material.createdByMembershipId,
        idempotencyKey: 'create-1',
        body: { sku: material.sku, name: material.name, unit: material.unit },
      }),
    ).resolves.toBe(material);

    expect(idempotency.claim).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: material.tenantId,
        applicationId: material.applicationId,
        idempotencyKey: 'create-1',
      }),
      expect.any(Object),
    );
  });

  it('replays an existing idempotent response without inserting again', async () => {
    idempotency.claim.mockResolvedValueOnce({
      kind: 'replay',
      responseStatus: 201,
      responseBody: material,
      status: 'completed',
    });

    await expect(
      service.create({
        tenantId: material.tenantId,
        applicationId: material.applicationId,
        actorMembershipId: material.createdByMembershipId,
        idempotencyKey: 'create-1',
        body: { sku: material.sku, name: material.name, unit: material.unit },
      }),
    ).resolves.toBe(material);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('returns a conflict when no published app version is available', async () => {
    repository.create.mockResolvedValueOnce(null);

    await expect(
      service.create({
        tenantId: material.tenantId,
        applicationId: material.applicationId,
        actorMembershipId: material.createdByMembershipId,
        idempotencyKey: 'create-1',
        body: { sku: material.sku, name: material.name, unit: material.unit },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(idempotency.fail).toHaveBeenCalled();
  });
});
