import { applyDecorators, SetMetadata } from '@nestjs/common';
import { TenantScoped } from './tenant-context.decorator';

export const REQUIRED_ROLES = 'auth:required-roles';
const ROLE_CODE_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;

export function RequireRoles(...roles: string[]) {
  const normalizedRoles = [
    ...new Set(roles.map((role) => role.trim().toLowerCase())),
  ].filter(Boolean);

  if (normalizedRoles.length === 0) {
    throw new Error('RequireRoles needs at least one role code');
  }

  if (normalizedRoles.some((role) => !ROLE_CODE_PATTERN.test(role))) {
    throw new Error('RequireRoles received an invalid role code');
  }

  return applyDecorators(
    TenantScoped(),
    SetMetadata(REQUIRED_ROLES, normalizedRoles),
  );
}
