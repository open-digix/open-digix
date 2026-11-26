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
      "erp.materials.materials.read",
      "erp.purchase_requests.requests.create",
      "erp.inventory.stock.read",
      "erp.purchase_requests.create", // Dạng cũ 2 phần (bị từ chối)
      "stock.read", // Dạng sai đứng 1 mình (bị từ chối)
    ],
  };

  it("khớp đúng dạng 3 phần: <featureId>.<resource>.<action>", () => {
    expect(
      hasPermission(sampleRole, {
        featureId: "erp.materials",
        resource: "materials",
        action: "read",
      })
    ).toBe(true);

    expect(
      hasPermission(sampleRole, {
        featureId: "erp.purchase_requests",
        resource: "requests",
        action: "create",
      })
    ).toBe(true);
  });

  it("từ chối dạng cũ 2 phần <featureId>.<action>", () => {
    expect(
      hasPermission(sampleRole, {
        featureId: "erp.purchase_requests",
        resource: "requests",
        action: "create_legacy",
      })
    ).toBe(false);
  });

  it("cấp erp.inventory.stock.read KHÔNG cho xem thành phần đọc receipts", () => {
    // Có stock.read
    expect(
      hasPermission(sampleRole, {
        featureId: "erp.inventory",
        resource: "stock",
        action: "read",
      })
    ).toBe(true);

    // Không có receipts.read -> bị từ chối
    expect(
      hasPermission(sampleRole, {
        featureId: "erp.inventory",
        resource: "receipts",
        action: "read",
      })
    ).toBe(false);
  });

  it("từ chối <resource>.<action> đứng một mình (ví dụ stock.read)", () => {
    // Role có "stock.read", nhưng không có featureId tiền tố erp.inventory.stock.read
    const roleWithBadPermission: AppRole = {
      id: "test",
      permissions: ["stock.read"],
    };
    const result = hasPermission(roleWithBadPermission, {
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
