import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { RequireAppPermission } from '../identity/app-permission.decorator';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { parseAppId } from '../identity/app-role.input';
import {
  parseCreateMaterialBody,
  parseListMaterialsQuery,
  parseMaterialId,
  parseUpdateMaterialNoteBody,
  requireIdempotencyKey,
} from './materials.input';
import { MaterialsService } from './materials.service';

@Controller('v1/apps/:appId/materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  @RequireAppPermission('erp.materials.materials.read')
  list(
    @Param('appId') appId: string,
    @Query() query: Record<string, unknown>,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.materials.list({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      limit: parseListMaterialsQuery(query).limit,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireAppPermission('erp.materials.materials.create')
  create(
    @Param('appId') appId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.materials.create({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      actorMembershipId: context.membership.id,
      idempotencyKey: requireIdempotencyKey(idempotencyKey),
      body: parseCreateMaterialBody(body),
    });
  }

  @Get(':materialId')
  @RequireAppPermission('erp.materials.materials.read')
  get(
    @Param('appId') appId: string,
    @Param('materialId') materialId: string,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.materials.get({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      materialId: parseMaterialId(materialId),
    });
  }

  @Post(':materialId/actions/update_note')
  @HttpCode(HttpStatus.OK)
  @RequireAppPermission('erp.materials.materials.update_note')
  updateNote(
    @Param('appId') appId: string,
    @Param('materialId') materialId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.materials.updateNote({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      actorMembershipId: context.membership.id,
      materialId: parseMaterialId(materialId),
      idempotencyKey: requireIdempotencyKey(idempotencyKey),
      body: parseUpdateMaterialNoteBody(body),
    });
  }
}
