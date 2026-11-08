import type { JWTVerifyGetKey, JWTPayload } from 'jose';
import type { OidcConfig } from './auth.config';
import type { AccessTokenVerifier, AuthenticatedIdentity } from './auth.types';

type JoseModule = typeof import('jose');

function optionalString(
  payload: JWTPayload,
  claim: string,
): string | undefined {
  const value = payload[claim];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export class OidcTokenVerifier implements AccessTokenVerifier {
  private joseModule?: Promise<JoseModule>;
  private keySet?: JWTVerifyGetKey;

  constructor(
    private readonly config: OidcConfig,
    keySet?: JWTVerifyGetKey,
  ) {
    this.keySet = keySet;
  }

  async verify(token: string): Promise<AuthenticatedIdentity> {
    const jose = await this.getJoseModule();
    const keySet = this.getKeySet(jose);
    const { payload } = await jose.jwtVerify(token, keySet, {
      issuer: this.config.issuer,
      audience: this.config.audience,
      algorithms: [...this.config.algorithms],
      requiredClaims: ['iss', 'sub', 'aud', 'iat', 'exp'],
      clockTolerance: 5,
    });

    if (
      typeof payload.iss !== 'string' ||
      typeof payload.sub !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      (typeof payload.aud !== 'string' && !Array.isArray(payload.aud))
    ) {
      throw new Error('Access token is missing required identity claims');
    }

    return {
      issuer: payload.iss,
      subject: payload.sub,
      audience: Array.isArray(payload.aud) ? payload.aud : [payload.aud],
      issuedAt: payload.iat,
      expiresAt: payload.exp,
      tokenId: optionalString(payload, 'jti'),
      username: optionalString(payload, 'preferred_username'),
      email: optionalString(payload, 'email'),
      displayName: optionalString(payload, 'name'),
    };
  }

  private getJoseModule(): Promise<JoseModule> {
    this.joseModule ??= import('jose');
    return this.joseModule;
  }

  private getKeySet(jose: JoseModule): JWTVerifyGetKey {
    this.keySet ??= jose.createRemoteJWKSet(this.config.jwksUri, {
      timeoutDuration: 5_000,
      cooldownDuration: 30_000,
      cacheMaxAge: 600_000,
    });

    return this.keySet;
  }
}
