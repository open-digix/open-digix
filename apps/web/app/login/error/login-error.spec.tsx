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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginErrorView, {
  classifyAuthError,
  getErrorContentInfo,
  sanitizeCallbackUrl,
  AUTH_RETRY_SESSION_KEY,
} from "./LoginErrorView";
import * as nextAuthReact from "next-auth/react";

// Mock next/navigation
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock next-auth/react signIn
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("classifyAuthError helper", () => {
  it("classifies state and PKCE errors correctly", () => {
    expect(classifyAuthError("CallbackRouteError")).toBe("state_pkce");
    expect(classifyAuthError("InvalidCheck")).toBe("state_pkce");
    expect(classifyAuthError("OAuthCallbackError")).toBe("state_pkce");
    expect(classifyAuthError("OAuthSignin")).toBe("state_pkce");
    expect(classifyAuthError("state_mismatch")).toBe("state_pkce");
    expect(classifyAuthError("pkce_verification_failed")).toBe("state_pkce");
  });

  it("classifies Configuration errors correctly", () => {
    expect(classifyAuthError("Configuration")).toBe("configuration");
    expect(classifyAuthError("configuration_error")).toBe("configuration");
  });

  it("classifies AccessDenied errors correctly", () => {
    expect(classifyAuthError("AccessDenied")).toBe("access_denied");
  });

  it("classifies Verification errors correctly", () => {
    expect(classifyAuthError("Verification")).toBe("verification");
  });

  it("defaults unknown or empty errors safely", () => {
    expect(classifyAuthError(null)).toBe("default");
    expect(classifyAuthError("")).toBe("default");
    expect(classifyAuthError("SomeRandomError")).toBe("default");
  });
});

describe("getErrorContentInfo helper", () => {
  it("returns reconnecting status for unretried state_pkce", () => {
    const info = getErrorContentInfo("CallbackRouteError", false);
    expect(info.kind).toBe("state_pkce");
    expect(info.title).toBe("Đang kết nối lại...");
    expect(info.isRetrying).toBe(true);
    expect(info.allowRetry).toBe(false);
  });

  it("returns interrupted session message for retried state_pkce", () => {
    const info = getErrorContentInfo("CallbackRouteError", true);
    expect(info.kind).toBe("state_pkce");
    expect(info.title).toBe("Phiên đăng nhập bị gián đoạn");
    expect(info.message).toBe("Phiên đăng nhập bị gián đoạn. Vui lòng đăng nhập lại.");
    expect(info.allowRetry).toBe(true);
    expect(info.showHome).toBe(true);
  });

  it("returns configuration issue info without exposing technical details", () => {
    const info = getErrorContentInfo("Configuration", false);
    expect(info.kind).toBe("configuration");
    expect(info.title).toBe("Sự cố cấu hình hệ thống");
    expect(info.message).toContain("Hệ thống đăng nhập đang gặp sự cố cấu hình");
    expect(info.allowRetry).toBe(false);
    expect(info.showHome).toBe(true);
    expect(info.message).not.toContain("Configuration");
  });

  it("returns access denied info", () => {
    const info = getErrorContentInfo("AccessDenied", false);
    expect(info.kind).toBe("access_denied");
    expect(info.title).toBe("Truy cập bị từ chối");
    expect(info.allowRetry).toBe(false);
    expect(info.showHome).toBe(true);
  });
});

