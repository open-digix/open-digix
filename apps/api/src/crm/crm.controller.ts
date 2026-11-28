import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type { TenantContext } from '../identity/identity.types';
import { CurrentTenantContext } from '../identity/tenant-context.decorator';
import { RequireAppPermission } from '../identity/app-permission.decorator';
import {
  advanceInput,
  contactInput,
  customerInput,
  opportunityInput,
  pageInput,
  uuid,
  writeKey,
} from './crm.input';
import { CrmService } from './crm.service';
import type { CrmScope } from './crm.repository';

function scope(appId: string, context: TenantContext): CrmScope {
  return {
    tenantId: context.membership.tenant.id,
    appId: uuid(appId, 'appId'),
    membershipId: context.membership.id,
  };
}

@Controller('v1/apps/:appId')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('customers')
  @RequireAppPermission('crm.customers.customers.read')
  customers(
    @Param('appId') app: string,
    @CurrentTenantContext() ctx: TenantContext,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.crm.listCustomers(scope(app, ctx), pageInput(limit, cursor));
  }

  @Get('customers/:id')
  @RequireAppPermission('crm.customers.customers.read')
  customer(
    @Param('appId') app: string,
    @Param('id') id: string,
    @CurrentTenantContext() ctx: TenantContext,
  ) {
    return this.crm.customer(scope(app, ctx), uuid(id, 'id'));
  }

  @Post('customers')
  @RequireAppPermission('crm.customers.customers.create')
  createCustomer(
    @Param('appId') app: string,
    @CurrentTenantContext() ctx: TenantContext,
    @Headers('idempotency-key') key: unknown,
    @Body() body: unknown,
  ) {
    return this.crm.createCustomer(
      scope(app, ctx),
      writeKey(key),
      customerInput(body),
    );
  }

  @Get('customers/:id/contacts')
  @RequireAppPermission('crm.customers.contacts.read')
  contacts(
    @Param('appId') app: string,
    @Param('id') id: string,
    @CurrentTenantContext() ctx: TenantContext,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.crm.listContacts(
      scope(app, ctx),
      uuid(id, 'id'),
      pageInput(limit, cursor),
    );
  }

  @Post('customers/:id/contacts')
  @RequireAppPermission('crm.customers.contacts.create_contact')
  createContact(
    @Param('appId') app: string,
    @Param('id') id: string,
    @CurrentTenantContext() ctx: TenantContext,
    @Headers('idempotency-key') key: unknown,
    @Body() body: unknown,
  ) {
    return this.crm.createContact(
      scope(app, ctx),
      uuid(id, 'id'),
      writeKey(key),
      contactInput(body),
    );
  }

  @Get('opportunities')
  @RequireAppPermission('crm.opportunities.opportunities.read')
  opportunities(
    @Param('appId') app: string,
    @CurrentTenantContext() ctx: TenantContext,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.crm.listOpportunities(
      scope(app, ctx),
      pageInput(limit, cursor),
    );
  }

  @Get('opportunities/:id')
  @RequireAppPermission('crm.opportunities.opportunities.read')
  opportunity(
    @Param('appId') app: string,
    @Param('id') id: string,
    @CurrentTenantContext() ctx: TenantContext,
  ) {
    return this.crm.opportunity(scope(app, ctx), uuid(id, 'id'));
  }

  @Post('opportunities')
  @RequireAppPermission('crm.opportunities.opportunities.create')
  createOpportunity(
    @Param('appId') app: string,
    @CurrentTenantContext() ctx: TenantContext,
    @Headers('idempotency-key') key: unknown,
    @Body() body: unknown,
  ) {
    return this.crm.createOpportunity(
      scope(app, ctx),
      writeKey(key),
      opportunityInput(body),
    );
  }

  @Post('opportunities/:id/actions/advance')
  @HttpCode(200)
  @RequireAppPermission('crm.opportunities.opportunities.advance')
  advance(
    @Param('appId') app: string,
    @Param('id') id: string,
    @CurrentTenantContext() ctx: TenantContext,
    @Headers('idempotency-key') key: unknown,
    @Body() body: unknown,
  ) {
    return this.crm.advance(
      scope(app, ctx),
      uuid(id, 'id'),
      writeKey(key),
      advanceInput(body),
    );
  }
}
