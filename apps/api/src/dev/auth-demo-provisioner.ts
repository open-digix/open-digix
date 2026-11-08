import { Pool, type PoolClient } from 'pg';
import { getDatabaseConfig } from '../database/database.config';

export interface AuthDemoConfig {
  keycloakInternalUrl: URL;
  keycloakRealm: string;
  keycloakAdmin: string;
  keycloakAdminPassword: string;
  issuer: string;
  username: string;
  password: string;
  email: string;
  displayName: string;
  tenantSlug: string;
  tenantName: string;
}

export interface AuthDemoResult {
  keycloakSubject: string;
  identityUserId: string;
  tenantId: string;
  membershipId: string;
  roles: string[];
}

interface KeycloakUser {
  id: string;
  username: string;
}

type QueryClient = Pick<PoolClient, 'query'>;

const TENANT_SLUG_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;

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

  return url;
}

export function loadAuthDemoConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AuthDemoConfig {
  const password = required(environment, 'DEMO_USER_PASSWORD');
  const tenantSlug = required(environment, 'DEMO_TENANT_SLUG');

  if (password.length < 12) {
    throw new Error('DEMO_USER_PASSWORD must contain at least 12 characters');
  }
  if (!TENANT_SLUG_PATTERN.test(tenantSlug)) {
    throw new Error('DEMO_TENANT_SLUG has an invalid format');
  }

  return {
    keycloakInternalUrl: httpUrl(
      'KEYCLOAK_INTERNAL_URL',
      required(environment, 'KEYCLOAK_INTERNAL_URL'),
    ),
    keycloakRealm: required(environment, 'KEYCLOAK_REALM'),
    keycloakAdmin: required(environment, 'KEYCLOAK_ADMIN'),
    keycloakAdminPassword: required(environment, 'KEYCLOAK_ADMIN_PASSWORD'),
    issuer: required(environment, 'OIDC_ISSUER').replace(/\/$/, ''),
    username: required(environment, 'DEMO_USER_USERNAME'),
    password,
    email: required(environment, 'DEMO_USER_EMAIL'),
    displayName: required(environment, 'DEMO_USER_DISPLAY_NAME'),
    tenantSlug,
    tenantName: required(environment, 'DEMO_TENANT_NAME'),
  };
}

