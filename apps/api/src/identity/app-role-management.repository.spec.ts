import type { Pool } from 'pg';
import { AuditLogRepository } from './audit-log.repository';
import {
  AppRoleAssignmentConflictError,
  AppRoleManagementRepository,
} from './app-role-management.repository';

describe('AppRoleManagementRepository', () => {
  const input = {
    tenantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    applicationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    membershipId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    roleId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    roleCode: 'designer',
    assignedByMembershipId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  };

  let query: jest.Mock;
  let release: jest.Mock;
  let auditLogs: { createInTransaction: jest.Mock };
  let repository: AppRoleManagementRepository;

  beforeEach(() => {
    query = jest.fn();
    release = jest.fn();
    auditLogs = { createInTransaction: jest.fn().mockResolvedValue(undefined) };
    const pool = {
      connect: jest.fn().mockResolvedValue({ query, release }),
    };
    repository = new AppRoleManagementRepository(
      pool as unknown as Pool,
      auditLogs as unknown as AuditLogRepository,
    );
  });

  it('assigns a role and writes its audit event in one transaction', async () => {
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await expect(repository.assignRole(input)).resolves.toBeUndefined();

    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO app_membership_roles'),
      [
        input.tenantId,
        input.applicationId,
        input.membershipId,
        input.roleId,
        input.assignedByMembershipId,
      ],
    );
    expect(auditLogs.createInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: input.tenantId,
        actorMembershipId: input.assignedByMembershipId,
        action: 'app_role.assign',
        resourceId: input.membershipId,
        result: 'success',
      }),
    );
    expect(query).toHaveBeenLastCalledWith('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rolls back duplicate assignments', async () => {
    query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: '23505' })
      .mockResolvedValueOnce({});

    await expect(repository.assignRole(input)).rejects.toBeInstanceOf(
      AppRoleAssignmentConflictError,
    );
    expect(query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(auditLogs.createInTransaction).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('revokes a role and writes its audit event with tenant/app scope', async () => {
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({});

    await expect(repository.revokeRole(input)).resolves.toBe(true);

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE tenant_id = $1'),
      [input.tenantId, input.applicationId, input.membershipId, input.roleId],
    );
    expect(auditLogs.createInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'app_role.revoke' }),
    );
    expect(query).toHaveBeenLastCalledWith('COMMIT');
  });

  it('does not write an audit event when there is nothing to revoke', async () => {
    query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 0 });

    await expect(repository.revokeRole(input)).resolves.toBe(false);

    expect(auditLogs.createInTransaction).not.toHaveBeenCalled();
    expect(query).toHaveBeenLastCalledWith('COMMIT');
  });

  it('rolls back the role change when audit writing fails', async () => {
    query.mockResolvedValueOnce({}).mockResolvedValueOnce({});
    auditLogs.createInTransaction.mockRejectedValueOnce(
      new Error('audit down'),
    );

    await expect(repository.assignRole(input)).rejects.toThrow('audit down');

    expect(query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(query).not.toHaveBeenCalledWith('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
