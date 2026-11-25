import type { Pool } from 'pg';
import { AppAuthorizationRepository } from './app-authorization.repository';

describe('AppAuthorizationRepository', () => {
  let pool: { query: jest.Mock };
  let repository: AppAuthorizationRepository;

  beforeEach(() => {
    pool = { query: jest.fn() };
    repository = new AppAuthorizationRepository(pool as unknown as Pool);
  });

  it('scopes application lookup by tenant and app', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 'app-a', status: 'draft' }],
    });

    await expect(
      repository.findApplication('tenant-a', 'app-a'),
    ).resolves.toEqual({ id: 'app-a', status: 'draft' });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE tenant_id = $1 AND id = $2'),
      ['tenant-a', 'app-a'],
    );
  });

  it('maps app roles and permissions from the membership assignment', async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          role_codes: ['designer'],
          permissions: ['app.draft.read'],
        },
      ],
    });

    await expect(
      repository.findMembershipAccess('tenant-a', 'app-a', 'membership-a'),
    ).resolves.toEqual({
      roleCodes: ['designer'],
      permissions: ['app.draft.read'],
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('AND amr.application_id = $3'),
      ['tenant-a', 'membership-a', 'app-a'],
    );
  });

  it('returns empty access when the membership has no app role', async () => {
    pool.query.mockResolvedValue({
      rows: [{ role_codes: null, permissions: null }],
    });

    await expect(
      repository.findMembershipAccess('tenant-a', 'app-a', 'membership-a'),
    ).resolves.toEqual({ roleCodes: [], permissions: [] });
  });
});
