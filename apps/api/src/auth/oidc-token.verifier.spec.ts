import type { JWK, JWTVerifyGetKey } from 'jose';
import type { OidcConfig } from './auth.config';
import { OidcTokenVerifier } from './oidc-token.verifier';

describe('OidcTokenVerifier', () => {
  const config: OidcConfig = {
    issuer: 'https://auth.example.test/realms/digix',
    audience: 'digix-api',
    jwksUri: new URL('https://auth.example.test/realms/digix/certs'),
    algorithms: ['RS256'],
  };

  let jose: typeof import('jose');
  let privateKey: CryptoKey;
  let keySet: JWTVerifyGetKey;

  beforeAll(async () => {
    jose = await import('jose');
    const keys = await jose.generateKeyPair('RS256');
    privateKey = keys.privateKey;
    const publicJwk: JWK = await jose.exportJWK(keys.publicKey);
    publicJwk.kid = 'test-key';
    publicJwk.alg = 'RS256';
    keySet = jose.createLocalJWKSet({ keys: [publicJwk] });
  });

  async function token(overrides?: {
    audience?: string;
    issuer?: string;
    subject?: string;
  }): Promise<string> {
    let builder = new jose.SignJWT({
      preferred_username: 'dung',
      email: 'dung@example.test',
      name: 'Dung',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })
      .setIssuer(overrides?.issuer ?? config.issuer)
      .setAudience(overrides?.audience ?? config.audience)
      .setIssuedAt()
      .setExpirationTime('5m');

    if (overrides?.subject !== '') {
      builder = builder.setSubject(overrides?.subject ?? 'identity-subject');
    }

    return builder.sign(privateKey);
  }

  it('verifies signature and required OIDC access-token claims', async () => {
    const verifier = new OidcTokenVerifier(config, keySet);

    await expect(verifier.verify(await token())).resolves.toMatchObject({
      issuer: config.issuer,
      subject: 'identity-subject',
      audience: ['digix-api'],
      username: 'dung',
      email: 'dung@example.test',
      displayName: 'Dung',
    });
  });

  it('rejects a token issued for another audience', async () => {
    const verifier = new OidcTokenVerifier(config, keySet);

    await expect(
      verifier.verify(await token({ audience: 'another-api' })),
    ).rejects.toThrow();
  });

  it('rejects a token from another issuer', async () => {
    const verifier = new OidcTokenVerifier(config, keySet);

    await expect(
      verifier.verify(
        await token({ issuer: 'https://attacker.example.test/realms/digix' }),
      ),
    ).rejects.toThrow();
  });

  it('rejects a token without a subject', async () => {
    const verifier = new OidcTokenVerifier(config, keySet);

    await expect(
      verifier.verify(await token({ subject: '' })),
    ).rejects.toThrow();
  });
});