async function responseJson<T>(response: Response, action: string): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${action} failed with HTTP ${response.status}: ${detail}`);
  }
  return (await response.json()) as T;
}

async function keycloakAdminToken(
  config: AuthDemoConfig,
  fetchImplementation: typeof fetch,
): Promise<string> {
  const tokenUrl = new URL(
    '/realms/master/protocol/openid-connect/token',
    config.keycloakInternalUrl,
  );
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: config.keycloakAdmin,
    password: config.keycloakAdminPassword,
  });
  const response = await fetchImplementation(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const token = await responseJson<{ access_token?: string }>(
    response,
    'Keycloak admin login',
  );

  if (!token.access_token) {
    throw new Error('Keycloak admin login returned no access token');
  }
  return token.access_token;
}

function keycloakHeaders(accessToken: string): Record<string, string> {
  return {
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json',
  };
}

function keycloakPersonName(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const [firstName, ...remainingNames] = displayName.split(/\s+/);
  return {
    firstName,
    lastName: remainingNames.join(' ') || 'Demo',
  };
}

export async function provisionKeycloakDemoUser(
  config: AuthDemoConfig,
  fetchImplementation: typeof fetch = fetch,
): Promise<string> {
  const accessToken = await keycloakAdminToken(config, fetchImplementation);
  const personName = keycloakPersonName(config.displayName);
  const usersUrl = new URL(
    `/admin/realms/${encodeURIComponent(config.keycloakRealm)}/users`,
    config.keycloakInternalUrl,
  );
  usersUrl.searchParams.set('username', config.username);
  usersUrl.searchParams.set('exact', 'true');

  const users = await responseJson<KeycloakUser[]>(
    await fetchImplementation(usersUrl, {
      headers: keycloakHeaders(accessToken),
    }),
    'Keycloak user lookup',
  );

  if (users.length > 1) {
    throw new Error(`Multiple Keycloak users matched ${config.username}`);
  }

  let subject = users[0]?.id;
  if (!subject) {
    const createResponse = await fetchImplementation(
      new URL(usersUrl.pathname, config.keycloakInternalUrl),
      {
        method: 'POST',
        headers: keycloakHeaders(accessToken),
        body: JSON.stringify({
          username: config.username,
          enabled: true,
          email: config.email,
          emailVerified: true,
          ...personName,
        }),
      },
    );

    if (createResponse.status !== 201) {
      const detail = await createResponse.text();
      throw new Error(
        `Keycloak user creation failed with HTTP ${createResponse.status}: ${detail}`,
      );
    }

    const location = createResponse.headers.get('location');
    const createdSubject = location?.split('/').filter(Boolean).at(-1);
    if (!createdSubject) {
      throw new Error('Keycloak user creation returned no user location');
    }
    subject = createdSubject;
  }

  const userUrl = new URL(
    `/admin/realms/${encodeURIComponent(config.keycloakRealm)}/users/${encodeURIComponent(subject)}`,
    config.keycloakInternalUrl,
  );
  const updateResponse = await fetchImplementation(userUrl, {
    method: 'PUT',
    headers: keycloakHeaders(accessToken),
    body: JSON.stringify({
      username: config.username,
      enabled: true,
      email: config.email,
      emailVerified: true,
      ...personName,
    }),
  });
  if (!updateResponse.ok) {
    throw new Error(
      `Keycloak user update failed with HTTP ${updateResponse.status}`,
    );
  }

  const passwordResponse = await fetchImplementation(
    new URL(`${userUrl.pathname}/reset-password`, config.keycloakInternalUrl),
    {
      method: 'PUT',
      headers: keycloakHeaders(accessToken),
      body: JSON.stringify({
        type: 'password',
        value: config.password,
        temporary: false,
      }),
    },
  );
  if (!passwordResponse.ok) {
    throw new Error(
      `Keycloak password reset failed with HTTP ${passwordResponse.status}`,
    );
  }

  return subject;
}

async function seedDatabase(
  client: QueryClient,
  config: AuthDemoConfig,
  subject: string,
): Promise<Omit<AuthDemoResult, 'keycloakSubject'>> {
  const tenant = await client.query<{ id: string }>(
    `INSERT INTO tenants (slug, name, status)
     VALUES ($1, $2, 'active')
     ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name, status = 'active', updated_at = now()
     RETURNING id`,
    [config.tenantSlug, config.tenantName],
  );
  const tenantId = tenant.rows[0].id;

  await client.query(
    `INSERT INTO tenants (slug, name, status)
     VALUES ('tenant_beta', 'Tenant Beta', 'active')
     ON CONFLICT (slug) DO NOTHING`,
  );

  const user = await client.query<{ id: string }>(
    `INSERT INTO identity_users
       (identity_issuer, identity_subject, email, display_name, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (identity_issuer, identity_subject) DO UPDATE
       SET email = EXCLUDED.email,
           display_name = EXCLUDED.display_name,
           status = 'active',
           updated_at = now()
     RETURNING id`,
    [config.issuer, subject, config.email, config.displayName],
  );
  const identityUserId = user.rows[0].id;

  const membership = await client.query<{ id: string }>(
    `INSERT INTO tenant_memberships (tenant_id, user_id, status)
     VALUES ($1, $2, 'active')
     ON CONFLICT (tenant_id, user_id) DO UPDATE
       SET status = 'active', updated_at = now()
     RETURNING id`,
    [tenantId, identityUserId],
  );
  const membershipId = membership.rows[0].id;
  const roles = [
    { code: 'employee', name: 'Employee' },
    { code: 'manager', name: 'Manager' },
  ];

  for (const role of roles) {
    const roleResult = await client.query<{ id: string }>(
      `INSERT INTO tenant_roles (tenant_id, code, name, is_system)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (tenant_id, code) DO UPDATE
         SET name = EXCLUDED.name, is_system = true, updated_at = now()
       RETURNING id`,
      [tenantId, role.code, role.name],
    );
    await client.query(
      `INSERT INTO membership_roles (tenant_id, membership_id, role_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, membership_id, role_id) DO NOTHING`,
      [tenantId, membershipId, roleResult.rows[0].id],
    );
  }

  return {
    identityUserId,
    tenantId,
    membershipId,
    roles: roles.map((role) => role.code),
  };
}

export async function provisionAuthDemo(
  config: AuthDemoConfig = loadAuthDemoConfig(),
  activePool?: Pool,
  fetchImplementation: typeof fetch = fetch,
): Promise<AuthDemoResult> {
  const subject = await provisionKeycloakDemoUser(config, fetchImplementation);
  const ownsPool = !activePool;
  const pool = activePool ?? new Pool(getDatabaseConfig());
  let client: PoolClient | undefined;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;
    const databaseResult = await seedDatabase(client, config, subject);
    await client.query('COMMIT');
    transactionStarted = false;
    return { keycloakSubject: subject, ...databaseResult };
  } catch (error) {
    if (client && transactionStarted) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    client?.release();
    if (ownsPool) {
      await pool.end();
    }
  }
}
