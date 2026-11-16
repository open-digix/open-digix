import type { BuilderApplicationDefinitionV1 } from '../builder.types';

export const purchaseValidFixture: BuilderApplicationDefinitionV1 = {
  schemaVersion: '1.0',
  appId: 'purchase-request',
  tenantId: 'acme',
  version: 1,
  name: 'Purchase Request',
  roles: ['requester', 'manager', 'finance'],
  fields: [
    { id: 'item_name', type: 'string', required: true },
    { id: 'amount', type: 'integer', required: true, min: 1 },
    {
      id: 'manager_decision',
      type: 'enum',
      required: false,
      options: ['approved', 'rejected'],
    },
    {
      id: 'finance_decision',
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
    { id: 'manager_route', type: 'gateway' },
    {
      id: 'finance_review',
      type: 'task',
      role: 'finance',
      decisionField: 'finance_decision',
      noSelfApproval: true,
    },
    { id: 'finance_route', type: 'gateway' },
    { id: 'accepted', type: 'end', endState: 'approved' },
    { id: 'declined', type: 'end', endState: 'rejected' },
  ],
  transitions: [
    { from: 'submitted', to: 'manager_review' },
    { from: 'manager_review', to: 'manager_route' },
    {
      from: 'manager_route',
      to: 'finance_review',
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
    { from: 'finance_review', to: 'finance_route' },
    {
      from: 'finance_route',
      to: 'accepted',
      when: {
        all: [{ field: 'finance_decision', op: 'eq', value: 'approved' }],
      },
    },
    {
      from: 'finance_route',
      to: 'declined',
      when: {
        all: [{ field: 'finance_decision', op: 'eq', value: 'rejected' }],
      },
    },
  ],
};
