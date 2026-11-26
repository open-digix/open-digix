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

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAppWithFeaturesAction,
  patchDraftFeaturesAction,
} from "./actions";
import * as serverApi from "../api/server";
import * as client from "./client";
import type { TenantContext } from "../tenant/types";
import type { AppDraftDefinitionV25 } from "./types";

vi.mock("../api/server", () => ({
  getTenantContext: vi.fn(),
}));

vi.mock("./client", () => ({
  createApp: vi.fn(),
  patchDraft: vi.fn(),
  getDraft: vi.fn(),
  validateDraft: vi.fn(),
  getCatalogFeatures: vi.fn(),
  getPresets: vi.fn(),
}));

const mockDraftDef: AppDraftDefinitionV25 = {
  schemaVersion: "2.5",
  appId: "app-new-123",
  name: "Test App",
  version: 1,
  tenantId: "t1",
  features: [],
  roles: [],
  pages: [],
};

const createMockContext = (roles: string[]): TenantContext => ({
  me: {
    user: {
      id: "u1",
      subject: "sub1",
      email: "user@example.com",
      displayName: "Test User",
      status: "active",
    },
    memberships: [],
    activeMembership: null,
  },
  activeMemberships: [],
  currentMembership: null,
  currentTenant: null,
  roles,
  needsTenantSelection: false,
});

describe("app-config Server Actions role enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAppWithFeaturesAction", () => {
    it("returns 401 UNAUTHENTICATED when tenant context is missing", async () => {
      vi.mocked(serverApi.getTenantContext).mockResolvedValueOnce(null);

      const res = await createAppWithFeaturesAction({
        name: "Test App",
        appKey: "test_app",
        selectedFeatures: ["erp.materials"],
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(401);
      expect(res.code).toBe("UNAUTHENTICATED");
    });

    it("returns 403 FORBIDDEN when user only has publisher or operator role", async () => {
      vi.mocked(serverApi.getTenantContext).mockResolvedValueOnce(
        createMockContext(["publisher", "operator"]),
      );

      const res = await createAppWithFeaturesAction({
        name: "Test App",
        appKey: "test_app",
        selectedFeatures: ["erp.materials"],
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(403);
      expect(res.code).toBe("FORBIDDEN");
      expect(res.kind).toBe("forbidden");
      expect(client.createApp).not.toHaveBeenCalled();
    });

    it("proceeds when user has designer role", async () => {
      vi.mocked(serverApi.getTenantContext).mockResolvedValueOnce(
        createMockContext(["designer"]),
      );

      vi.mocked(client.createApp).mockResolvedValueOnce({
        appId: "app-new-123",
        version: 1,
        lockVersion: 1,
        definition: mockDraftDef,
        draft: mockDraftDef,
      });
      vi.mocked(client.patchDraft).mockResolvedValueOnce({
        appId: "app-new-123",
        lockVersion: 2,
        definition: mockDraftDef,
      });

      const res = await createAppWithFeaturesAction({
        name: "Test App",
        appKey: "test_app",
        selectedFeatures: ["erp.materials"],
      });

      expect(res.ok).toBe(true);
      expect(res.appId).toBe("app-new-123");
    });
  });

  describe("patchDraftFeaturesAction", () => {
    it("returns 403 FORBIDDEN when user only has publisher role", async () => {
      vi.mocked(serverApi.getTenantContext).mockResolvedValueOnce(
        createMockContext(["publisher"]),
      );

      const res = await patchDraftFeaturesAction("app-123", 1, ["erp.materials"]);

      expect(res.ok).toBe(false);
      expect(res.status).toBe(403);
      expect(res.code).toBe("FORBIDDEN");
      expect(res.kind).toBe("forbidden");
      expect(client.patchDraft).not.toHaveBeenCalled();
    });

    it("proceeds when user has tenant_admin role", async () => {
      vi.mocked(serverApi.getTenantContext).mockResolvedValueOnce(
        createMockContext(["tenant_admin"]),
      );

      vi.mocked(client.patchDraft).mockResolvedValueOnce({
        appId: "app-123",
        lockVersion: 3,
        definition: mockDraftDef,
      });

      const res = await patchDraftFeaturesAction("app-123", 2, ["erp.materials", "erp.inventory"]);

      expect(res.ok).toBe(true);
      expect(res.newLockVersion).toBe(3);
    });
  });
});
