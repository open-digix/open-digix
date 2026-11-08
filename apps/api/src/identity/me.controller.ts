import {
  Controller,
  Get,
  Headers,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { IdentityContextService } from './identity-context.service';
import type { MeResponse } from './identity.types';

@Controller('v1/me')
export class MeController {
  constructor(private readonly identityContext: IdentityContextService) {}

  @Get()
  getMe(
    @Req() request: AuthenticatedRequest,
    @Headers('x-tenant-id') tenantId?: string,
  ): Promise<MeResponse> {
    const identity = request.authenticatedIdentity;
    if (!identity) {
      throw new UnauthorizedException({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'A Bearer access token is required.',
        },
      });
    }

    return this.identityContext.getMe(identity, tenantId);
  }
}
