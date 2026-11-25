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

import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { signOut } from "@/auth";

export async function POST(req?: NextRequest) {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER?.replace(/\/+$/, "");
  const clientId = process.env.AUTH_KEYCLOAK_ID;
  const appUrl = process.env.AUTH_URL;

  if (!issuer || !clientId || !appUrl) {
    return NextResponse.json(
      { error: "Keycloak logout is not configured." },
      { status: 500 },
    );
  }

  // 1. Đọc idToken từ JWT phía server (không ghi token ra log)
  let idToken: string | undefined;
  try {
    const requestHeaders = await headers();
    const token = await getToken({
      req: req ?? { headers: requestHeaders },
      secret: process.env.AUTH_SECRET,
    });
    if (typeof token?.idToken === "string" && token.idToken) {
      idToken = token.idToken;
    } else if (typeof token?.id_token === "string" && token.id_token) {
      idToken = token.id_token;
    }
  } catch {
    // Không có token hoặc giải mã thất bại
  }

  // 2. Xóa phiên Auth.js phía server
  try {
    await signOut({ redirect: false });
  } catch {
    // Bỏ qua nếu signOut thất bại
  }

  const cookieStore = await cookies();
  const allCookies =
    typeof cookieStore.getAll === "function" ? cookieStore.getAll() : [];
  const cookiesToDelete = allCookies.filter((c) =>
    c.name.includes("session-token") ||
    c.name.includes("csrf-token") ||
    c.name.includes("callback-url") ||
    c.name.includes("authjs") ||
    c.name.includes("next-auth")
  );

  for (const c of cookiesToDelete) {
    cookieStore.delete(c.name);
  }
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-authjs.session-token");
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("__Secure-next-auth.session-token");

  // 3. Chuyển hướng 303 tới endpoint logout của Keycloak
  const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("client_id", clientId);
  logoutUrl.searchParams.set(
    "post_logout_redirect_uri",
    new URL("/login", appUrl).toString(),
  );
  if (idToken) {
    logoutUrl.searchParams.set("id_token_hint", idToken);
  }

  const response = NextResponse.redirect(logoutUrl, 303);
  for (const c of cookiesToDelete) {
    response.cookies.delete(c.name);
  }
  response.cookies.delete("authjs.session-token");
  response.cookies.delete("__Secure-authjs.session-token");
  response.cookies.delete("next-auth.session-token");
  response.cookies.delete("__Secure-next-auth.session-token");

  return response;
}

export function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}
