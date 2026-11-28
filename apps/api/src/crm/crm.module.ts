import { Module, NotImplementedException, OnModuleInit } from '@nestjs/common';
import { FeatureModuleModule } from '../feature-modules/feature-module.module';
import { FeatureModuleRegistry } from '../feature-modules/feature-module.registry';
import { CrmController } from './crm.controller';
import { CrmRepository } from './crm.repository';
import { CrmService } from './crm.service';

@Module({
  imports: [FeatureModuleModule],
  controllers: [CrmController],
  providers: [CrmRepository, CrmService],
})
export class CrmModule implements OnModuleInit {
  constructor(private readonly registry: FeatureModuleRegistry) {}

  onModuleInit(): void {
    this.registry.register({
      featureId: 'crm.customers',
      version: 1,
      route: '/v1/apps/:appId/customers',
      permissions: [
        'crm.customers.customers.create',
        'crm.customers.customers.read',
        'crm.customers.contacts.create_contact',
        'crm.customers.contacts.read',
      ],
      metric: 'crm.customers.count',
      handler: () =>
        Promise.reject(
          new NotImplementedException('Use the scoped CRM API routes.'),
        ),
    });
    this.registry.register({
      featureId: 'crm.opportunities',
      version: 1,
      route: '/v1/apps/:appId/opportunities',
      permissions: [
        'crm.opportunities.opportunities.create',
        'crm.opportunities.opportunities.read',
        'crm.opportunities.opportunities.advance',
      ],
      metric: 'crm.opportunities.count',
      handler: () =>
        Promise.reject(
          new NotImplementedException('Use the scoped CRM API routes.'),
        ),
    });
  }
}
