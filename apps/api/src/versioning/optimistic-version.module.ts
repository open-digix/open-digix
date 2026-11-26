import { Module } from '@nestjs/common';
import { OptimisticVersionService } from './optimistic-version.service';

@Module({
  providers: [OptimisticVersionService],
  exports: [OptimisticVersionService],
})
export class OptimisticVersionModule {}
