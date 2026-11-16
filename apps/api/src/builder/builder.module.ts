import { Module } from '@nestjs/common';
import { BuilderApplicationController } from './builder-application.controller';
import { BuilderApplicationRepository } from './builder-application.repository';
import { BuilderApplicationService } from './builder-application.service';
import { BuilderDraftController } from './builder-draft.controller';
import { BuilderDraftRepository } from './builder-draft.repository';
import { BuilderDraftService } from './builder-draft.service';
import { BuilderManifestSchemaValidator } from './builder-manifest-schema.validator';
import { BuilderSemanticValidator } from './builder-semantic.validator';
import { BuilderSourceController } from './builder-source.controller';
import { BuilderSourceNormalizer } from './builder-source.normalizer';
import { BuilderSourceRepository } from './builder-source.repository';
import { BuilderSourceService } from './builder-source.service';

@Module({
  controllers: [
    BuilderApplicationController,
    BuilderSourceController,
    BuilderDraftController,
  ],
  providers: [
    BuilderApplicationRepository,
    BuilderApplicationService,
    BuilderSourceRepository,
    BuilderSourceService,
    BuilderDraftRepository,
    BuilderDraftService,
    BuilderSourceNormalizer,
    BuilderManifestSchemaValidator,
    BuilderSemanticValidator,
  ],
  exports: [
    BuilderApplicationService,
    BuilderSourceService,
    BuilderDraftService,
  ],
})
export class BuilderModule {}
