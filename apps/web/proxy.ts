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

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

/**
 * Node.js runtime proxy in Next.js 16.
 * Refreshes session tokens before downstream Server Components render.
 * Passes refreshed session cookies into the downstream request headers so
 * Server Components in the CURRENT request can immediately read the new token.
 */
export async function proxy(request: NextRequest) {
  // Execute Auth.js to handle session refresh and token callbacks
  const authResponse = await (
    auth as unknown as (req: NextRequest) => Promise<Response | null | undefined>
  )(request);

  // If Auth returned a redirect or custom error response, return it directly
  if (authResponse && authResponse.status >= 300 && authResponse.status < 400) {
    return authResponse;
  }

  // Extract set-cookie headers from Auth.js response
  const setCookies = authResponse?.headers?.getSetCookie?.() ?? [];
  const requestHeaders = new Headers(request.headers);

  // If new session cookies were issued during refresh, inject them into the downstream request
  if (setCookies.length > 0) {
    const cookieMap = new Map<string, string>();
    const existingCookieHeader = request.headers.get("cookie") ?? "";
    for (const pair of existingCookieHeader.split(";")) {
      const trimmed = pair.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        cookieMap.set(
          trimmed.substring(0, idx).trim(),
          trimmed.substring(idx + 1).trim(),
        );
      }
    }

    for (const setCookie of setCookies) {
      const parts = setCookie.split(";")[0]?.trim();
      if (parts) {
        const idx = parts.indexOf("=");
        if (idx > 0) {
          cookieMap.set(
            parts.substring(0, idx).trim(),
            parts.substring(idx + 1).trim(),
          );
        }
      }
    }

    const updatedCookieString = Array.from(cookieMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    requestHeaders.set("cookie", updatedCookieString);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /api/auth/*
     * - /_next/*
     * - Static files (favicon, icons, manifest, etc.)
     * - /
     * - /login*
     * - /register*
     * - /status*
     * - /dieu-khoan*
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-icon.png|icons/|icon.svg|$|login|register|status|dieu-khoan).*)",
  ],
};
