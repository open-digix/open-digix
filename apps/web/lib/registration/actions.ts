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

"use server";

import type {
  TenantRegistrationInput,
  TenantRegistrationResult,
  RegistrationErrorCode,
  RegistrationTargetField,
} from "./types";
import { getRegistrationErrorMessage } from "./messages";

export async function registerTenantAction(
  input: TenantRegistrationInput,
): Promise<TenantRegistrationResult> {
  const mode = process.env.REGISTRATION_API_MODE === "mock" ? "mock" : "api";

  if (mode === "api") {
    const internalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";
    try {
      const res = await fetch(`${internalUrl}/v1/public/tenant-registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantName: input.tenantName,
          tenantSlug: input.tenantSlug,
          admin: {
            firstName: input.admin.firstName,
            lastName: input.admin.lastName,
            email: input.admin.email,
            username: input.admin.username,
            password: input.admin.password,
          },
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        return {
          ok: true,
          tenantId: data.tenantId ?? "tenant-" + input.tenantSlug,
          tenantSlug: data.tenantSlug ?? input.tenantSlug,
          tenantName: input.tenantName,
          username: data.username ?? input.admin.username,
        };
      }

      if (res.status === 429) {
        const mapping = getRegistrationErrorMessage("RATE_LIMITED");
        return {
          ok: false,
          code: "RATE_LIMITED",
          message: mapping.message,
          field: "general",
        };
      }

      if (res.status >= 500) {
        const mapping = getRegistrationErrorMessage("UNAVAILABLE");
        return {
          ok: false,
          code: "UNAVAILABLE",
          message: mapping.message,
          field: "general",
        };
      }

      const errJson = await res.json().catch(() => ({}));
      const code = (errJson?.error?.code as RegistrationErrorCode) || "UNAVAILABLE";
      const mapping = getRegistrationErrorMessage(code);

      // Xử lý VALIDATION_FAILED với error.issues: [{ path, message }]
      if (code === "VALIDATION_FAILED" && Array.isArray(errJson?.error?.issues)) {
        const fieldErrors: Partial<Record<RegistrationTargetField, string>> = {};
        const genericMsg = "Giá trị chưa hợp lệ, vui lòng kiểm tra lại.";
        for (const issue of errJson.error.issues) {
          const path = issue?.path;
          if (path === "/tenantName") fieldErrors.tenantName = genericMsg;
          else if (path === "/tenantSlug") fieldErrors.tenantSlug = genericMsg;
          else if (path === "/admin") fieldErrors.admin = "Thông tin tài khoản quản trị chưa hợp lệ.";
          else if (path === "/admin/firstName") fieldErrors.firstName = genericMsg;
          else if (path === "/admin/lastName") fieldErrors.lastName = genericMsg;
          else if (path === "/admin/email") fieldErrors.email = genericMsg;
          else if (path === "/admin/username") fieldErrors.username = genericMsg;
          else if (path === "/admin/password") fieldErrors.password = genericMsg;
        }

        const firstField = Object.keys(fieldErrors)[0] as RegistrationTargetField | undefined;
        return {
          ok: false,
          code: "VALIDATION_FAILED",
          message: mapping.message,
          field: firstField || "general",
          fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
        };
      }

      return {
        ok: false,
        code,
        message: mapping.message,
        field: mapping.field,
      };
    } catch {
      const mapping = getRegistrationErrorMessage("UNAVAILABLE");
      return {
        ok: false,
        code: "UNAVAILABLE",
        message: mapping.message,
        field: mapping.field,
      };
    }
  }

  // Chế độ Mock: chờ 600ms mô phỏng mạng, không ghi log mật khẩu
  await new Promise((r) => setTimeout(r, 600));

  const slug = input.tenantSlug?.trim().toLowerCase();
  const email = input.admin?.email?.trim().toLowerCase();
  const username = input.admin?.username?.trim().toLowerCase();

  // Mock ca kiểm tra VALIDATION_FAILED với issues
  if (slug === "mock-validation-issues") {
    const mapping = getRegistrationErrorMessage("VALIDATION_FAILED");
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: mapping.message,
      field: "email",
      fieldErrors: {
        email: "Giá trị chưa hợp lệ, vui lòng kiểm tra lại.",
      },
    };
  }

  if (slug === "da-ton-tai") {
    const mapping = getRegistrationErrorMessage("TENANT_SLUG_TAKEN");
    return {
      ok: false,
      code: "TENANT_SLUG_TAKEN",
      message: mapping.message,
      field: mapping.field,
    };
  }

  if (email && email.includes("trung@")) {
    const mapping = getRegistrationErrorMessage("EMAIL_TAKEN");
    return {
      ok: false,
      code: "EMAIL_TAKEN",
      message: mapping.message,
      field: mapping.field,
    };
  }

  if (username === "admin") {
    const mapping = getRegistrationErrorMessage("USERNAME_TAKEN");
    return {
      ok: false,
      code: "USERNAME_TAKEN",
      message: mapping.message,
      field: mapping.field,
    };
  }

  return {
    ok: true,
    tenantId: "mock-" + (slug || "tenant"),
    tenantSlug: slug,
    tenantName: input.tenantName,
    username: username,
    mock: true,
  };
}
