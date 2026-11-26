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

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AppRenderer from "./AppRenderer";
import { MockDataSource } from "@/lib/app-runtime/data-source";
import { FIXTURE_ERP_A, FIXTURE_CRM_A } from "@/lib/app-runtime/fixtures";

describe("AppRenderer", () => {
  const dataSource = new MockDataSource();

  it("render tên ứng dụng, danh sách tab trang và banner MẪU THỬ", () => {
    render(
      <AppRenderer
        app={FIXTURE_ERP_A}
        roleId="buyer"
        dataSource={dataSource}
      />
    );

    expect(screen.getByText("Vật tư và mua hàng")).toBeDefined();
    expect(screen.getByTestId("mock-preview-banner")).toBeDefined();
    expect(screen.getByText("Yêu cầu mua")).toBeDefined();
    expect(screen.getByText("Tồn kho")).toBeDefined();
  });

  it("chuyển trang khi bấm vào tab khác", () => {
    render(
      <AppRenderer
        app={FIXTURE_ERP_A}
        roleId="buyer"
        dataSource={dataSource}
      />
    );

    const stockTab = screen.getByText("Tồn kho");
    fireEvent.click(stockTab);

    expect(stockTab.getAttribute("aria-current")).toBe("page");
  });

  it("ẩn các component không có quyền theo roleId (ví dụ buyer không thấy nút approve)", () => {
    const { queryByTestId } = render(
      <AppRenderer
        app={FIXTURE_ERP_A}
        roleId="buyer"
        dataSource={dataSource}
      />
    );

    // buyer không có quyền erp.purchase_requests.approve
    expect(queryByTestId("action-approve_request")).toBeNull();

    // buyer có quyền erp.purchase_requests.create
    expect(queryByTestId("form-purchase_form")).not.toBeNull();
  });

  it("approver thấy nút approve nhưng không thấy form tạo mới", () => {
    const { queryByTestId } = render(
      <AppRenderer
        app={FIXTURE_ERP_A}
        roleId="approver"
        dataSource={dataSource}
      />
    );

    // approver có quyền erp.purchase_requests.approve
    expect(queryByTestId("action-approve_request")).not.toBeNull();

    // approver không có quyền erp.purchase_requests.create
    expect(queryByTestId("form-purchase_form")).toBeNull();
  });

  it("render ở viewport 375px thu gọn container và gán data-viewport=375", () => {
    render(
      <AppRenderer
        app={FIXTURE_CRM_A}
        roleId="sales"
        dataSource={dataSource}
        viewport="375"
      />
    );

    const root = screen.getByTestId("app-renderer-root");
    expect(root.getAttribute("data-viewport")).toBe("375");
    expect(root.className).toContain("max-w-[375px]");
  });
});
