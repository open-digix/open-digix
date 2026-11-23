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

import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import type { MeMembership, MeResponse, TenantContext } from "../tenant/types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function getServerAccessToken(): Promise<string | null> {
  const requestHeaders = await headers();
  const token = await getToken({
    req: { headers: requestHeaders },
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.accessToken || typeof token.accessToken !== "string") {
    return null;
  }
  return token.accessToken;
}

export const getMeCached = cache(async (): Promise<MeResponse | null> => {
  const token = await getServerAccessToken();
  if (!token) return null;

  const internalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(`${internalUrl}/v1/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as MeResponse;
  } catch {
    return null;
  }
});

export async function getTenantContext(): Promise<TenantContext | null> {
  const me = await getMeCached();
  if (!me) return null;

  const activeMemberships = me.memberships.filter(
    (m) => m.status === "active" && m.tenant.status === "active",
  );

  const cookieStore = await cookies();
  const tenantCookie = cookieStore.get("ws-tenant")?.value;

  let currentMembership: MeMembership | null = null;

  if (activeMemberships.length === 1) {
    currentMembership = activeMemberships[0];
  } else if (tenantCookie) {
    currentMembership =
      activeMemberships.find((m) => m.tenant.id === tenantCookie) ?? null;
  }

  const needsTenantSelection =
    activeMemberships.length > 1 && !currentMembership;

  return {
    me,
    activeMemberships,
    currentMembership,
    currentTenant: currentMembership ? currentMembership.tenant : null,
    roles: currentMembership ? currentMembership.roles : [],
    needsTenantSelection,
  };
}

export async function apiCall<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    tenantId?: string;
  } = {},
): Promise<T> {
  const token = await getServerAccessToken();
  if (!token) {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "Yêu cầu đăng nhập.");
  }

  let tenantId = options.tenantId;
  if (!tenantId) {
    const ctx = await getTenantContext();
    if (!ctx?.currentTenant?.id) {
      throw new ApiError(
        400,
        "TENANT_CONTEXT_REQUIRED",
        "Vui lòng chọn doanh nghiệp trước khi thao tác.",
      );
    }
    tenantId = ctx.currentTenant.id;
  }

  const internalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";
  const headersInit: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Tenant-Id": tenantId,
  };

  if (options.body !== undefined) {
    headersInit["Content-Type"] = "application/json";
  }

  const res = await fetch(`${internalUrl}${path}`, {
    method: options.method ?? "GET",
    headers: headersInit,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const contentType = res.headers?.get("content-type") ?? "application/json";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errCode = data?.error?.code ?? `HTTP_${res.status}`;
    const errMessage = data?.error?.message ?? res.statusText;
    const errDetails = data?.error?.details;
    throw new ApiError(res.status, errCode, errMessage, errDetails);
  }

  return data as T;
}
