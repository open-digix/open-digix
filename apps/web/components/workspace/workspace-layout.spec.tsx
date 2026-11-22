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
});
