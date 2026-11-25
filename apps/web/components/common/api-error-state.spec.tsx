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
import { render, screen, fireEvent } from "@testing-library/react";
import ApiErrorState from "./ApiErrorState";
import { ApiError } from "../../lib/api/server";

// Mock next-auth/react signIn
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("ApiErrorState (v2.5 §3)", () => {
  it("renders 404 not_found with honest Vietnamese message without revealing record name or key", () => {
    const error404 = new ApiError(
      404,
      "APP_NOT_FOUND",
      "Secret Record app_id_12345 should not leak",
    );

    render(<ApiErrorState error={error404} />);

    expect(
      screen.getByText("Không tìm thấy hoặc bạn không có quyền xem"),
    ).toBeInTheDocument();
    // Verify secret record key is NOT leaked
    expect(
      screen.queryByText(/Secret Record/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/app_id_12345/i),
    ).not.toBeInTheDocument();
  });

  it("renders 409 conflict with 'Tải lại' button and triggers reload/callback", () => {
    const onRetry = vi.fn();
    const error409 = new ApiError(
      409,
      "VERSION_CONFLICT",
      "Bản nháp đã được cập nhật bởi phiên làm việc khác.",
    );

    render(<ApiErrorState error={error409} onRetry={onRetry} />);

    expect(screen.getByText("Xung đột dữ liệu")).toBeInTheDocument();
    const reloadButton = screen.getByRole("button", { name: "Tải lại" });
    expect(reloadButton).toBeInTheDocument();

    fireEvent.click(reloadButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders 401 unauthenticated with 'Đăng nhập lại' button that calls signIn", async () => {
    const { signIn } = await import("next-auth/react");
    const error401 = new ApiError(401, "UNAUTHENTICATED", "Yêu cầu đăng nhập.");

    render(<ApiErrorState error={error401} />);

    expect(
      screen.getByText("Phiên đăng nhập đã hết hạn"),
    ).toBeInTheDocument();
    const reloginBtn = screen.getByRole("button", { name: "Đăng nhập lại" });
    expect(reloginBtn).toBeInTheDocument();

    fireEvent.click(reloginBtn);
    expect(signIn).toHaveBeenCalledWith("keycloak", {
      callbackUrl: "/dashboard",
    });
  });

  it("renders 403 forbidden message", () => {
    const error403 = new ApiError(
      403,
      "FORBIDDEN",
      "Bạn không có quyền thực hiện thao tác này.",
    );

    render(<ApiErrorState error={error403} />);

    expect(screen.getByText("Không có quyền truy cập")).toBeInTheDocument();
    expect(
      screen.getByText("Bạn không có quyền thực hiện thao tác này."),
    ).toBeInTheDocument();
  });

  it("renders 422 unprocessable with issues list", () => {
    const error422 = new ApiError(
      422,
      "VALIDATION_FAILED",
      "Dữ liệu không hợp lệ",
      undefined,
      [
        { code: "REQUIRED", path: "/goal", message: "Mục tiêu không được để trống" },
        { code: "INVALID", path: "/inputNotes", message: "Ghi chú không đúng định dạng" },
      ],
    );

    render(<ApiErrorState error={error422} />);

    expect(screen.getByText("Dữ liệu không hợp lệ")).toBeInTheDocument();
    expect(
      screen.getByText("Mục tiêu không được để trống"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ghi chú không đúng định dạng"),
    ).toBeInTheDocument();
  });

  it("renders 429 rate_limited message", () => {
    const error429 = new ApiError(429, "RATE_LIMITED", "Quá nhiều yêu cầu.");

    render(<ApiErrorState error={error429} />);

    expect(screen.getByText("Hệ thống đang bận")).toBeInTheDocument();
    expect(
      screen.getByText("Hệ thống đang bận. Vui lòng thử lại sau giây lát."),
    ).toBeInTheDocument();
  });

  it("renders 5xx unavailable message", () => {
    const error500 = new ApiError(500, "INTERNAL_ERROR", "Lỗi server.");

    render(<ApiErrorState error={error500} />);

    expect(
      screen.getByText("Dịch vụ tạm thời không khả dụng"),
    ).toBeInTheDocument();
  });
});
