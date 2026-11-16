import { Module } from '@nestjs/common';
import { BuilderApplicationController } from './builder-application.controller';
import { BuilderApplicationRepository } from './builder-application.repository';
import { BuilderApplicationService } from './builder-application.service';
import { BuilderSourceController } from './builder-source.controller';
import { BuilderSourceRepository } from './builder-source.repository';
import { BuilderSourceService } from './builder-source.service';

@Module({
  controllers: [BuilderApplicationController, BuilderSourceController],
  providers: [
    BuilderApplicationRepository,
    BuilderApplicationService,
    BuilderSourceRepository,
    BuilderSourceService,
  ],
  exports: [BuilderApplicationService, BuilderSourceService],
})
export class BuilderModule {}
