import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ROLES } from './roles.decorator';
import type { TenantContextRequest } from './tenant-context.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantContextRequest>();
    const assignedRoles = request.tenantContext?.membership.roles;
    const allowed = requiredRoles.some((role) => assignedRoles?.includes(role));

    if (!allowed) {
      throw new ForbiddenException({
        error: {
          code: 'ROLE_REQUIRED',
          message: 'The selected tenant membership lacks a required role.',
        },
      });
    }

    return true;
  }
}
