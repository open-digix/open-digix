import { Module } from '@nestjs/common';
import { OIDC_CONFIG, loadOidcConfig, type OidcConfig } from './auth.config';
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
  ],
  exports: [OIDC_CONFIG, OidcTokenVerifier],
})
export class AuthModule {}
