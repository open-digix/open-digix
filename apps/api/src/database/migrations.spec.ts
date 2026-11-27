import { migrations } from './migrations';

describe('database migrations', () => {
  it('registers the initial DigiX schema migration', () => {
    expect(migrations.map((migration) => migration.id)).toEqual([
      '0001_initial_schema',
      '0002_builder_drafts',
      '0003_app_acl',
      '0004_app_acl_backfill',
      '0005_shared_foundation',
      '0006_erp_materials',
    ]);
  });

  it.each([
    'tenants',
    'identity_users',
    'tenant_memberships',
    'tenant_roles',
    'membership_roles',
    'applications',
    'application_versions',
    'business_records',
    'workflow_instances',
    'workflow_tasks',
    'stored_files',
    'audit_logs',
  ])('creates the %s table', (tableName) => {
    expect(migrations[0].sql).toContain(`CREATE TABLE ${tableName}`);
  });

  it('uses composite tenant foreign keys for tenant-owned relationships', () => {
    expect(migrations[0].sql).toContain(
      'FOREIGN KEY (tenant_id, membership_id)',
    );
    expect(migrations[0].sql).toContain(
      'FOREIGN KEY (tenant_id, application_id, application_version_id)',
    );
    expect(migrations[0].sql).toContain(
      'FOREIGN KEY (tenant_id, workflow_instance_id)',
    );
  });

  it.each([
    'builder_source_revisions',
    'builder_source_files',
    'builder_draft_revisions',
    'builder_revision_sources',
  ])('creates the %s table for Builder drafts', (tableName) => {
    expect(migrations[1].sql).toContain(`CREATE TABLE ${tableName}`);
  });

  it('keeps Builder revision relationships tenant-scoped', () => {
    expect(migrations[1].sql).toContain(
      'FOREIGN KEY (tenant_id, application_id, source_revision_id)',
    );
    expect(migrations[1].sql).toContain(
      'FOREIGN KEY (tenant_id, application_id, application_version_id)',
    );
    expect(migrations[1].sql).toContain(
      'ADD CONSTRAINT application_versions_current_revision_fk',
    );
  });

  it.each([
    'application_roles',
    'application_role_permissions',
    'app_membership_roles',
  ])('creates the %s table for app ACL', (tableName) => {
    expect(migrations[2].sql).toContain(`CREATE TABLE ${tableName}`);
  });

  it('keeps app ACL relationships scoped to tenant and application', () => {
    expect(migrations[2].sql).toContain(
      'FOREIGN KEY (tenant_id, application_id)',
    );
    expect(migrations[2].sql).toContain(
      'FOREIGN KEY (tenant_id, application_id, role_id)',
    );
  });

  it('backfills app roles, permissions and creator assignments', () => {
    expect(migrations[3].sql).toContain('INSERT INTO application_roles');
    expect(migrations[3].sql).toContain(
      'INSERT INTO application_role_permissions',
    );
    expect(migrations[3].sql).toContain('INSERT INTO app_membership_roles');
    expect(migrations[3].sql).toContain('created_by_membership_id');
    expect(migrations[3].sql).toContain(
      'ON CONFLICT (tenant_id, application_id, code) DO NOTHING',
    );
  });

  it('creates the shared idempotency ledger with tenant and app scope', () => {
    expect(migrations[4].sql).toContain('CREATE TABLE idempotency_keys');
    expect(migrations[4].sql).toContain(
      'FOREIGN KEY (tenant_id, application_id)',
    );
    expect(migrations[4].sql).toContain(
      'FOREIGN KEY (tenant_id, actor_membership_id)',
    );
    expect(migrations[4].sql).toContain(
      'UNIQUE (\n          tenant_id,\n          application_id,\n          actor_membership_id,\n          action,\n          idempotency_key\n        )',
    );
  });

  it('creates the ERP materials table with app and version scope', () => {
    expect(migrations[5].sql).toContain('CREATE TABLE materials');
    expect(migrations[5].sql).toContain(
      'FOREIGN KEY (tenant_id, application_id)',
    );
    expect(migrations[5].sql).toContain(
      'FOREIGN KEY (tenant_id, application_id, application_version_id)',
    );
    expect(migrations[5].sql).toContain(
      'UNIQUE (tenant_id, application_id, sku)',
    );
  });
});
