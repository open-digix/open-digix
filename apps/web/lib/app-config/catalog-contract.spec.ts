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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fixtureData from "./__fixtures__/catalog-api-2026-11-27.json";
import {
  MOCK_CATALOG_FEATURES,
  MOCK_CATALOG_PRESETS,
  MOCK_CATALOG_VERSION,
} from "./catalog-mock";
import type { CatalogResponse, PresetsResponse } from "./types";
import { getCatalogFeatures, getPresets } from "./client";
import { createAppWithFeaturesAction } from "./actions";
import { ApiError } from "../api/server";

vi.mock("../api/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/server")>();
  return {
    ...actual,
    getTenantContext: vi.fn().mockResolvedValue({
      currentTenant: { id: "tenant-mau-thu-uuid", name: "Doanh nghiệp mẫu thử" },
      roles: ["designer"],
    }),
    apiCall: vi.fn(),
  };
});

describe("Catalog & API v2.5 Contract Verification", () => {
  const originalEnv = process.env.APP_CONFIG_API_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.APP_CONFIG_API_MODE = originalEnv;
  });

  describe("Live API Gateway Fixture (2026-11-27)", () => {
    it("documents live getMe endpoint returning 200 with sanitized demo user & active designer membership", () => {
      const { getMe } = fixtureData.endpoints;
      expect(getMe.status).toBe(200);
      expect(getMe.response.user.id).toContain("mau-thu");
      expect(getMe.response.user.subject).toContain("mau-thu");
      expect(getMe.response.memberships[0].id).toContain("mau-thu");
      expect(getMe.response.memberships[0].tenant.id).toContain("mau-thu");
      expect(getMe.response.memberships[0].roles).toContain("designer");
    });

    it("documents backend live CatalogController returning 200 for /v1/catalog/features with valid permission format", () => {
      const { getCatalogFeatures: catalogFeat } = fixtureData.endpoints;
      expect(catalogFeat.status).toBe(200);
      expect(catalogFeat.response.catalogVersion).toBe("2026-11-demo-1");
      expect(catalogFeat.response.features).toHaveLength(5);

      // Verify permission format: <featureId>.<resource>.<action>
      for (const feat of catalogFeat.response.features) {
        expect(feat.permissions.length).toBeGreaterThan(0);
        for (const perm of feat.permissions) {
          expect(perm.startsWith(feat.id)).toBe(true);
          const parts = perm.split(".");
          expect(parts.length).toBe(4); // e.g. erp (1) . materials (2) . materials (3) . create (4)
        }
      }
    });

    it("documents backend live CatalogController returning 200 for /v1/catalog/presets with 3 presets", () => {
      const { getCatalogPresets: presets } = fixtureData.endpoints;
      expect(presets.status).toBe(200);
      expect(presets.response.catalogVersion).toBe("2026-11-demo-1");
      expect(presets.response.presets).toHaveLength(3);
      const presetIds = presets.response.presets.map((p) => p.id);
      expect(presetIds).toEqual(["erp", "crm", "blank"]);
    });

    it("documents POST /v1/apps rejecting v2.5 payload with INVALID_APP_INPUT", () => {
      const { postAppsV25 } = fixtureData.endpoints;
      expect(postAppsV25.status).toBe(400);
      expect(postAppsV25.response.error.code).toBe("INVALID_APP_INPUT");
      const issuePaths = postAppsV25.response.error.issues.map((i) => i.path);
      expect(issuePaths).toContain("/schemaVersion");
      expect(issuePaths).toContain("/startingPoint");
      expect(issuePaths).toContain("/goal");
    });
  });

  describe("Mock Catalog Conformance to v2.5 Interfaces", () => {
    it("features mock complies with CatalogResponse structure and matches live permission format", () => {
      const catalog: CatalogResponse = {
        catalogVersion: MOCK_CATALOG_VERSION,
        features: MOCK_CATALOG_FEATURES,
      };

      expect(catalog.catalogVersion).toBe(MOCK_CATALOG_VERSION);
      expect(catalog.features.length).toBe(5);

      for (const feat of catalog.features) {
        expect(feat).toHaveProperty("id");
        expect(feat).toHaveProperty("domain");
        expect(feat).toHaveProperty("version");
        expect(feat).toHaveProperty("status");
        expect(feat).toHaveProperty("dependencies");
        expect(Array.isArray(feat.dependencies)).toBe(true);
        for (const perm of feat.permissions) {
          expect(perm.startsWith(feat.id)).toBe(true);
        }
      }
    });

    it("presets mock complies with PresetsResponse structure", () => {
      const presets: PresetsResponse = {
        catalogVersion: MOCK_CATALOG_VERSION,
        presets: MOCK_CATALOG_PRESETS,
      };

      expect(presets.catalogVersion).toBe(MOCK_CATALOG_VERSION);
      expect(presets.presets.length).toBe(3);

      for (const p of presets.presets) {
        expect(p).toHaveProperty("id");
        expect(p).toHaveProperty("version");
        expect(p).toHaveProperty("suggestedFeatures");
        expect(Array.isArray(p.suggestedFeatures)).toBe(true);
      }
    });
  });

  describe("Client in API Mode", () => {
    it("returns real catalog features when backend returns 200", async () => {
      process.env.APP_CONFIG_API_MODE = "api";
      const { apiCall } = await import("../api/server");
      const { getCatalogFeatures: catalogFeat } = fixtureData.endpoints;
      vi.mocked(apiCall).mockResolvedValueOnce(catalogFeat.response);

      const res = await getCatalogFeatures();
      expect(res.catalogVersion).toBe("2026-11-demo-1");
      expect(res.features).toHaveLength(5);
    });

    it("returns real catalog presets when backend returns 200", async () => {
      process.env.APP_CONFIG_API_MODE = "api";
      const { apiCall } = await import("../api/server");
      const { getCatalogPresets: presets } = fixtureData.endpoints;
      vi.mocked(apiCall).mockResolvedValueOnce(presets.response);

      const res = await getPresets();
      expect(res.catalogVersion).toBe("2026-11-demo-1");
      expect(res.presets).toHaveLength(3);
    });

    it("gracefully falls back to mock catalog when backend returns 404 for /v1/catalog/features", async () => {
      process.env.APP_CONFIG_API_MODE = "api";
      const { apiCall } = await import("../api/server");
      vi.mocked(apiCall).mockRejectedValueOnce(
        new ApiError(404, "NOT_FOUND", "Cannot GET /v1/catalog/features"),
      );

      const res = await getCatalogFeatures();
      expect(res.features).toHaveLength(5);
      expect(res.catalogVersion).toBe(MOCK_CATALOG_VERSION);
    });

    it("rethrows non-404 errors in API mode", async () => {
      process.env.APP_CONFIG_API_MODE = "api";
      const { apiCall } = await import("../api/server");
      vi.mocked(apiCall).mockRejectedValueOnce(
        new ApiError(500, "INTERNAL_ERROR", "Internal server error"),
      );

      await expect(getCatalogFeatures()).rejects.toThrow("Internal server error");
    });
  });

  describe("API v2.5 Error Translation in createAppWithFeaturesAction", () => {
    it("formats 400 INVALID_APP_INPUT with clear Vietnamese labels and backend v2.5 notice", async () => {
      process.env.APP_CONFIG_API_MODE = "api";
      const { apiCall } = await import("../api/server");
      const { postAppsV25 } = fixtureData.endpoints;

      vi.mocked(apiCall).mockRejectedValueOnce(
        new ApiError(
          postAppsV25.status,
          postAppsV25.response.error.code,
          postAppsV25.response.error.message,
          undefined,
          postAppsV25.response.error.issues,
        ),
      );

      const result = await createAppWithFeaturesAction({
        name: "Test App",
        appKey: "test_app",
        startingPoint: "erp",
        selectedFeatures: ["erp.materials"],
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(result.code).toBe("INVALID_APP_INPUT");
      expect(result.error).toContain("Thông tin ứng dụng chưa hợp lệ");
      expect(result.error).toContain("Phiên bản schema");
      expect(result.error).toContain("Điểm xuất phát");
      expect(result.error).toContain("Backend hiện tại chưa hỗ trợ cấu trúc ứng dụng v2.5");
    });
  });
});
