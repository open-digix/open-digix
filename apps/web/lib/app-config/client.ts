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
import { getTenantContext, apiCall } from "../api/server";
import type {
  AppSummary,
  CatalogResponse,
  CreateAppRequest,
  CreateAppResponse,
  DraftResponseV25,
  PatchDraftRequest,
  PresetsResponse,
  ValidateDraftResponse,
} from "./types";
import {
  MOCK_CATALOG_FEATURES,
  MOCK_CATALOG_PRESETS,
  MOCK_CATALOG_VERSION,
} from "./catalog-mock";
import {
  createMockApp,
  getMockDraft,
  listMockApps,
  patchMockDraft,
  validateMockDraft,
} from "./mock-store";
import { getRuntimeSync } from "../app-runtime/fixtures";
import type { PublishedAppV25 } from "../app-runtime/types";

export function getAppConfigApiMode(): "mock" | "api" {
  const mode = process.env.APP_CONFIG_API_MODE?.trim().toLowerCase();
  return mode === "api" ? "api" : "mock";
}

async function getRequiredTenantId(): Promise<string> {
  const ctx = await getTenantContext();
  if (!ctx?.currentTenant?.id) {
    if (getAppConfigApiMode() === "mock") {
      return "mock-tenant-default";
    }
    throw new Error("Vui lòng chọn doanh nghiệp trước khi thao tác.");
  }
  return ctx.currentTenant.id;
}

/**
 * GET /v1/catalog/features
 */
export async function getCatalogFeatures(): Promise<CatalogResponse> {
  if (getAppConfigApiMode() === "api") {
    return apiCall<CatalogResponse>("/v1/catalog/features");
  }

  return {
    catalogVersion: MOCK_CATALOG_VERSION,
    features: MOCK_CATALOG_FEATURES,
  };
}

/**
 * GET /v1/catalog/presets
 */
export async function getPresets(): Promise<PresetsResponse> {
  if (getAppConfigApiMode() === "api") {
    return apiCall<PresetsResponse>("/v1/catalog/presets");
  }

  return {
    catalogVersion: MOCK_CATALOG_VERSION,
    presets: MOCK_CATALOG_PRESETS,
  };
}

/**
 * GET /v1/apps
 */
export async function listApps(): Promise<AppSummary[]> {
  const tenantId = await getRequiredTenantId();

  if (getAppConfigApiMode() === "api") {
    return apiCall<AppSummary[]>("/v1/apps");
  }

  return listMockApps(tenantId);
}

/**
 * GET /v1/apps/:appId/runtime
 */
export async function getRuntime(
  appId: string,
  options?: { userRoles?: string[] }
): Promise<PublishedAppV25 | null> {
  await getRequiredTenantId();

  if (getAppConfigApiMode() === "api") {
    try {
      return await apiCall<PublishedAppV25>(
        `/v1/apps/${encodeURIComponent(appId)}/runtime`
      );
    } catch {
      return null;
    }
  }

  // Mock implementation with role filtering
  const roles = options?.userRoles;

  // ERP A
  if (
    appId === "11111111-1111-4111-8111-111111111111" ||
    appId === "erp-a" ||
    appId === "erp"
  ) {
    if (
      roles &&
      roles.length > 0 &&
      !roles.some((r) =>
        [
          "buyer",
          "approver",
          "warehouse",
          "admin",
          "owner",
          "tenant_admin",
          "manager",
          "employee",
        ].includes(r)
      )
    ) {
      return null;
    }
    return getRuntimeSync("erp-a");
  }

  // CRM A
  if (
    appId === "22222222-2222-4222-8222-222222222222" ||
    appId === "crm-a" ||
    appId === "crm"
  ) {
    if (
      roles &&
      roles.length > 0 &&
      !roles.some((r) =>
        [
          "sales",
          "sales_rep",
          "admin",
          "owner",
          "tenant_admin",
          "designer",
          "employee",
          "manager",
        ].includes(r)
      )
    ) {
      return null;
    }
    return getRuntimeSync("crm-a");
  }

  return getRuntimeSync(appId);
}

/**
 * POST /v1/apps
 * Sends { schemaVersion: "2.5", name, appKey, startingPoint?, presetVersion? }
 */
export async function createApp(
  req: CreateAppRequest,
): Promise<CreateAppResponse> {
  const tenantId = await getRequiredTenantId();

  if (getAppConfigApiMode() === "api") {
    return apiCall<CreateAppResponse>("/v1/apps", {
      method: "POST",
      body: req,
    });
  }

  return createMockApp(tenantId, req);
}

/**
 * GET /v1/apps/:appId/drafts/:version
 * Version defaults to 1 for v2.5
 */
export async function getDraft(
  appId: string,
  version = 1,
): Promise<DraftResponseV25> {
  const tenantId = await getRequiredTenantId();

  if (getAppConfigApiMode() === "api") {
    return apiCall<DraftResponseV25>(`/v1/apps/${appId}/drafts/${version}`);
  }

  return getMockDraft(tenantId, appId);
}

/**
 * PATCH /v1/apps/:appId/drafts/:version
 */
export async function patchDraft(
  appId: string,
  patch: PatchDraftRequest,
  version = 1,
): Promise<DraftResponseV25> {
  const tenantId = await getRequiredTenantId();

  if (getAppConfigApiMode() === "api") {
    return apiCall<DraftResponseV25>(`/v1/apps/${appId}/drafts/${version}`, {
      method: "PATCH",
      body: patch,
    });
  }

  return patchMockDraft(tenantId, appId, patch);
}

/**
 * POST /v1/apps/:appId/drafts/:version/validate
 */
export async function validateDraft(
  appId: string,
  version = 1,
): Promise<ValidateDraftResponse> {
  const tenantId = await getRequiredTenantId();

  if (getAppConfigApiMode() === "api") {
    return apiCall<ValidateDraftResponse>(
      `/v1/apps/${appId}/drafts/${version}/validate`,
      {
        method: "POST",
      },
    );
  }

  return validateMockDraft(tenantId, appId);
}
