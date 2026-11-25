import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppAuthorizationService } from './app-authorization.service';
import {
  AppRoleAssignmentConflictError,
  AppRoleManagementRepository,
} from './app-role-management.repository';

export interface ManageAppRoleInput {
  readonly tenantId: string;
  readonly applicationId: string;
  readonly membershipId: string;
  readonly roleCode: string;
  readonly assignedByMembershipId: string;
}

export interface ManagedAppRole {
  readonly applicationId: string;
  readonly membershipId: string;
  readonly roleCode: string;
  readonly status: 'assigned' | 'revoked';
}

@Injectable()
export class AppRoleManagementService {
  constructor(
    private readonly authorization: AppAuthorizationService,
    private readonly repository: AppRoleManagementRepository,
  ) {}

  async assign(input: ManageAppRoleInput): Promise<ManagedAppRole> {
    await this.authorization.requireApplication(
      input.tenantId,
      input.applicationId,
    );
    await this.requireActiveMembership(input.tenantId, input.membershipId);
    const role = await this.requireRole(
      input.tenantId,
      input.applicationId,
      input.roleCode,
    );

    try {
      await this.repository.assignRole({
        ...input,
        roleId: role.id,
      });
    } catch (error) {
      if (error instanceof AppRoleAssignmentConflictError) {
        throw new ConflictException({
          error: {
            code: 'APP_ROLE_ALREADY_ASSIGNED',
            message: 'The app role is already assigned to this membership.',
          },
        });
      }
      throw error;
    }

    return {
      applicationId: input.applicationId,
      membershipId: input.membershipId,
      roleCode: role.code,
      status: 'assigned',
    };
  }

  async revoke(input: ManageAppRoleInput): Promise<ManagedAppRole> {
    await this.authorization.requireApplication(
      input.tenantId,
      input.applicationId,
    );
    const role = await this.requireRole(
      input.tenantId,
      input.applicationId,
      input.roleCode,
    );
    const revoked = await this.repository.revokeRole({
      tenantId: input.tenantId,
      applicationId: input.applicationId,
      membershipId: input.membershipId,
      roleId: role.id,
    });

    if (!revoked) {
      throw new NotFoundException({
        error: {
          code: 'APP_ROLE_ASSIGNMENT_NOT_FOUND',
          message: 'The app role assignment was not found.',
        },
      });
    }

    return {
      applicationId: input.applicationId,
      membershipId: input.membershipId,
      roleCode: role.code,
      status: 'revoked',
    };
  }

  private async requireActiveMembership(
    tenantId: string,
    membershipId: string,
  ): Promise<void> {
    if (!(await this.repository.hasActiveMembership(tenantId, membershipId))) {
      throw new NotFoundException({
        error: {
          code: 'MEMBERSHIP_NOT_FOUND',
          message: 'The active membership was not found in the tenant.',
        },
      });
    }
  }

  private async requireRole(
    tenantId: string,
    applicationId: string,
    roleCode: string,
  ) {
    const role = await this.repository.findRole(
      tenantId,
      applicationId,
      roleCode,
    );
    if (!role) {
      throw new UnprocessableEntityException({
        error: {
          code: 'APP_ROLE_NOT_FOUND',
          message: 'The app role is not configured for this application.',
        },
      });
    }
    return role;
  }
}
