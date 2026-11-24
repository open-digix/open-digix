import { loadKeycloakAdminClientConfig } from './keycloak-admin.config';

describe('loadKeycloakAdminClientConfig', () => {
  const environment = {
    KEYCLOAK_INTERNAL_URL: 'http://keycloak:8080',
    KEYCLOAK_REALM: 'digix',
    KEYCLOAK_ADMIN: 'admin',
    KEYCLOAK_ADMIN_PASSWORD: 'admin-password',
  };

  it('loads the Keycloak Admin API configuration', () => {
    expect(loadKeycloakAdminClientConfig(environment)).toEqual({
      internalUrl: new URL('http://keycloak:8080'),
      realm: 'digix',
      adminUsername: 'admin',
      adminPassword: 'admin-password',
    });
  });

  it.each([
    'KEYCLOAK_INTERNAL_URL',
    'KEYCLOAK_REALM',
    'KEYCLOAK_ADMIN',
    'KEYCLOAK_ADMIN_PASSWORD',
  ])('requires %s', (name) => {
    const missing = { ...environment };
    delete missing[name as keyof typeof missing];

    expect(() => loadKeycloakAdminClientConfig(missing)).toThrow(
      `${name} is required`,
    );
  });

  it('rejects a Keycloak URL with a path', () => {
    expect(() =>
      loadKeycloakAdminClientConfig({
        ...environment,
        KEYCLOAK_INTERNAL_URL: 'http://keycloak:8080/base',
      }),
    ).toThrow(
      'KEYCLOAK_INTERNAL_URL must contain only the Keycloak server origin',
    );
  });
});
