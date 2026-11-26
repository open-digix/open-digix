import { Module } from '@nestjs/common';
import { FeatureModuleRegistry } from './feature-module.registry';

@Module({
  providers: [FeatureModuleRegistry],
  exports: [FeatureModuleRegistry],
})
export class FeatureModuleModule {}
