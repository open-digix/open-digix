import { Module } from '@nestjs/common';
import {
  KEYCLOAK_ADMIN_CONFIG,
  loadKeycloakAdminClientConfig,
} from '../auth/keycloak-admin.config';
import {
  KeycloakAdminClient,
  type KeycloakAdminClientConfig,
} from '../auth/keycloak-admin.client';
import { AuthModule } from '../auth/auth.module';
import { OIDC_CONFIG, type OidcConfig } from '../auth/auth.config';
import { TenantAdminRepository } from './tenant-admin.repository';
import {
  KEYCLOAK_ADMIN_CLIENT,
  TENANT_ADMIN_IDENTITY_ISSUER,
  TENANT_ADMIN_REPOSITORY,
  TenantAdminRegistrationService,
} from './tenant-admin-registration.service';

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: KEYCLOAK_ADMIN_CONFIG,
      useFactory: loadKeycloakAdminClientConfig,
    },
    {
      provide: KEYCLOAK_ADMIN_CLIENT,
      inject: [KEYCLOAK_ADMIN_CONFIG],
      useFactory: (config: KeycloakAdminClientConfig) =>
        new KeycloakAdminClient(config),
    },
    TenantAdminRepository,
    {
      provide: TENANT_ADMIN_REPOSITORY,
      useExisting: TenantAdminRepository,
    },
    {
      provide: TENANT_ADMIN_IDENTITY_ISSUER,
      inject: [OIDC_CONFIG],
      useFactory: (config: OidcConfig) => config.issuer,
    },
    TenantAdminRegistrationService,
  ],
  exports: [TenantAdminRegistrationService],
})
export class OnboardingModule {}
