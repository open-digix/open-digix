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

import "server-only";
import type { CatalogFeature, CatalogPreset } from "./types";
import { FEATURE_LABELS, PRESET_LABELS } from "./feature-labels";

export const MOCK_CATALOG_VERSION = "2026-11-v2.5-demo";

export const MOCK_CATALOG_FEATURES: CatalogFeature[] = [
  {
    id: "erp.materials",
    version: 1,
    domain: "erp",
    dependencies: [],
    resources: ["materials"],
    actions: [
      { resource: "materials", action: "create", permission: "erp.materials.materials.create" },
      { resource: "materials", action: "read", permission: "erp.materials.materials.read" },
      { resource: "materials", action: "update_note", permission: "erp.materials.materials.update_note" },
    ],
    permissions: [
      "erp.materials.materials.create",
      "erp.materials.materials.read",
      "erp.materials.materials.update_note",
    ],
    components: ["form", "table", "detail", "action"],
    status: "supported",
    label: FEATURE_LABELS["erp.materials"]?.label,
    description: FEATURE_LABELS["erp.materials"]?.description,
  },
  {
    id: "erp.purchase_requests",
    version: 1,
    domain: "erp",
    dependencies: ["erp.materials"],
    resources: ["requests"],
    actions: [
      { resource: "requests", action: "create", permission: "erp.purchase_requests.requests.create" },
      { resource: "requests", action: "read", permission: "erp.purchase_requests.requests.read" },
      { resource: "requests", action: "submit", permission: "erp.purchase_requests.requests.submit" },
      { resource: "requests", action: "approve", permission: "erp.purchase_requests.requests.approve" },
      { resource: "requests", action: "reject", permission: "erp.purchase_requests.requests.reject" },
    ],
    permissions: [
      "erp.purchase_requests.requests.create",
      "erp.purchase_requests.requests.read",
      "erp.purchase_requests.requests.submit",
      "erp.purchase_requests.requests.approve",
      "erp.purchase_requests.requests.reject",
    ],
    components: ["form", "table", "detail", "action"],
    status: "supported",
    label: FEATURE_LABELS["erp.purchase_requests"]?.label,
    description: FEATURE_LABELS["erp.purchase_requests"]?.description,
  },
  {
    id: "erp.inventory",
    version: 1,
    domain: "erp",
    dependencies: ["erp.materials"],
    resources: ["receipts", "stock"],
    actions: [
      { resource: "receipts", action: "receive", permission: "erp.inventory.receipts.receive" },
      { resource: "receipts", action: "read", permission: "erp.inventory.receipts.read" },
      { resource: "stock", action: "read", permission: "erp.inventory.stock.read" },
    ],
    permissions: [
      "erp.inventory.receipts.receive",
      "erp.inventory.receipts.read",
      "erp.inventory.stock.read",
    ],
    components: ["form", "table", "detail", "action"],
    status: "supported",
    label: FEATURE_LABELS["erp.inventory"]?.label,
    description: FEATURE_LABELS["erp.inventory"]?.description,
  },
  {
    id: "crm.customers",
    version: 1,
    domain: "crm",
    dependencies: [],
    resources: ["customers", "contacts"],
    actions: [
      { resource: "customers", action: "create", permission: "crm.customers.customers.create" },
      { resource: "customers", action: "read", permission: "crm.customers.customers.read" },
      { resource: "contacts", action: "create_contact", permission: "crm.customers.contacts.create_contact" },
      { resource: "contacts", action: "read", permission: "crm.customers.contacts.read" },
    ],
    permissions: [
      "crm.customers.customers.create",
      "crm.customers.customers.read",
      "crm.customers.contacts.create_contact",
      "crm.customers.contacts.read",
    ],
    components: ["form", "table", "detail", "action"],
    status: "supported",
    label: FEATURE_LABELS["crm.customers"]?.label,
    description: FEATURE_LABELS["crm.customers"]?.description,
  },
  {
    id: "crm.opportunities",
    version: 1,
    domain: "crm",
    dependencies: ["crm.customers"],
    resources: ["opportunities"],
    actions: [
      { resource: "opportunities", action: "create", permission: "crm.opportunities.opportunities.create" },
      { resource: "opportunities", action: "read", permission: "crm.opportunities.opportunities.read" },
      { resource: "opportunities", action: "advance", permission: "crm.opportunities.opportunities.advance" },
    ],
    permissions: [
      "crm.opportunities.opportunities.create",
      "crm.opportunities.opportunities.read",
      "crm.opportunities.opportunities.advance",
    ],
    components: ["form", "table", "detail", "action"],
    status: "supported",
    label: FEATURE_LABELS["crm.opportunities"]?.label,
    description: FEATURE_LABELS["crm.opportunities"]?.description,
  },
];

export const MOCK_CATALOG_PRESETS: CatalogPreset[] = [
  {
    id: "erp",
    version: 1,
    suggestedFeatures: [
      "erp.materials",
      "erp.purchase_requests",
      "erp.inventory",
    ],
    label: PRESET_LABELS.erp.label,
    description: PRESET_LABELS.erp.description,
  },
  {
    id: "crm",
    version: 1,
    suggestedFeatures: [
      "crm.customers",
      "crm.opportunities",
    ],
    label: PRESET_LABELS.crm.label,
    description: PRESET_LABELS.crm.description,
  },
  {
    id: "blank",
    version: 1,
    suggestedFeatures: [],
    label: PRESET_LABELS.blank.label,
    description: PRESET_LABELS.blank.description,
  },
];
