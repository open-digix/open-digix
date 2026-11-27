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
import AppSelect from "./AppSelect";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AppPage from "../../app/(workspace)/app/[appId]/[[...page]]/page";
import type { MeMembership, MeUser } from "../../lib/tenant/types";

let currentMockPath = "/apps";
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => currentMockPath,
  redirect: vi.fn(),
}));

vi.mock("../../lib/api/server", () => ({
  getTenantContext: vi.fn().mockResolvedValue({
    roles: ["buyer"],
    currentTenant: { id: "tenant-1", name: "Công ty Alpha" },
  }),
}));

const mockUser: MeUser = {
  id: "u-1",
  subject: "s-1",
  email: "test@example.com",
  displayName: "Nguyen Van A",
  status: "active",
};

const mockMemberships: MeMembership[] = [
  {
    id: "mem-1",
    tenant: { id: "tenant-1", slug: "alpha", name: "Công ty Alpha", status: "active" },
    roles: ["buyer"],
    status: "active",
  },
];

describe("WEB-F07 App Framework & Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockPath = "/apps";
  });

  describe("Sidebar", () => {
    it("renders brand logo linking to /apps instead of /dashboard", () => {
      render(
        <Sidebar
          roles={["buyer"]}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const brandLink = screen.getByLabelText("Về danh mục ứng dụng DigiX Lab");
      expect(brandLink).toHaveAttribute("href", "/apps");
    });

    it("renders only system group when outside /app/[appId]", () => {
      currentMockPath = "/apps";
      render(
        <Sidebar
          roles={["buyer"]}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText("HỆ THỐNG")).toBeInTheDocument();
      expect(screen.getByText("Ứng dụng")).toBeInTheDocument();
      expect(screen.getByText("Trợ lý")).toBeInTheDocument();
      expect(screen.getByText("Cài đặt")).toBeInTheDocument();

      // Obsolete items must be gone
      expect(screen.queryByText("Tổng quan")).not.toBeInTheDocument();
      expect(screen.queryByText("Việc của tôi")).not.toBeInTheDocument();
      expect(screen.queryByText("Hồ sơ của tôi")).not.toBeInTheDocument();
      expect(screen.queryByText("Báo cáo")).not.toBeInTheDocument();
    });

    it("renders app pages group when inside /app/erp-a", async () => {
      currentMockPath = "/app/11111111-1111-4111-8111-111111111111/purchase";
      render(
        <Sidebar
          roles={["buyer"]}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Yêu cầu mua")).toBeInTheDocument();
        expect(screen.getByText("Tồn kho")).toBeInTheDocument();
      });
    });

    it("shows 'Thiết kế ứng dụng' for designer role with new stroke icon", () => {
      render(
        <Sidebar
          roles={["designer"]}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText("Thiết kế ứng dụng")).toBeInTheDocument();
    });
  });

  describe("Topbar & AppSelect", () => {
    it("renders AppSelect dropdown with published apps", async () => {
      currentMockPath = "/app/11111111-1111-4111-8111-111111111111";
      render(<AppSelect currentTenantId="tenant-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Chọn ứng dụng")).toBeInTheDocument();
      });

      const select = screen.getByLabelText("Chọn ứng dụng") as HTMLSelectElement;
      expect(select.value).toBe("11111111-1111-4111-8111-111111111111");
    });

    it("switches app when selecting a different app", async () => {
      currentMockPath = "/app/11111111-1111-4111-8111-111111111111";
      render(<AppSelect currentTenantId="tenant-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText("Chọn ứng dụng")).toBeInTheDocument();
      });

      const select = screen.getByLabelText("Chọn ứng dụng");
      fireEvent.change(select, {
        target: { value: "22222222-2222-4222-8222-222222222222" },
      });

      expect(mockPush).toHaveBeenCalledWith(
        "/app/22222222-2222-4222-8222-222222222222"
      );
    });

    it("Topbar displays breadcrumb with tenant and app name when in app", async () => {
      currentMockPath = "/app/11111111-1111-4111-8111-111111111111";
      render(
        <Topbar
          user={mockUser}
          activeMemberships={mockMemberships}
          currentTenantId="tenant-1"
          roles={["buyer"]}
          isSidebarOpen={false}
          onToggleSidebar={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("Công ty Alpha").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Vật tư và mua hàng v1/)).toBeInTheDocument();
      });
    });
  });

  describe("Route /app/[appId] Deep Link & Permission Protection", () => {
    it("renders safe state when app does not exist", async () => {
      const pageResult = await AppPage({
        params: Promise.resolve({ appId: "non-existent-app-id" }),
      });

      render(pageResult);

      expect(
        screen.getByText("Không tìm thấy hoặc bạn không có quyền xem")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Ứng dụng này không tồn tại hoặc tài khoản của bạn chưa được cấp quyền truy cập."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Quay lại danh mục ứng dụng" })
      ).toHaveAttribute("href", "/apps");

      // Must not leak app name or technical error
      expect(screen.queryByText("non-existent-app-id")).not.toBeInTheDocument();
    });

    it("renders safe state when user does not have permission", async () => {
      // Role "guest" has no access to CRM A (requires sales, admin, owner, tenant_admin)
      const pageResult = await AppPage({
        params: Promise.resolve({
          appId: "22222222-2222-4222-8222-222222222222",
        }),
      });

      render(pageResult);

      expect(
        screen.getByText("Không tìm thấy hoặc bạn không có quyền xem")
      ).toBeInTheDocument();
      expect(screen.queryByText("Khách hàng của đội kinh doanh")).not.toBeInTheDocument();
    });
  });
});
