import { Module } from '@nestjs/common';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { IdentityModule } from '../identity/identity.module';
import { OptimisticVersionModule } from '../versioning/optimistic-version.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { PurchaseRequestWorkflowRepository } from './purchase-request-workflow.repository';
import { PurchaseRequestWorkflowService } from './purchase-request-workflow.service';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PurchaseRequestTasksController } from './purchase-request-tasks.controller';
import { PurchaseRequestsRepository } from './purchase-requests.repository';
import { PurchaseRequestsService } from './purchase-requests.service';

@Module({
  imports: [
    IdentityModule,
    IdempotencyModule,
    OptimisticVersionModule,
    WorkflowModule,
  ],
  controllers: [PurchaseRequestsController, PurchaseRequestTasksController],
  providers: [
    PurchaseRequestsRepository,
    PurchaseRequestsService,
    PurchaseRequestWorkflowRepository,
    PurchaseRequestWorkflowService,
  ],
})
export class PurchaseRequestsModule {}
