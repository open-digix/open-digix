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
import { requirePurchaseRequestIdempotencyKey } from '../purchase-requests/purchase-requests.input';
import {
  parseInventoryReceiptId,
  parseReceiveInventoryBody,
} from './inventory.input';
import { InventoryService } from './inventory.service';

@Controller('v1/apps/:appId/receipts')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireAppPermission('erp.inventory.receipts.receive')
  receive(
    @Param('appId') appId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ) {
    const parsed = parseReceiveInventoryBody(body);
    return this.inventory.receive({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      actorMembershipId: context.membership.id,
      idempotencyKey: requirePurchaseRequestIdempotencyKey(idempotencyKey),
      ...parsed,
    });
  }

  @Get(':receiptId')
  @RequireAppPermission('erp.inventory.receipts.read')
  get(
    @Param('appId') appId: string,
    @Param('receiptId') receiptId: string,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.inventory.get({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      receiptId: parseInventoryReceiptId(receiptId),
    });
  }
}
