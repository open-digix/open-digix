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
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AssistantView from "./AssistantView";
import * as assistantClient from "../../lib/assistant/client";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AssistantView Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    assistantClient.setMockUnavailable(false);
  });

  it("renders 3 columns and initial demo chat on mount", async () => {
    render(<AssistantView />);

    // Header title
    expect(screen.getByText("Trợ lý AI")).toBeDefined();
    expect(
      screen.getByText(
        "Trả lời từ nguồn quản trị đã chọn cho ứng dụng. Không tự thực hiện thao tác."
      )
    ).toBeDefined();

    // App select
    expect(screen.getByLabelText("Hỏi trong ứng dụng")).toBeDefined();

    // Left column history
    expect(screen.getByText("Cuộc trò chuyện mới")).toBeDefined();
    expect(screen.getByText("Duyệt yêu cầu mua trên 50 triệu")).toBeDefined();

    // Active chat messages
    expect(
      screen.getByText("Yêu cầu mua vật tư trên 50 triệu cần những ai duyệt?")
    ).toBeDefined();
    expect(
      screen.getByText("Kiểm kê cuối năm làm vào ngày nào?")
    ).toBeDefined();
    expect(
      screen.getByText("Chưa tìm thấy trong nguồn đang dùng")
    ).toBeDefined();

    // Right column sources
    await waitFor(() => {
      expect(screen.getByText("Nguồn đang dùng")).toBeDefined();
      expect(screen.getByText("Quy chế mua sắm nội bộ")).toBeDefined();
    });
  });

  it("sends message via Enter key, but allows Shift+Enter for newline", async () => {
    const askSpy = vi.spyOn(assistantClient, "ask");
    render(<AssistantView />);

    const textarea = screen.getByPlaceholderText(
      /Hỏi về quy chế, cách dùng ứng dụng/
    ) as HTMLTextAreaElement;

    // Shift + Enter should NOT send
    fireEvent.change(textarea, { target: { value: "Dòng 1" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(askSpy).not.toHaveBeenCalled();

    // Enter without shift should send
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    await waitFor(() => {
      expect(askSpy).toHaveBeenCalledWith("app-erp", "Dòng 1");
    });
  });

  it("sends exact prompt text when clicking suggestion pills", async () => {
    const askSpy = vi.spyOn(assistantClient, "ask");
    render(<AssistantView />);

    const pill = screen.getByRole("button", { name: "Nhập kho khi nào?" });
    fireEvent.click(pill);

    await waitFor(() => {
      expect(askSpy).toHaveBeenCalledWith("app-erp", "Nhập kho khi nào?");
    });
  });

  it("switches to State A (Start screen) on new chat and sends exact text from start suggestion", async () => {
    const askSpy = vi.spyOn(assistantClient, "ask");
    render(<AssistantView userName="Dung" />);

    // Click "+ Cuộc trò chuyện mới"
    const newChatBtn = screen.getByText("Cuộc trò chuyện mới");
    fireEvent.click(newChatBtn);

    // State A title should appear
    expect(screen.getByText("Chào Dung, bạn cần hỏi gì?")).toBeDefined();
    await waitFor(() => {
      expect(
        screen.getByText(
          /Trợ lý dùng.*nguồn quản trị viên đã chọn và luôn ghi rõ nguồn/
        )
      ).toBeDefined();
    });

    // Click start suggestion button
    const suggestionBtn = screen.getByRole("button", {
      name: "Yêu cầu mua trên 50 triệu cần ai duyệt?",
    });
    fireEvent.click(suggestionBtn);

    await waitFor(() => {
      expect(askSpy).toHaveBeenCalledWith(
        "app-erp",
        "Yêu cầu mua trên 50 triệu cần ai duyệt?"
      );
    });
  });

  it("switches to State C when choosing an app without sources", async () => {
    render(<AssistantView />);

    const select = screen.getByLabelText("Hỏi trong ứng dụng");

    // Switching with active messages triggers confirm dialog
    fireEvent.change(select, { target: { value: "app-crm" } });

    expect(screen.getByText("Đổi ứng dụng đang hỏi?")).toBeDefined();
    const confirmBtn = screen.getByRole("button", { name: "Đổi ứng dụng" });
    fireEvent.click(confirmBtn);

    // State C appears
    await waitFor(() => {
      expect(
        screen.getByText("Ứng dụng này chưa có nguồn cho trợ lý")
      ).toBeDefined();
      expect(
        screen.getByText(/Trợ lý chỉ trả lời từ tài liệu được quản trị viên chọn/)
      ).toBeDefined();
      expect(screen.getByText("Chọn nguồn cho trợ lý")).toBeDefined();
    });
  });

  it("renders State B (unavailable) with disabled input and retry button", async () => {
    vi.spyOn(assistantClient, "isMockUnavailable").mockReturnValue(true);

    render(<AssistantView />);

    expect(screen.getByText("Trợ lý AI đang tạm ngừng")).toBeDefined();
    expect(screen.getByText("Tạm thời chưa gửi được câu hỏi")).toBeDefined();

    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(screen.queryByText("Trợ lý AI đang tạm ngừng")).toBeNull();
  });

  it("handles citation click to select source and feedback buttons", async () => {
    render(<AssistantView />);

    // Click citation button '1'
    const citeBtns = screen.getAllByRole("button", { name: /Xem nguồn số 1/ });
    fireEvent.click(citeBtns[0]);

    // Source card should be selected and show snippet
    await waitFor(() => {
      expect(
        screen.getByText(
          /Mục 4.2: Yêu cầu trên 50.000.000 đ do trưởng bộ phận và kế toán trưởng/
        )
      ).toBeDefined();
    });

    // Helpful feedback
    const helpfulBtns = screen.getAllByRole("button", { name: "Hữu ích" });
    fireEvent.click(helpfulBtns[0]);
    expect(screen.getByText("Cảm ơn, đã ghi nhận.")).toBeDefined();
  });
});
