import type { Pool } from 'pg';
import { BuilderSourceRepository } from './builder-source.repository';

describe('BuilderSourceRepository', () => {
  const createdAt = new Date('2026-11-16T00:00:00.000Z');
  const input = {
    tenantId: '11111111-1111-4111-8111-111111111111',
    applicationId: '22222222-2222-4222-8222-222222222222',
    createdByMembershipId: '33333333-3333-4333-8333-333333333333',
    sections: {
      inputs: 'Employee enters an amount and reason.',
      steps: 'A manager reviews the request.',
    },
    segments: [
      {
        id: 'inputs_1',
        section: 'inputs' as const,
        text: 'Employee enters an amount and reason.',
      },
      {
        id: 'steps_1',
        section: 'steps' as const,
        text: 'A manager reviews the request.',
      },
    ],
  };
  const row = {
    id: '44444444-4444-4444-8444-444444444444',
    tenant_id: input.tenantId,
    application_id: input.applicationId,
    revision_no: 1,
    sections: input.sections,
    segments: input.segments,
    created_by_membership_id: input.createdByMembershipId,
    created_at: createdAt,
  };

  let query: jest.Mock;
  let release: jest.Mock;
  let repository: BuilderSourceRepository;

  beforeEach(() => {
    query = jest.fn();
    release = jest.fn();
    const pool = {
      connect: jest.fn().mockResolvedValue({ query, release }),
    };
    repository = new BuilderSourceRepository(pool as unknown as Pool);
  });

  it('locks the tenant application and creates its next source revision', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: input.applicationId }] })
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.createRevision(input)).resolves.toEqual({
      id: row.id,
      tenantId: input.tenantId,
      applicationId: input.applicationId,
      revisionNo: 1,
      sections: input.sections,
      segments: input.segments,
      createdByMembershipId: input.createdByMembershipId,
      createdAt,
    });
    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FOR UPDATE'),
      [input.tenantId, input.applicationId],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO builder_source_revisions'),
      [
        input.tenantId,
        input.applicationId,
        JSON.stringify(input.sections),
        JSON.stringify(input.segments),
        input.createdByMembershipId,
      ],
    );
    expect(query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('returns undefined without inserting when the tenant application is absent', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.createRevision(input)).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenLastCalledWith('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rolls back and releases the client when revision creation fails', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: input.applicationId }] })
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.createRevision(input)).rejects.toThrow(
      'database unavailable',
    );
    expect(query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
