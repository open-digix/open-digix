import type { TenantContext } from '../identity/identity.types';
import { REQUIRED_APP_PERMISSION } from '../identity/app-permission.decorator';
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

  const draftDetailsResult = {
    applicationId: appId,
    appKey: 'laptop_request',
    appName: 'Laptop Request',
    appStatus: 'draft',
    versionId: '44444444-4444-4444-8444-444444444444',
    version: 1,
    versionStatus: 'draft',
    lockVersion: 1,
    revisionId: '55555555-5555-4555-8555-555555555555',
    revisionNo: 1,
    snapshotChecksum: 'a'.repeat(64),
    definition: {
      schemaVersion: '1.0' as const,
      appId: 'laptop_request',
      tenantId: 'tenant_alpha',
      version: 1,
      name: 'Laptop Request',
      roles: ['employee'],
      fields: [],
      steps: [],
      transitions: [],
    },
    sourceMappings: [],
    openIssues: [],
    createdAt,
  };

  const normalizedResult = {
    revisionId: '55555555-5555-4555-8555-555555555555',
    revisionNo: 1,
    lockVersion: 2,
    snapshotChecksum: 'b'.repeat(64),
    definition: draftDetailsResult.definition,
    sourceMappings: [],
    openIssues: [],
    createdAt,
  };

  const patchedResult = {
    revisionId: '66666666-6666-4666-8666-666666666666',
    revisionNo: 2,
    lockVersion: 2,
    snapshotChecksum: 'c'.repeat(64),
    createdAt,
  };

  let getDraft: jest.Mock;
  let normalizeDraft: jest.Mock;
  let patchDraft: jest.Mock;
  let validateDraft: jest.Mock;
  let controller: BuilderDraftController;

  beforeEach(() => {
    getDraft = jest.fn().mockResolvedValue(draftDetailsResult);
    normalizeDraft = jest.fn().mockResolvedValue(normalizedResult);
    patchDraft = jest.fn().mockResolvedValue(patchedResult);
    validateDraft = jest.fn().mockResolvedValue({
      valid: true,
      snapshotChecksum: 'a'.repeat(64),
      issues: [],
    });

    controller = new BuilderDraftController({
      getDraft,
      normalizeDraft,
      patchDraft,
      validateDraft,
    } as unknown as BuilderDraftService);
  });

  describe('GET :appId/drafts/:version', () => {
    it('returns draft details using verified tenant context', async () => {
      const response = await controller.get(appId, '1', context);

      expect(getDraft).toHaveBeenCalledWith(
        context.membership.tenant.id,
        appId,
        1,
      );
      expect(response).toEqual({
        appId,
        version: 1,
        status: 'draft',
        lockVersion: 1,
        revisionId: draftDetailsResult.revisionId,
        revisionNo: 1,
        snapshotChecksum: draftDetailsResult.snapshotChecksum,
        definition: draftDetailsResult.definition,
        sourceMappings: [],
        openIssues: [],
        createdAt: createdAt.toISOString(),
      });
    });

    it('requires designer, publisher, or tenant_admin roles', () => {
      const handler = Object.getOwnPropertyDescriptor(
        BuilderDraftController.prototype,
        'get',
      )?.value as object;

      expect(Reflect.getMetadata(REQUIRED_ROLES, handler)).toEqual([
        'designer',
        'publisher',
        'tenant_admin',
      ]);
      expect(Reflect.getMetadata(TENANT_CONTEXT_REQUIRED, handler)).toBe(true);
      expect(Reflect.getMetadata(REQUIRED_APP_PERMISSION, handler)).toEqual({
        permission: 'app.draft.read',
        appIdParam: 'appId',
      });
    });
  });

  describe('POST :appId/drafts/:version/normalize', () => {
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

    it('requires designer or tenant_admin roles', () => {
      const handler = Object.getOwnPropertyDescriptor(
        BuilderDraftController.prototype,
        'normalize',
      )?.value as object;

      expect(Reflect.getMetadata(REQUIRED_ROLES, handler)).toEqual([
        'designer',
        'tenant_admin',
      ]);
      expect(Reflect.getMetadata(TENANT_CONTEXT_REQUIRED, handler)).toBe(true);
      expect(Reflect.getMetadata(REQUIRED_APP_PERMISSION, handler)).toEqual({
        permission: 'app.draft.write',
        appIdParam: 'appId',
      });
    });
  });

  describe('PATCH :appId/drafts/:version', () => {
    it('patches draft using verified tenant context and lockVersion', async () => {
      const response = await controller.patch(
        appId,
        '1',
        {
          lockVersion: 1,
          definition: draftDetailsResult.definition,
        },
        context,
      );

      expect(patchDraft).toHaveBeenCalledWith({
        tenantId: context.membership.tenant.id,
        applicationId: appId,
        version: 1,
        lockVersion: 1,
        definition: draftDetailsResult.definition,
        designMetadata: undefined,
        createdByMembershipId: context.membership.id,
      });

      expect(response).toEqual({
        revisionId: patchedResult.revisionId,
        revisionNo: 2,
        lockVersion: 2,
        snapshotChecksum: patchedResult.snapshotChecksum,
        createdAt: createdAt.toISOString(),
      });
    });

    it('requires designer or tenant_admin roles (publisher not allowed to edit)', () => {
      const handler = Object.getOwnPropertyDescriptor(
        BuilderDraftController.prototype,
        'patch',
      )?.value as object;

      expect(Reflect.getMetadata(REQUIRED_ROLES, handler)).toEqual([
        'designer',
        'tenant_admin',
      ]);
      expect(Reflect.getMetadata(TENANT_CONTEXT_REQUIRED, handler)).toBe(true);
      expect(Reflect.getMetadata(REQUIRED_APP_PERMISSION, handler)).toEqual({
        permission: 'app.draft.write',
        appIdParam: 'appId',
      });
    });
  });

  describe('POST :appId/drafts/:version/validate', () => {
    it('validates draft using verified tenant context', async () => {
      const response = await controller.validate(appId, '1', context);

      expect(validateDraft).toHaveBeenCalledWith(
        context.membership.tenant.id,
        appId,
        1,
      );
      expect(response).toEqual({
        valid: true,
        snapshotChecksum: 'a'.repeat(64),
        issues: [],
      });
    });

    it('requires designer, publisher, or tenant_admin roles', () => {
      const handler = Object.getOwnPropertyDescriptor(
        BuilderDraftController.prototype,
        'validate',
      )?.value as object;

      expect(Reflect.getMetadata(REQUIRED_ROLES, handler)).toEqual([
        'designer',
        'publisher',
        'tenant_admin',
      ]);
      expect(Reflect.getMetadata(TENANT_CONTEXT_REQUIRED, handler)).toBe(true);
      expect(Reflect.getMetadata(REQUIRED_APP_PERMISSION, handler)).toEqual({
        permission: 'app.draft.validate',
        appIdParam: 'appId',
      });
    });
  });
});
