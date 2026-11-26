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
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FormComponent from "./FormComponent";
import TableComponent from "./TableComponent";
import ActionComponent from "./ActionComponent";
import MetricComponent from "./MetricComponent";
import DetailComponent from "./DetailComponent";
import { MockDataSource } from "@/lib/app-runtime/data-source";
import type { NormalizedComponent } from "@/lib/app-runtime/types";

describe("components", () => {
  it("FormComponent submit dữ liệu và hiển thị thông báo thành công", async () => {
    const dataSource = new MockDataSource();
    const comp: NormalizedComponent = {
      id: "form_1",
      type: "form",
      componentVersion: 1,
      featureId: "erp.purchase_requests",
      resource: "requests",
      action: "create",
      zone: "main",
      order: 0,
      hidden: false,
    };

    render(<FormComponent component={comp} dataSource={dataSource} />);

    const titleInput = screen.getByPlaceholderText(/Mua vật tư đợt 2/);
    fireEvent.change(titleInput, { target: { value: "Yêu cầu kiểm thử" } });

    const requesterInput = screen.getByPlaceholderText(/Họ và tên/);
    fireEvent.change(requesterInput, { target: { value: "Nguyễn Văn A" } });

    const submitBtn = screen.getByRole("button", { name: "Lưu dữ liệu" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText(/thành công/i)).toBeDefined();
    });
  });

  it("TableComponent hỗ trợ nút Tải thêm qua cursor mà không hiển thị tổng số", async () => {
    const dataSource = new MockDataSource();
    const comp: NormalizedComponent = {
      id: "table_1",
      type: "table",
      componentVersion: 1,
      featureId: "erp.materials",
      resource: "materials",
      zone: "main",
      order: 0,
      hidden: false,
    };

    render(<TableComponent component={comp} dataSource={dataSource} />);

    // Kiểm tra không có text "trang x / tổng y" hay tổng số bản ghi
    await waitFor(() => {
      expect(screen.getByText(/THEP-H150/)).toBeDefined();
    });

    expect(screen.queryByText(/\/ tổng/i)).toBeNull();
  });

  it("ActionComponent mở ConfirmDialog và gọi runAction khi xác nhận", async () => {
    const dataSource = new MockDataSource();
    const comp: NormalizedComponent = {
      id: "action_1",
      type: "action",
      componentVersion: 1,
      featureId: "erp.purchase_requests",
      resource: "requests",
      action: "approve",
      zone: "side",
      order: 0,
      hidden: false,
    };

    render(<ActionComponent component={comp} dataSource={dataSource} />);

    const triggerBtn = screen.getByRole("button", { name: "Phê duyệt ngay" });
    fireEvent.click(triggerBtn);

    // ConfirmDialog phải mở ra
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();

    const confirmBtn = screen.getByRole("button", { name: "Xác nhận thực hiện" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      const statusEl = screen.getByRole("status");
      expect(statusEl).toBeDefined();
      expect(statusEl.textContent).toContain("phê duyệt");
    });
  });

  it("MetricComponent hiển thị chỉ số tài nguyên", async () => {
    const dataSource = new MockDataSource();
    const comp: NormalizedComponent = {
      id: "metric_1",
      type: "metric",
      componentVersion: 1,
      featureId: "erp.materials",
      resource: "materials",
      zone: "main",
      order: 0,
      hidden: false,
    };

    render(<MetricComponent component={comp} dataSource={dataSource} />);

    await waitFor(() => {
      expect(screen.getByText("6")).toBeDefined(); // materials có 6 items
    });
  });

  it("DetailComponent hiển thị thông tin chi tiết bản ghi", async () => {
    const dataSource = new MockDataSource();
    const comp: NormalizedComponent = {
      id: "detail_1",
      type: "detail",
      componentVersion: 1,
      featureId: "erp.materials",
      resource: "materials",
      zone: "main",
      order: 0,
      hidden: false,
    };

    render(<DetailComponent component={comp} dataSource={dataSource} />);

    await waitFor(() => {
      expect(screen.getByText("THEP-H150")).toBeDefined();
    });
  });
});
