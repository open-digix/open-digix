import { migrations } from './migrations';

describe('database migrations', () => {
  it('registers the initial DigiX schema migration', () => {
    expect(migrations.map((migration) => migration.id)).toEqual([
      '0001_initial_schema',
      '0002_builder_drafts',
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
});
