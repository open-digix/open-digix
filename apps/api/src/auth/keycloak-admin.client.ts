export interface KeycloakAdminClientConfig {
  readonly internalUrl: URL;
  readonly realm: string;
  readonly adminUsername: string;
  readonly adminPassword: string;
}

export interface CreateKeycloakUserInput {
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
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
    const response = await this.fetchImplementation(userUrl, {
      method: 'POST',
      headers: this.jsonHeaders(accessToken),
      body: JSON.stringify({
        username: input.username,
        enabled: true,
        email: input.email,
        emailVerified: false,
        ...keycloakPersonName(input.displayName),
        credentials: [
          {
            type: 'password',
            value: input.password,
            temporary: false,
          },
        ],
      }),
    });

    if (response.status !== 201) {
      throw new Error(
        `Keycloak user creation failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const location = response.headers.get('location');
    const subject = location?.split('/').filter(Boolean).at(-1);
    if (!subject) {
      throw new Error('Keycloak user creation returned no user location');
    }
    return subject;
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
    const response = await this.fetchImplementation(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Keycloak admin login failed with HTTP ${response.status}: ${await response.text()}`,
      );
    }

    const token = (await response.json()) as KeycloakTokenResponse;
    if (!token.access_token) {
      throw new Error('Keycloak admin login returned no access token');
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

function keycloakPersonName(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const [firstName, ...remainingNames] = displayName.trim().split(/\s+/);
  return {
    firstName,
    lastName: remainingNames.join(' ') || 'User',
  };
}
