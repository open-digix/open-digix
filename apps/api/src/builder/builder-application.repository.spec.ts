import type { Pool } from 'pg';
import { BuilderApplicationRepository } from './builder-application.repository';

describe('BuilderApplicationRepository', () => {
  const input = {
    tenantId: '11111111-1111-4111-8111-111111111111',
    createdByMembershipId: '22222222-2222-4222-8222-222222222222',
    appKey: 'purchase_request',
    name: 'Purchase request',
    goal: 'Control purchase approvals',
    departmentRefs: ['finance', 'operations'],
    templateKey: 'purchase_v1',
    schemaVersion: '1.0',
    initialDefinition: {},
    definitionChecksum: 'a'.repeat(64),
  };
  const applicationRow = {
    id: '33333333-3333-4333-8333-333333333333',
    app_key: input.appKey,
    name: input.name,
    status: 'draft',
  };
  const versionRow = {
    id: '44444444-4444-4444-8444-444444444444',
    version: 1,
    status: 'draft',
    lock_version: 1,
  };

  let query: jest.Mock;
  let release: jest.Mock;
  let repository: BuilderApplicationRepository;

  beforeEach(() => {
    query = jest.fn();
    release = jest.fn();
    const pool = {
      connect: jest.fn().mockResolvedValue({ query, release }),
    };
    repository = new BuilderApplicationRepository(pool as unknown as Pool);
  });

  it('creates an application and its first draft version atomically', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [applicationRow] })
      .mockResolvedValueOnce({ rows: [versionRow] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.createDraft(input)).resolves.toEqual({
      appId: applicationRow.id,
      appKey: input.appKey,
      name: input.name,
      status: 'draft',
      versionId: versionRow.id,
      version: 1,
      versionStatus: 'draft',
      lockVersion: 1,
    });

    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO applications'),
      [
        input.tenantId,
        input.appKey,
        input.name,
        input.goal,
        JSON.stringify(input.departmentRefs),
        input.templateKey,
      ],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO application_versions'),
      [
        input.tenantId,
        applicationRow.id,
        input.schemaVersion,
        input.initialDefinition,
        input.definitionChecksum,
        input.createdByMembershipId,
      ],
    );
    expect(query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('stores absent optional application metadata as null', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [applicationRow] })
      .mockResolvedValueOnce({ rows: [versionRow] })
      .mockResolvedValueOnce({ rows: [] });

    await repository.createDraft({
      ...input,
      goal: undefined,
      templateKey: undefined,
    });

    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), [
      input.tenantId,
      input.appKey,
      input.name,
      null,
      JSON.stringify(input.departmentRefs),
      null,
    ]);
  });

  it('rolls back and releases the client when creation fails', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [applicationRow] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.createDraft(input)).rejects.toThrow(
      'Database did not return the created application version',
    );
    expect(query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
