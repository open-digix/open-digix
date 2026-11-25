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

  it("defaults to api mode when REGISTRATION_API_MODE is unset", async () => {
    delete process.env.REGISTRATION_API_MODE;
    process.env.API_INTERNAL_URL = "http://localhost:3001";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        tenantId: "tenant-donga",
        tenantSlug: "donga",
        username: "an.nguyen",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await registerTenantAction({
      tenantName: "Đông Á Corp",
      tenantSlug: "donga",
      admin: {
        firstName: "An",
        lastName: "Nguyễn",
        email: "an@donga.vn",
        username: "an.nguyen",
        password: "Password123!",
      },
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.tenantId).toBe("tenant-donga");
      expect(res.tenantSlug).toBe("donga");
      expect(res.username).toBe("an.nguyen");
      expect(res.mock).toBeUndefined();
    }
  });

  it("uses mock mode only when explicitly set to 'mock'", async () => {
    process.env.REGISTRATION_API_MODE = "mock";
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const res = await registerTenantAction({
      tenantName: "Công ty Mẫu Thử",
      tenantSlug: "mau-thu-slug",
      admin: {
        firstName: "Bình",
        lastName: "Trần",
        email: "binh@example.com",
        username: "binh.tran",
        password: "Password123!",
      },
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.mock).toBe(true);
      expect(res.tenantSlug).toBe("mau-thu-slug");
    }
  });

  it("maps backend TENANT_SLUG_TAKEN (409) to correct field and Vietnamese message", async () => {
    delete process.env.REGISTRATION_API_MODE;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          code: "TENANT_SLUG_TAKEN",
          message: "Tenant slug is already taken.",
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await registerTenantAction({
      tenantName: "Công ty Test",
      tenantSlug: "da-ton-tai",
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
      expect(res.code).toBe("TENANT_SLUG_TAKEN");
      expect(res.field).toBe("tenantSlug");
      expect(res.message).toBe("Mã doanh nghiệp đã được dùng, hãy chọn mã khác.");
    }
  });

  it("maps backend EMAIL_TAKEN (409) to correct field and Vietnamese message", async () => {
    delete process.env.REGISTRATION_API_MODE;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          code: "EMAIL_TAKEN",
          message: "Email is already taken.",
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await registerTenantAction({
      tenantName: "Công ty Test",
      tenantSlug: "slug-moi",
      admin: {
        firstName: "An",
        lastName: "Nguyễn",
        email: "trung@example.com",
        username: "an.nguyen",
        password: "Password123!",
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("EMAIL_TAKEN");
      expect(res.field).toBe("email");
      expect(res.message).toBe("Email này đã được đăng ký, vui lòng dùng email khác.");
    }
  });

  it("maps backend USERNAME_TAKEN (409) to correct field and Vietnamese message", async () => {
    delete process.env.REGISTRATION_API_MODE;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          code: "USERNAME_TAKEN",
          message: "Username is already taken.",
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await registerTenantAction({
      tenantName: "Công ty Test",
      tenantSlug: "slug-moi",
      admin: {
        firstName: "An",
        lastName: "Nguyễn",
        email: "an@example.com",
        username: "admin",
        password: "Password123!",
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("USERNAME_TAKEN");
      expect(res.field).toBe("username");
      expect(res.message).toBe("Tên đăng nhập này đã tồn tại, hãy chọn tên khác.");
    }
  });

  it("maps backend VALIDATION_FAILED with issues including /admin to fieldErrors and Vietnamese message", async () => {
    delete process.env.REGISTRATION_API_MODE;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: "VALIDATION_FAILED",
          message: "Tenant registration input is invalid.",
          issues: [
            { path: "/tenantName", message: "tenantName must be a non-empty string." },
            { path: "/tenantSlug", message: "tenantSlug is invalid" },
            { path: "/admin", message: "admin must be a JSON object." },
            { path: "/admin/firstName", message: "firstName is required" },
            { path: "/admin/lastName", message: "lastName is required" },
            { path: "/admin/email", message: "email is invalid" },
            { path: "/admin/username", message: "username is invalid" },
            { path: "/admin/password", message: "password is required" },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await registerTenantAction({
      tenantName: "",
      tenantSlug: "1-invalid",
      admin: {
        firstName: "",
        lastName: "",
        email: "invalid-email",
        username: "1invalid",
        password: "123",
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("VALIDATION_FAILED");
      expect(res.message).toBe("Thông tin đăng ký chưa hợp lệ, vui lòng kiểm tra lại các trường.");
      expect(res.fieldErrors?.tenantName).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
      expect(res.fieldErrors?.tenantSlug).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
      expect(res.fieldErrors?.admin).toBe("Thông tin tài khoản quản trị chưa hợp lệ.");
      expect(res.fieldErrors?.firstName).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
      expect(res.fieldErrors?.lastName).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
      expect(res.fieldErrors?.email).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
      expect(res.fieldErrors?.username).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
      expect(res.fieldErrors?.password).toBe("Giá trị chưa hợp lệ, vui lòng kiểm tra lại.");
    }
  });

  it("maps HTTP 429 to RATE_LIMITED with Vietnamese message", async () => {
    delete process.env.REGISTRATION_API_MODE;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests",
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
      expect(res.code).toBe("RATE_LIMITED");
      expect(res.field).toBe("general");
      expect(res.message).toBe("Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.");
    }
  });

  it("maps HTTP 5xx or server errors to UNAVAILABLE with Vietnamese message", async () => {
    delete process.env.REGISTRATION_API_MODE;
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        error: {
          code: "UNAVAILABLE",
          message: "Service unavailable",
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
      expect(res.field).toBe("general");
      expect(res.message).toBe("Hệ thống đăng ký hiện đang bận hoặc không thể kết nối. Vui lòng thử lại sau.");
    }
  });

  it("handles network failure gracefully returning UNAVAILABLE", async () => {
    delete process.env.REGISTRATION_API_MODE;
    const mockFetch = vi.fn().mockRejectedValue(new Error("Connection refused"));
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
      expect(res.field).toBe("general");
      expect(res.message).toBe("Hệ thống đăng ký hiện đang bận hoặc không thể kết nối. Vui lòng thử lại sau.");
    }
  });
});
