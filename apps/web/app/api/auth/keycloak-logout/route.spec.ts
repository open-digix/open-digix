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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockDeleteCookie = vi.fn();
const mockGetAllCookies = vi.fn().mockReturnValue([
  { name: "authjs.session-token", value: "token-1" },
  { name: "other-cookie", value: "val-2" },
]);

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
  cookies: () =>
    Promise.resolve({
      getAll: mockGetAllCookies,
      delete: mockDeleteCookie,
    }),
}));

const mockSignOut = vi.fn().mockResolvedValue(undefined);
vi.mock("@/auth", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

let mockTokenResult: Record<string, unknown> | null = null;
vi.mock("next-auth/jwt", () => ({
  getToken: () => Promise.resolve(mockTokenResult),
}));

import { GET, POST } from "./route";
import type { NextRequest } from "next/server";

function createMockRequest(): NextRequest {
  return new Request("http://localhost:3000/api/auth/keycloak-logout", {
    method: "POST",
  }) as unknown as NextRequest;
}

const originalEnv = {
  issuer: process.env.AUTH_KEYCLOAK_ISSUER,
  clientId: process.env.AUTH_KEYCLOAK_ID,
  appUrl: process.env.AUTH_URL,
  secret: process.env.AUTH_SECRET,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AUTH_KEYCLOAK_ISSUER = "http://localhost:8080/realms/digix";
  process.env.AUTH_KEYCLOAK_ID = "digix-web";
  process.env.AUTH_URL = "http://localhost:3000";
  process.env.AUTH_SECRET = "test-secret";
  mockTokenResult = null;
});

afterEach(() => {
  process.env.AUTH_KEYCLOAK_ISSUER = originalEnv.issuer;
  process.env.AUTH_KEYCLOAK_ID = originalEnv.clientId;
  process.env.AUTH_URL = originalEnv.appUrl;
  process.env.AUTH_SECRET = originalEnv.secret;
});

describe("Keycloak logout route", () => {
  it("POST có id_token: URL có đủ 3 tham số mã hóa và chuyển hướng 303", async () => {
    mockTokenResult = { idToken: "header.payload.signature" };

    const response = await POST(createMockRequest());
    expect(response.status).toBe(303);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const parsedUrl = new URL(location!);

    expect(parsedUrl.origin).toBe("http://localhost:8080");
    expect(parsedUrl.pathname).toBe("/realms/digix/protocol/openid-connect/logout");
    expect(parsedUrl.searchParams.get("client_id")).toBe("digix-web");
    expect(parsedUrl.searchParams.get("post_logout_redirect_uri")).toBe("http://localhost:3000/login");
    expect(parsedUrl.searchParams.get("id_token_hint")).toBe("header.payload.signature");
  });

  it("POST không có id_token: chuyển hướng 303 và không có id_token_hint", async () => {
    mockTokenResult = null;

    const response = await POST(createMockRequest());
    expect(response.status).toBe(303);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const parsedUrl = new URL(location!);

    expect(parsedUrl.searchParams.get("client_id")).toBe("digix-web");
    expect(parsedUrl.searchParams.get("post_logout_redirect_uri")).toBe("http://localhost:3000/login");
    expect(parsedUrl.searchParams.has("id_token_hint")).toBe(false);
  });

  it("GET: trả về 405 Method Not Allowed với header Allow POST", () => {
    const response = GET();
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("Xóa phiên Auth.js và cookie phiên khi POST đăng xuất", async () => {
    mockTokenResult = { idToken: "token-abc" };

    const response = await POST(createMockRequest());
    expect(response.status).toBe(303);
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(mockDeleteCookie).toHaveBeenCalledWith("authjs.session-token");
    expect(mockDeleteCookie).toHaveBeenCalled();
  });

  it("Thiếu cấu hình: trả về mã lỗi 500 như cũ", async () => {
    delete process.env.AUTH_KEYCLOAK_ISSUER;

    const response = await POST(createMockRequest());
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe("Keycloak logout is not configured.");
  });
});