describe("LoginErrorView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("handles Configuration error: renders Vietnamese message and home button, no auto-retry", () => {
    mockSearchParams = new URLSearchParams("error=Configuration");
    render(<LoginErrorView />);

    expect(screen.getByRole("heading", { name: "Sự cố cấu hình hệ thống" })).toBeInTheDocument();
    expect(
      screen.getByText("Hệ thống đăng nhập đang gặp sự cố cấu hình. Vui lòng thử lại sau hoặc liên hệ quản trị viên.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^←?\s*Về trang chủ/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Đăng nhập lại/i })).not.toBeInTheDocument();

    // No auto-retry triggered
    expect(nextAuthReact.signIn).not.toHaveBeenCalled();
    // No technical error code leaked in text
    expect(screen.queryByText("Configuration")).not.toBeInTheDocument();
  });

  it("handles AccessDenied error: renders Vietnamese message and home button", () => {
    mockSearchParams = new URLSearchParams("error=AccessDenied");
    render(<LoginErrorView />);

    expect(screen.getByRole("heading", { name: "Truy cập bị từ chối" })).toBeInTheDocument();
    expect(
      screen.getByText("Bạn không có quyền truy cập vào không gian làm việc này.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^←?\s*Về trang chủ/i })).toBeInTheDocument();
    expect(nextAuthReact.signIn).not.toHaveBeenCalled();
  });

  it("handles CallbackRouteError (state error) first time: auto-retries once and marks sessionStorage", () => {
    mockSearchParams = new URLSearchParams("error=CallbackRouteError");
    render(<LoginErrorView />);

    expect(screen.getByRole("heading", { name: "Đang kết nối lại..." })).toBeInTheDocument();
    expect(
      screen.getByText("Hệ thống đang tự động kết nối lại phiên đăng nhập. Vui lòng đợi trong giây lát...")
    ).toBeInTheDocument();

    // Auto-retry triggered exactly once
    expect(nextAuthReact.signIn).toHaveBeenCalledTimes(1);
    expect(nextAuthReact.signIn).toHaveBeenCalledWith("keycloak", { callbackUrl: "/dashboard" });
    expect(sessionStorage.getItem(AUTH_RETRY_SESSION_KEY)).toBe("1");
  });

  it("handles CallbackRouteError with ?retry=1: does not auto-retry, shows retry prompt", () => {
    mockSearchParams = new URLSearchParams("error=CallbackRouteError&retry=1");
    render(<LoginErrorView />);

    expect(screen.getByRole("heading", { name: "Phiên đăng nhập bị gián đoạn" })).toBeInTheDocument();
    expect(
      screen.getByText("Phiên đăng nhập bị gián đoạn. Vui lòng đăng nhập lại.")
    ).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Đăng nhập lại/i });
    expect(retryBtn).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^←?\s*Về trang chủ/i })).toBeInTheDocument();

    // Should NOT automatically call signIn
    expect(nextAuthReact.signIn).not.toHaveBeenCalled();

    // Clicking "Đăng nhập lại" triggers signIn and clears retry flag
    fireEvent.click(retryBtn);
    expect(nextAuthReact.signIn).toHaveBeenCalledTimes(1);
    expect(nextAuthReact.signIn).toHaveBeenCalledWith("keycloak", { callbackUrl: "/dashboard" });
    expect(sessionStorage.getItem(AUTH_RETRY_SESSION_KEY)).toBeNull();
  });

  it("handles InvalidCheck when sessionStorage has retry flag: prevents infinite loop and shows retry button", () => {
    sessionStorage.setItem(AUTH_RETRY_SESSION_KEY, "1");
    mockSearchParams = new URLSearchParams("error=InvalidCheck");
    render(<LoginErrorView />);

    expect(screen.getByRole("heading", { name: "Phiên đăng nhập bị gián đoạn" })).toBeInTheDocument();
    expect(
      screen.getByText("Phiên đăng nhập bị gián đoạn. Vui lòng đăng nhập lại.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng nhập lại/i })).toBeInTheDocument();

    // Prevent infinite loop: signIn was not called on mount
    expect(nextAuthReact.signIn).not.toHaveBeenCalled();
  });

  describe("sanitizeCallbackUrl helper", () => {
    it("allows safe internal relative paths", () => {
      expect(sanitizeCallbackUrl("/")).toBe("/");
      expect(sanitizeCallbackUrl("/dashboard")).toBe("/dashboard");
      expect(sanitizeCallbackUrl("/builder?step=2&tab=api#section")).toBe("/builder?step=2&tab=api#section");
    });

    it("sanitizes unsafe, external, or malformed paths to /dashboard", () => {
      expect(sanitizeCallbackUrl(null)).toBe("/dashboard");
      expect(sanitizeCallbackUrl("")).toBe("/dashboard");
      expect(sanitizeCallbackUrl("   ")).toBe("/dashboard");
      expect(sanitizeCallbackUrl("//evil.example")).toBe("/dashboard");
      expect(sanitizeCallbackUrl("https://evil.example")).toBe("/dashboard");
      expect(sanitizeCallbackUrl("/\\evil.example")).toBe("/dashboard");
      expect(sanitizeCallbackUrl("javascript:alert(1)")).toBe("/dashboard");
    });
  });

  describe("LoginErrorView with callbackUrl parameter", () => {
    it("preserves valid callbackUrl on auto-retry", () => {
      mockSearchParams = new URLSearchParams("error=CallbackRouteError&callbackUrl=/builder?step=2");
      render(<LoginErrorView />);

      expect(nextAuthReact.signIn).toHaveBeenCalledWith("keycloak", {
        callbackUrl: "/builder?step=2",
      });
    });

    it("sanitizes malicious callbackUrl to /dashboard on auto-retry", () => {
      mockSearchParams = new URLSearchParams("error=CallbackRouteError&callbackUrl=//evil.example");
      render(<LoginErrorView />);

      expect(nextAuthReact.signIn).toHaveBeenCalledWith("keycloak", {
        callbackUrl: "/dashboard",
      });
    });

    it("preserves valid callbackUrl on manual retry click", () => {
      mockSearchParams = new URLSearchParams("error=CallbackRouteError&retry=1&callbackUrl=/settings");
      render(<LoginErrorView />);

      const retryBtn = screen.getByRole("button", { name: /Đăng nhập lại/i });
      fireEvent.click(retryBtn);

      expect(nextAuthReact.signIn).toHaveBeenCalledWith("keycloak", {
        callbackUrl: "/settings",
      });
    });
  });
});
