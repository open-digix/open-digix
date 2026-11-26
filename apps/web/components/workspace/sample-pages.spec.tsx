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
import { render, screen, waitFor } from "@testing-library/react";
import AppsPage from "../../app/(workspace)/apps/page";
import TasksPage from "../../app/(workspace)/tasks/page";
import ReportsPage from "../../app/(workspace)/reports/page";
import SettingsPage from "../../app/(workspace)/settings/page";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/apps",
  redirect: vi.fn(),
}));

describe("Sample Data Workspace Pages", () => {
  it("AppsPage renders applications from mock store", async () => {
    render(<AppsPage />);

    await waitFor(() => {
      expect(screen.getByText("Vật tư và mua hàng")).toBeInTheDocument();
      expect(
        screen.getByText("Khách hàng của đội kinh doanh")
      ).toBeInTheDocument();
    });
  });

  it("TasksPage redirects to /apps", () => {
    TasksPage();
    expect(redirect).toHaveBeenCalledWith("/apps");
  });

  it("ReportsPage redirects to /apps", () => {
    ReportsPage();
    expect(redirect).toHaveBeenCalledWith("/apps");
  });

  it("SettingsPage renders configuration rows and operational rules", () => {
    render(<SettingsPage />);

    expect(
      screen.getByText("Thiết lập không gian làm việc"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nguyên tắc Không tự duyệt (No Self-Approval)"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Lưu thay đổi"),
    ).not.toBeInTheDocument();
  });
});
