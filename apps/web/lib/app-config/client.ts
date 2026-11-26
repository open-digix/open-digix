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
import { getTenantContext, apiCall, ApiError } from "../api/server";
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

export function getAppConfigApiMode(): "mock" | "api" {
  const mode = process.env.APP_CONFIG_API_MODE?.trim().toLowerCase();
  return mode === "api" ? "api" : "mock";
}

async function getRequiredTenantId(): Promise<string> {
  const ctx = await getTenantContext();
  if (!ctx?.currentTenant?.id) {
    throw new Error("Vui lòng chọn doanh nghiệp trước khi thao tác.");
  }
  return ctx.currentTenant.id;
}

/**
 * GET /v1/catalog/features
 */
export async function getCatalogFeatures(): Promise<CatalogResponse> {
  if (getAppConfigApiMode() === "api") {
    try {
      return await apiCall<CatalogResponse>("/v1/catalog/features");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return {
          catalogVersion: MOCK_CATALOG_VERSION,
          features: MOCK_CATALOG_FEATURES,
        };
      }
      throw err;
    }
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
    try {
      return await apiCall<PresetsResponse>("/v1/catalog/presets");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return {
          catalogVersion: MOCK_CATALOG_VERSION,
          presets: MOCK_CATALOG_PRESETS,
        };
      }
      throw err;
    }
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
