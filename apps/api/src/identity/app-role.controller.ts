import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import type { TenantContext } from './identity.types';
import { CurrentTenantContext } from './tenant-context.decorator';
import { RequireRoles } from './roles.decorator';
import { AppRoleManagementService } from './app-role-management.service';
import {
  parseAppId,
  parseAppRoleBody,
  parseMembershipId,
} from './app-role.input';

export interface ManagedAppRoleResponse {
  readonly appId: string;
  readonly membershipId: string;
  readonly roleCode: string;
  readonly status: 'assigned' | 'revoked';
}

@Controller('v1/apps')
export class AppRoleController {
  constructor(private readonly roles: AppRoleManagementService) {}

  @Put(':appId/memberships/:membershipId/roles')
  @RequireRoles('tenant_admin')
  async assign(
    @Param('appId') appIdParam: string,
    @Param('membershipId') membershipIdParam: string,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<ManagedAppRoleResponse> {
    const result = await this.roles.assign({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appIdParam),
      membershipId: parseMembershipId(membershipIdParam),
      roleCode: parseAppRoleBody(body).roleCode,
      assignedByMembershipId: context.membership.id,
    });

    return toResponse(result);
  }

  @Delete(':appId/memberships/:membershipId/roles')
  @HttpCode(HttpStatus.OK)
  @RequireRoles('tenant_admin')
  async revoke(
    @Param('appId') appIdParam: string,
    @Param('membershipId') membershipIdParam: string,
    @Body() body: unknown,
    @CurrentTenantContext() context: TenantContext,
  ): Promise<ManagedAppRoleResponse> {
    const result = await this.roles.revoke({
      tenantId: context.membership.tenant.id,
      applicationId: parseAppId(appIdParam),
      membershipId: parseMembershipId(membershipIdParam),
      roleCode: parseAppRoleBody(body).roleCode,
      assignedByMembershipId: context.membership.id,
    });

    return toResponse(result);
  }
}

function toResponse(result: {
  applicationId: string;
  membershipId: string;
  roleCode: string;
  status: 'assigned' | 'revoked';
}): ManagedAppRoleResponse {
  return {
    appId: result.applicationId,
    membershipId: result.membershipId,
    roleCode: result.roleCode,
    status: result.status,
  };
}
