import { Module } from '@nestjs/common';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { IdentityModule } from '../identity/identity.module';
import { InventoryController } from './inventory.controller';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';
import { StockController } from './stock.controller';

@Module({
  imports: [IdentityModule, IdempotencyModule],
  controllers: [InventoryController, StockController],
  providers: [InventoryRepository, InventoryService],
})
export class InventoryModule {}
