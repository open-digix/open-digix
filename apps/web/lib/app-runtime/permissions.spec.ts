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
import { hasPermission, hasSystemPermission } from "./permissions";
import type { AppRole } from "./types";

describe("hasPermission", () => {
  const sampleRole: AppRole = {
    id: "buyer",
    permissions: [
      "erp.materials.read",
      "erp.purchase_requests.create",
      "erp.purchase_requests.requests.create",
      "crm.opportunities.advance",
      "stock.read", // Dạng sai đứng 1 mình
    ],
  };

  it("khớp dạng 1: <featureId>.<action>", () => {
    expect(
      hasPermission(sampleRole, {
        featureId: "erp.materials",
        resource: "materials",
        action: "read",
      })
    ).toBe(true);

    expect(
      hasPermission(sampleRole, {
        featureId: "crm.opportunities",
        resource: "opportunities",
        action: "advance",
      })
    ).toBe(true);
  });

  it("khớp dạng 2: <featureId>.<resource>.<action>", () => {
    expect(
      hasPermission(sampleRole, {
        featureId: "erp.purchase_requests",
        resource: "requests",
        action: "create",
      })
    ).toBe(true);
  });

  it("từ chối <resource>.<action> đứng một mình (ví dụ stock.read)", () => {
    // Role có "stock.read", nhưng không có featureId tiền tố
    const result = hasPermission(sampleRole, {
      featureId: "erp.inventory",
      resource: "stock",
      action: "read",
    });
    expect(result).toBe(false);
  });

  it("trả về false khi role thiếu quyền hoặc role null/undefined", () => {
    expect(
      hasPermission(sampleRole, {
        featureId: "erp.materials",
        resource: "materials",
        action: "delete",
      })
    ).toBe(false);

    expect(
      hasPermission(null, {
        featureId: "erp.materials",
        resource: "materials",
        action: "read",
      })
    ).toBe(false);

    expect(
      hasPermission(undefined, {
        featureId: "erp.materials",
        resource: "materials",
        action: "read",
      })
    ).toBe(false);
  });

  it("kiểm tra quyền hệ thống qua hasSystemPermission", () => {
    const adminRole: AppRole = {
      id: "publisher",
      permissions: ["share.manage", "ai.sources.manage"],
    };

    expect(hasSystemPermission(adminRole, "share.manage")).toBe(true);
    expect(hasSystemPermission(adminRole, "ai.sources.manage")).toBe(true);
    expect(hasSystemPermission(sampleRole, "share.manage")).toBe(false);
  });
});
