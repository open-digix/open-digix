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

// NGUỒN GỐC: Chép từ docs/examples/*-v2.5.json, phục vụ MẪU THỬ (PREVIEW) và runtime độc lập.
import erpAJson from "./fixtures/erp-a-app-v2.5.json";
import crmAJson from "./fixtures/crm-a-app-v2.5.json";
import crmBJson from "./fixtures/crm-b-app-v2.5.json";
import hybridJson from "./fixtures/hybrid-app-v2.5.json";
import type { PublishedAppV25 } from "./types";

export const FIXTURE_ERP_A = erpAJson as unknown as PublishedAppV25;
export const FIXTURE_CRM_A = crmAJson as unknown as PublishedAppV25;
export const FIXTURE_CRM_B = crmBJson as unknown as PublishedAppV25;
export const FIXTURE_HYBRID = hybridJson as unknown as PublishedAppV25;

export interface FixtureMeta {
  id: string;
  name: string;
  filename: string;
  app: PublishedAppV25;
}

export const FIXTURE_METAS: FixtureMeta[] = [
  {
    id: "erp-a",
    name: "ERP A - Vật tư và mua hàng",
    filename: "erp-a-app-v2.5.json",
    app: FIXTURE_ERP_A,
  },
  {
    id: "crm-a",
    name: "CRM A - Khách hàng đội kinh doanh",
    filename: "crm-a-app-v2.5.json",
    app: FIXTURE_CRM_A,
  },
  {
    id: "crm-b",
    name: "CRM B - Khách hàng và cơ hội",
    filename: "crm-b-app-v2.5.json",
    app: FIXTURE_CRM_B,
  },
  {
    id: "hybrid",
    name: "Hybrid - Khách hàng và vật tư",
    filename: "hybrid-app-v2.5.json",
    app: FIXTURE_HYBRID,
  },
];
