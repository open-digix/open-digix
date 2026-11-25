import type { TenantContext } from '../identity/identity.types';
import { REQUIRED_APP_PERMISSION } from '../identity/app-permission.decorator';
import { REQUIRED_ROLES } from '../identity/roles.decorator';
import { TENANT_CONTEXT_REQUIRED } from '../identity/tenant-context.decorator';
import { BuilderSourceController } from './builder-source.controller';
import { BuilderSourceService } from './builder-source.service';

describe('BuilderSourceController', () => {
  const appId = '11111111-1111-4111-8111-111111111111';
  const context = {
    membership: {
      id: '22222222-2222-4222-8222-222222222222',
      tenant: { id: '33333333-3333-4333-8333-333333333333' },
    },
  } as TenantContext;
  const createdAt = new Date('2026-11-16T00:00:00.000Z');
  let createRevision: jest.Mock;
  let controller: BuilderSourceController;

  beforeEach(() => {
    createRevision = jest.fn().mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
      revisionNo: 1,
      segments: [
        { id: 'inputs_1', section: 'inputs', text: 'Employee enters data.' },
      ],
      createdAt,
    });
    controller = new BuilderSourceController({
      createRevision,
    } as unknown as BuilderSourceService);
  });

  it('creates a source revision in the verified tenant', async () => {
    await expect(
      controller.create(
        appId,
        { inputNotes: 'Employee enters data.' },
        context,
      ),
    ).resolves.toEqual({
      sourceRevisionId: '44444444-4444-4444-8444-444444444444',
      revisionNo: 1,
      segments: [
        { id: 'inputs_1', section: 'inputs', text: 'Employee enters data.' },
      ],
      createdAt: createdAt.toISOString(),
    });
    expect(createRevision).toHaveBeenCalledWith({
      tenantId: context.membership.tenant.id,
      applicationId: appId,
      createdByMembershipId: context.membership.id,
      sections: { inputs: 'Employee enters data.' },
      fileRefs: [],
    });
  });

  it('rejects a malformed application id before calling the service', async () => {
    await expect(
      controller.create('not-a-uuid', { inputNotes: 'Data' }, context),
    ).rejects.toMatchObject({
      response: { error: { code: 'INVALID_APP_ID' } },
    });
    expect(createRevision).not.toHaveBeenCalled();
  });

  it('uses app permission and tenant context without tenant role guard', () => {
    const handler = Object.getOwnPropertyDescriptor(
      BuilderSourceController.prototype,
      'create',
    )?.value as object;

    expect(Reflect.getMetadata(REQUIRED_ROLES, handler)).toBeUndefined();
    expect(Reflect.getMetadata(TENANT_CONTEXT_REQUIRED, handler)).toBe(true);
    expect(Reflect.getMetadata(REQUIRED_APP_PERMISSION, handler)).toEqual({
      permission: 'app.source.write',
      appIdParam: 'appId',
    });
  });
});
