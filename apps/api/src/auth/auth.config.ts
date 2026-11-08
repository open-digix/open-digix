export const OIDC_CONFIG = Symbol('OIDC_CONFIG');

export interface OidcConfig {
  issuer: string;
  audience: string;
  jwksUri: URL;
  algorithms: readonly ['RS256'];
}

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function httpUrl(name: string, value: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use http or https`);
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must not contain credentials, query, or fragment`);
  }

  return url;
}

export function loadOidcConfig(
  environment: NodeJS.ProcessEnv = process.env,
): OidcConfig {
  const issuerValue = required(environment, 'OIDC_ISSUER');
  const issuerUrl = httpUrl('OIDC_ISSUER', issuerValue);
  const audience = required(environment, 'OIDC_AUDIENCE');
  const jwksUri = httpUrl(
    'OIDC_JWKS_URI',
    required(environment, 'OIDC_JWKS_URI'),
  );

  return {
    issuer: issuerUrl.toString().replace(/\/$/, ''),
    audience,
    jwksUri,
    algorithms: ['RS256'],
  };
}
