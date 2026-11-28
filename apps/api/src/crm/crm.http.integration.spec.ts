import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';
import { OidcTokenVerifier } from '../auth/oidc-token.verifier';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DATABASE_POOL } from '../database/database.module';
import { getDatabaseConfig } from '../database/database.config';
import { migrateDatabase } from '../database/migration-runner';
import { AppAuthorizationRepository } from '../identity/app-authorization.repository';
import { AppAuthorizationService } from '../identity/app-authorization.service';
import { APP_AUTHORIZATION_REPOSITORY } from '../identity/app-authorization.types';
import { AppPermissionGuard } from '../identity/app-permission.guard';
import { IdentityContextRepository } from '../identity/identity-context.repository';
import { IdentityContextService } from '../identity/identity-context.service';
import { TenantContextGuard } from '../identity/tenant-context.guard';
import { CrmController } from './crm.controller';
import { CrmRepository } from './crm.repository';
import { CrmService } from './crm.service';

// The verifier is stubbed; the HTTP guards, identity/ACL repositories and
// PostgreSQL are real. This is not a real-JWT Gateway acceptance test.
const integration = process.env.CRM_TEST_DB ? describe : describe.skip;
const issuer = 'https://crm-verification.invalid';
const permissions = [
  'crm.customers.customers.create',
  'crm.customers.customers.read',
  'crm.customers.contacts.create_contact',
  'crm.customers.contacts.read',
  'crm.opportunities.opportunities.create',
  'crm.opportunities.opportunities.read',
  'crm.opportunities.opportunities.advance',
] as const;

