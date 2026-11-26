/*
 * Copyright 2026 DigiX Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  CatalogAction,
  CatalogFeature,
  CatalogPreset,
} from './catalog.types';

const action = (
  featureId: string,
  resource: string,
  actionName: string,
): CatalogAction => ({
  resource,
  action: actionName,
  permission: `${featureId}.${resource}.${actionName}`,
});

const feature = (value: Omit<CatalogFeature, 'permissions'>): CatalogFeature =>
  Object.freeze({
    ...value,
    permissions: [
      ...new Set(value.actions.map(({ permission }) => permission)),
    ],
  });

export const CATALOG_FEATURES = Object.freeze([
  feature({
    id: 'erp.materials',
    version: 1,
    domain: 'erp',
    resources: ['materials'],
    actions: [
      action('erp.materials', 'materials', 'create'),
      action('erp.materials', 'materials', 'read'),
      action('erp.materials', 'materials', 'update_note'),
    ],
    dependencies: [],
    components: ['form', 'table', 'detail', 'action'],
    status: 'supported',
  }),
  feature({
    id: 'erp.purchase_requests',
    version: 1,
    domain: 'erp',
    resources: ['requests'],
    actions: [
      action('erp.purchase_requests', 'requests', 'create'),
      action('erp.purchase_requests', 'requests', 'read'),
      action('erp.purchase_requests', 'requests', 'submit'),
      action('erp.purchase_requests', 'requests', 'approve'),
      action('erp.purchase_requests', 'requests', 'reject'),
    ],
    dependencies: ['erp.materials'],
    components: ['form', 'table', 'detail', 'action'],
    status: 'supported',
  }),
  feature({
    id: 'erp.inventory',
    version: 1,
    domain: 'erp',
    resources: ['receipts', 'stock'],
    actions: [
      action('erp.inventory', 'receipts', 'receive'),
      action('erp.inventory', 'receipts', 'read'),
      action('erp.inventory', 'stock', 'read'),
    ],
    dependencies: ['erp.materials'],
    components: ['table', 'detail', 'metric', 'action'],
    status: 'supported',
  }),
  feature({
    id: 'crm.customers',
    version: 1,
    domain: 'crm',
    resources: ['customers', 'contacts'],
    actions: [
      action('crm.customers', 'customers', 'create'),
      action('crm.customers', 'customers', 'read'),
      action('crm.customers', 'contacts', 'create_contact'),
      action('crm.customers', 'contacts', 'read'),
    ],
    dependencies: [],
    components: ['form', 'table', 'detail', 'action'],
    status: 'supported',
  }),
  feature({
    id: 'crm.opportunities',
    version: 1,
    domain: 'crm',
    resources: ['opportunities'],
    actions: [
      action('crm.opportunities', 'opportunities', 'create'),
      action('crm.opportunities', 'opportunities', 'read'),
      action('crm.opportunities', 'opportunities', 'advance'),
    ],
    dependencies: ['crm.customers'],
    components: ['form', 'table', 'detail', 'metric', 'action'],
    status: 'supported',
  }),
] satisfies readonly CatalogFeature[]);

export const CATALOG_PRESETS = Object.freeze([
  {
    id: 'erp',
    version: 1,
    suggestedFeatures: [
      'erp.materials',
      'erp.purchase_requests',
      'erp.inventory',
    ],
  },
  {
    id: 'crm',
    version: 1,
    suggestedFeatures: ['crm.customers', 'crm.opportunities'],
  },
  {
    id: 'blank',
    version: 1,
    suggestedFeatures: [],
  },
] satisfies readonly CatalogPreset[]);
