import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { RequireRoles } from '../identity/roles.decorator';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { BuilderDraftService } from './builder-draft.service';
import type {
  BuilderApplicationDefinitionV1,
  BuilderOpenIssue,
  BuilderSourceMapping,
} from './builder.types';
import {
  parseApplicationId,
  parseDraftVersion,
  parseNormalizeDraftBody,
} from './normalize-draft.input';

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

@Controller('v1/apps')
export class BuilderDraftController {
  constructor(private readonly draftService: BuilderDraftService) {}

  @Post(':appId/drafts/:version/normalize')
  @HttpCode(HttpStatus.OK)
  @RequireRoles('designer', 'tenant_admin')
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
}
