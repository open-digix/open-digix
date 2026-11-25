import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { RequireAppPermission } from '../identity/app-permission.decorator';
import { RequireRoles } from '../identity/roles.decorator';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { BuilderSourceService } from './builder-source.service';
import type { BuilderSourceSegment } from './builder.types';
import { parseCreateBuilderDescriptionBody } from './create-builder-description.input';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CreatedBuilderSourceRevisionResponse {
  readonly sourceRevisionId: string;
  readonly revisionNo: number;
  readonly segments: readonly BuilderSourceSegment[];
  readonly createdAt: string;
}

@Controller('v1/apps')
export class BuilderSourceController {
  constructor(private readonly sources: BuilderSourceService) {}

  @Post(':appId/descriptions')
  @HttpCode(HttpStatus.CREATED)
  @RequireRoles('designer', 'tenant_admin')
  @RequireAppPermission('app.source.write')
  async create(
    @Param('appId') appId: string,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<CreatedBuilderSourceRevisionResponse> {
    const applicationId = parseApplicationId(appId);
    const input = parseCreateBuilderDescriptionBody(body);
    const revision = await this.sources.createRevision({
      tenantId: context.membership.tenant.id,
      applicationId,
      createdByMembershipId: context.membership.id,
      sections: input.sections,
      fileRefs: input.fileRefs,
    });

    return {
      sourceRevisionId: revision.id,
      revisionNo: revision.revisionNo,
      segments: revision.segments,
      createdAt: revision.createdAt.toISOString(),
    };
  }
}

function parseApplicationId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_APP_ID',
        message: 'appId must be a valid UUID.',
      },
    });
  }
  return normalized;
}
