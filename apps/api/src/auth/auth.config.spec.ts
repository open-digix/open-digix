import { loadOidcConfig } from './auth.config';

describe('loadOidcConfig', () => {
  const validEnvironment: NodeJS.ProcessEnv = {
    OIDC_ISSUER: 'http://localhost:8080/realms/digix',
    OIDC_AUDIENCE: 'digix-api',
    OIDC_JWKS_URI:
      'http://keycloak:8080/realms/digix/protocol/openid-connect/certs',
  };

  it('loads an explicit issuer, audience, JWKS URI, and algorithm allowlist', () => {
    expect(loadOidcConfig(validEnvironment)).toEqual({
      issuer: 'http://localhost:8080/realms/digix',
      audience: 'digix-api',
      jwksUri: new URL(
        'http://keycloak:8080/realms/digix/protocol/openid-connect/certs',
      ),
      algorithms: ['RS256'],
    });
  });

  it.each(['OIDC_ISSUER', 'OIDC_AUDIENCE', 'OIDC_JWKS_URI'])(
    'fails fast when %s is missing',
    (name) => {
      const environment = { ...validEnvironment };
      delete environment[name];

      expect(() => loadOidcConfig(environment)).toThrow(`${name} is required`);
    },
  );

  it('rejects a non-HTTP JWKS endpoint', () => {
    expect(() =>
      loadOidcConfig({
        ...validEnvironment,
        OIDC_JWKS_URI: 'file:///tmp/jwks.json',
      }),
    ).toThrow('OIDC_JWKS_URI must use http or https');
  });

  it('rejects credentials embedded in the issuer URL', () => {
    expect(() =>
      loadOidcConfig({
        ...validEnvironment,
        OIDC_ISSUER: 'http://user:password@localhost:8080/realms/digix',
      }),
    ).toThrow('OIDC_ISSUER must not contain credentials, query, or fragment');
  });
});
