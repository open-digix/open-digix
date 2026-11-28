import { REQUIRED_APP_PERMISSION } from '../identity/app-permission.decorator';
import { CrmController } from './crm.controller';

describe('CRM route permissions', () => {
  it.each([
    ['customers', 'crm.customers.customers.read'],
    ['customer', 'crm.customers.customers.read'],
    ['createCustomer', 'crm.customers.customers.create'],
    ['contacts', 'crm.customers.contacts.read'],
    ['contact', 'crm.customers.contacts.read'],
    ['createContact', 'crm.customers.contacts.create_contact'],
    ['opportunities', 'crm.opportunities.opportunities.read'],
    ['opportunity', 'crm.opportunities.opportunities.read'],
    ['createOpportunity', 'crm.opportunities.opportunities.create'],
    ['advance', 'crm.opportunities.opportunities.advance'],
  ] as const)('%s requires %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        REQUIRED_APP_PERMISSION,
        Object.getOwnPropertyDescriptor(CrmController.prototype, method)
          ?.value as object,
      ),
    ).toEqual({ permission, appIdParam: 'appId' });
  });
});
