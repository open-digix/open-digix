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

import type { CatalogFeature, CatalogPreset } from './catalog.types';

const feature = <T extends CatalogFeature>(value: T): T => Object.freeze(value);

export const CATALOG_FEATURES = Object.freeze([
  feature({
    id: 'erp.materials',
    version: 1,
    domain: 'erp',
    resources: ['materials'],
    actions: ['materials.create', 'materials.read', 'materials.update_note'],
    permissions: [
      'erp.materials.create',
      'erp.materials.read',
      'erp.materials.update_note',
    ],
    dependencies: [],
    components: ['form', 'table', 'detail', 'action'],
    status: 'supported',
  }),
  feature({
    id: 'erp.purchase_requests',
    version: 1,
    domain: 'erp',
    resources: ['purchase_requests', 'purchase_request_lines'],
    actions: [
      'requests.create',
      'requests.read',
      'requests.submit',
      'requests.approve',
      'requests.reject',
    ],
    permissions: [
      'erp.purchase_requests.create',
      'erp.purchase_requests.read',
      'erp.purchase_requests.submit',
      'erp.purchase_requests.approve',
      'erp.purchase_requests.reject',
    ],
    dependencies: ['erp.materials'],
    components: ['form', 'table', 'detail', 'action'],
    status: 'supported',
  }),
  feature({
    id: 'erp.inventory',
    version: 1,
    domain: 'erp',
    resources: ['inventory_receipts', 'inventory_receipt_lines', 'stock'],
    actions: ['receipts.receive', 'receipts.read', 'stock.read'],
    permissions: [
      'erp.inventory.receive',
      'erp.inventory.read',
      'erp.inventory.stock_read',
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
      'customers.create',
      'customers.read',
      'contacts.create_contact',
      'contacts.read',
    ],
    permissions: [
      'crm.customers.create',
      'crm.customers.read',
      'crm.customers.create_contact',
      'crm.customers.contacts_read',
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
      'opportunities.create',
      'opportunities.read',
      'opportunities.advance',
    ],
    permissions: [
      'crm.opportunities.create',
      'crm.opportunities.read',
      'crm.opportunities.advance',
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
