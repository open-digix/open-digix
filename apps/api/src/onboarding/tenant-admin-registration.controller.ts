import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { parseTenantAdminRegistrationBody } from './tenant-admin-registration.input';
import { TenantAdminRegistrationService } from './tenant-admin-registration.service';

export interface TenantAdminRegistrationResponse {
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly username: string;
}

@Controller('v1/public')
export class TenantAdminRegistrationController {
  constructor(private readonly registration: TenantAdminRegistrationService) {}

  @Post('tenant-registrations')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: unknown,
  ): Promise<TenantAdminRegistrationResponse> {
    const input = parseTenantAdminRegistrationBody(body);
    const created = await this.registration.register(input);

    return {
      tenantId: created.tenantId,
      tenantSlug: created.tenantSlug,
      username: created.username,
    };
  }
}
