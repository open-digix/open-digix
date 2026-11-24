import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { parseTenantAdminRegistrationBody } from './tenant-admin-registration.input';
import { TenantAdminRegistrationService } from './tenant-admin-registration.service';

export interface TenantAdminRegistrationResponse {
  readonly tenantId: string;
  readonly membershipId: string;
  readonly status: 'created';
  readonly role: 'tenant_admin';
}

@Controller('v1/onboarding')
export class TenantAdminRegistrationController {
  constructor(private readonly registration: TenantAdminRegistrationService) {}

  @Post('tenant-admin')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: unknown,
  ): Promise<TenantAdminRegistrationResponse> {
    const input = parseTenantAdminRegistrationBody(body);
    const created = await this.registration.register(input);

    return {
      tenantId: created.tenantId,
      membershipId: created.membershipId,
      status: 'created',
      role: 'tenant_admin',
    };
  }
}
