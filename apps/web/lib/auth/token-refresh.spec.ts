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
import {
  refreshAccessToken,
  clearRefreshCache,
  hashRefreshToken,
  type JWTToken,
} from "./token-refresh";

describe("token-refresh (WEB-F00 / AUTH-01)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearRefreshCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("calculates consistent sha256 hash for refresh token", () => {
    const hash1 = hashRefreshToken("my-secret-refresh-token");
    const hash2 = hashRefreshToken("my-secret-refresh-token");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns token without calling Keycloak if refresh token already expired", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const now = Math.floor(Date.now() / 1000);
    const expiredToken: JWTToken = {
      accessToken: "old-access",
      refreshToken: "old-refresh",
      refreshExpiresAt: now - 100, // expired 100s ago
    };

    const result = await refreshAccessToken(expiredToken);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.error).toBe("RefreshTokenError");
    expect(result.accessToken).toBeUndefined();
  });

  it("returns token without calling Keycloak if token already has error", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const errorToken: JWTToken = {
      accessToken: "some-access",
      refreshToken: "some-refresh",
      error: "RefreshTokenError",
    };

    const result = await refreshAccessToken(errorToken);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.error).toBe("RefreshTokenError");
  });

  it("refreshes token successfully and updates expires_at and tokens", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockResponse = {
      access_token: "new-access-token",
      expires_in: 300,
      refresh_token: "new-refresh-token",
      refresh_expires_in: 1800,
      id_token: "new-id-token",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const token: JWTToken = {
      accessToken: "old-access-token",
      refreshToken: "old-refresh-token",
      expiresAt: now - 10,
      refreshExpiresAt: now + 600,
    };

    const result = await refreshAccessToken(token);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe("new-access-token");
    expect(result.refreshToken).toBe("new-refresh-token");
    expect(result.idToken).toBe("new-id-token");
    expect(result.expiresAt).toBeGreaterThanOrEqual(now + 299);
    expect(result.error).toBeUndefined();
  });

  it("keeps old refresh token if Keycloak does not return a new refresh token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockResponse = {
      access_token: "new-access-token",
      expires_in: 300,
      // no refresh_token returned (Keycloak realm without rotation)
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const token: JWTToken = {
      accessToken: "old-access-token",
      refreshToken: "keep-this-refresh-token",
      expiresAt: now - 10,
      refreshExpiresAt: now + 600,
    };

    const result = await refreshAccessToken(token);

    expect(result.accessToken).toBe("new-access-token");
    expect(result.refreshToken).toBe("keep-this-refresh-token");
    expect(result.error).toBeUndefined();
  });

  it("handles Keycloak 400 error by returning RefreshTokenError and clearing access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });
    global.fetch = fetchMock;

    const now = Math.floor(Date.now() / 1000);
    const token: JWTToken = {
      accessToken: "old-access-token",
      refreshToken: "invalid-refresh-token",
      expiresAt: now - 10,
      refreshExpiresAt: now + 2000,
    };

    const result = await refreshAccessToken(token);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.error).toBe("RefreshTokenError");
    expect(result.accessToken).toBeUndefined();
  });

  it("deduplicates simultaneous concurrent requests: only calls Keycloak once for same refresh token", async () => {
    const mockResponse = {
      access_token: "shared-refreshed-token",
      expires_in: 300,
      refresh_token: "shared-refresh-token",
    };

    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      callCount++;
      // Simulate network latency
      await new Promise((r) => setTimeout(r, 50));
      return {
        ok: true,
        json: async () => mockResponse,
      };
    });
    global.fetch = fetchMock;

    const now = Math.floor(Date.now() / 1000);
    const token: JWTToken = {
      accessToken: "stale-access",
      refreshToken: "concurrent-refresh-token",
      expiresAt: now - 10,
      refreshExpiresAt: now + 2000,
    };

    // Run two refresh requests simultaneously
    const [res1, res2] = await Promise.all([
      refreshAccessToken(token),
      refreshAccessToken(token),
    ]);

    expect(callCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res1.accessToken).toBe("shared-refreshed-token");
    expect(res2.accessToken).toBe("shared-refreshed-token");
  });

  it("never returns snake_case token properties in returned object on success", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockResponse = {
      access_token: "new-access",
      expires_in: 300,
      refresh_token: "new-refresh",
      refresh_expires_in: 1800,
      id_token: "new-id",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const legacyToken: JWTToken & Record<string, unknown> = {
      accessToken: "old-access",
      refreshToken: "old-refresh",
      access_token: "legacy-access",
      refresh_token: "legacy-refresh",
      id_token: "legacy-id",
      expires_at: now - 10,
      refresh_expires_at: now + 500,
      expiresAt: now - 10,
      refreshExpiresAt: now + 500,
    };

    const result = await refreshAccessToken(legacyToken) as Record<string, unknown>;

    expect(result.accessToken).toBe("new-access");
    expect(result.refreshToken).toBe("new-refresh");
    expect(result.idToken).toBe("new-id");
    expect(result.expiresAt).toBeDefined();
    expect(result.refreshExpiresAt).toBeDefined();

    // Verify absolutely no snake_case keys exist
    expect(result.access_token).toBeUndefined();
    expect(result.refresh_token).toBeUndefined();
    expect(result.id_token).toBeUndefined();
    expect(result.expires_at).toBeUndefined();
    expect(result.refresh_expires_at).toBeUndefined();
  });

  it("never returns snake_case token properties in returned object on error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });
    global.fetch = fetchMock;

    const legacyToken: JWTToken & Record<string, unknown> = {
      accessToken: "old-access",
      refreshToken: "old-refresh",
      access_token: "legacy-access",
      refresh_token: "legacy-refresh",
      id_token: "legacy-id",
      expires_at: 100,
      refresh_expires_at: 200,
      expiresAt: 100,
      refreshExpiresAt: 200,
    };

    const result = await refreshAccessToken(legacyToken) as Record<string, unknown>;

    expect(result.error).toBe("RefreshTokenError");
    expect(result.accessToken).toBeUndefined();
    expect(result.access_token).toBeUndefined();
    expect(result.refresh_token).toBeUndefined();
    expect(result.id_token).toBeUndefined();
    expect(result.expires_at).toBeUndefined();
    expect(result.refresh_expires_at).toBeUndefined();
  });
});
