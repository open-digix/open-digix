import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { RequireAppPermission } from '../identity/app-permission.decorator';
import { RequireRoles } from '../identity/roles.decorator';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { BuilderDraftService } from './builder-draft.service';
import type {
  BuilderApplicationDefinitionV1,
  BuilderOpenIssue,
  BuilderSourceMapping,
  BuilderValidationResult,
} from './builder.types';
import {
  parseApplicationId,
  parseDraftVersion,
  parseNormalizeDraftBody,
} from './normalize-draft.input';
import { parsePatchDraftBody } from './patch-draft.input';

export interface NormalizedDraftResponse {
  readonly revisionId: string;
  readonly revisionNo: number;
  readonly lockVersion: number;
  readonly snapshotChecksum: string;
  readonly definition: BuilderApplicationDefinitionV1;
  readonly sourceMappings: readonly BuilderSourceMapping[];
  readonly openIssues: readonly BuilderOpenIssue[];
  readonly createdAt: string;
}

export interface DraftDetailsResponse {
  readonly appId: string;
  readonly version: number;
  readonly status: string;
  readonly lockVersion: number;
  readonly revisionId: string | null;
  readonly revisionNo: number | null;
  readonly snapshotChecksum: string;
  readonly definition: BuilderApplicationDefinitionV1 | Record<string, unknown>;
  readonly sourceMappings: readonly BuilderSourceMapping[];
  readonly openIssues: readonly BuilderOpenIssue[];
  readonly createdAt: string | null;
}

export interface PatchedDraftResponse {
  readonly revisionId: string;
  readonly revisionNo: number;
  readonly lockVersion: number;
  readonly snapshotChecksum: string;
  readonly createdAt: string;
}

@Controller('v1/apps')
export class BuilderDraftController {
  constructor(private readonly draftService: BuilderDraftService) {}

  @Get(':appId/drafts/:version')
  @RequireRoles('designer', 'publisher', 'tenant_admin')
  @RequireAppPermission('app.draft.read')
  async get(
    @Param('appId') appId: string,
    @Param('version') versionParam: string,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<DraftDetailsResponse> {
    const applicationId = parseApplicationId(appId);
    const version = parseDraftVersion(versionParam);

    const draft = await this.draftService.getDraft(
      context.membership.tenant.id,
      applicationId,
      version,
    );

    return {
      appId: draft.applicationId,
      version: draft.version,
      status: draft.versionStatus,
      lockVersion: draft.lockVersion,
      revisionId: draft.revisionId,
      revisionNo: draft.revisionNo,
      snapshotChecksum: draft.snapshotChecksum,
      definition: draft.definition,
      sourceMappings: draft.sourceMappings,
      openIssues: draft.openIssues,
      createdAt: draft.createdAt ? draft.createdAt.toISOString() : null,
    };
  }

  @Post(':appId/drafts/:version/normalize')
  @HttpCode(HttpStatus.OK)
  @RequireRoles('designer', 'tenant_admin')
  @RequireAppPermission('app.draft.write')
  async normalize(
    @Param('appId') appId: string,
    @Param('version') versionParam: string,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<NormalizedDraftResponse> {
    const applicationId = parseApplicationId(appId);
    const version = parseDraftVersion(versionParam);
    const input = parseNormalizeDraftBody(body);

    const result = await this.draftService.normalizeDraft({
      tenantId: context.membership.tenant.id,
      tenantSlug: context.membership.tenant.slug,
      applicationId,
      version,
      createdByMembershipId: context.membership.id,
      sourceRevisionId: input.sourceRevisionId,
    });

    return {
      revisionId: result.revisionId,
      revisionNo: result.revisionNo,
      lockVersion: result.lockVersion,
      snapshotChecksum: result.snapshotChecksum,
      definition: result.definition,
      sourceMappings: result.sourceMappings,
      openIssues: result.openIssues,
      createdAt: result.createdAt.toISOString(),
    };
  }

  @Patch(':appId/drafts/:version')
  @RequireRoles('designer', 'tenant_admin')
  @RequireAppPermission('app.draft.write')
  async patch(
    @Param('appId') appId: string,
    @Param('version') versionParam: string,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<PatchedDraftResponse> {
    const applicationId = parseApplicationId(appId);
    const version = parseDraftVersion(versionParam);
    const input = parsePatchDraftBody(body);

    const res = await this.draftService.patchDraft({
      tenantId: context.membership.tenant.id,
      applicationId,
      version,
      lockVersion: input.lockVersion,
      definition: input.definition,
      designMetadata: input.designMetadata,
      createdByMembershipId: context.membership.id,
    });

    return {
      revisionId: res.revisionId,
      revisionNo: res.revisionNo,
      lockVersion: res.lockVersion,
      snapshotChecksum: res.snapshotChecksum,
      createdAt: res.createdAt.toISOString(),
    };
  }

  @Post(':appId/drafts/:version/validate')
  @HttpCode(HttpStatus.OK)
  @RequireRoles('designer', 'publisher', 'tenant_admin')
  @RequireAppPermission('app.draft.validate')
  async validate(
    @Param('appId') appId: string,
    @Param('version') versionParam: string,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<BuilderValidationResult> {
    const applicationId = parseApplicationId(appId);
    const version = parseDraftVersion(versionParam);

    return this.draftService.validateDraft(
      context.membership.tenant.id,
      applicationId,
      version,
    );
  }
}
