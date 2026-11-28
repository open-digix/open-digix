import { Controller, Get, Param } from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { RequireAppPermission } from '../identity/app-permission.decorator';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { parseAppId } from '../identity/app-role.input';
import { PurchaseRequestsService } from './purchase-requests.service';

@Controller('v1/apps/:appId/workflow-tasks')
export class PurchaseRequestTasksController {
  constructor(private readonly purchaseRequests: PurchaseRequestsService) {}

  @Get()
  @RequireAppPermission('erp.purchase_requests.requests.approve')
  list(
    @Param('appId') appId: string,
    @CurrentTenantContext() context: TenantContext,
  ) {
    return this.purchaseRequests.listTasks({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appId),
      membershipId: context.membership.id,
    });
  }
}
