import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BuilderDraftService } from './builder-draft.service';
import {
  BuilderVersionConflictError,
  type BuilderDraftRepository,
} from './builder-draft.repository';

describe('BuilderDraftService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const tenantSlug = 'tenant_alpha';
  const applicationId = '22222222-2222-4222-8222-222222222222';
  const versionId = '33333333-3333-4333-8333-333333333333';
  const sourceRevisionId = '44444444-4444-4444-8444-444444444444';
  const createdByMembershipId = '55555555-5555-4555-8555-555555555555';
  const createdAt = new Date('2026-11-16T12:00:00.000Z');

  const appVersionRecord = {
    applicationId,
    appKey: 'laptop_request',
    appName: 'Laptop Request',
    appStatus: 'draft',
    versionId,
    version: 1,
    versionStatus: 'draft',
    lockVersion: 1,
    currentRevisionId: null,
  };

  const sourceRevisionRecord = {
    id: sourceRevisionId,
    tenantId,
    applicationId,
    revisionNo: 1,
    sections: { inputs: 'device: string' },
    segments: [
      { id: 'inputs_1', section: 'inputs' as const, text: 'device: string' },
    ],
    createdByMembershipId,
    createdAt,
  };

  const normalizedResult = {
    definition: {
      schemaVersion: '1.0' as const,
      appId: 'laptop_request',
      tenantId: 'tenant_alpha',
      version: 1,
      name: 'Laptop Request',
      roles: ['employee'],
      fields: [{ id: 'device', type: 'string' as const, required: true }],
      steps: [
        { id: 'submitted', type: 'start' as const },
        { id: 'accepted', type: 'end' as const, endState: 'approved' as const },
        { id: 'declined', type: 'end' as const, endState: 'rejected' as const },
      ],
      transitions: [
        { from: 'submitted', to: 'accepted' },
        { from: 'submitted', to: 'declined' },
      ],
    },
    sourceMappings: [
      {
        targetType: 'field' as const,
        targetId: 'device',
        sourceRevisionId,
        segmentIds: ['inputs_1'],
      },
    ],
    openIssues: [],
  };

  let repository: {
    findApplicationVersion: jest.Mock;
    findDraftDetails: jest.Mock;
    findSourceRevision: jest.Mock;
    saveNormalizedDraft: jest.Mock;
    updateDraftRevision: jest.Mock;
  };
  let normalizer: {
    normalize: jest.Mock;
  };
  let service: BuilderDraftService;

  beforeEach(() => {
    repository = {
      findApplicationVersion: jest.fn().mockResolvedValue(appVersionRecord),
      findDraftDetails: jest.fn().mockResolvedValue({
        applicationId,
        appKey: 'laptop_request',
        appName: 'Laptop Request',
        appStatus: 'draft',
        versionId,
        version: 1,
        versionStatus: 'draft',
        lockVersion: 1,
        revisionId: '66666666-6666-4666-8666-666666666666',
        revisionNo: 1,
        snapshotChecksum: 'a'.repeat(64),
        definition: normalizedResult.definition,
        sourceMappings: [],
        openIssues: [],
        createdAt,
      }),
      findSourceRevision: jest.fn().mockResolvedValue(sourceRevisionRecord),
      saveNormalizedDraft: jest.fn().mockResolvedValue({
        revisionId: '66666666-6666-4666-8666-666666666666',
        revisionNo: 1,
        lockVersion: 2,
        snapshotChecksum: 'a'.repeat(64),
        createdAt,
      }),
      updateDraftRevision: jest.fn().mockResolvedValue({
        revisionId: '77777777-7777-4777-8777-777777777777',
        revisionNo: 2,
        lockVersion: 2,
        snapshotChecksum: 'b'.repeat(64),
        createdAt,
      }),
    };
    normalizer = {
      normalize: jest.fn().mockReturnValue(normalizedResult),
    };
    service = new BuilderDraftService(
      repository as unknown as BuilderDraftRepository,
      normalizer,
    );
  });

  describe('getDraft', () => {
    it('returns draft details when draft exists', async () => {
      const res = await service.getDraft(tenantId, applicationId, 1);
      expect(res.applicationId).toBe(applicationId);
      expect(res.version).toBe(1);
      expect(repository.findDraftDetails).toHaveBeenCalledWith(
        tenantId,
        applicationId,
        1,
      );
    });

    it('throws NotFoundException when draft does not exist', async () => {
      repository.findDraftDetails.mockResolvedValueOnce(undefined);
      await expect(
        service.getDraft(tenantId, applicationId, 1),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('normalizeDraft', () => {
    it('normalizes draft and persists draft revision successfully', async () => {
      const res = await service.normalizeDraft({
        tenantId,
        tenantSlug,
        applicationId,
        version: 1,
        createdByMembershipId,
      });

      expect(repository.findApplicationVersion).toHaveBeenCalledWith(
        tenantId,
        applicationId,
        1,
      );
      expect(repository.findSourceRevision).toHaveBeenCalledWith(
        tenantId,
        applicationId,
        undefined,
      );
      expect(normalizer.normalize).toHaveBeenCalledWith({
        appId: appVersionRecord.appKey,
        tenantId: tenantSlug,
        version: 1,
        name: appVersionRecord.appName,
        sourceRevisionId: sourceRevisionRecord.id,
        sections: sourceRevisionRecord.sections,
        segments: sourceRevisionRecord.segments,
      });
      expect(repository.saveNormalizedDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          applicationId,
          applicationVersionId: versionId,
          version: 1,
          sourceRevisionId,
          definition: normalizedResult.definition,
          sourceMappings: normalizedResult.sourceMappings,
          openIssues: normalizedResult.openIssues,
        }),
      );
      expect(res).toEqual({
        revisionId: '66666666-6666-4666-8666-666666666666',
        revisionNo: 1,
        lockVersion: 2,
        snapshotChecksum: 'a'.repeat(64),
        definition: normalizedResult.definition,
        sourceMappings: normalizedResult.sourceMappings,
        openIssues: normalizedResult.openIssues,
        createdAt,
      });
    });

    it('throws NotFoundException when application or version does not exist', async () => {
      repository.findApplicationVersion.mockResolvedValueOnce(undefined);

      await expect(
        service.normalizeDraft({
          tenantId,
          tenantSlug,
          applicationId,
          version: 1,
          createdByMembershipId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when application is not in draft status', async () => {
      repository.findApplicationVersion.mockResolvedValueOnce({
        ...appVersionRecord,
        versionStatus: 'published',
      });

      await expect(
        service.normalizeDraft({
          tenantId,
          tenantSlug,
          applicationId,
          version: 1,
          createdByMembershipId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when no source revision exists', async () => {
      repository.findSourceRevision.mockResolvedValueOnce(undefined);

      await expect(
        service.normalizeDraft({
          tenantId,
          tenantSlug,
          applicationId,
          version: 1,
          createdByMembershipId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('patchDraft', () => {
    it('updates draft revision when lock matches', async () => {
      const res = await service.patchDraft({
        tenantId,
        applicationId,
        version: 1,
        lockVersion: 1,
        createdByMembershipId,
        definition: normalizedResult.definition,
      });

      expect(repository.updateDraftRevision).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          applicationId,
          applicationVersionId: versionId,
          version: 1,
          lockVersion: 1,
          definition: normalizedResult.definition,
        }),
      );
      expect(res).toEqual({
        revisionId: '77777777-7777-4777-8777-777777777777',
        revisionNo: 2,
        lockVersion: 2,
        snapshotChecksum: 'b'.repeat(64),
        createdAt,
      });
    });

    it('throws ConflictException on version conflict', async () => {
      repository.updateDraftRevision.mockRejectedValueOnce(
        new BuilderVersionConflictError(),
      );

      await expect(
        service.patchDraft({
          tenantId,
          applicationId,
          version: 1,
          lockVersion: 1,
          createdByMembershipId,
          definition: normalizedResult.definition,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFoundException when app does not exist', async () => {
      repository.findApplicationVersion.mockResolvedValueOnce(undefined);

      await expect(
        service.patchDraft({
          tenantId,
          applicationId,
          version: 1,
          lockVersion: 1,
          createdByMembershipId,
          definition: normalizedResult.definition,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
