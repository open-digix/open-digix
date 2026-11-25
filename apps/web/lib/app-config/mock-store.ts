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
import { randomUUID } from "node:crypto";
import type {
  AppDraftDefinitionV25,
  AppSummary,
  CreateAppRequest,
  CreateAppResponse,
  DraftResponseV25,
  PatchDraftRequest,
  ValidateDraftIssue,
  ValidateDraftResponse,
} from "./types";
import { MOCK_CATALOG_FEATURES } from "./catalog-mock";
import { getMissingDependencies } from "./dependencies";

export interface StoredDraft {
  definition: AppDraftDefinitionV25;
  lockVersion: number;
  snapshotChecksum: string;
  updatedAt: string;
}

export interface TenantAppData {
  apps: AppSummary[];
  drafts: Map<string, StoredDraft>;
}

declare global {
  var __DIGIX_MOCK_APPS__: Map<string, TenantAppData> | undefined;
}

const mockStore: Map<string, TenantAppData> =
  globalThis.__DIGIX_MOCK_APPS__ ?? new Map<string, TenantAppData>();

globalThis.__DIGIX_MOCK_APPS__ = mockStore;

function initTenantStore(tenantId: string): TenantAppData {
  let data = mockStore.get(tenantId);
  if (!data) {
    data = {
      apps: [
        {
          appId: "a1000000-0000-4000-8000-000000000001",
          appKey: "erp_materials_sample",
          name: "ERP Quản lý vật tư mẫu",
          schemaVersion: "2.5",
          startingPoint: "erp",
          version: 1,
          status: "draft",
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          featureCount: 3,
          features: [
            { id: "erp.materials", version: 1 },
            { id: "erp.purchase_requests", version: 1 },
            { id: "erp.inventory", version: 1 },
          ],
        },
        {
          appId: "a1000000-0000-4000-8000-000000000002",
          appKey: "crm_sales_sample",
          name: "CRM Bán hàng mẫu",
          schemaVersion: "2.5",
          startingPoint: "crm",
          version: 1,
          status: "draft",
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
          featureCount: 2,
          features: [
            { id: "crm.customers", version: 1 },
            { id: "crm.opportunities", version: 1 },
          ],
        },
      ],
      drafts: new Map(),
    };

    // Seed corresponding drafts
    data.drafts.set("a1000000-0000-4000-8000-000000000001", {
      definition: {
        schemaVersion: "2.5",
        startingPoint: "erp",
        tenantId,
        appId: "a1000000-0000-4000-8000-000000000001",
        version: 1,
        name: "ERP Quản lý vật tư mẫu",
        features: [
          { id: "erp.materials", version: 1 },
          { id: "erp.purchase_requests", version: 1 },
          { id: "erp.inventory", version: 1 },
        ],
        roles: [],
        pages: [],
      },
      lockVersion: 1,
      snapshotChecksum: "mock-chk-001",
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    });

    data.drafts.set("a1000000-0000-4000-8000-000000000002", {
      definition: {
        schemaVersion: "2.5",
        startingPoint: "crm",
        tenantId,
        appId: "a1000000-0000-4000-8000-000000000002",
        version: 1,
        name: "CRM Bán hàng mẫu",
        features: [
          { id: "crm.customers", version: 1 },
          { id: "crm.opportunities", version: 1 },
        ],
        roles: [],
        pages: [],
      },
      lockVersion: 1,
      snapshotChecksum: "mock-chk-002",
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    });

    mockStore.set(tenantId, data);
  }
  return data;
}

export function listMockApps(tenantId: string): AppSummary[] {
  const data = initTenantStore(tenantId);
  return [...data.apps];
}

export function createMockApp(
  tenantId: string,
  req: CreateAppRequest,
): CreateAppResponse {
  const data = initTenantStore(tenantId);

  // Check duplicate appKey
  const exists = data.apps.some((a) => a.appKey === req.appKey);
  if (exists) {
    const error = new Error(`Mã ứng dụng "${req.appKey}" đã được sử dụng.`);
    (error as unknown as { code: string; status: number }).code = "APP_KEY_CONFLICT";
    (error as unknown as { status: number }).status = 409;
    throw error;
  }

  const appId = randomUUID();
  const now = new Date().toISOString();

  const definition: AppDraftDefinitionV25 = {
    schemaVersion: "2.5",
    startingPoint: req.startingPoint,
    tenantId,
    appId,
    version: 1,
    name: req.name,
    features: [],
    roles: [],
    pages: [],
  };

  const storedDraft: StoredDraft = {
    definition,
    lockVersion: 1,
    snapshotChecksum: `mock-chk-${Date.now()}`,
    updatedAt: now,
  };

  data.drafts.set(appId, storedDraft);

  const summary: AppSummary = {
    appId,
    appKey: req.appKey,
    name: req.name,
    schemaVersion: "2.5",
    startingPoint: req.startingPoint,
    version: 1,
    status: "draft",
    updatedAt: now,
    featureCount: 0,
    features: [],
  };

  data.apps.unshift(summary);

  return {
    appId,
    lockVersion: 1,
    draft: definition,
  };
}

