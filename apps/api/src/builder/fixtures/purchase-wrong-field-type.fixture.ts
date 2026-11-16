import type { BuilderApplicationDefinitionV1 } from '../builder.types';

export const purchaseWrongFieldTypeFixture: BuilderApplicationDefinitionV1 = {
  schemaVersion: '1.0',
  appId: 'purchase-request',
  tenantId: 'acme',
  version: 1,
  name: 'Purchase Request',
  roles: ['requester', 'manager'],
  fields: [
    { id: 'item_name', type: 'string', required: true },
    { id: 'manager_decision', type: 'string', required: false },
  ],
  steps: [
    { id: 'submitted', type: 'start' },
    {
      id: 'manager_review',
      type: 'task',
      role: 'manager',
      decisionField: 'manager_decision',
      noSelfApproval: true,
    },
    { id: 'manager_route', type: 'gateway' },
    { id: 'accepted', type: 'end', endState: 'approved' },
    { id: 'declined', type: 'end', endState: 'rejected' },
  ],
  transitions: [
    { from: 'submitted', to: 'manager_review' },
    { from: 'manager_review', to: 'manager_route' },
    {
      from: 'manager_route',
      to: 'accepted',
      when: {
        all: [{ field: 'manager_decision', op: 'eq', value: 'approved' }],
      },
    },
    {
      from: 'manager_route',
      to: 'declined',
      when: {
        all: [{ field: 'manager_decision', op: 'eq', value: 'rejected' }],
      },
    },
  ],
};
