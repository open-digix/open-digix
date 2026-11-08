import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { OidcTokenVerifier } from './../src/auth/oidc-token.verifier';
import { DATABASE_POOL } from './../src/database/database.module';
import { AppModule } from './../src/app.module';
import type { TenantContext } from './../src/identity/identity.types';
import { RequireRoles } from './../src/identity/roles.decorator';
import {
  CurrentTenantContext,
  TenantScoped,
} from './../src/identity/tenant-context.decorator';

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

  beforeAll(() => {
    process.env.OIDC_ISSUER = 'http://localhost:8080/realms/digix';
    process.env.OIDC_AUDIENCE = 'digix-api';
    process.env.OIDC_JWKS_URI =
      'http://localhost:8080/realms/digix/protocol/openid-connect/certs';
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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AuthorizationTestController],
    })
      .overrideProvider(OidcTokenVerifier)
      .useValue(tokenVerifier)
      .overrideProvider(DATABASE_POOL)
      .useValue(pool)
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
