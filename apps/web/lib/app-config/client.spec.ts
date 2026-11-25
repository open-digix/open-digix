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
import {
  getCatalogFeatures,
  getPresets,
  listApps,
  createApp,
  getDraft,
  patchDraft,
  validateDraft,
} from "./client";

vi.mock("../api/server", () => ({
  getTenantContext: vi.fn().mockResolvedValue({
    currentTenant: { id: "test-tenant-123", name: "Doanh nghiệp mẫu" },
    roles: ["designer"],
  }),
  apiCall: vi.fn(),
}));

describe("app-config client", () => {
  const originalEnv = process.env.APP_CONFIG_API_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_CONFIG_API_MODE = "mock";
  });

  afterEach(() => {
    process.env.APP_CONFIG_API_MODE = originalEnv;
  });

  describe("Mock mode (default)", () => {
    it("returns 5 supported features in catalog", async () => {
      const res = await getCatalogFeatures();
      expect(res.features).toHaveLength(5);
      expect(res.features.map((f) => f.id)).toContain("erp.materials");
      expect(res.features.map((f) => f.id)).toContain("crm.customers");
    });

    it("returns 3 presets: erp, crm, blank", async () => {
      const res = await getPresets();
      expect(res.presets).toHaveLength(3);
      const presetIds = res.presets.map((p) => p.id);
      expect(presetIds).toEqual(["erp", "crm", "blank"]);
    });

    it("lists apps for current tenant from mock store", async () => {
      const apps = await listApps();
      expect(apps.length).toBeGreaterThanOrEqual(2);
      expect(apps[0].schemaVersion).toBe("2.5");
    });

    it("creates an app in mock store and retrieves its draft", async () => {
      const uniqueKey = `app_key_${Date.now()}`;
      const created = await createApp({
        schemaVersion: "2.5",
        name: "Ứng dụng thử nghiệm",
        appKey: uniqueKey,
        startingPoint: "erp",
      });

      expect(created.appId).toBeDefined();
      expect(created.lockVersion).toBe(1);
      expect(created.draft.name).toBe("Ứng dụng thử nghiệm");
      expect(created.draft.features).toEqual([]);

      // Retrieve draft
      const draft = await getDraft(created.appId);
      expect(draft.definition.name).toBe("Ứng dụng thử nghiệm");
      expect(draft.lockVersion).toBe(1);
    });

    it("throws 409 APP_KEY_CONFLICT when creating with duplicate appKey", async () => {
      const duplicateKey = "erp_materials_sample";
      await expect(
        createApp({
          schemaVersion: "2.5",
          name: "Trùng mã",
          appKey: duplicateKey,
          startingPoint: "erp",
        }),
      ).rejects.toThrow();
    });

    it("patches draft with features and increments lockVersion", async () => {
      const uniqueKey = `patch_test_${Date.now()}`;
      const created = await createApp({
        schemaVersion: "2.5",
        name: "Patch Test App",
        appKey: uniqueKey,
        startingPoint: "erp",
      });

      const patched = await patchDraft(created.appId, {
        lockVersion: 1,
        features: [
          { id: "erp.materials", version: 1 },
          { id: "erp.inventory", version: 1 },
        ],
      });

      expect(patched.lockVersion).toBe(2);
      expect(patched.definition.features).toHaveLength(2);
    });

    it("throws 409 conflict when lockVersion does not match", async () => {
      const uniqueKey = `conflict_test_${Date.now()}`;
      const created = await createApp({
        schemaVersion: "2.5",
        name: "Conflict Test App",
        appKey: uniqueKey,
      });

      await expect(
        patchDraft(created.appId, {
          lockVersion: 999, // wrong lockVersion
          features: [{ id: "erp.materials", version: 1 }],
        }),
      ).rejects.toThrow(/phiên khác/);
    });

    it("validates draft: returns EMPTY_FEATURES when empty", async () => {
      const uniqueKey = `empty_validate_${Date.now()}`;
      const created = await createApp({
        schemaVersion: "2.5",
        name: "Empty App",
        appKey: uniqueKey,
      });

      const res = await validateDraft(created.appId);
      expect(res.valid).toBe(false);
      expect(res.issues).toHaveLength(1);
      expect(res.issues[0].code).toBe("EMPTY_FEATURES");
      expect(res.issues[0].path).toBe("/features");
    });

    it("validates draft: returns MISSING_DEPENDENCY when dependent feature is missing its dependency", async () => {
      const uniqueKey = `dep_validate_${Date.now()}`;
      const created = await createApp({
        schemaVersion: "2.5",
        name: "Missing Dep App",
        appKey: uniqueKey,
      });

      await patchDraft(created.appId, {
        lockVersion: 1,
        features: [{ id: "erp.inventory", version: 1 }], // missing erp.materials
      });

      const res = await validateDraft(created.appId);
      expect(res.valid).toBe(false);
      expect(res.issues.some((i) => i.code === "MISSING_DEPENDENCY")).toBe(true);
    });
  });

  describe("API mode", () => {
    it("calls apiCall with correct endpoints in api mode", async () => {
      process.env.APP_CONFIG_API_MODE = "api";
      const { apiCall } = await import("../api/server");

      vi.mocked(apiCall).mockResolvedValueOnce({
        catalogVersion: "v1",
        features: [],
      });
      await getCatalogFeatures();
      expect(apiCall).toHaveBeenCalledWith("/v1/catalog/features");

      vi.mocked(apiCall).mockResolvedValueOnce({
        appId: "new-id",
        lockVersion: 1,
      });
      await createApp({
        schemaVersion: "2.5",
        name: "API App",
        appKey: "api_app",
      });
      expect(apiCall).toHaveBeenCalledWith("/v1/apps", {
        method: "POST",
        body: {
          schemaVersion: "2.5",
          name: "API App",
          appKey: "api_app",
        },
      });
    });
  });
});
