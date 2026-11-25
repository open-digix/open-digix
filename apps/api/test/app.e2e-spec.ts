import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { OidcTokenVerifier } from './../src/auth/oidc-token.verifier';
import { DATABASE_POOL } from './../src/database/database.module';
import { AppModule } from './../src/app.module';
import { S3_CLIENT } from './../src/storage/storage.constants';
import type { TenantContext } from './../src/identity/identity.types';
import { RequireRoles } from './../src/identity/roles.decorator';
import { KeycloakUserConflictError } from './../src/auth/keycloak-admin.client';
import {
  CurrentTenantContext,
  TenantScoped,
} from './../src/identity/tenant-context.decorator';
import {
  KEYCLOAK_ADMIN_CLIENT,
  TENANT_ADMIN_IDENTITY_ISSUER,
  TENANT_ADMIN_REPOSITORY,
} from './../src/onboarding/tenant-admin-registration.service';
import { TenantSlugConflictError } from './../src/onboarding/tenant-admin.repository';

@Controller('__test/tenant')
class AuthorizationTestController {
  @Get()
  @TenantScoped()
  tenantContext(@CurrentTenantContext() context: TenantContext) {
    return context;
  }

  @Get('manager')
  @RequireRoles('manager')
  managerContext(@CurrentTenantContext() context: TenantContext) {
    return context;
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let tokenVerifier: { verify: jest.Mock };
  let pool: { query: jest.Mock; end: jest.Mock };
  let keycloakAdmin: {
    createUser: jest.Mock;
    deleteUser: jest.Mock;
  };
  let tenantAdminRepository: { createTenantAdmin: jest.Mock };
  let s3Client: { send: jest.Mock; destroy: jest.Mock };

  beforeAll(() => {
    process.env.OIDC_ISSUER = 'http://localhost:8080/realms/digix';
    process.env.OIDC_AUDIENCE = 'digix-api';
    process.env.OIDC_JWKS_URI =
      'http://localhost:8080/realms/digix/protocol/openid-connect/certs';
    process.env.KEYCLOAK_INTERNAL_URL = 'http://keycloak:8080';
    process.env.KEYCLOAK_REALM = 'digix';
    process.env.KEYCLOAK_ADMIN = 'admin';
    process.env.KEYCLOAK_ADMIN_PASSWORD = 'test-admin-password';
    process.env.S3_BUCKET = 'digix-files';
    process.env.S3_ENDPOINT = 'http://object-storage:8333';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_FORCE_PATH_STYLE = 'true';
    process.env.S3_ACCESS_KEY_ID = 'test-access-key';
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.STORAGE_UPLOAD_MAX_BYTES = '1048576';
    process.env.STORAGE_UPLOAD_ALLOWED_CONTENT_TYPES = 'application/pdf';
    process.env.WORKFLOW_BASE_URL = 'http://workflow-engine:8080/flowable-rest';
    process.env.WORKFLOW_USERNAME = 'rest-admin';
    process.env.WORKFLOW_PASSWORD = 'test-workflow-password';
    process.env.WORKFLOW_REQUEST_TIMEOUT_MS = '5000';
    process.env.S3_ENDPOINT = 'http://minio:9000';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_FORCE_PATH_STYLE = 'true';
    process.env.S3_ACCESS_KEY_ID = 'test-access-key';
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.S3_BUCKET = 'digix-files';
    process.env.STORAGE_UPLOAD_MAX_BYTES = '1048576';
    process.env.STORAGE_UPLOAD_ALLOWED_CONTENT_TYPES = 'application/pdf';
    process.env.WORKFLOW_BASE_URL = 'http://flowable:8080/flowable-rest';
    process.env.WORKFLOW_USERNAME = 'admin';
    process.env.WORKFLOW_PASSWORD = 'test-workflow-password';
    process.env.WORKFLOW_REQUEST_TIMEOUT_MS = '5000';
  });

  beforeEach(async () => {
    tokenVerifier = {
      verify: jest.fn().mockResolvedValue({
        issuer: 'http://localhost:8080/realms/digix',
        subject: 'keycloak-subject',
        audience: ['digix-api'],
        issuedAt: 1_700_000_000,
        expiresAt: 1_700_000_300,
      }),
    };
    pool = {
      query: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined),
    };
    keycloakAdmin = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };
    tenantAdminRepository = {
      createTenantAdmin: jest.fn(),
    };
    s3Client = {
      send: jest.fn().mockResolvedValue({}),
      destroy: jest.fn(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AuthorizationTestController],
    })
      .overrideProvider(OidcTokenVerifier)
      .useValue(tokenVerifier)
      .overrideProvider(DATABASE_POOL)
      .useValue(pool)
      .overrideProvider(KEYCLOAK_ADMIN_CLIENT)
      .useValue(keycloakAdmin)
      .overrideProvider(TENANT_ADMIN_REPOSITORY)
      .useValue(tenantAdminRepository)
      .overrideProvider(TENANT_ADMIN_IDENTITY_ISSUER)
      .useValue('http://localhost:8080/realms/digix')
      .overrideProvider(S3_CLIENT)
      .useValue(s3Client)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('registers a tenant admin through the public onboarding endpoint', async () => {
    keycloakAdmin.createUser.mockResolvedValue('keycloak-subject');
    tenantAdminRepository.createTenantAdmin.mockResolvedValue({
      tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      identityUserId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      membershipId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      roleId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    });

    const response = await request(app.getHttpServer())
      .post('/v1/public/tenant-registrations')
      .send({
        tenantName: 'Acme Corporation',
        tenantSlug: 'acme_corp',
        admin: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'admin@example.com',
          username: 'admin',
          password: 'correct-horse-battery',
        },
      })
      .expect(201);

    expect(response.body).toEqual({
      tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      tenantSlug: 'acme_corp',
      username: 'admin',
    });
    expect(keycloakAdmin.createUser).toHaveBeenCalledWith({
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Nguyen',
      lastName: 'Van A',
      password: 'correct-horse-battery',
    });
    expect(tenantAdminRepository.createTenantAdmin).toHaveBeenCalledWith({
      tenantSlug: 'acme_corp',
      tenantName: 'Acme Corporation',
      identityIssuer: 'http://localhost:8080/realms/digix',
      identitySubject: 'keycloak-subject',
      email: 'admin@example.com',
      displayName: 'Nguyen Van A',
    });
  });

  it('rejects invalid tenant admin registration input', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/public/tenant-registrations')
      .send({
        tenantName: 'Acme Corporation',
        tenantSlug: 'Acme Corporation',
        admin: {
          firstName: 'Nguyen',
          lastName: 'Van A',
          email: 'not-an-email',
          username: 'admin',
          password: 'short',
        },
      })
      .expect(400);

    expect((response.body as { error: { code: string } }).error.code).toBe(
      'VALIDATION_FAILED',
    );

    expect(keycloakAdmin.createUser).not.toHaveBeenCalled();
    expect(tenantAdminRepository.createTenantAdmin).not.toHaveBeenCalled();
  });

  it('returns EMAIL_TAKEN when Keycloak rejects a duplicate email', async () => {
    keycloakAdmin.createUser.mockRejectedValue(
      new KeycloakUserConflictError('email'),
    );

    const response = await request(app.getHttpServer())
      .post('/v1/public/tenant-registrations')
      .send(validRegistrationBody())
      .expect(409);

    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_TAKEN',
        message: 'Email is already taken.',
      },
    });
    expect(tenantAdminRepository.createTenantAdmin).not.toHaveBeenCalled();
  });

  it('returns TENANT_SLUG_TAKEN and cleans up Keycloak on a duplicate slug', async () => {
    keycloakAdmin.createUser.mockResolvedValue('keycloak-subject');
    tenantAdminRepository.createTenantAdmin.mockRejectedValue(
      new TenantSlugConflictError('acme_corp'),
    );
    keycloakAdmin.deleteUser.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .post('/v1/public/tenant-registrations')
      .send(validRegistrationBody())
      .expect(409);

    expect(response.body).toEqual({
      error: {
        code: 'TENANT_SLUG_TAKEN',
        message: 'Tenant slug is already taken.',
      },
    });
    expect(keycloakAdmin.deleteUser).toHaveBeenCalledWith('keycloak-subject');
  });

  it('/v1/me rejects a request without a Bearer token', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/me')
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'A Bearer access token is required.',
      },
    });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('/v1/me returns the active PostgreSQL membership', async () => {
    const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    pool.query.mockResolvedValue({
      rows: [
        {
          user_id: '11111111-1111-4111-8111-111111111111',
          identity_subject: 'keycloak-subject',
          user_email: 'dung@example.test',
          user_display_name: 'Dung',
          user_status: 'active',
          membership_id: '22222222-2222-4222-8222-222222222222',
          membership_status: 'active',
          tenant_id: tenantId,
          tenant_slug: 'tenant_alpha',
          tenant_name: 'Tenant Alpha',
          tenant_status: 'active',
          roles: ['employee'],
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/v1/me')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Tenant-Id', tenantId)
      .expect(200);

    expect(tokenVerifier.verify).toHaveBeenCalledWith('valid-token');
    expect(response.body).toMatchObject({
      user: {
        subject: 'keycloak-subject',
        email: 'dung@example.test',
      },
      memberships: [
        {
          status: 'active',
          tenant: { id: tenantId, slug: 'tenant_alpha' },
          roles: ['employee'],
        },
      ],
      activeMembership: {
        tenant: { id: tenantId },
        roles: ['employee'],
      },
    });
  });

  it('tenant-scoped endpoints require X-Tenant-Id', async () => {
    const response = await request(app.getHttpServer())
      .get('/__test/tenant')
      .set('Authorization', 'Bearer valid-token')
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'TENANT_CONTEXT_REQUIRED',
        message: 'X-Tenant-Id is required for this endpoint.',
      },
    });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('tenant-scoped endpoints expose only a verified active membership', async () => {
    const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    pool.query.mockResolvedValue({
      rows: [identityRow(tenantId, ['employee'])],
    });

    const response = await request(app.getHttpServer())
      .get('/__test/tenant')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Tenant-Id', tenantId)
      .expect(200);

    expect(response.body).toMatchObject({
      user: { subject: 'keycloak-subject' },
      membership: {
        tenant: { id: tenantId },
        roles: ['employee'],
      },
    });
  });

  it('tenant-scoped endpoints reject a tenant outside the membership', async () => {
    const tenantAlphaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const tenantBetaId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    pool.query.mockResolvedValue({
      rows: [identityRow(tenantAlphaId, ['employee'])],
    });

    const response = await request(app.getHttpServer())
      .get('/__test/tenant')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Tenant-Id', tenantBetaId)
      .expect(403);

    expect(response.body).toMatchObject({
      error: { code: 'TENANT_ACCESS_DENIED' },
    });
  });

  it('role-protected endpoints reject a membership without the role', async () => {
    const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    pool.query.mockResolvedValue({
      rows: [identityRow(tenantId, ['employee'])],
    });

    const response = await request(app.getHttpServer())
      .get('/__test/tenant/manager')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Tenant-Id', tenantId)
      .expect(403);

    expect(response.body).toEqual({
      error: {
        code: 'ROLE_REQUIRED',
        message: 'The selected tenant membership lacks a required role.',
      },
    });
  });

  it('role-protected endpoints accept a role loaded from PostgreSQL', async () => {
    const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    pool.query.mockResolvedValue({
      rows: [identityRow(tenantId, ['employee', 'manager'])],
    });

    await request(app.getHttpServer())
      .get('/__test/tenant/manager')
      .set('Authorization', 'Bearer valid-token')
      .set('X-Tenant-Id', tenantId)
      .expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});

function identityRow(tenantId: string, roles: string[]) {
  return {
    user_id: '11111111-1111-4111-8111-111111111111',
    identity_subject: 'keycloak-subject',
    user_email: 'dung@example.test',
    user_display_name: 'Dung',
    user_status: 'active',
    membership_id: '22222222-2222-4222-8222-222222222222',
    membership_status: 'active',
    tenant_id: tenantId,
    tenant_slug: 'tenant_alpha',
    tenant_name: 'Tenant Alpha',
    tenant_status: 'active',
    roles,
  };
}

function validRegistrationBody() {
  return {
    tenantName: 'Acme Corporation',
    tenantSlug: 'acme_corp',
    admin: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      email: 'admin@example.com',
      username: 'admin',
      password: 'correct-horse-battery',
    },
  };
}
