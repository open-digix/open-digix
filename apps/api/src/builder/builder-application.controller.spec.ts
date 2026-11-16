import { BadRequestException } from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { REQUIRED_ROLES } from '../identity/roles.decorator';
import { TENANT_CONTEXT_REQUIRED } from '../identity/tenant-context.decorator';
import { BuilderApplicationController } from './builder-application.controller';
import { BuilderApplicationService } from './builder-application.service';

describe('BuilderApplicationController', () => {
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
  const body = {
    appKey: 'blank_request',
    name: 'Blank request',
    goal: 'Build manually',
    departmentRefs: ['operations'],
  };

  let createBlankDraft: jest.Mock;
  let controller: BuilderApplicationController;

  beforeEach(() => {
    createBlankDraft = jest.fn().mockResolvedValue({
      appId: '33333333-3333-4333-8333-333333333333',
      appKey: body.appKey,
      name: body.name,
      status: 'draft',
      versionId: '44444444-4444-4444-8444-444444444444',
      version: 1,
      versionStatus: 'draft',
      lockVersion: 1,
    });
    controller = new BuilderApplicationController({
      createBlankDraft,
    } as unknown as BuilderApplicationService);
  });

  it('creates a draft using only the verified tenant context', async () => {
    await expect(controller.create(body, context)).resolves.toEqual({
      appId: '33333333-3333-4333-8333-333333333333',
      appKey: body.appKey,
      name: body.name,
      status: 'draft',
      version: 1,
      versionStatus: 'draft',
      lockVersion: 1,
    });
    expect(createBlankDraft).toHaveBeenCalledWith({
      tenantId: context.membership.tenant.id,
      createdByMembershipId: context.membership.id,
      ...body,
    });
  });

  it('rejects templates until a trusted server-side template is registered', async () => {
    await expect(
      controller.create({ ...body, templateKey: 'purchase_v1' }, context),
    ).rejects.toMatchObject({
      response: { error: { code: 'APP_TEMPLATE_NOT_AVAILABLE' } },
    });
    expect(createBlankDraft).not.toHaveBeenCalled();
  });

  it('requires designer or tenant administrator role and tenant context', () => {
    const createHandler = Object.getOwnPropertyDescriptor(
      BuilderApplicationController.prototype,
      'create',
    )?.value as object;

    expect(Reflect.getMetadata(REQUIRED_ROLES, createHandler)).toEqual([
      'designer',
      'tenant_admin',
    ]);
    expect(Reflect.getMetadata(TENANT_CONTEXT_REQUIRED, createHandler)).toBe(
      true,
    );
  });

  it('returns a structured bad request for an unavailable template', async () => {
    await expect(
      controller.create({ ...body, templateKey: 'purchase_v1' }, context),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
