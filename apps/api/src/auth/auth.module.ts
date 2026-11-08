import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { OIDC_CONFIG, loadOidcConfig, type OidcConfig } from './auth.config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OidcTokenVerifier } from './oidc-token.verifier';

@Module({
  providers: [
    {
      provide: OIDC_CONFIG,
      useFactory: loadOidcConfig,
    },
    {
      provide: OidcTokenVerifier,
      inject: [OIDC_CONFIG],
      useFactory: (config: OidcConfig) => new OidcTokenVerifier(config),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [OIDC_CONFIG, OidcTokenVerifier],
})
export class AuthModule {}
