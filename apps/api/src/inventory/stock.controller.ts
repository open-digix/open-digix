import { Controller, Get, Param, Query } from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { RequireAppPermission } from '../identity/app-permission.decorator';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { parseAppId } from '../identity/app-role.input';
import {
  parseOptionalMaterialId,
  parseStockCursor,
  parseStockLimit,
} from './inventory.input';
import { InventoryService } from './inventory.service';

@Controller('v1/apps/:appId/stock')
export class StockController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @RequireAppPermission('erp.inventory.stock.read')
  list(
    @Param('appId') appId: string,
    @Query() query: Record<string, string | undefined>,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.inventory.listStock({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      limit: parseStockLimit(query.limit),
      materialId: parseOptionalMaterialId(query.materialId),
      cursor: parseStockCursor(query.cursor),
    });
  }
}
