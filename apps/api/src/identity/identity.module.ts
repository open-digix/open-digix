import { Module } from '@nestjs/common';
import { IdentityContextRepository } from './identity-context.repository';
import { IdentityContextService } from './identity-context.service';
import { MeController } from './me.controller';

@Module({
  controllers: [MeController],
  providers: [IdentityContextRepository, IdentityContextService],
  exports: [IdentityContextService],
})
export class IdentityModule {}