export function getMockDraft(
  tenantId: string,
  appId: string,
): DraftResponseV25 {
  const data = initTenantStore(tenantId);
  const stored = data.drafts.get(appId);

  if (!stored) {
    const error = new Error("Không tìm thấy bản nháp ứng dụng.");
    (error as unknown as { status: number }).status = 404;
    throw error;
  }

  return {
    appId,
    definition: { ...stored.definition },
    lockVersion: stored.lockVersion,
    snapshotChecksum: stored.snapshotChecksum,
    updatedAt: stored.updatedAt,
  };
}

export function patchMockDraft(
  tenantId: string,
  appId: string,
  patch: PatchDraftRequest,
): DraftResponseV25 {
  const data = initTenantStore(tenantId);
  const stored = data.drafts.get(appId);

  if (!stored) {
    const error = new Error("Không tìm thấy bản nháp ứng dụng.");
    (error as unknown as { status: number }).status = 404;
    throw error;
  }

  if (patch.lockVersion !== stored.lockVersion) {
    const error = new Error(
      "Bản nháp đã được chỉnh sửa bởi phiên khác. Vui lòng tải lại trang.",
    );
    (error as unknown as { status: number; code: string }).status = 409;
    (error as unknown as { code: string }).code = "CONCURRENCY_CONFLICT";
    throw error;
  }

  const now = new Date().toISOString();
  if (patch.name !== undefined) stored.definition.name = patch.name;
  if (patch.startingPoint !== undefined)
    stored.definition.startingPoint = patch.startingPoint;
  if (patch.features !== undefined) stored.definition.features = patch.features;
  if (patch.roles !== undefined) stored.definition.roles = patch.roles;
  if (patch.pages !== undefined) stored.definition.pages = patch.pages;
  if (patch.workflows !== undefined)
    stored.definition.workflows = patch.workflows;

  stored.lockVersion += 1;
  stored.updatedAt = now;
  stored.snapshotChecksum = `mock-chk-${Date.now()}`;

  // Update summary in app list
  const appSummary = data.apps.find((a) => a.appId === appId);
  if (appSummary) {
    if (patch.name !== undefined) appSummary.name = patch.name;
    if (patch.startingPoint !== undefined)
      appSummary.startingPoint = patch.startingPoint;
    if (patch.features !== undefined) {
      appSummary.features = patch.features;
      appSummary.featureCount = patch.features.length;
    }
    appSummary.updatedAt = now;
  }

  return {
    appId,
    definition: { ...stored.definition },
    lockVersion: stored.lockVersion,
    snapshotChecksum: stored.snapshotChecksum,
    updatedAt: stored.updatedAt,
  };
}

export function validateMockDraft(
  tenantId: string,
  appId: string,
): ValidateDraftResponse {
  const data = initTenantStore(tenantId);
  const stored = data.drafts.get(appId);

  if (!stored) {
    const error = new Error("Không tìm thấy bản nháp ứng dụng.");
    (error as unknown as { status: number }).status = 404;
    throw error;
  }

  const issues: ValidateDraftIssue[] = [];
  const features = stored.definition.features || [];

  // Check empty features
  if (features.length === 0) {
    issues.push({
      code: "EMPTY_FEATURES",
      path: "/features",
      message: "Chưa thể xuất bản: cần chọn ít nhất một chức năng.",
    });
  }

  // Check missing dependencies
  const selectedIds = features.map((f) => f.id);
  const missing = getMissingDependencies(selectedIds, MOCK_CATALOG_FEATURES);

  for (const depId of missing) {
    const dependent = features.find((f) => {
      const feat = MOCK_CATALOG_FEATURES.find((c) => c.id === f.id);
      return feat?.dependencies.includes(depId);
    });
    const idx = dependent ? features.indexOf(dependent) : 0;
    issues.push({
      code: "MISSING_DEPENDENCY",
      path: `/features/${idx}`,
      message: `Thiếu chức năng phụ thuộc "${depId}" cho chức năng đã chọn.`,
    });
  }

  return {
    valid: issues.length === 0,
    snapshotChecksum: stored.snapshotChecksum,
    issues,
  };
}
