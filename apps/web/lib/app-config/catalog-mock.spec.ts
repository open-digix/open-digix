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

import { describe, it, expect } from "vitest";
import { MOCK_CATALOG_FEATURES, MOCK_CATALOG_PRESETS } from "./catalog-mock";
import { formatFeatureActionsByResource } from "./feature-labels";

describe("catalog-mock v2.5 new permission contract", () => {
  it("contains 5 supported business features", () => {
    expect(MOCK_CATALOG_FEATURES).toHaveLength(5);
    const ids = MOCK_CATALOG_FEATURES.map((f) => f.id);
    expect(ids).toContain("erp.materials");
    expect(ids).toContain("erp.purchase_requests");
    expect(ids).toContain("erp.inventory");
    expect(ids).toContain("crm.customers");
    expect(ids).toContain("crm.opportunities");
  });

  it("every action in every feature conforms to { resource, action, permission }", () => {
    for (const feat of MOCK_CATALOG_FEATURES) {
      expect(feat.actions.length).toBeGreaterThan(0);
      for (const act of feat.actions) {
        expect(act).toHaveProperty("resource");
        expect(act).toHaveProperty("action");
        expect(act).toHaveProperty("permission");
        // Permission format: <featureId>.<resource>.<action>
        expect(act.permission).toBe(`${feat.id}.${act.resource}.${act.action}`);
        expect(feat.permissions).toContain(act.permission);
      }
    }
  });

  it("separates erp.inventory into receipts and stock permissions without legacy format", () => {
    const inv = MOCK_CATALOG_FEATURES.find((f) => f.id === "erp.inventory");
    expect(inv).toBeDefined();

    const perms = inv!.permissions;
    expect(perms).toContain("erp.inventory.receipts.receive");
    expect(perms).toContain("erp.inventory.receipts.read");
    expect(perms).toContain("erp.inventory.stock.read");

    // No legacy format like 'receipts.receive' or 'inventory.read'
    expect(perms.some((p) => !p.startsWith("erp.inventory."))).toBe(false);
  });

  it("formats actions grouped by resource accurately", () => {
    const inv = MOCK_CATALOG_FEATURES.find((f) => f.id === "erp.inventory")!;
    const formatted = formatFeatureActionsByResource(inv.actions);
    expect(formatted).toBe("Phiếu nhập: nhận, xem · Tồn kho: xem");
  });

  it("provides 3 presets (erp, crm, blank)", () => {
    expect(MOCK_CATALOG_PRESETS).toHaveLength(3);
    const presetKeys = MOCK_CATALOG_PRESETS.map((p) => p.id);
    expect(presetKeys).toEqual(["erp", "crm", "blank"]);
  });
});
