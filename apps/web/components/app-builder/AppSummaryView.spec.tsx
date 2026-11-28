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
import AppSummaryView from "./AppSummaryView";
import { MOCK_CATALOG_FEATURES } from "../../lib/app-config/catalog-mock";
import * as actions from "../../lib/app-config/actions";
import type { AppDraftDefinitionV25 } from "../../lib/app-config/types";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("../../lib/app-config/actions", () => ({
  patchDraftFeaturesAction: vi.fn(),
  validateDraftAction: vi.fn(),
  getDraftV25Action: vi.fn(),
}));

describe("AppSummaryView Component (v2.5 draft summary)", () => {
  const sampleDraft: AppDraftDefinitionV25 = {
    schemaVersion: "2.5",
    startingPoint: "erp",
    tenantId: "t1",
    appId: "app-123",
    version: 1,
    name: "ERP Vật tư & Kho",
    features: [
      { id: "erp.materials", version: 1 },
      { id: "erp.inventory", version: 1 },
    ],
    roles: [],
    pages: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders draft header, startingPoint and features", () => {
    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    expect(screen.getByRole("heading", { name: "ERP Vật tư & Kho" })).toBeInTheDocument();
    expect(screen.getByText(/Lối vào khởi tạo:/i)).toHaveTextContent("Bắt đầu với ERP");
    expect(screen.getByText("Khóa: v1")).toBeInTheDocument();
    expect(screen.getByText("Quản lý vật tư")).toBeInTheDocument();
    expect(screen.getByText("Quản lý kho & Nhập hàng")).toBeInTheDocument();
  });

  it("displays 'Không ghi nhận lối vào' when startingPoint is missing", () => {
    const draftWithoutSp: AppDraftDefinitionV25 = {
      ...sampleDraft,
      startingPoint: undefined,
    };

    render(
      <AppSummaryView
        initialDraft={draftWithoutSp}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    expect(screen.getByText(/Không ghi nhận lối vào/i)).toBeInTheDocument();
  });

  it("displays empty features warning when draft has 0 features", () => {
    const emptyDraft: AppDraftDefinitionV25 = {
      ...sampleDraft,
      features: [],
    };

    render(
      <AppSummaryView
        initialDraft={emptyDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    expect(
      screen.getByText(/Chưa thể xuất bản/i),
    ).toBeInTheDocument();
  });

  it("calls validateDraftAction on 'Kiểm tra bản nháp' and renders issues by path", async () => {
    vi.mocked(actions.validateDraftAction).mockResolvedValueOnce({
      ok: true,
      valid: false,
      issues: [
        {
          code: "MISSING_DEPENDENCY",
          path: "/features/1",
          message: "Thiếu chức năng phụ thuộc erp.materials",
        },
      ],
    });

    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    const validateBtn = screen.getByRole("button", { name: "Kiểm tra bản nháp" });
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(actions.validateDraftAction).toHaveBeenCalledWith("app-123");
    });

    expect(screen.getByText(/Phát hiện vấn đề cần giải quyết/i)).toBeInTheDocument();
    expect(screen.getByText(/Chức năng Quản lý kho & Nhập hàng/i)).toBeInTheDocument();
    expect(screen.getByText(/\(MISSING_DEPENDENCY\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Thiếu chức năng phụ thuộc erp.materials/i)).toBeInTheDocument();
  });

  it("displays success message when validation passes", async () => {
    vi.mocked(actions.validateDraftAction).mockResolvedValueOnce({
      ok: true,
      valid: true,
      issues: [],
    });

    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Kiểm tra bản nháp" }));

    await waitFor(() => {
      expect(actions.validateDraftAction).toHaveBeenCalledWith("app-123");
    });

    expect(
      screen.getByText(/Chức năng hợp lệ. Bước tiếp theo là thiết kế trang – tính năng đang phát triển, chưa xuất bản được./i),
    ).toBeInTheDocument();
  });

  it("closes edit modal on Escape key press", () => {
    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa chức năng" }));
    expect(screen.getByRole("heading", { name: "Chỉnh sửa chức năng ứng dụng" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: "Chỉnh sửa chức năng ứng dụng" })).not.toBeInTheDocument();
  });

  it("handles 409 VERSION_CONFLICT when saving features and reloads fresh draft", async () => {
    vi.mocked(actions.patchDraftFeaturesAction).mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "VERSION_CONFLICT",
      error: "Bản nháp đã thay đổi, vui lòng tải lại.",
    });
    vi.mocked(actions.getDraftV25Action).mockResolvedValueOnce({
      ok: true,
      draft: { ...sampleDraft, name: "ERP Đã được cập nhật" },
      lockVersion: 5,
    });

    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa chức năng" }));

    // Modal opens
    expect(screen.getByRole("heading", { name: "Chỉnh sửa chức năng ứng dụng" })).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: "Lưu thay đổi" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Bản nháp đã thay đổi, vui lòng tải lại/i)).toBeInTheDocument();
    });

    const reloadBtn = screen.getByRole("button", { name: "Tải lại trang ngay" });
    expect(reloadBtn).toBeInTheDocument();
    fireEvent.click(reloadBtn);

    await waitFor(() => {
      expect(actions.getDraftV25Action).toHaveBeenCalledWith("app-123");
      expect(screen.getByText("Khóa: v5")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "ERP Đã được cập nhật" })).toBeInTheDocument();
    });
  });

  it("hides 'Sửa chức năng' button when canEdit is false", () => {
    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
        canEdit={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Sửa chức năng" })).not.toBeInTheDocument();
  });

  it("shows warning banner when canhBao is 'chua-luu-chuc-nang' and closes on click", () => {
    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
        canhBao="chua-luu-chuc-nang"
      />,
    );

    expect(
      screen.getByText(/Đã tạo bản nháp nhưng chưa lưu được chức năng đã chọn/i),
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: "Đóng thông báo cảnh báo" });
    fireEvent.click(closeBtn);

    expect(
      screen.queryByText(/Đã tạo bản nháp nhưng chưa lưu được chức năng đã chọn/i),
    ).not.toBeInTheDocument();
  });

  it("formats feature actions grouped by resource", () => {
    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    // erp.inventory has actions for receipts and stock
    expect(screen.getByText(/Phiếu nhập: nhận, xem · Tồn kho: xem/i)).toBeInTheDocument();
  });

  it("handles unknown custom 409 status code when saving features", async () => {
    vi.mocked(actions.patchDraftFeaturesAction).mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "UNKNOWN_CUSTOM_409",
      error: "Bản nháp đã thay đổi, vui lòng tải lại.",
    });

    render(
      <AppSummaryView
        initialDraft={sampleDraft}
        initialLockVersion={1}
        catalogFeatures={MOCK_CATALOG_FEATURES}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sửa chức năng" }));

    const saveBtn = screen.getByRole("button", { name: "Lưu thay đổi" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Bản nháp đã thay đổi, vui lòng tải lại/i)).toBeInTheDocument();
    });

    const reloadBtn = screen.getByRole("button", { name: "Tải lại trang ngay" });
    expect(reloadBtn).toBeInTheDocument();
  });
});
