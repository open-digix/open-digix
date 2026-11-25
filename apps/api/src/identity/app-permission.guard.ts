import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppAuthorizationService } from './app-authorization.service';
import {
  REQUIRED_APP_PERMISSION,
  type AppPermissionRequirement,
} from './app-permission.decorator';
import { parseAppId } from './app-role.input';
import type { TenantContextRequest } from './tenant-context.types';

@Injectable()
export class AppPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AppAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<
      AppPermissionRequirement | undefined
    >(REQUIRED_APP_PERMISSION, [context.getHandler(), context.getClass()]);

    if (!requirement) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<TenantContextRequest & { params?: Record<string, string> }>();
    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException({
        error: {
          code: 'TENANT_ACCESS_DENIED',
          message: 'An active tenant context is required.',
        },
      });
    }

    const rawApplicationId = request.params?.[requirement.appIdParam];
    if (!rawApplicationId) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_APP_ID',
          message: `Route parameter '${requirement.appIdParam}' is required.`,
        },
      });
    }

    await this.authorization.requirePermission(
      {
        tenantId: tenantContext.membership.tenant.id,
        applicationId: parseAppId(rawApplicationId),
        membershipId: tenantContext.membership.id,
      },
      requirement.permission,
    );

    return true;
  }
}
