import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerTenantAction } from "./actions";

describe("registerTenantAction", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("maps backend VALIDATION_FAILED issues to Vietnamese fieldErrors and uses Vietnamese message instead of English", async () => {
    process.env.REGISTRATION_API_MODE = "api";
    process.env.API_INTERNAL_URL = "http://localhost:3001";

    // Mock fetch to simulate backend PR #40 response
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: "VALIDATION_FAILED",
          message: "Tenant registration input is invalid.", // English message from server
          issues: [
            { path: "/tenantSlug", message: "tenantSlug is invalid" },
            { path: "/admin/email", message: "email is invalid" },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await registerTenantAction({
      tenantName: "Công ty Test",
      tenantSlug: "test-slug",
      admin: {
        firstName: "An",
        lastName: "Nguyễn",
        email: "invalid-email",
        username: "an.nguyen",
        password: "Password123!",
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION_FAILED");
      // Must NOT display English server message
      expect(res.message).toBe("Thông tin đăng ký chưa hợp lệ, vui lòng kiểm tra lại các trường.");
      expect(res.message).not.toContain("Tenant registration input is invalid.");
      // Issues mapped to Vietnamese
      expect(res.fieldErrors?.tenantSlug).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
      expect(res.fieldErrors?.email).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
    }
  });

  it("maps backend UNAVAILABLE code to Vietnamese message", async () => {
    process.env.REGISTRATION_API_MODE = "api";
    process.env.API_INTERNAL_URL = "http://localhost:3001";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: {
          code: "UNAVAILABLE",
          message: "Identity provider connection failed.",
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await registerTenantAction({
      tenantName: "Công ty Test",
      tenantSlug: "test-slug",
      admin: {
        firstName: "An",
        lastName: "Nguyễn",
        email: "an@example.com",
        username: "an.nguyen",
        password: "Password123!",
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("UNAVAILABLE");
      expect(res.message).toBe("Hệ thống đăng ký hiện đang bận hoặc không thể kết nối. Vui lòng thử lại sau.");
    }
  });
});
