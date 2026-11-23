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

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(() => Promise.resolve(mockCookieStore)),
  headers: vi.fn().mockImplementation(() => Promise.resolve(new Headers())),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn().mockResolvedValue({ accessToken: "mock-token" }),
}));

// We'll dynamically import or mock server.ts
import { getTenantContext } from "../api/server";
import { selectTenantAction } from "./actions";

describe("Point 1: getTenantContext and selectTenantAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1 active membership: uses it directly, does NOT set or delete cookies during render", async () => {
    const mockMe = {
      user: { id: "u1", email: "a@b.com", displayName: "A", status: "active" },
      memberships: [
        {
          id: "m1",
          status: "active",
          tenant: { id: "t1", name: "Tenant 1", status: "active" },
          roles: ["designer"],
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMe),
    } as unknown as Response);

    mockCookieStore.get.mockReturnValue(undefined);

    const ctx = await getTenantContext();

    expect(ctx).not.toBeNull();
    expect(ctx?.currentTenant?.id).toBe("t1");
    expect(ctx?.needsTenantSelection).toBe(false);
    expect(mockCookieStore.set).not.toHaveBeenCalled();
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
  });

  it(">1 active membership with invalid cookie: treats as unselected without deleting cookie in render", async () => {
    const mockMe = {
      user: { id: "u1", email: "a@b.com", displayName: "A", status: "active" },
      memberships: [
        {
          id: "m1",
          status: "active",
          tenant: { id: "t1", name: "Tenant 1", status: "active" },
          roles: ["designer"],
        },
        {
          id: "m2",
          status: "active",
          tenant: { id: "t2", name: "Tenant 2", status: "active" },
          roles: ["viewer"],
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMe),
    } as unknown as Response);

    mockCookieStore.get.mockReturnValue({ value: "non-existent-tenant" });

    const ctx = await getTenantContext();

    expect(ctx).not.toBeNull();
    expect(ctx?.currentMembership).toBeNull();
    expect(ctx?.needsTenantSelection).toBe(true);
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("selectTenantAction sets cookie for active tenant and deletes cookie for invalid tenant", async () => {
    const mockMe = {
      user: { id: "u1", email: "a@b.com", displayName: "A", status: "active" },
      memberships: [
        {
          id: "m1",
          status: "active",
          tenant: { id: "t1", name: "Tenant 1", status: "active" },
          roles: ["designer"],
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMe),
    } as unknown as Response);

    // Valid tenant
    await selectTenantAction("t1");
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "ws-tenant",
      "t1",
      expect.objectContaining({ path: "/" }),
    );
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");

    // Invalid tenant
    vi.clearAllMocks();
    await selectTenantAction("invalid-tenant");
    expect(mockCookieStore.delete).toHaveBeenCalledWith("ws-tenant");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });
});
