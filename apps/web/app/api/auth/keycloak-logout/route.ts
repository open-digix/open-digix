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

export function GET() {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER?.replace(/\/+$/, "");
  const clientId = process.env.AUTH_KEYCLOAK_ID;
  const appUrl = process.env.AUTH_URL;

  if (!issuer || !clientId || !appUrl) {
    return NextResponse.json(
      { error: "Keycloak logout is not configured." },
      { status: 500 },
    );
  }

  const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("client_id", clientId);
  logoutUrl.searchParams.set(
    "post_logout_redirect_uri",
    new URL("/login", appUrl).toString(),
  );

  return NextResponse.redirect(logoutUrl);
}
