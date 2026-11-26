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
import {
  getMissingDependencies,
  getAffectedDependents,
} from "./dependencies";
import { MOCK_CATALOG_FEATURES } from "./catalog-mock";

describe("dependencies helper (pure functions)", () => {
  describe("getMissingDependencies", () => {
    it("returns empty array when no features are selected", () => {
      expect(getMissingDependencies([], MOCK_CATALOG_FEATURES)).toEqual([]);
    });

    it("returns empty array when feature has no dependencies", () => {
      expect(
        getMissingDependencies(["erp.materials"], MOCK_CATALOG_FEATURES),
      ).toEqual([]);
      expect(
        getMissingDependencies(["crm.customers"], MOCK_CATALOG_FEATURES),
      ).toEqual([]);
    });

    it("detects missing erp.materials when erp.inventory is selected alone", () => {
      const missing = getMissingDependencies(
        ["erp.inventory"],
        MOCK_CATALOG_FEATURES,
      );
      expect(missing).toEqual(["erp.materials"]);
    });

    it("detects missing erp.materials when erp.purchase_requests is selected alone", () => {
      const missing = getMissingDependencies(
        ["erp.purchase_requests"],
        MOCK_CATALOG_FEATURES,
      );
      expect(missing).toEqual(["erp.materials"]);
    });

    it("detects missing crm.customers when crm.opportunities is selected alone", () => {
      const missing = getMissingDependencies(
        ["crm.opportunities"],
        MOCK_CATALOG_FEATURES,
      );
      expect(missing).toEqual(["crm.customers"]);
    });

    it("returns empty array when all dependencies are satisfied", () => {
      expect(
        getMissingDependencies(
          ["erp.materials", "erp.inventory", "erp.purchase_requests"],
          MOCK_CATALOG_FEATURES,
        ),
      ).toEqual([]);

      expect(
        getMissingDependencies(
          ["crm.customers", "crm.opportunities"],
          MOCK_CATALOG_FEATURES,
        ),
      ).toEqual([]);
    });
  });

  describe("getAffectedDependents", () => {
    it("returns empty array if removed feature has no dependents among selected", () => {
      const affected = getAffectedDependents(
        "erp.inventory",
        ["erp.materials", "erp.purchase_requests", "erp.inventory"],
        MOCK_CATALOG_FEATURES,
      );
      expect(affected).toEqual([]);
    });

    it("identifies erp.purchase_requests and erp.inventory when erp.materials is removed", () => {
      const affected = getAffectedDependents(
        "erp.materials",
        ["erp.materials", "erp.purchase_requests", "erp.inventory"],
        MOCK_CATALOG_FEATURES,
      );
      expect(affected).toContain("erp.purchase_requests");
      expect(affected).toContain("erp.inventory");
    });

    it("identifies crm.opportunities when crm.customers is removed", () => {
      const affected = getAffectedDependents(
        "crm.customers",
        ["crm.customers", "crm.opportunities"],
        MOCK_CATALOG_FEATURES,
      );
      expect(affected).toEqual(["crm.opportunities"]);
    });

    it("ignores dependents that are not currently in the selected list", () => {
      const affected = getAffectedDependents(
        "crm.customers",
        ["crm.customers", "erp.materials"],
        MOCK_CATALOG_FEATURES,
      );
      expect(affected).toEqual([]);
    });
  });
});
