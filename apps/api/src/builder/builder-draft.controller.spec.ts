import type { TenantContext } from '../identity/identity.types';
import { REQUIRED_ROLES } from '../identity/roles.decorator';
import { TENANT_CONTEXT_REQUIRED } from '../identity/tenant-context.decorator';
import { BuilderDraftController } from './builder-draft.controller';
import type { BuilderDraftService } from './builder-draft.service';

describe('BuilderDraftController', () => {
  const context: TenantContext = {
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      subject: 'keycloak-subject',
      email: 'designer@example.test',
      displayName: 'Designer',
      status: 'active',
    },
    membership: {
      id: '22222222-2222-4222-8222-222222222222',
      status: 'active',
      tenant: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        slug: 'tenant_alpha',
        name: 'Tenant Alpha',
        status: 'active',
      },
      roles: ['designer'],
    },
  };

  const appId = '33333333-3333-4333-8333-333333333333';
  const createdAt = new Date('2026-11-16T12:00:00.000Z');

  const normalizedResult = {
    revisionId: '44444444-4444-4444-8444-444444444444',
    revisionNo: 1,
    lockVersion: 2,
    snapshotChecksum: 'b'.repeat(64),
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
    sourceMappings: [],
    openIssues: [],
    createdAt,
  };

  let normalizeDraft: jest.Mock;
  let controller: BuilderDraftController;

  beforeEach(() => {
    normalizeDraft = jest.fn().mockResolvedValue(normalizedResult);
    controller = new BuilderDraftController({
      normalizeDraft,
    } as unknown as BuilderDraftService);
  });

  it('normalizes draft using verified tenant context', async () => {
    const response = await controller.normalize(appId, '1', {}, context);

    expect(normalizeDraft).toHaveBeenCalledWith({
      tenantId: context.membership.tenant.id,
      tenantSlug: context.membership.tenant.slug,
      applicationId: appId,
      version: 1,
      createdByMembershipId: context.membership.id,
      sourceRevisionId: undefined,
    });

    expect(response).toEqual({
      revisionId: normalizedResult.revisionId,
      revisionNo: 1,
      lockVersion: 2,
      snapshotChecksum: normalizedResult.snapshotChecksum,
      definition: normalizedResult.definition,
      sourceMappings: [],
      openIssues: [],
      createdAt: createdAt.toISOString(),
    });
  });

  it('passes sourceRevisionId when provided in request body', async () => {
    const sourceRevisionId = '55555555-5555-4555-8555-555555555555';
    await controller.normalize(appId, '1', { sourceRevisionId }, context);

    expect(normalizeDraft).toHaveBeenCalledWith({
      tenantId: context.membership.tenant.id,
      tenantSlug: context.membership.tenant.slug,
      applicationId: appId,
      version: 1,
      createdByMembershipId: context.membership.id,
      sourceRevisionId,
    });
  });

  it('requires designer or tenant_admin roles and tenant context', () => {
    const handler = Object.getOwnPropertyDescriptor(
      BuilderDraftController.prototype,
      'normalize',
    )?.value as object;

    expect(Reflect.getMetadata(REQUIRED_ROLES, handler)).toEqual([
      'designer',
      'tenant_admin',
    ]);
    expect(Reflect.getMetadata(TENANT_CONTEXT_REQUIRED, handler)).toBe(true);
  });
});
