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

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TenantSelect from "./TenantSelect";
import Stepper from "../builder/Stepper";
import type { MeMembership, MeUser } from "../../lib/tenant/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

const mockUser: MeUser = {
  id: "user-1",
  subject: "sub-1",
  email: "dung.demo@example.com",
  displayName: "Dung Demo",
  status: "active",
};

const mockMemberships: MeMembership[] = [
  {
    id: "mem-1",
    status: "active",
    tenant: {
      id: "tenant-alpha-uuid",
      slug: "tenant-alpha",
      name: "Tenant Alpha",
      status: "active",
    },
    roles: ["employee", "manager"],
  },
];

describe("Workspace Layout Components", () => {
  it("Sidebar renders standard nav links and hides Builder for non-designers", () => {
    render(
      <Sidebar
        roles={["employee", "manager"]}
        isOpen={false}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Tổng quan")).toBeInTheDocument();
    expect(screen.getByText("Ứng dụng")).toBeInTheDocument();
    expect(screen.getByText("Việc của tôi")).toBeInTheDocument();
    expect(screen.queryByText("Thiết kế quy trình")).not.toBeInTheDocument();
  });

  it("Sidebar shows Builder nav link when user has designer role", () => {
    render(
      <Sidebar
        roles={["employee", "designer"]}
        isOpen={false}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Thiết kế quy trình")).toBeInTheDocument();
  });

  it("Topbar renders initials from user display name and breadcrumb", () => {
    render(
      <Topbar
        user={mockUser}
        activeMemberships={mockMemberships}
        currentTenantId="tenant-alpha-uuid"
        roles={["employee"]}
        isSidebarOpen={false}
        onToggleSidebar={vi.fn()}
      />,
    );

    expect(screen.getByText("DD")).toBeInTheDocument();
    expect(screen.getByText("Tổng quan")).toBeInTheDocument();
    // Verify notifications button is NOT in DOM
    expect(screen.queryByLabelText("Thông báo")).not.toBeInTheDocument();
  });

  it("TenantSelect renders plain text when exactly 1 tenant is available", () => {
    render(
      <TenantSelect
        activeMemberships={mockMemberships}
        currentTenantId="tenant-alpha-uuid"
      />,
    );

    expect(screen.getByText("Tenant Alpha")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("TenantSelect renders dropdown when multiple active tenants are available", () => {
    const multiMemberships: MeMembership[] = [
      ...mockMemberships,
      {
        id: "mem-2",
        status: "active",
        tenant: {
          id: "tenant-beta-uuid",
          slug: "tenant-beta",
          name: "Tenant Beta",
          status: "active",
        },
        roles: ["employee"],
      },
    ];

    render(
      <TenantSelect
        activeMemberships={multiMemberships}
        currentTenantId="tenant-alpha-uuid"
      />,
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Tenant Beta")).toBeInTheDocument();
  });

  describe("Point 6: getMeCached classification and layout error states", () => {
    it("getMeCached classifies 401 as unauthenticated", async () => {
      const { getMeCached } = await import("../../lib/api/server");
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
      } as unknown as Response);

      const res = await getMeCached();
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.kind).toBe("unauthenticated");
      }
    });

    it("getMeCached classifies 403 as forbidden", async () => {
      const { getMeCached } = await import("../../lib/api/server");
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
      } as unknown as Response);

      const res = await getMeCached();
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.kind).toBe("forbidden");
      }
    });

    it("getMeCached classifies network error/500 as unavailable", async () => {
      const { getMeCached } = await import("../../lib/api/server");
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failed"));

      const res = await getMeCached();
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.kind).toBe("unavailable");
      }
    });

    it("WorkspaceLayout renders 401 error message when session expired", async () => {
      const { WorkspaceLayoutContent } = await import(
        "../../app/(workspace)/layout"
      );
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
      } as unknown as Response);

      const element = await WorkspaceLayoutContent({
        children: <div>Child Content</div>,
      });

      render(element);

      expect(
        screen.getByText("Phiên đăng nhập đã hết hạn"),
      ).toBeInTheDocument();
      expect(screen.getByText("Đăng nhập lại")).toBeInTheDocument();
    });

    it("WorkspaceLayout renders 403 error message when forbidden", async () => {
      const { WorkspaceLayoutContent } = await import(
        "../../app/(workspace)/layout"
      );
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
      } as unknown as Response);

      const element = await WorkspaceLayoutContent({
        children: <div>Child Content</div>,
      });

      render(element);

      expect(
        screen.getByText("Tài khoản chưa được cấp quyền vào doanh nghiệp nào"),
      ).toBeInTheDocument();
    });

    it("WorkspaceLayout renders 500/unavailable error message with retry", async () => {
      const { WorkspaceLayoutContent } = await import(
        "../../app/(workspace)/layout"
      );
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const element = await WorkspaceLayoutContent({
        children: <div>Child Content</div>,
      });

      render(element);

      expect(
        screen.getByText("Không kết nối được hệ thống"),
      ).toBeInTheDocument();
      expect(screen.getByText("Thử lại")).toBeInTheDocument();
    });

    it("Point 4: menu-button has aria-label and contains menu-lines for mobile hamburger", () => {
      render(
        <Topbar
          user={mockUser}
          activeMemberships={mockMemberships}
          currentTenantId="tenant-alpha-uuid"
          roles={["employee"]}
          isSidebarOpen={false}
          onToggleSidebar={vi.fn()}
        />,
      );

      const menuBtn = screen.getByRole("button", { name: "Mở điều hướng" });
      expect(menuBtn).toBeInTheDocument();
      expect(menuBtn.id).toBe("menu-button");
      expect(menuBtn.querySelector(".menu-lines")).toBeInTheDocument();
    });

    it("Point 4: Stepper wraps stage labels in .flow-stage-label for responsive display", () => {
      const { container } = render(<Stepper currentStep="source" />);

      const labels = container.querySelectorAll(".flow-stage-label");
      expect(labels).toHaveLength(5);
      expect(labels[1].textContent).toBe("Mô tả nguồn");
    });

    it("renders Stepper desktop with number in span and label in b element beside number without collapsed classes", () => {
      const { container } = render(<Stepper currentStep="source" />);

      const stages = container.querySelectorAll(".flow-stage");
      expect(stages).toHaveLength(5);
      for (const stage of stages) {
        expect(stage.className).not.toContain("collapsed");
        const num = stage.querySelector("span.flow-stage-num");
        const label = stage.querySelector("b.flow-stage-label");
        expect(num).toBeInTheDocument();
        expect(label).toBeInTheDocument();
        expect(num?.contains(label)).toBe(false);
      }
    });
  });
});
