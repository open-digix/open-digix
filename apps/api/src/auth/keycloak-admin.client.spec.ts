import {
  KeycloakAdminClient,
  type KeycloakAdminClientConfig,
} from './keycloak-admin.client';

describe('KeycloakAdminClient', () => {
  const config: KeycloakAdminClientConfig = {
    internalUrl: new URL('http://keycloak:8080'),
    realm: 'digix',
    adminUsername: 'admin',
    adminPassword: 'admin-password',
  };
  const user = {
    username: 'admin@example.com',
    email: 'admin@example.com',
    displayName: 'Nguyen Van A',
    password: 'correct-horse-battery',
  };

  it('creates a Keycloak user with the admin access token', async () => {
    const fetchImplementation = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetchImplementation
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'admin-token' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 201,
          headers: {
            location:
              'http://keycloak:8080/admin/realms/digix/users/keycloak-subject',
          },
        }),
      );
    const client = new KeycloakAdminClient(config, fetchImplementation);

    await expect(client.createUser(user)).resolves.toBe('keycloak-subject');

    expect(fetchImplementation).toHaveBeenNthCalledWith(
      1,
      new URL(
        'http://keycloak:8080/realms/master/protocol/openid-connect/token',
      ),
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }),
    );
    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      new URL('http://keycloak:8080/admin/realms/digix/users'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'content-type': 'application/json',
        },
      }),
    );
    const createRequest = fetchImplementation.mock.calls[1]?.[1];
    expect(createRequest?.body).toContain('"username":"admin@example.com"');
  });

  it('fails when Keycloak admin login returns no token', async () => {
    const fetchImplementation = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetchImplementation.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const client = new KeycloakAdminClient(config, fetchImplementation);

    await expect(client.createUser(user)).rejects.toThrow(
      'Keycloak admin login returned no access token',
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it('fails when Keycloak does not return the created user location', async () => {
    const fetchImplementation = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetchImplementation
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'admin-token' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    const client = new KeycloakAdminClient(config, fetchImplementation);

    await expect(client.createUser(user)).rejects.toThrow(
      'Keycloak user creation returned no user location',
    );
  });

  it('deletes a Keycloak user with the admin access token', async () => {
    const fetchImplementation = jest.fn() as jest.MockedFunction<typeof fetch>;
    fetchImplementation
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'admin-token' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = new KeycloakAdminClient(config, fetchImplementation);

    await expect(
      client.deleteUser('keycloak-subject'),
    ).resolves.toBeUndefined();

    expect(fetchImplementation).toHaveBeenNthCalledWith(
      2,
      new URL('http://keycloak:8080/admin/realms/digix/users/keycloak-subject'),
      {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer admin-token',
          'content-type': 'application/json',
        },
      },
    );
  });
});
