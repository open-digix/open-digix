import { migrations } from './migrations';

describe('database migrations', () => {
  it('registers the initial DigiX schema migration', () => {
    expect(migrations.map((migration) => migration.id)).toEqual([
      '0001_initial_schema',
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
});
