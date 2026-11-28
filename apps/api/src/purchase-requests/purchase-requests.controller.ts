import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { RequireAppPermission } from '../identity/app-permission.decorator';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { parseAppId } from '../identity/app-role.input';
import {
  parseCreatePurchaseRequestBody,
  parsePurchaseRequestId,
  requirePurchaseRequestIdempotencyKey,
} from './purchase-requests.input';
import { PurchaseRequestsService } from './purchase-requests.service';

@Controller('v1/apps/:appId/purchase-requests')
export class PurchaseRequestsController {
  constructor(private readonly purchaseRequests: PurchaseRequestsService) {}

  @Get(':purchaseRequestId')
  @RequireAppPermission('erp.purchase_requests.requests.read')
  get(
    @Param('appId') appId: string,
    @Param('purchaseRequestId') purchaseRequestId: string,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.purchaseRequests.get({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      purchaseRequestId: parsePurchaseRequestId(purchaseRequestId),
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireAppPermission('erp.purchase_requests.requests.create')
  create(
    @Param('appId') appId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.purchaseRequests.create({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      actorMembershipId: context.membership.id,
      idempotencyKey: requirePurchaseRequestIdempotencyKey(idempotencyKey),
      body: parseCreatePurchaseRequestBody(body),
    });
  }
}
