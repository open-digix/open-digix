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
import { isComponentVisible, isPageVisible, resolveVisibleComponents } from "./visibility";
import type { NormalizedApp, NormalizedComponent, NormalizedPage, AppRole } from "./types";

describe("visibility rules", () => {
  const sampleApp: NormalizedApp = {
    schemaVersion: "2.5",
    tenantId: "11111111-1111-4111-8111-111111111111",
    appId: "22222222-2222-4222-8222-222222222222",
    version: 1,
    name: "Sample App",
    features: [
      { id: "erp.materials", version: 1 },
      { id: "erp.purchase_requests", version: 1 },
    ],
    roles: [],
    pages: [],
  };

  const buyerRole: AppRole = {
    id: "buyer",
    permissions: ["erp.materials.read", "erp.purchase_requests.create"],
  };

  const approverRole: AppRole = {
    id: "approver",
    permissions: ["erp.materials.read", "erp.purchase_requests.approve"],
  };

  const tableComp: NormalizedComponent = {
    id: "tbl",
    type: "table",
    componentVersion: 1,
    featureId: "erp.materials",
    resource: "materials",
    zone: "main",
    order: 0,
    hidden: false,
  };

  const formCreateComp: NormalizedComponent = {
    id: "frm_create",
    type: "form",
    componentVersion: 1,
    featureId: "erp.purchase_requests",
    resource: "requests",
    action: "create",
    zone: "main",
    order: 1,
    hidden: false,
  };

  const actionApproveComp: NormalizedComponent = {
    id: "act_approve",
    type: "action",
    componentVersion: 1,
    featureId: "erp.purchase_requests",
    resource: "requests",
    action: "approve",
    zone: "side",
    order: 2,
    hidden: false,
  };

  it("table/detail/metric yêu cầu quyền read", () => {
    expect(isComponentVisible(tableComp, sampleApp, buyerRole, "buyer")).toBe(true);
    expect(isComponentVisible(tableComp, sampleApp, approverRole, "approver")).toBe(true);

    const emptyRole: AppRole = { id: "guest", permissions: [] };
    expect(isComponentVisible(tableComp, sampleApp, emptyRole, "guest")).toBe(false);
  });

  it("form/action yêu cầu đúng quyền action tương ứng", () => {
    // buyer có quyền create nhưng không có approve
    expect(isComponentVisible(formCreateComp, sampleApp, buyerRole, "buyer")).toBe(true);
    expect(isComponentVisible(actionApproveComp, sampleApp, buyerRole, "buyer")).toBe(false);

    // approver có quyền approve nhưng không có create
    expect(isComponentVisible(formCreateComp, sampleApp, approverRole, "approver")).toBe(false);
    expect(isComponentVisible(actionApproveComp, sampleApp, approverRole, "approver")).toBe(true);
  });

  it("ẩn component khi hidden === true hoặc feature không được bật trong app", () => {
    const hiddenComp: NormalizedComponent = { ...tableComp, hidden: true };
    expect(isComponentVisible(hiddenComp, sampleApp, buyerRole, "buyer")).toBe(false);

    const disabledFeatureComp: NormalizedComponent = {
      ...tableComp,
      featureId: "erp.inventory", // Không có trong sampleApp.features
    };
    expect(isComponentVisible(disabledFeatureComp, sampleApp, buyerRole, "buyer")).toBe(false);
  });

  it("lọc theo visibleToRoles của component và page", () => {
    const restrictedComp: NormalizedComponent = {
      ...tableComp,
      visibleToRoles: ["manager"],
    };
    expect(isComponentVisible(restrictedComp, sampleApp, buyerRole, "buyer")).toBe(false);
    expect(isComponentVisible(restrictedComp, sampleApp, { id: "manager", permissions: ["erp.materials.read"] }, "manager")).toBe(true);

    const page: NormalizedPage = {
      id: "p1",
      label: "Trang quan sát",
      path: "p1",
      layout: "single",
      menuOrder: 0,
      hidden: false,
      visibleToRoles: ["manager"],
      components: [tableComp],
    };
    expect(isPageVisible(page, sampleApp, "buyer")).toBe(false);
    expect(isPageVisible(page, sampleApp, "manager")).toBe(true);
  });

  it("resolveVisibleComponents lọc chính xác các thành phần thỏa mãn", () => {
    const page: NormalizedPage = {
      id: "p1",
      label: "Yêu cầu mua",
      path: "p1",
      layout: "two_columns",
      menuOrder: 0,
      hidden: false,
      components: [tableComp, formCreateComp, actionApproveComp],
    };

    const buyerVisible = resolveVisibleComponents(page, sampleApp, buyerRole, "buyer");
    expect(buyerVisible.map((c) => c.id)).toEqual(["tbl", "frm_create"]);

    const approverVisible = resolveVisibleComponents(page, sampleApp, approverRole, "approver");
    expect(approverVisible.map((c) => c.id)).toEqual(["tbl", "act_approve"]);
  });
});
