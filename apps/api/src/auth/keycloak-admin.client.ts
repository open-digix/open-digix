export interface KeycloakAdminClientConfig {
  readonly internalUrl: URL;
  readonly realm: string;
  readonly adminUsername: string;
  readonly adminPassword: string;
  readonly requestTimeoutMs: number;
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
    const response = await this.fetchWithTimeout(
      userUrl,
      {
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
      },
      'Keycloak user creation',
    );

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
    const response = await this.fetchWithTimeout(
      userUrl,
      {
        method: 'DELETE',
        headers: this.jsonHeaders(accessToken),
      },
      'Keycloak user deletion',
    );

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
    const response = await this.fetchWithTimeout(
      tokenUrl,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      },
      'Keycloak admin login',
    );

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

  private async fetchWithTimeout(
    input: URL,
    init: RequestInit,
    operation: string,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.requestTimeoutMs,
    );

    try {
      return await this.fetchImplementation(input, {
        ...init,
        signal: controller.signal,
      });
    } catch {
      const suffix = controller.signal.aborted ? 'timed out' : 'request failed';
      throw new KeycloakAdminUnavailableError(`${operation} ${suffix}.`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function keycloakConflictField(
  responseBody: string,
): KeycloakUserConflictField {
  return /email/i.test(responseBody) ? 'email' : 'username';
}
