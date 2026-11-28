import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmRepository, type CrmScope } from './crm.repository';
import type {
  advanceInput,
  contactInput,
  customerInput,
  opportunityInput,
} from './crm.input';

type Customer = ReturnType<typeof customerInput>;
type Contact = ReturnType<typeof contactInput>;
type Opportunity = ReturnType<typeof opportunityInput>;
type Advance = ReturnType<typeof advanceInput>;

@Injectable()
export class CrmService {
  constructor(private readonly repository: CrmRepository) {}

  async listCustomers(
    scope: CrmScope,
    page: { limit: number; cursor: readonly [string, string] | null },
  ) {
    await this.repository.version(scope, 'crm.customers');
    return this.repository.list('customers', scope, page);
  }

  async customer(scope: CrmScope, id: string) {
    await this.repository.version(scope, 'crm.customers');
    return this.repository.detail('customers', scope, id);
  }

  async createCustomer(scope: CrmScope, key: string, input: Customer) {
    return this.repository.write(
      scope,
      'crm.customers.create',
      key,
      input,
      async (client) => {
        const version = await this.repository.version(
          scope,
          'crm.customers',
          client,
        );
        return this.repository.createCustomer(client, scope, version, input);
      },
    );
  }

  async listContacts(
    scope: CrmScope,
    id: string,
    page: { limit: number; cursor: readonly [string, string] | null },
  ) {
    await this.repository.version(scope, 'crm.customers');
    return this.repository.contacts(scope, id, page);
  }

  async createContact(
    scope: CrmScope,
    id: string,
    key: string,
    input: Contact,
  ) {
    return this.repository.write(
      scope,
      'crm.contacts.create',
      key,
      { id, ...input },
      async (client) => {
        const version = await this.repository.version(
          scope,
          'crm.customers',
          client,
        );
        return this.repository.createContact(client, scope, version, id, input);
      },
    );
  }

  async listOpportunities(
    scope: CrmScope,
    page: { limit: number; cursor: readonly [string, string] | null },
  ) {
    await this.repository.version(scope, 'crm.opportunities');
    return this.repository.list('opportunities', scope, page);
  }

  async opportunity(scope: CrmScope, id: string) {
    await this.repository.version(scope, 'crm.opportunities');
    const row = await this.repository.detail('opportunities', scope, id);
    return { ...row, history: await this.repository.history(scope, id) };
  }

  async createOpportunity(scope: CrmScope, key: string, input: Opportunity) {
    return this.repository.write(
      scope,
      'crm.opportunities.create',
      key,
      input,
      async (client) => {
        const version = await this.repository.version(
          scope,
          'crm.opportunities',
          client,
        );
        // The customer must be in this app even if created under an older version.
        const customer = await client.query(
          `SELECT 1 FROM customers WHERE tenant_id = $1 AND application_id = $2 AND id = $3`,
          [scope.tenantId, scope.appId, input.customerId],
        );
        if (!customer.rowCount)
          throw new NotFoundException({
            error: { code: 'CRM_NOT_FOUND', message: 'Resource not found.' },
          });
        if (input.assigneeId) {
          const assignee = await client.query(
            `SELECT 1 FROM app_membership_roles r
           JOIN tenant_memberships m ON m.tenant_id = r.tenant_id AND m.id = r.membership_id
           WHERE r.tenant_id = $1 AND r.application_id = $2
             AND r.membership_id = $3 AND m.status = 'active' LIMIT 1`,
            [scope.tenantId, scope.appId, input.assigneeId],
          );
          if (!assignee.rowCount)
            throw new NotFoundException({
              error: { code: 'CRM_NOT_FOUND', message: 'Resource not found.' },
            });
        }
        return this.repository.createOpportunity(client, scope, version, input);
      },
    );
  }

  async advance(scope: CrmScope, id: string, key: string, input: Advance) {
    return this.repository.write(
      scope,
      'crm.opportunities.advance',
      key,
      { id, ...input },
      async (client) => {
        await this.repository.version(scope, 'crm.opportunities', client);
        return this.repository.advance(
          client,
          scope,
          id,
          input.expectedStage,
          input.expectedVersion,
        );
      },
    );
  }
}
