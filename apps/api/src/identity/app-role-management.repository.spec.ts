import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
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
  let audit: { record: jest.Mock };
  let repository: AppRoleManagementRepository;

  beforeEach(() => {
    query = jest.fn();
    release = jest.fn();
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    const pool = {
      connect: jest.fn().mockResolvedValue({ query, release }),
    };
    repository = new AppRoleManagementRepository(
      pool as unknown as Pool,
      audit as unknown as AuditService,
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
    expect(audit.record).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: input.tenantId,
        actorMembershipId: input.assignedByMembershipId,
        action: 'rbac.role.assigned',
        resourceId: input.membershipId,
        result: 'success',
        metadata: {
          targetMembershipId: input.membershipId,
          roleCode: input.roleCode,
          scope: input.applicationId,
        },
      }),
      expect.objectContaining({ query }),
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
    expect(audit.record).not.toHaveBeenCalled();
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
    expect(audit.record).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'rbac.role.revoked' }),
      expect.objectContaining({ query }),
    );
    expect(query).toHaveBeenLastCalledWith('COMMIT');
  });

  it('does not write an audit event when there is nothing to revoke', async () => {
    query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 0 });

    await expect(repository.revokeRole(input)).resolves.toBe(false);

    expect(audit.record).not.toHaveBeenCalled();
    expect(query).toHaveBeenLastCalledWith('COMMIT');
  });

  it('rolls back the role change when audit writing fails', async () => {
    query.mockResolvedValueOnce({}).mockResolvedValueOnce({});
    audit.record.mockRejectedValueOnce(new Error('audit down'));

    await expect(repository.assignRole(input)).rejects.toThrow('audit down');

    expect(query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(query).not.toHaveBeenCalledWith('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
