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
import type { ApiIssue } from "./errors";
export { formatApiErrorVi } from "./errors";
export type { ApiIssue, FormattedApiError } from "./errors";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly issues?: readonly ApiIssue[];

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    issues?: readonly ApiIssue[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.issues = issues;
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

export type GetMeResult =
  | { ok: true; me: MeResponse }
  | {
      ok: false;
      kind: "unauthenticated" | "forbidden" | "unavailable";
      status?: number;
    };

export const getMeCached = cache(async (): Promise<GetMeResult> => {
  const token = await getServerAccessToken();
  if (!token) return { ok: false, kind: "unauthenticated" };

  const internalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(`${internalUrl}/v1/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { ok: false, kind: "unauthenticated", status: 401 };
    }

    if (response.status === 403) {
      return { ok: false, kind: "forbidden", status: 403 };
    }

    if (!response.ok) {
      return { ok: false, kind: "unavailable", status: response.status };
    }

    const me = (await response.json()) as MeResponse;
    return { ok: true, me };
  } catch {
    return { ok: false, kind: "unavailable" };
  }
});

export async function getTenantContext(): Promise<TenantContext | null> {
  const meResult = await getMeCached();
  if (!meResult.ok) return null;
  const me = meResult.me;

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
    const rawIssues = data?.error?.issues ?? data?.error?.details;
    const issues = Array.isArray(rawIssues)
      ? (rawIssues as readonly ApiIssue[])
      : undefined;
    const errDetails = data?.error?.details;
    throw new ApiError(res.status, errCode, errMessage, errDetails, issues);
  }

  return data as T;
}
