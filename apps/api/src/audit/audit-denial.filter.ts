import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { TenantContextRequest } from '../identity/tenant-context.types';
import { AuditAction, AuditResult } from './constants/audit-policy.constants';
import { AuditService } from './audit.service';

@Catch(UnauthorizedException, ForbiddenException)
export class AuditDenialFilter implements ExceptionFilter<
  UnauthorizedException | ForbiddenException
> {
  private readonly logger = new Logger(AuditDenialFilter.name);

  constructor(private readonly audit: AuditService) {}

  async catch(
    exception: UnauthorizedException | ForbiddenException,
    host: ArgumentsHost,
  ): Promise<void> {
    const http = host.switchToHttp();
    const request = http.getRequest<TenantContextRequest>();
    const response = http.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    const tenant = request.tenantContext?.membership;
    if ((status === 401 || status === 403) && tenant) {
      try {
        await this.audit.record({
          tenantId: tenant.tenant.id,
          actorMembershipId: tenant.id,
          action:
            status === 401
              ? AuditAction.AUTH_DENIED
              : AuditAction.ACCESS_DENIED,
          resourceType: 'http_request',
          result: AuditResult.DENIED,
          metadata: {
            reasonCode:
              typeof body === 'object' &&
              body !== null &&
              'error' in body &&
              typeof body.error === 'object' &&
              body.error !== null &&
              'code' in body.error
                ? body.error.code
                : 'ACCESS_DENIED',
            method: request.method,
            path: request.path,
          },
        });
      } catch (error) {
        this.logger.error('Failed to persist access denial audit event', error);
      }
    }
    response.status(status).json(body);
  }
}
