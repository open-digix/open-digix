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
import { render, screen, fireEvent } from "@testing-library/react";
import ReloginButton, { sanitizeCallbackUrl } from "./ReloginButton";
import * as nextAuthReact from "next-auth/react";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("ReloginButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sanitizeCallbackUrl", () => {
    it("allows valid internal relative path", () => {
      expect(sanitizeCallbackUrl("/")).toBe("/");
      expect(sanitizeCallbackUrl("/dashboard")).toBe("/dashboard");
      expect(sanitizeCallbackUrl("/builder?foo=bar")).toBe("/builder?foo=bar");
    });

    it("rejects malicious or protocol-relative URLs", () => {
      expect(sanitizeCallbackUrl("//evil.example")).toBe("");
      expect(sanitizeCallbackUrl("https://evil.example")).toBe("");
      expect(sanitizeCallbackUrl("/\\evil.example")).toBe("");
      expect(sanitizeCallbackUrl("")).toBe("");
      expect(sanitizeCallbackUrl(null)).toBe("");
      expect(sanitizeCallbackUrl(undefined)).toBe("");
    });
  });

  it("calls signIn with sanitized callbackUrl prop if provided", () => {
    render(<ReloginButton callbackUrl="/builder?tab=overview" />);

    const button = screen.getByRole("button", { name: "Đăng nhập lại" });
    fireEvent.click(button);

    expect(nextAuthReact.signIn).toHaveBeenCalledTimes(1);
    expect(nextAuthReact.signIn).toHaveBeenCalledWith("keycloak", {
      callbackUrl: "/builder?tab=overview",
    });
  });

  it("falls back to window.location if callbackUrl prop is omitted", () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        pathname: "/workspace/settings",
        search: "?view=profile",
      },
    });

    render(<ReloginButton />);

    const button = screen.getByRole("button", { name: "Đăng nhập lại" });
    fireEvent.click(button);

    expect(nextAuthReact.signIn).toHaveBeenCalledTimes(1);
    expect(nextAuthReact.signIn).toHaveBeenCalledWith("keycloak", {
      callbackUrl: "/workspace/settings?view=profile",
    });
  });

  it("sanitizes unsafe callbackUrl prop and falls back safely", () => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        pathname: "/dashboard",
        search: "",
      },
    });

    render(<ReloginButton callbackUrl="//attacker.com/exploit" />);

    const button = screen.getByRole("button", { name: "Đăng nhập lại" });
    fireEvent.click(button);

    expect(nextAuthReact.signIn).toHaveBeenCalledTimes(1);
    // Unsafe prop rejected, falls back to current location /dashboard
    expect(nextAuthReact.signIn).toHaveBeenCalledWith("keycloak", {
      callbackUrl: "/dashboard",
    });
  });
});
