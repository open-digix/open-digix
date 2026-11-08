import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import type { TenantContext } from './identity.types';
import type { TenantContextRequest } from './tenant-context.types';

export const TENANT_CONTEXT_REQUIRED = 'auth:tenant-context-required';

export const TenantScoped = () => SetMetadata(TENANT_CONTEXT_REQUIRED, true);

export const CurrentTenantContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context.switchToHttp().getRequest<TenantContextRequest>();
    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException({
        error: {
          code: 'TENANT_ACCESS_DENIED',
          message: 'An active tenant context is required.',
        },
      });
    }

    return tenantContext;
  },
);
