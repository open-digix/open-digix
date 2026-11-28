import { randomUUID } from 'node:crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { getDatabaseConfig } from '../database/database.config';
import { migrateDatabase } from '../database/migration-runner';
import { CrmRepository, type CrmScope } from './crm.repository';
import { CrmService } from './crm.service';

const integration = process.env.CRM_TEST_DB ? describe : describe.skip;

integration('CRM PostgreSQL integration (isolated database)', () => {
  let pool: Pool;
  let service: CrmService;
  let repository: CrmRepository;
  let scope: CrmScope;
  let other: CrmScope;
  let versionId: string;

  beforeAll(async () => {
    pool = new Pool({
      ...getDatabaseConfig(),
      database: process.env.CRM_TEST_DB,
    });
    await migrateDatabase(pool);
    repository = new CrmRepository(pool);
    service = new CrmService(repository);
    const tenant = randomUUID();
    const user = randomUUID();
    const member = randomUUID();
    const app = randomUUID();
    const otherApp = randomUUID();
    const otherVersion = randomUUID();
    versionId = randomUUID();
    scope = { tenantId: tenant, appId: app, membershipId: member };
    other = { ...scope, appId: otherApp };
    await pool.query(
      'INSERT INTO tenants (id, slug, name) VALUES ($1, $2, $3)',
      [tenant, `crm-test-${tenant}`, 'CRM integration'],
    );
    await pool.query(
      `INSERT INTO identity_users
        (id, identity_issuer, identity_subject, display_name)
       VALUES ($1, 'https://verification.invalid', $2, 'CRM user')`,
      [user, `crm-${user}`],
    );
    await pool.query(
      'INSERT INTO tenant_memberships (id, tenant_id, user_id) VALUES ($1, $2, $3)',
      [member, tenant, user],
    );
    await pool.query(
      `INSERT INTO applications (id, tenant_id, app_key, name, status)
       VALUES ($1, $3, 'crm_app', 'CRM App', 'active'),
              ($2, $3, 'crm_other', 'Other App', 'active')`,
      [app, otherApp, tenant],
    );
    const definition = JSON.stringify({
      features: [
        { id: 'crm.customers', version: 1 },
        { id: 'crm.opportunities', version: 1 },
      ],
    });
    for (const [id, appId] of [
      [versionId, app],
      [otherVersion, otherApp],
    ]) {
      await pool.query(
        `INSERT INTO application_versions (id, tenant_id, application_id, version,
          schema_version, status, definition, definition_checksum, created_by_membership_id)
         VALUES ($1, $2, $3, 1, '2.5', 'published', $4::jsonb, $5, $6)`,
        [id, tenant, appId, definition, 'a'.repeat(64), member],
      );
    }
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('creates customers, contacts and opportunities with scoped reads', async () => {
    const customer = await service.createCustomer(scope, 'customer-1', {
      customerCode: 'CRM-001',
      name: 'Customer',
    });
    const id = customer.id as string;
    const contact = await service.createContact(scope, id, 'contact-1', {
      name: 'Contact',
      email: 'contact@example.test',
    });
    expect(contact.customer_id).toBe(id);
    expect(
      await service.contact(scope, id, contact.id as string),
    ).toMatchObject({
      id: contact.id,
      customer_id: id,
    });
    await expect(
      service.contact(other, id, contact.id as string),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.contact(scope, randomUUID(), contact.id as string),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.contact(scope, id, randomUUID()),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.contact(
        { ...scope, tenantId: randomUUID() },
        id,
        contact.id as string,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    const opportunity = await service.createOpportunity(
      scope,
      'opportunity-1',
      {
        customerId: id,
        name: 'Deal',
        assigneeId: null,
      },
    );
    expect(opportunity.stage).toBe('new');
    expect(
      (await service.listCustomers(scope, { limit: 20, cursor: null })).items,
    ).toHaveLength(1);
    expect(
      (await service.listContacts(scope, id, { limit: 20, cursor: null }))
        .items,
    ).toHaveLength(1);
    const customerReplay = await service.createCustomer(scope, 'customer-1', {
      customerCode: 'CRM-001',
      name: 'Customer',
    });
    expect(customerReplay.id).toBe(id);
    await expect(
      service.createCustomer(scope, 'customer-1', {
        customerCode: 'CRM-002',
        name: 'Different payload',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.createCustomer(scope, 'customer-duplicate', {
        customerCode: 'CRM-001',
        name: 'Duplicate code',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(service.customer(other, id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.createOpportunity(other, 'cross-app', {
        customerId: id,
        name: 'Cross-app',
        assigneeId: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.opportunity(other, opportunity.id as string),
    ).rejects.toBeInstanceOf(NotFoundException);

    const first = await service.advance(
      scope,
      opportunity.id as string,
      'advance-1',
      { expectedStage: 'new', expectedVersion: 1 },
    );
    expect(first.stage).toBe('qualified');
    const replay = await service.advance(
      scope,
      opportunity.id as string,
      'advance-1',
      { expectedStage: 'new', expectedVersion: 1 },
    );
    expect(replay).toEqual(JSON.parse(JSON.stringify(first)));
    await expect(
      service.advance(scope, opportunity.id as string, 'advance-1', {
        expectedStage: 'qualified',
        expectedVersion: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    const competing = await Promise.allSettled([
      service.advance(scope, opportunity.id as string, 'advance-2', {
        expectedStage: 'qualified',
        expectedVersion: 2,
      }),
      service.advance(scope, opportunity.id as string, 'advance-3', {
        expectedStage: 'qualified',
        expectedVersion: 2,
      }),
    ]);
    expect(
      competing.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      competing.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    const detail = await service.opportunity(scope, opportunity.id as string);
    expect(detail.stage).toBe('proposal');
    expect(detail.history).toHaveLength(2);
    expect(detail.history[0].application_version_id).toBe(versionId);
    const won = await service.advance(
      scope,
      opportunity.id as string,
      'advance-won',
      { expectedStage: 'proposal', expectedVersion: 3 },
    );
    expect(won.stage).toBe('won');
    await expect(
      service.advance(scope, opportunity.id as string, 'advance-terminal', {
        expectedStage: 'won',
        expectedVersion: 4,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      (await service.opportunity(scope, opportunity.id as string)).history,
    ).toHaveLength(3);
  });

  it('does not fall back to an older enabled version after a feature is disabled', async () => {
    await pool.query(
      `INSERT INTO application_versions (tenant_id, application_id, version,
        schema_version, status, definition, definition_checksum, created_by_membership_id)
       VALUES ($1, $2, 2, '2.5', 'published', $3::jsonb, $4, $5)`,
      [
        scope.tenantId,
        scope.appId,
        JSON.stringify({ features: [] }),
        'b'.repeat(64),
        scope.membershipId,
      ],
    );
    await expect(
      service.listCustomers(scope, { limit: 20, cursor: null }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.createCustomer(scope, 'customer-1', {
        customerCode: 'CRM-001',
        name: 'Customer',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
