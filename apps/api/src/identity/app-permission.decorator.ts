import { applyDecorators, SetMetadata } from '@nestjs/common';
import { TenantScoped } from './tenant-context.decorator';

export const REQUIRED_APP_PERMISSION = 'auth:required-app-permission';

const PERMISSION_PATTERN = /^[a-z][a-z0-9_-]{1,63}(\.[a-z][a-z0-9_-]{1,63})+$/;

export interface AppPermissionRequirement {
  readonly permission: string;
  readonly appIdParam: string;
}

export function RequireAppPermission(permission: string, appIdParam = 'appId') {
  const normalizedPermission = permission.trim().toLowerCase();
  const normalizedAppIdParam = appIdParam.trim();

  if (!PERMISSION_PATTERN.test(normalizedPermission)) {
    throw new Error(`Invalid application permission: ${permission}`);
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(normalizedAppIdParam)) {
    throw new Error(`Invalid application id route parameter: ${appIdParam}`);
  }

  return applyDecorators(
    TenantScoped(),
    SetMetadata(REQUIRED_APP_PERMISSION, {
      permission: normalizedPermission,
      appIdParam: normalizedAppIdParam,
    } satisfies AppPermissionRequirement),
  );
}
