import { Module } from '@nestjs/common';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { IdentityModule } from '../identity/identity.module';
import { OptimisticVersionModule } from '../versioning/optimistic-version.module';
import { MaterialsController } from './materials.controller';
import { MaterialsRepository } from './materials.repository';
import { MaterialsService } from './materials.service';

@Module({
  imports: [IdentityModule, IdempotencyModule, OptimisticVersionModule],
  controllers: [MaterialsController],
  providers: [MaterialsRepository, MaterialsService],
})
export class MaterialsModule {}
