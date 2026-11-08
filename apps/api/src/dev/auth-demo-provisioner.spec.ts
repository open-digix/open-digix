import {
  loadAuthDemoConfig,
  provisionKeycloakDemoUser,
  type AuthDemoConfig,
} from './auth-demo-provisioner';

describe('auth demo provisioner', () => {
  const environment: NodeJS.ProcessEnv = {
    KEYCLOAK_INTERNAL_URL: 'http://keycloak:8080',
    KEYCLOAK_REALM: 'digix',
    KEYCLOAK_ADMIN: 'admin',
    KEYCLOAK_ADMIN_PASSWORD: 'local-admin-password',
    OIDC_ISSUER: 'http://localhost:8080/realms/digix',
    DEMO_USER_USERNAME: 'dung.demo',
    DEMO_USER_PASSWORD: 'local-demo-password',
    DEMO_USER_EMAIL: 'dung.demo@example.test',
    DEMO_USER_DISPLAY_NAME: 'Dung Demo',
    DEMO_TENANT_SLUG: 'tenant_alpha',
    DEMO_TENANT_NAME: 'Tenant Alpha',
  };

  const config: AuthDemoConfig = loadAuthDemoConfig(environment);

  it('loads an explicit synthetic user and tenant configuration', () => {
    expect(config).toEqual({
      keycloakInternalUrl: new URL('http://keycloak:8080'),
      keycloakRealm: 'digix',
      keycloakAdmin: 'admin',
      keycloakAdminPassword: 'local-admin-password',
      issuer: 'http://localhost:8080/realms/digix',
      username: 'dung.demo',
      password: 'local-demo-password',
      email: 'dung.demo@example.test',
      displayName: 'Dung Demo',
      tenantSlug: 'tenant_alpha',
      tenantName: 'Tenant Alpha',
    });
  });

  it('rejects a short demo password', () => {
    expect(() =>
      loadAuthDemoConfig({
        ...environment,
        DEMO_USER_PASSWORD: 'too-short',
      }),
    ).toThrow('DEMO_USER_PASSWORD must contain at least 12 characters');
  });

  it('rejects an invalid tenant slug', () => {
    expect(() =>
      loadAuthDemoConfig({
        ...environment,
        DEMO_TENANT_SLUG: 'Tenant Alpha',
      }),
    ).toThrow('DEMO_TENANT_SLUG has an invalid format');
  });

  it('updates an existing Keycloak user and resets its synthetic password', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        Response.json({ access_token: 'admin-access-token' }),
      )
      .mockResolvedValueOnce(
        Response.json([{ id: 'keycloak-subject', username: 'dung.demo' }]),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      provisionKeycloakDemoUser(config, fetchMock as unknown as typeof fetch),
    ).resolves.toBe('keycloak-subject');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      expect.any(URL),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          type: 'password',
          value: 'local-demo-password',
          temporary: false,
        }),
      }),
    );
  });

  it('creates the Keycloak user when it does not exist', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        Response.json({ access_token: 'admin-access-token' }),
      )
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(
        new Response(null, {
          status: 201,
          headers: {
            location:
              'http://keycloak:8080/admin/realms/digix/users/new-keycloak-subject',
          },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      provisionKeycloakDemoUser(config, fetchMock as unknown as typeof fetch),
    ).resolves.toBe('new-keycloak-subject');
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.any(URL),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
