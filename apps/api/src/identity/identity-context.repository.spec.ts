import type { Pool } from 'pg';
import { IdentityContextRepository } from './identity-context.repository';

describe('IdentityContextRepository', () => {
  const issuer = 'http://localhost:8080/realms/digix';
  const subject = 'keycloak-subject';
  const baseRow = {
    user_id: '11111111-1111-4111-8111-111111111111',
    identity_subject: subject,
    user_email: 'dung@example.test',
    user_display_name: 'Dung',
    user_status: 'active',
    membership_id: '22222222-2222-4222-8222-222222222222',
    membership_status: 'active',
    tenant_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    tenant_slug: 'tenant_alpha',
    tenant_name: 'Tenant Alpha',
    tenant_status: 'active',
    roles: ['employee', 'manager'],
  };

  let pool: { query: jest.Mock };
  let repository: IdentityContextRepository;

  beforeEach(() => {
    pool = { query: jest.fn() };
    repository = new IdentityContextRepository(pool as unknown as Pool);
  });

  it('queries by issuer and subject and maps memberships', async () => {
    pool.query.mockResolvedValue({
      rows: [
        baseRow,
        {
          ...baseRow,
          membership_id: '33333333-3333-4333-8333-333333333333',
          membership_status: 'suspended',
          tenant_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          tenant_slug: 'tenant_beta',
          tenant_name: 'Tenant Beta',
          roles: ['publisher'],
        },
      ],
    });

    await expect(
      repository.findByExternalIdentity(issuer, subject),
    ).resolves.toEqual({
      user: {
        id: baseRow.user_id,
        subject,
        email: 'dung@example.test',
        displayName: 'Dung',
        status: 'active',
      },
      memberships: [
        {
          id: baseRow.membership_id,
          status: 'active',
          tenant: {
            id: baseRow.tenant_id,
            slug: 'tenant_alpha',
            name: 'Tenant Alpha',
            status: 'active',
          },
          roles: ['employee', 'manager'],
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          status: 'suspended',
          tenant: {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            slug: 'tenant_beta',
            name: 'Tenant Beta',
            status: 'active',
          },
          roles: ['publisher'],
        },
      ],
    });
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      issuer,
      subject,
    ]);
  });

  it('maps a provisioned user without memberships', async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          ...baseRow,
          membership_id: null,
          membership_status: null,
          tenant_id: null,
          tenant_slug: null,
          tenant_name: null,
          tenant_status: null,
          roles: [],
        },
      ],
    });

    await expect(
      repository.findByExternalIdentity(issuer, subject),
    ).resolves.toMatchObject({ memberships: [] });
  });

  it('returns undefined when the identity is not provisioned', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    await expect(
      repository.findByExternalIdentity(issuer, subject),
    ).resolves.toBeUndefined();
  });
});
