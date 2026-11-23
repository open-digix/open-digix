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
import DashboardOverview, { getGreetingVi } from "./DashboardOverview";
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
  it("getGreetingVi returns correct greeting according to Vietnam timezone (Asia/Ho_Chi_Minh)", () => {
    // 08:30 in Vietnam (UTC 01:30) -> < 11h -> Chào buổi sáng
    const morning = new Date("2026-11-23T01:30:00Z");
    expect(getGreetingVi(morning)).toBe("Chào buổi sáng");

    // 10:59 in Vietnam (UTC 03:59) -> < 11h -> Chào buổi sáng
    const lateMorning = new Date("2026-11-23T03:59:00Z");
    expect(getGreetingVi(lateMorning)).toBe("Chào buổi sáng");

    // 11:00 in Vietnam (UTC 04:00) -> >= 11h and < 13h -> Chào buổi trưa
    const noon = new Date("2026-11-23T04:00:00Z");
    expect(getGreetingVi(noon)).toBe("Chào buổi trưa");

    // 12:59 in Vietnam (UTC 05:59) -> < 13h -> Chào buổi trưa
    const lateNoon = new Date("2026-11-23T05:59:00Z");
    expect(getGreetingVi(lateNoon)).toBe("Chào buổi trưa");

    // 13:00 in Vietnam (UTC 06:00) -> >= 13h and < 18h -> Chào buổi chiều
    const afternoon = new Date("2026-11-23T06:00:00Z");
    expect(getGreetingVi(afternoon)).toBe("Chào buổi chiều");

    // 17:59 in Vietnam (UTC 10:59) -> < 18h -> Chào buổi chiều
    const lateAfternoon = new Date("2026-11-23T10:59:00Z");
    expect(getGreetingVi(lateAfternoon)).toBe("Chào buổi chiều");

    // 18:00 in Vietnam (UTC 11:00) -> >= 18h -> Chào buổi tối
    const evening = new Date("2026-11-23T11:00:00Z");
    expect(getGreetingVi(evening)).toBe("Chào buổi tối");

    // 23:30 in Vietnam (UTC 16:30) -> >= 18h -> Chào buổi tối
    const lateEvening = new Date("2026-11-23T16:30:00Z");
    expect(getGreetingVi(lateEvening)).toBe("Chào buổi tối");

    // Invalid date -> fallback "Xin chào"
    const invalidDate = new Date("invalid-date-string");
    expect(getGreetingVi(invalidDate)).toBe("Xin chào");
  });

  it("renders real user greeting and real tenant name", () => {
    render(
      <DashboardOverview
        user={mockUser}
        tenant={mockTenant}
        roles={["employee", "manager"]}
      />,
    );

    const currentGreeting = getGreetingVi();
    expect(
      screen.getByText(new RegExp(`${currentGreeting}, Dung Demo`)),
    ).toBeInTheDocument();
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
