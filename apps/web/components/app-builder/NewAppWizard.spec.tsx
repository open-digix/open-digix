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
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewAppWizard from "./NewAppWizard";
import { MOCK_CATALOG_FEATURES, MOCK_CATALOG_PRESETS } from "../../lib/app-config/catalog-mock";
import * as actions from "../../lib/app-config/actions";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("../../lib/app-config/actions", () => ({
  createAppWithFeaturesAction: vi.fn(),
}));

describe("NewAppWizard Component (TC-START)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders 3 steps in stepper and starts at step 1", () => {
    render(
      <NewAppWizard
        initialFeatures={MOCK_CATALOG_FEATURES}
        initialPresets={MOCK_CATALOG_PRESETS}
        tenantName="Doanh nghiệp Demo"
      />,
    );

    expect(screen.getByRole("heading", { name: "Chọn lối vào khởi tạo" })).toBeInTheDocument();
    expect(screen.getByText("Bắt đầu với ERP")).toBeInTheDocument();
    expect(screen.getByText("Bắt đầu với CRM")).toBeInTheDocument();
    expect(screen.getByText("Tạo từ trống")).toBeInTheDocument();
  });

  it("TC-START-01: ERP -> bỏ erp.inventory -> lưu: còn vật tư + yêu cầu mua, startingPoint: erp", async () => {
    vi.mocked(actions.createAppWithFeaturesAction).mockResolvedValueOnce({
      ok: true,
      appId: "app-erp-test-id",
    });

    render(
      <NewAppWizard
        initialFeatures={MOCK_CATALOG_FEATURES}
        initialPresets={MOCK_CATALOG_PRESETS}
      />,
    );

    // Step 1: Click "Bắt đầu với ERP"
    fireEvent.click(screen.getByText("Bắt đầu với ERP"));

    // Step 2: In feature catalog, erp.inventory is checked. Uncheck it.
    expect(screen.getByRole("heading", { name: "Lựa chọn chức năng nghiệp vụ" })).toBeInTheDocument();
    const inventoryCheckbox = screen.getByLabelText(/Quản lý kho/i);
    expect(inventoryCheckbox).toBeChecked();

    fireEvent.click(inventoryCheckbox);
    expect(inventoryCheckbox).not.toBeChecked();

    // Verify materials and purchase_requests remain checked
    const materialsCheckbox = screen.getByLabelText(/Quản lý vật tư/i);
    const purchaseCheckbox = screen.getByLabelText(/Yêu cầu mua hàng/i);
    expect(materialsCheckbox).toBeChecked();
    expect(purchaseCheckbox).toBeChecked();

    // Advance to Step 3
    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục: Thông tin ứng dụng/i }));

    // Step 3: Fill app name and submit
    const nameInput = screen.getByLabelText(/Tên ứng dụng/i);
    fireEvent.change(nameInput, { target: { value: "Ứng dụng Kho Vận" } });

    const submitBtn = screen.getByRole("button", { name: "Lưu bản nháp" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(actions.createAppWithFeaturesAction).toHaveBeenCalledTimes(1);
    });

    expect(actions.createAppWithFeaturesAction).toHaveBeenCalledWith({
      name: "Ứng dụng Kho Vận",
      appKey: "ung_dung_kho_van",
      startingPoint: "erp",
      selectedFeatures: ["erp.materials", "erp.purchase_requests"],
    });

    expect(mockPush).toHaveBeenCalledWith("/builder/app-erp-test-id");
  });

  it("TC-START-02: CRM -> thêm erp.materials: không tự bật mua hàng/kho", async () => {
    render(
      <NewAppWizard
        initialFeatures={MOCK_CATALOG_FEATURES}
        initialPresets={MOCK_CATALOG_PRESETS}
      />,
    );

    // Step 1: Choose CRM
    fireEvent.click(screen.getByText("Bắt đầu với CRM"));

    // Step 2: Check CRM features preselected
    const customersCheckbox = screen.getByLabelText(/Quản lý khách hàng/i);
    const opportunitiesCheckbox = screen.getByLabelText(/Cơ hội bán hàng/i);
    expect(customersCheckbox).toBeChecked();
    expect(opportunitiesCheckbox).toBeChecked();

    // Add erp.materials
    const materialsCheckbox = screen.getByLabelText(/Quản lý vật tư/i);
    expect(materialsCheckbox).not.toBeChecked();
    fireEvent.click(materialsCheckbox);
    expect(materialsCheckbox).toBeChecked();

    // Ensure erp.purchase_requests and erp.inventory are NOT automatically checked
    const purchaseCheckbox = screen.getByLabelText(/Yêu cầu mua hàng/i);
    const inventoryCheckbox = screen.getByLabelText(/Quản lý kho/i);
    expect(purchaseCheckbox).not.toBeChecked();
    expect(inventoryCheckbox).not.toBeChecked();
  });

  it("TC-START-03: Từ trống -> lưu nháp rỗng được", async () => {
    vi.mocked(actions.createAppWithFeaturesAction).mockResolvedValueOnce({
      ok: true,
      appId: "empty-draft-id",
    });

    render(
      <NewAppWizard
        initialFeatures={MOCK_CATALOG_FEATURES}
        initialPresets={MOCK_CATALOG_PRESETS}
      />,
    );

    // Step 1: Choose Blank
    fireEvent.click(screen.getByText("Tạo từ trống"));

    // Step 2: Verify 0 features selected
    expect(screen.getByText(/Đã chọn: 0 chức năng/i)).toBeInTheDocument();

    // Advance to Step 3
    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục: Thông tin ứng dụng/i }));

    // Verify empty draft notice is rendered
    expect(screen.getByText(/bản nháp rỗng/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Tên ứng dụng/i);
    fireEvent.change(nameInput, { target: { value: "Nháp rỗng từ đầu" } });

    const submitBtn = screen.getByRole("button", { name: "Lưu bản nháp" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(actions.createAppWithFeaturesAction).toHaveBeenCalledWith({
        name: "Nháp rỗng từ đầu",
        appKey: "nhap_rong_tu_dau",
        startingPoint: "blank",
        selectedFeatures: [],
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/builder/empty-draft-id");
  });

  it("TC-START-04: Bỏ crm.customers khi còn crm.opportunities -> cảnh báo phụ thuộc", async () => {
    render(
      <NewAppWizard
        initialFeatures={MOCK_CATALOG_FEATURES}
        initialPresets={MOCK_CATALOG_PRESETS}
      />,
    );

    fireEvent.click(screen.getByText("Bắt đầu với CRM"));

    const customersCheckbox = screen.getByLabelText(/Quản lý khách hàng/i);
    expect(customersCheckbox).toBeChecked();

    // Try to uncheck customers
    fireEvent.click(customersCheckbox);

    // Modal warning should appear
    expect(screen.getByRole("heading", { name: /Cảnh báo phụ thuộc/i })).toBeInTheDocument();
    expect(screen.getByText(/sẽ ảnh hưởng đến các chức năng sau đang phụ thuộc vào nó/i)).toBeInTheDocument();

    // Cancel removal
    fireEvent.click(screen.getByRole("button", { name: "Giữ lại" }));
    expect(screen.queryByRole("heading", { name: /Cảnh báo phụ thuộc/i })).not.toBeInTheDocument();
    expect(customersCheckbox).toBeChecked();

    // Confirm removal
    fireEvent.click(customersCheckbox);
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận bỏ chọn" }));
    expect(customersCheckbox).not.toBeChecked();
  });

  it("TC-START-05: Đổi lối vào sau khi đã sửa -> hỏi trước, không ghi đè im lặng", async () => {
    render(
      <NewAppWizard
        initialFeatures={MOCK_CATALOG_FEATURES}
        initialPresets={MOCK_CATALOG_PRESETS}
      />,
    );

    // Step 1: select ERP
    fireEvent.click(screen.getByText("Bắt đầu với ERP"));

    // Step 2: customize by unchecking inventory
    const inventoryCheckbox = screen.getByLabelText(/Quản lý kho/i);
    fireEvent.click(inventoryCheckbox);

    // Go back to Step 1
    fireEvent.click(screen.getByRole("button", { name: /Quay lại lối vào/i }));

    // Click CRM on Step 1
    fireEvent.click(screen.getByText("Bắt đầu với CRM"));

    // Confirm modal should appear
    expect(screen.getByRole("heading", { name: "Thay đổi lối vào khởi tạo" })).toBeInTheDocument();
    expect(screen.getByText(/Bạn đã tùy chỉnh danh sách chức năng khác với gợi ý ban đầu/i)).toBeInTheDocument();

    // Option A: "Giữ lựa chọn hiện tại"
    fireEvent.click(screen.getByRole("button", { name: "Giữ lựa chọn hiện tại" }));
    expect(screen.queryByRole("heading", { name: "Thay đổi lối vào khởi tạo" })).not.toBeInTheDocument();

    // Should be at step 2 with materials and purchase_requests still checked
    expect(screen.getByLabelText(/Quản lý vật tư/i)).toBeChecked();
    expect(screen.getByLabelText(/Yêu cầu mua hàng/i)).toBeChecked();
    expect(screen.getByLabelText(/Quản lý kho/i)).not.toBeChecked();
  });

  it("shows appKey conflict error under appKey field when code is APP_KEY_CONFLICT", async () => {
    vi.mocked(actions.createAppWithFeaturesAction).mockResolvedValueOnce({
      ok: false,
      code: "APP_KEY_CONFLICT",
      error: "Mã ứng dụng đã tồn tại",
    });

    render(
      <NewAppWizard
        initialFeatures={MOCK_CATALOG_FEATURES}
        initialPresets={MOCK_CATALOG_PRESETS}
      />,
    );

    fireEvent.click(screen.getByText("Bắt đầu với ERP"));
    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục: Thông tin ứng dụng/i }));

    const nameInput = screen.getByLabelText(/Tên ứng dụng/i);
    fireEvent.change(nameInput, { target: { value: "Trùng mã" } });

    const submitBtn = screen.getByRole("button", { name: "Lưu bản nháp" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mã ứng dụng "trung_ma" đã tồn tại/i)).toBeInTheDocument();
    });
  });

  it("closes dialog on Escape key without changing choices", async () => {
    render(
      <NewAppWizard
        initialFeatures={MOCK_CATALOG_FEATURES}
        initialPresets={MOCK_CATALOG_PRESETS}
      />,
    );

    // Step 1: ERP
    fireEvent.click(screen.getByText("Bắt đầu với ERP"));

    // Step 2: uncheck inventory
    const inventoryCheckbox = screen.getByLabelText(/Quản lý kho/i);
    fireEvent.click(inventoryCheckbox);

    // Back to Step 1
    fireEvent.click(screen.getByRole("button", { name: /Quay lại lối vào/i }));

    // Click CRM -> dialog appears
    fireEvent.click(screen.getByText("Bắt đầu với CRM"));
    expect(screen.getByRole("heading", { name: "Thay đổi lối vào khởi tạo" })).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: "Thay đổi lối vào khởi tạo" })).not.toBeInTheDocument();

    // Still at step 1
    expect(screen.getByRole("heading", { name: "Chọn lối vào khởi tạo" })).toBeInTheDocument();
  });
});
