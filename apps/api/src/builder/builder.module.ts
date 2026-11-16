import { Module } from '@nestjs/common';
import { BuilderApplicationController } from './builder-application.controller';
import { BuilderApplicationRepository } from './builder-application.repository';
import { BuilderApplicationService } from './builder-application.service';

@Module({
  controllers: [BuilderApplicationController],
  providers: [BuilderApplicationRepository, BuilderApplicationService],
  exports: [BuilderApplicationService],
})
export class BuilderModule {}
