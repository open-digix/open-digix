import { Module } from '@nestjs/common';
import { AppV2Validator } from './app-v2.validator';

@Module({
  providers: [AppV2Validator],
  exports: [AppV2Validator],
})
export class ValidatorModule {}
