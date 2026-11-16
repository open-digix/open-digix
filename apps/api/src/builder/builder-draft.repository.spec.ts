import type { Pool } from 'pg';
import {
  BuilderDraftRepository,
  BuilderVersionConflictError,
} from './builder-draft.repository';
import type { BuilderApplicationDefinitionV1 } from './builder.types';

describe('BuilderDraftRepository', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const applicationId = '22222222-2222-4222-8222-222222222222';
  const versionId = '33333333-3333-4333-8333-333333333333';
  const sourceRevisionId = '44444444-4444-4444-8444-444444444444';
  const draftRevisionId = '55555555-5555-4555-8555-555555555555';
  const createdByMembershipId = '66666666-6666-4666-8666-666666666666';
  const createdAt = new Date('2026-11-16T12:00:00.000Z');

  const dummyDefinition: BuilderApplicationDefinitionV1 = {
    schemaVersion: '1.0',
    appId: 'test_app',
    tenantId: 'tenant_alpha',
    version: 1,
    name: 'Test App',
    roles: ['employee'],
    fields: [{ id: 'title', type: 'string', required: true }],
    steps: [
      { id: 'submitted', type: 'start' },
      { id: 'accepted', type: 'end', endState: 'approved' },
      { id: 'declined', type: 'end', endState: 'rejected' },
    ],
    transitions: [
      { from: 'submitted', to: 'accepted' },
      { from: 'submitted', to: 'declined' },
    ],
  };

  let poolQuery: jest.Mock;
  let clientQuery: jest.Mock;
  let clientRelease: jest.Mock;
  let repository: BuilderDraftRepository;

  beforeEach(() => {
    poolQuery = jest.fn();
    clientQuery = jest.fn();
    clientRelease = jest.fn();

    const pool = {
      query: poolQuery,
      connect: jest.fn().mockResolvedValue({
        query: clientQuery,
        release: clientRelease,
      }),
    };

    repository = new BuilderDraftRepository(pool as unknown as Pool);
  });

  describe('findApplicationVersion', () => {
    it('returns application and version record when found', async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [
          {
            application_id: applicationId,
            app_key: 'test_app',
            app_name: 'Test App',
            app_status: 'draft',
            version_id: versionId,
            version: 1,
            version_status: 'draft',
            lock_version: 1,
            current_revision_id: null,
          },
        ],
      });

      const res = await repository.findApplicationVersion(
        tenantId,
        applicationId,
        1,
      );
      expect(res).toEqual({
        applicationId,
        appKey: 'test_app',
        appName: 'Test App',
        appStatus: 'draft',
        versionId,
        version: 1,
        versionStatus: 'draft',
        lockVersion: 1,
        currentRevisionId: null,
      });
      expect(poolQuery).toHaveBeenCalledWith(expect.any(String), [
        tenantId,
        applicationId,
        1,
      ]);
    });

    it('returns undefined when not found', async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] });
      const res = await repository.findApplicationVersion(
        tenantId,
        applicationId,
        1,
      );
      expect(res).toBeUndefined();
    });
  });

  describe('findDraftDetails', () => {
    it('returns draft details with revision when revision exists', async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [
          {
            application_id: applicationId,
            app_key: 'test_app',
            app_name: 'Test App',
            app_status: 'draft',
            version_id: versionId,
            version: 1,
            version_status: 'draft',
            lock_version: 2,
            version_definition: {},
            version_definition_checksum: 'a'.repeat(64),
            revision_id: draftRevisionId,
            revision_no: 1,
            revision_definition: dummyDefinition,
            design_metadata: { sourceMappings: [], openIssues: [] },
            snapshot_checksum: 'b'.repeat(64),
            revision_created_at: createdAt,
          },
        ],
      });

      const res = await repository.findDraftDetails(tenantId, applicationId, 1);
      expect(res).toEqual({
        applicationId,
        appKey: 'test_app',
        appName: 'Test App',
        appStatus: 'draft',
        versionId,
        version: 1,
        versionStatus: 'draft',
        lockVersion: 2,
        revisionId: draftRevisionId,
        revisionNo: 1,
        snapshotChecksum: 'b'.repeat(64),
        definition: dummyDefinition,
        sourceMappings: [],
        openIssues: [],
        createdAt,
      });
    });

    it('returns undefined when draft is not found', async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] });
      const res = await repository.findDraftDetails(tenantId, applicationId, 1);
      expect(res).toBeUndefined();
    });
  });

  describe('findSourceRevision', () => {
    it('returns latest source revision when sourceRevisionId is not specified', async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [
          {
            id: sourceRevisionId,
            tenant_id: tenantId,
            application_id: applicationId,
            revision_no: 2,
            sections: { inputs: 'Input notes' },
            segments: [
              {
                id: 'inputs_1',
                section: 'inputs' as const,
                text: 'Input notes',
              },
            ],
            created_by_membership_id: createdByMembershipId,
            created_at: createdAt,
          },
        ],
      });

      const res = await repository.findSourceRevision(tenantId, applicationId);
      expect(res?.id).toBe(sourceRevisionId);
      expect(res?.revisionNo).toBe(2);
      expect(poolQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY revision_no DESC'),
        [tenantId, applicationId],
      );
    });

    it('returns specific source revision when sourceRevisionId is specified', async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [
          {
            id: sourceRevisionId,
            tenant_id: tenantId,
            application_id: applicationId,
            revision_no: 1,
            sections: {},
            segments: [],
            created_by_membership_id: createdByMembershipId,
            created_at: createdAt,
          },
        ],
      });

      const res = await repository.findSourceRevision(
        tenantId,
        applicationId,
        sourceRevisionId,
      );
      expect(res?.id).toBe(sourceRevisionId);
      expect(poolQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND id = $3'),
        [tenantId, applicationId, sourceRevisionId],
      );
    });
  });

  describe('saveNormalizedDraft', () => {
    it('persists draft revision and updates version inside transaction', async () => {
      clientQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ lock_version: 1 }] })
        .mockResolvedValueOnce({ rows: [{ next_rev: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: draftRevisionId,
              revision_no: 2,
              created_at: createdAt,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ lock_version: 2 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined);

      const res = await repository.saveNormalizedDraft({
        tenantId,
        applicationId,
        applicationVersionId: versionId,
        version: 1,
        sourceRevisionId,
        definition: dummyDefinition,
        sourceMappings: [],
        openIssues: [],
        snapshotChecksum: 'a'.repeat(64),
        createdByMembershipId,
      });

      expect(res).toEqual({
        revisionId: draftRevisionId,
        revisionNo: 2,
        lockVersion: 2,
        snapshotChecksum: 'a'.repeat(64),
        createdAt,
      });
      expect(clientRelease).toHaveBeenCalled();
    });

    it('rolls back transaction on error', async () => {
      clientQuery
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Lock error'));

      await expect(
        repository.saveNormalizedDraft({
          tenantId,
          applicationId,
          applicationVersionId: versionId,
          version: 1,
          sourceRevisionId,
          definition: dummyDefinition,
          sourceMappings: [],
          openIssues: [],
          snapshotChecksum: 'a'.repeat(64),
          createdByMembershipId,
        }),
      ).rejects.toThrow('Lock error');

      expect(clientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(clientRelease).toHaveBeenCalled();
    });
  });

  describe('updateDraftRevision', () => {
    it('persists new revision and increments lockVersion when lock matches', async () => {
      clientQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ lock_version: 2 }] })
        .mockResolvedValueOnce({ rows: [{ next_rev: 3 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: draftRevisionId,
              revision_no: 3,
              created_at: createdAt,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ lock_version: 3 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined);

      const res = await repository.updateDraftRevision({
        tenantId,
        applicationId,
        applicationVersionId: versionId,
        version: 1,
        lockVersion: 2,
        definition: dummyDefinition,
        sourceMappings: [],
        openIssues: [],
        snapshotChecksum: 'c'.repeat(64),
        createdByMembershipId,
      });

      expect(res).toEqual({
        revisionId: draftRevisionId,
        revisionNo: 3,
        lockVersion: 3,
        snapshotChecksum: 'c'.repeat(64),
        createdAt,
      });
      expect(clientRelease).toHaveBeenCalled();
    });

    it('throws BuilderVersionConflictError when lockVersion does not match', async () => {
      clientQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ lock_version: 5 }] });

      await expect(
        repository.updateDraftRevision({
          tenantId,
          applicationId,
          applicationVersionId: versionId,
          version: 1,
          lockVersion: 2,
          definition: dummyDefinition,
          sourceMappings: [],
          openIssues: [],
          snapshotChecksum: 'c'.repeat(64),
          createdByMembershipId,
        }),
      ).rejects.toBeInstanceOf(BuilderVersionConflictError);

      expect(clientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(clientRelease).toHaveBeenCalled();
    });
  });
});
