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
} from "./types";
import { getRegistrationErrorMessage } from "./messages";

export async function registerTenantAction(
  input: TenantRegistrationInput,
): Promise<TenantRegistrationResult> {
  const mode = process.env.REGISTRATION_API_MODE || "mock";

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

      const errJson = await res.json().catch(() => ({}));
      const code = (errJson?.error?.code as RegistrationErrorCode) || "UNAVAILABLE";
      const mapping = getRegistrationErrorMessage(code);
      return {
        ok: false,
        code,
        message: errJson?.error?.message || mapping.message,
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
