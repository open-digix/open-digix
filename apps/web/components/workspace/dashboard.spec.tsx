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
import { render, screen } from "@testing-library/react";
import DashboardOverview from "./DashboardOverview";
import type { MeTenant, MeUser } from "../../lib/tenant/types";

const mockUser: MeUser = {
  id: "user-dung",
  subject: "sub-dung",
  email: "dung.demo@example.com",
  displayName: "Dung Demo",
  status: "active",
};

const mockTenant: MeTenant = {
  id: "tenant-alpha-uuid",
  slug: "tenant-alpha",
  name: "Tenant Alpha",
  status: "active",
};

describe("DashboardOverview component", () => {
  it("renders real user greeting and real tenant name", () => {
    render(
      <DashboardOverview
        user={mockUser}
        tenant={mockTenant}
        roles={["employee", "manager"]}
      />,
    );

    expect(screen.getByText("Chào buổi sáng, Dung Demo")).toBeInTheDocument();
    expect(screen.getByText("Tenant Alpha")).toBeInTheDocument();
  });

  it("renders role chips with Vietnamese labels", () => {
    render(
      <DashboardOverview
        user={mockUser}
        tenant={mockTenant}
        roles={["employee", "manager"]}
      />,
    );

    expect(screen.getByText("Nhân viên")).toBeInTheDocument();
    expect(screen.getByText("Quản lý")).toBeInTheDocument();
  });

  it("marks KPI section with DỮ LIỆU MẪU pill", () => {
    render(
      <DashboardOverview
        user={mockUser}
        tenant={mockTenant}
        roles={["employee"]}
      />,
    );

    expect(screen.getByText("DỮ LIỆU MẪU")).toBeInTheDocument();
    expect(screen.getByText("Chỉ số hoạt động")).toBeInTheDocument();
  });
});
