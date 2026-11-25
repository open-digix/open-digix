import { Module } from '@nestjs/common';
import { AppAuthorizationRepository } from './app-authorization.repository';
import { APP_AUTHORIZATION_REPOSITORY } from './app-authorization.types';
import { AppAuthorizationService } from './app-authorization.service';
import { IdentityContextRepository } from './identity-context.repository';
import { IdentityContextService } from './identity-context.service';
import { MeController } from './me.controller';

@Module({
  controllers: [MeController],
  providers: [
    IdentityContextRepository,
    IdentityContextService,
    AppAuthorizationRepository,
    {
      provide: APP_AUTHORIZATION_REPOSITORY,
      useExisting: AppAuthorizationRepository,
    },
    AppAuthorizationService,
  ],
  exports: [IdentityContextService, AppAuthorizationService],
})
export class IdentityModule {}
