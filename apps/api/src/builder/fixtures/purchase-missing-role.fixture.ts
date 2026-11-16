import type { BuilderApplicationDefinitionV1 } from '../builder.types';

export const purchaseMissingRoleFixture: BuilderApplicationDefinitionV1 = {
  schemaVersion: '1.0',
  appId: 'purchase-request',
  tenantId: 'acme',
  version: 1,
  name: 'Purchase Request',
  roles: ['requester'],
  fields: [
    { id: 'item_name', type: 'string', required: true },
    {
      id: 'manager_decision',
      type: 'enum',
      required: false,
      options: ['approved', 'rejected'],
    },
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
    { id: 'accepted', type: 'end', endState: 'approved' },
    { id: 'declined', type: 'end', endState: 'rejected' },
  ],
  transitions: [
    { from: 'submitted', to: 'manager_review' },
    { from: 'manager_review', to: 'accepted' },
  ],
};
