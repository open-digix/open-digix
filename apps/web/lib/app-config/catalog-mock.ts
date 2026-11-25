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
    actions: ["create", "read", "update_note"],
    permissions: ["materials.create", "materials.read", "materials.update_note"],
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
    actions: ["create", "read", "submit", "approve", "reject"],
    permissions: [
      "requests.create",
      "requests.read",
      "requests.submit",
      "requests.approve",
      "requests.reject",
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
    actions: ["receive", "read"],
    permissions: ["receipts.receive", "receipts.read", "stock.read"],
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
    actions: ["create", "read", "create_contact"],
    permissions: [
      "customers.create",
      "customers.read",
      "contacts.create_contact",
      "contacts.read",
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
    actions: ["create", "read", "advance"],
    permissions: [
      "opportunities.create",
      "opportunities.read",
      "opportunities.advance",
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
    suggestedFeatures: ["crm.customers", "crm.opportunities"],
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
