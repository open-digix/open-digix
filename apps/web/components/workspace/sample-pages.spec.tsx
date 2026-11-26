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
import { render, screen, fireEvent } from "@testing-library/react";
import AppsPage from "../../app/(workspace)/apps/page";
import TasksPage from "../../app/(workspace)/tasks/page";
import ReportsPage from "../../app/(workspace)/reports/page";
import SettingsPage from "../../app/(workspace)/settings/page";

describe("Sample Data Workspace Pages", () => {
  it("AppsPage renders mock applications and filter tabs", () => {
    render(<AppsPage />);

    expect(screen.getByText("Đề nghị mua sắm")).toBeInTheDocument();
    expect(screen.getByText("Đăng ký nghỉ phép")).toBeInTheDocument();
    expect(screen.getByText("Tiếp nhận nhân sự")).toBeInTheDocument();
  });

  it("TasksPage renders mock tasks and quick approve displays sample toast", () => {
    render(<TasksPage />);

    expect(
      screen.getByText("Đề nghị mua laptop cho nhóm thiết kế"),
    ).toBeInTheDocument();

    const quickApproveButtons = screen.getAllByText("Duyệt nhanh");
    fireEvent.click(quickApproveButtons[0]);

    expect(
      screen.getByText(/Đã duyệt công việc \(mẫu — không gửi tới hệ thống\)/),
    ).toBeInTheDocument();
  });

  it("ReportsPage renders metrics and operational insights", () => {
    render(<ReportsPage />);

    expect(screen.getByText("Báo cáo & Thống kê")).toBeInTheDocument();
    expect(screen.getByText("Nhận định vận hành")).toBeInTheDocument();
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
