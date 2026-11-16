import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { RequireRoles } from '../identity/roles.decorator';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { BuilderApplicationService } from './builder-application.service';
import { parseCreateBuilderApplicationBody } from './create-builder-application.input';

export interface CreatedBuilderApplicationResponse {
  readonly appId: string;
  readonly appKey: string;
  readonly name: string;
  readonly status: 'draft';
  readonly version: number;
  readonly versionStatus: 'draft';
  readonly lockVersion: number;
}

@Controller('v1/apps')
export class BuilderApplicationController {
  constructor(private readonly applications: BuilderApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRoles('designer', 'tenant_admin')
  async create(
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<CreatedBuilderApplicationResponse> {
    const input = parseCreateBuilderApplicationBody(body);
    if (input.templateKey) {
      throw new BadRequestException({
        error: {
          code: 'APP_TEMPLATE_NOT_AVAILABLE',
          message: `Application template '${input.templateKey}' is not available yet.`,
        },
      });
    }

    const created = await this.applications.createBlankDraft({
      tenantId: context.membership.tenant.id,
      createdByMembershipId: context.membership.id,
      appKey: input.appKey,
      name: input.name,
      goal: input.goal,
      departmentRefs: input.departmentRefs,
    });

    return {
      appId: created.appId,
      appKey: created.appKey,
      name: created.name,
      status: created.status,
      version: created.version,
      versionStatus: created.versionStatus,
      lockVersion: created.lockVersion,
    };
  }
}
