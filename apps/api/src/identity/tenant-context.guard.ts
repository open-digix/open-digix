import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IdentityContextService } from './identity-context.service';
import { TENANT_CONTEXT_REQUIRED } from './tenant-context.decorator';
import type { TenantContextRequest } from './tenant-context.types';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identityContext: IdentityContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tenantRequired = this.reflector.getAllAndOverride<boolean>(
      TENANT_CONTEXT_REQUIRED,
      [context.getHandler(), context.getClass()],
    );

    if (!tenantRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantContextRequest>();
    const identity = request.authenticatedIdentity;

    if (!identity) {
      throw new UnauthorizedException({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'A Bearer access token is required.',
        },
      });
    }

    request.tenantContext = await this.identityContext.resolveRequiredTenant(
      identity,
      request.header('x-tenant-id'),
    );

    return true;
  }
}
