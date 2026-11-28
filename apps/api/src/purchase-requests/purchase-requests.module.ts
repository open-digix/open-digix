import { Module } from '@nestjs/common';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { IdentityModule } from '../identity/identity.module';
import { OptimisticVersionModule } from '../versioning/optimistic-version.module';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PurchaseRequestsRepository } from './purchase-requests.repository';
import { PurchaseRequestsService } from './purchase-requests.service';

@Module({
  imports: [IdentityModule, IdempotencyModule, OptimisticVersionModule],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsRepository, PurchaseRequestsService],
})
export class PurchaseRequestsModule {}
