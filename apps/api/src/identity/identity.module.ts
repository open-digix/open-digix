import { Module } from '@nestjs/common';
import { AppAuthorizationRepository } from './app-authorization.repository';
import { APP_AUTHORIZATION_REPOSITORY } from './app-authorization.types';
import { AppAuthorizationService } from './app-authorization.service';
import { ApplicationAclBootstrapService } from './application-acl-bootstrap.service';
import { AppRoleController } from './app-role.controller';
import { AppRoleManagementRepository } from './app-role-management.repository';
import { AppRoleManagementService } from './app-role-management.service';
import { IdentityContextRepository } from './identity-context.repository';
import { IdentityContextService } from './identity-context.service';
import { MeController } from './me.controller';

@Module({
  controllers: [MeController, AppRoleController],
  providers: [
    IdentityContextRepository,
    IdentityContextService,
    AppAuthorizationRepository,
    {
      provide: APP_AUTHORIZATION_REPOSITORY,
      useExisting: AppAuthorizationRepository,
    },
    AppAuthorizationService,
    ApplicationAclBootstrapService,
    AppRoleManagementRepository,
    AppRoleManagementService,
  ],
  exports: [
    IdentityContextService,
    AppAuthorizationService,
    ApplicationAclBootstrapService,
  ],
})
export class IdentityModule {}
