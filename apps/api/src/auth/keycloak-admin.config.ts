import type { KeycloakAdminClientConfig } from './keycloak-admin.client';

export const KEYCLOAK_ADMIN_CONFIG = Symbol('KEYCLOAK_ADMIN_CONFIG');

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const rawValue = environment[name];
  const value = rawValue?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }
  if (rawValue !== value) {
    throw new Error(`${name} must not contain leading or trailing whitespace`);
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
  if (url.pathname !== '/' || url.port === '') {
    throw new Error(`${name} must contain only the Keycloak server origin`);
  }
  return url;
}

export function loadKeycloakAdminClientConfig(
  environment: NodeJS.ProcessEnv = process.env,
): KeycloakAdminClientConfig {
  return {
    internalUrl: httpUrl(
      'KEYCLOAK_INTERNAL_URL',
      required(environment, 'KEYCLOAK_INTERNAL_URL'),
    ),
    realm: required(environment, 'KEYCLOAK_REALM'),
    adminUsername: required(environment, 'KEYCLOAK_ADMIN'),
    adminPassword: required(environment, 'KEYCLOAK_ADMIN_PASSWORD'),
  };
}