integration('CRM HTTP guards and persistence (isolated database)', () => {
  let pool: Pool;
  let app: INestApplication<App>;
  const tenant = randomUUID();
  const otherTenant = randomUUID();
  const application = randomUUID();
  const otherApplication = randomUUID();
  const member = randomUUID();
  const reader = randomUUID();
  const role = randomUUID();
  const readerRole = randomUUID();
  const customerIds: string[] = [];
  let opportunityId: string;

  async function start(): Promise<INestApplication<App>> {
    const module = await Test.createTestingModule({
      controllers: [CrmController],
      providers: [
        { provide: DATABASE_POOL, useValue: pool },
        CrmRepository,
        CrmService,
        IdentityContextRepository,
        IdentityContextService,
        AppAuthorizationRepository,
        {
          provide: APP_AUTHORIZATION_REPOSITORY,
          useExisting: AppAuthorizationRepository,
        },
        AppAuthorizationService,
        {
          provide: OidcTokenVerifier,
          useValue: {
            verify: (token: string) => {
              if (!['owner', 'reader'].includes(token))
                throw new Error('Invalid test token');
              return Promise.resolve({
                issuer,
                subject: token,
                audience: ['digix-api'],
                issuedAt: 1,
                expiresAt: 9999999999,
              });
            },
          },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: TenantContextGuard },
        { provide: APP_GUARD, useClass: AppPermissionGuard },
      ],
    }).compile();
    const result: INestApplication = module.createNestApplication();
    await result.init();
    return result as INestApplication<App>;
  }

  function api(token = 'owner') {
    return request(app.getHttpServer())
      .get(`/v1/apps/${application}/customers`)
      .set('authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenant);
  }

  beforeAll(async () => {
    pool = new Pool({
      ...getDatabaseConfig(),
      database: process.env.CRM_TEST_DB,
    });
    await migrateDatabase(pool);
    await pool.query(
      `INSERT INTO tenants (id, slug, name)
       VALUES ($1, $3, 'CRM HTTP'), ($2, $4, 'Other tenant')`,
      [tenant, otherTenant, `crm-http-${tenant}`, `crm-other-${otherTenant}`],
    );
    for (const [subject, membership] of [
      ['owner', member],
      ['reader', reader],
    ]) {
      const user = randomUUID();
      await pool.query(
        `INSERT INTO identity_users (id, identity_issuer, identity_subject)
         VALUES ($1, $2, $3)`,
        [user, issuer, subject],
      );
      await pool.query(
        `INSERT INTO tenant_memberships (id, tenant_id, user_id)
         VALUES ($1, $2, $3)`,
        [membership, tenant, user],
      );
    }
    await pool.query(
      `INSERT INTO applications (id, tenant_id, app_key, name, status)
       VALUES ($1, $3, 'crm_http', 'CRM HTTP', 'active'),
              ($2, $3, 'crm_http_other', 'Other app', 'active')`,
      [application, otherApplication, tenant],
    );
    await pool.query(
      `INSERT INTO application_versions (tenant_id, application_id, version,
         schema_version, status, definition, definition_checksum, created_by_membership_id)
       VALUES ($1, $2, 1, '2.5', 'published', $3::jsonb, $4, $5)`,
      [
        tenant,
        application,
        JSON.stringify({
          features: [
            { id: 'crm.customers', version: 1 },
            { id: 'crm.opportunities', version: 1 },
          ],
        }),
        'a'.repeat(64),
        member,
      ],
    );
    await pool.query(
      `INSERT INTO application_roles (id, tenant_id, application_id, code, name)
       VALUES ($1, $3, $4, 'sales', 'Sales'),
              ($2, $3, $4, 'reader', 'Reader')`,
      [role, readerRole, tenant, application],
    );
    for (const permission of permissions) {
      await pool.query(
        `INSERT INTO application_role_permissions
          (tenant_id, application_id, role_id, permission)
         VALUES ($1, $2, $3, $4)`,
        [tenant, application, role, permission],
      );
    }
    await pool.query(
      `INSERT INTO application_role_permissions
        (tenant_id, application_id, role_id, permission)
       VALUES ($1, $2, $3, 'crm.customers.customers.read')`,
      [tenant, application, readerRole],
    );
    await pool.query(
      `INSERT INTO app_membership_roles
        (tenant_id, application_id, membership_id, role_id)
       VALUES ($1, $2, $3, $4), ($1, $2, $5, $6)`,
      [tenant, application, member, role, reader, readerRole],
    );
    app = await start();
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it('enforces resource-specific permissions, tenant/app scope and role revocation', async () => {
    await api('reader').expect(200);
    await request(app.getHttpServer())
      .post(`/v1/apps/${application}/customers`)
      .set('authorization', 'Bearer reader')
      .set('x-tenant-id', tenant)
      .set('idempotency-key', 'reader-create')
      .send({ customerCode: 'DENIED', name: 'Denied' })
      .expect(403);
    await request(app.getHttpServer())
      .get(`/v1/apps/${application}/opportunities`)
      .set('authorization', 'Bearer reader')
      .set('x-tenant-id', tenant)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/v1/apps/${application}/customers/${randomUUID()}/contacts`)
      .set('authorization', 'Bearer reader')
      .set('x-tenant-id', tenant)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/v1/apps/${otherApplication}/customers`)
      .set('authorization', 'Bearer owner')
      .set('x-tenant-id', tenant)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/v1/apps/${application}/customers`)
      .set('authorization', 'Bearer owner')
      .set('x-tenant-id', otherTenant)
      .expect(403);
    await request(app.getHttpServer())
      .get(`/v1/apps/${application}/customers`)
      .set('x-tenant-id', tenant)
      .expect(401);

    await pool.query(
      `DELETE FROM app_membership_roles
       WHERE tenant_id = $1 AND application_id = $2 AND membership_id = $3`,
      [tenant, application, reader],
    );
    // Same bearer token, but the database role has been revoked.
    await api('reader').expect(403);
    await api().expect(200);
  });

  it('paginates without loss and survives a new API instance', async () => {
    for (let i = 0; i < 3; i++) {
      const response = await request(app.getHttpServer())
        .post(`/v1/apps/${application}/customers`)
        .set('authorization', 'Bearer owner')
        .set('x-tenant-id', tenant)
        .set('idempotency-key', `http-customer-${i}`)
        .send({ customerCode: `HTTP-${i}`, name: `Customer ${i}` })
        .expect(201);
      customerIds.push((response.body as { id: string }).id);
    }
    const firstCustomer = customerIds[0];
    const contactIds: string[] = [];
    for (let i = 0; i < 2; i++) {
      const contact = await request(app.getHttpServer())
        .post(`/v1/apps/${application}/customers/${firstCustomer}/contacts`)
        .set('authorization', 'Bearer owner')
        .set('x-tenant-id', tenant)
        .set('idempotency-key', `http-contact-${i}`)
        .send({ name: `Contact ${i}` })
        .expect(201);
      contactIds.push((contact.body as { id: string }).id);
    }
    await request(app.getHttpServer())
      .get(`/v1/apps/${application}/customers/${firstCustomer}/contacts`)
      .set('authorization', 'Bearer reader')
      .set('x-tenant-id', tenant)
      .expect(403);
    const opportunity = await request(app.getHttpServer())
      .post(`/v1/apps/${application}/opportunities`)
      .set('authorization', 'Bearer owner')
      .set('x-tenant-id', tenant)
      .set('idempotency-key', 'http-opportunity')
      .send({ customerId: firstCustomer, name: 'Persistent deal' })
      .expect(201);
    opportunityId = (opportunity.body as { id: string }).id;
    const secondOpportunity = await request(app.getHttpServer())
      .post(`/v1/apps/${application}/opportunities`)
      .set('authorization', 'Bearer owner')
      .set('x-tenant-id', tenant)
      .set('idempotency-key', 'http-opportunity-2')
      .send({ customerId: firstCustomer, name: 'Second deal' })
      .expect(201);
    const opportunityIds = [
      opportunityId,
      (secondOpportunity.body as { id: string }).id,
    ];
    await request(app.getHttpServer())
      .post(
        `/v1/apps/${application}/opportunities/${opportunityId}/actions/advance`,
      )
      .set('authorization', 'Bearer owner')
      .set('x-tenant-id', tenant)
      .set('idempotency-key', 'http-advance')
      .send({ expectedStage: 'new', expectedVersion: 1 })
      .expect(200);

    // Force a timestamp tie with microsecond precision: cursor must use
    // (created_at, id), not JS Date's millisecond-truncated timestamp.
    await pool.query(
      `UPDATE customers SET created_at = '2026-11-28 08:00:00.123456+00'
       WHERE tenant_id = $1 AND application_id = $2`,
      [tenant, application],
    );
    await pool.query(
      `UPDATE contacts SET created_at = '2026-11-28 08:00:00.123456+00'
       WHERE tenant_id = $1 AND application_id = $2`,
      [tenant, application],
    );
    await pool.query(
      `UPDATE opportunities SET created_at = '2026-11-28 08:00:00.123456+00'
       WHERE tenant_id = $1 AND application_id = $2`,
      [tenant, application],
    );
    await app.close();
    app = await start();

    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await request(app.getHttpServer())
        .get(`/v1/apps/${application}/customers`)
        .set('authorization', 'Bearer owner')
        .set('x-tenant-id', tenant)
        .query({ limit: 1, ...(cursor ? { cursor } : {}) })
        .expect(200);
      const body = page.body as {
        items: Array<{ id: string }>;
        nextCursor: string | null;
      };
      expect(body.items).toHaveLength(1);
      seen.push(body.items[0].id);
      cursor = body.nextCursor;
    } while (cursor);
    expect(seen.sort()).toEqual([...customerIds].sort());
    for (const [route, ids] of [
      [`customers/${firstCustomer}/contacts`, contactIds],
      ['opportunities', opportunityIds],
    ] as const) {
      const paged: string[] = [];
      let next: string | null = null;
      do {
        const result = await request(app.getHttpServer())
          .get(`/v1/apps/${application}/${route}`)
          .set('authorization', 'Bearer owner')
          .set('x-tenant-id', tenant)
          .query({ limit: 1, ...(next ? { cursor: next } : {}) })
          .expect(200);
        const body = result.body as {
          items: Array<{ id: string }>;
          nextCursor: string | null;
        };
        expect(body.items).toHaveLength(1);
        paged.push(body.items[0].id);
        next = body.nextCursor;
      } while (next);
      expect(paged.sort()).toEqual([...ids].sort());
    }
    const persisted = await request(app.getHttpServer())
      .get(`/v1/apps/${application}/opportunities/${opportunityId}`)
      .set('authorization', 'Bearer owner')
      .set('x-tenant-id', tenant)
      .expect(200);
    const body = persisted.body as { stage: string; history: unknown[] };
    expect(body.stage).toBe('qualified');
    expect(body.history).toHaveLength(1);
  });

  it('denies HTTP reads after disabling the feature on a newer published version', async () => {
    await pool.query(
      `INSERT INTO application_versions
        (tenant_id, application_id, version, schema_version, status, definition,
         definition_checksum, created_by_membership_id)
       VALUES ($1, $2, 2, '2.5', 'published', '{"features":[]}'::jsonb, $3, $4)`,
      [tenant, application, 'b'.repeat(64), member],
    );
    await api().expect(404);
    await request(app.getHttpServer())
      .get(`/v1/apps/${application}/opportunities/${opportunityId}`)
      .set('authorization', 'Bearer owner')
      .set('x-tenant-id', tenant)
      .expect(404);
  });
});
