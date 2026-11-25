export interface KeycloakAdminClientConfig {
  readonly internalUrl: URL;
  readonly realm: string;
  readonly adminUsername: string;
  readonly adminPassword: string;
}

export interface CreateKeycloakUserInput {
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly password: string;
}

export type KeycloakUserConflictField = 'username' | 'email';

export class KeycloakUserConflictError extends Error {
  constructor(readonly field: KeycloakUserConflictField) {
    super(`Keycloak user already exists with the same ${field}.`);
    this.name = 'KeycloakUserConflictError';
  }
}

export class KeycloakAdminUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeycloakAdminUnavailableError';
  }
}

interface KeycloakTokenResponse {
  readonly access_token?: string;
}

export class KeycloakAdminClient {
  constructor(
    private readonly config: KeycloakAdminClientConfig,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async createUser(input: CreateKeycloakUserInput): Promise<string> {
    const accessToken = await this.getAdminToken();
    const userUrl = new URL(
      `/admin/realms/${encodeURIComponent(this.config.realm)}/users`,
      this.config.internalUrl,
    );
    let response: Response;
    try {
      response = await this.fetchImplementation(userUrl, {
        method: 'POST',
        headers: this.jsonHeaders(accessToken),
        body: JSON.stringify({
          username: input.username,
          enabled: true,
          email: input.email,
          emailVerified: false,
          firstName: input.firstName,
          lastName: input.lastName,
          credentials: [
            {
              type: 'password',
              value: input.password,
              temporary: false,
            },
          ],
        }),
      });
    } catch {
      throw new KeycloakAdminUnavailableError(
        'Keycloak user creation request failed.',
      );
    }

    if (response.status === 409) {
      throw new KeycloakUserConflictError(
        keycloakConflictField(await response.text()),
      );
    }

    if (response.status !== 201) {
      throw new KeycloakAdminUnavailableError(
        `Keycloak user creation failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const location = response.headers.get('location');
    const subject = location?.split('/').filter(Boolean).at(-1);
    if (!subject) {
      throw new KeycloakAdminUnavailableError(
        'Keycloak user creation returned no user location',
      );
    }
    return subject;
  }

  async deleteUser(subject: string): Promise<void> {
    const accessToken = await this.getAdminToken();
    const userUrl = new URL(
      `/admin/realms/${encodeURIComponent(this.config.realm)}/users/${encodeURIComponent(subject)}`,
      this.config.internalUrl,
    );
    let response: Response;
    try {
      response = await this.fetchImplementation(userUrl, {
        method: 'DELETE',
        headers: this.jsonHeaders(accessToken),
      });
    } catch {
      throw new KeycloakAdminUnavailableError(
        'Keycloak user deletion request failed.',
      );
    }

    if (!response.ok) {
      throw new KeycloakAdminUnavailableError(
        `Keycloak user deletion failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }
  }

  private async getAdminToken(): Promise<string> {
    const tokenUrl = new URL(
      '/realms/master/protocol/openid-connect/token',
      this.config.internalUrl,
    );
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: this.config.adminUsername,
      password: this.config.adminPassword,
    });
    let response: Response;
    try {
      response = await this.fetchImplementation(tokenUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      throw new KeycloakAdminUnavailableError(
        'Keycloak admin login request failed.',
      );
    }

    if (!response.ok) {
      throw new KeycloakAdminUnavailableError(
        `Keycloak admin login failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const token = (await response.json()) as KeycloakTokenResponse;
    if (!token.access_token) {
      throw new KeycloakAdminUnavailableError(
        'Keycloak admin login returned no access token',
      );
    }
    return token.access_token;
  }

  private jsonHeaders(accessToken: string): Record<string, string> {
    return {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };
  }
}

function keycloakConflictField(
  responseBody: string,
): KeycloakUserConflictField {
  return /email/i.test(responseBody) ? 'email' : 'username';
}
