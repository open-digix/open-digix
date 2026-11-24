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

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { "content-type": "application/json" },
      }),
    redirect: (url: URL) =>
      new Response(null, {
        status: 307,
        headers: { location: url.toString() },
      }),
  },
}));

import { GET } from "./route";

const originalEnv = {
  issuer: process.env.AUTH_KEYCLOAK_ISSUER,
  clientId: process.env.AUTH_KEYCLOAK_ID,
  appUrl: process.env.AUTH_URL,
};

afterEach(() => {
  process.env.AUTH_KEYCLOAK_ISSUER = originalEnv.issuer;
  process.env.AUTH_KEYCLOAK_ID = originalEnv.clientId;
  process.env.AUTH_URL = originalEnv.appUrl;
});

describe("Keycloak logout route", () => {
  it("redirects to Keycloak logout and returns to the login page", () => {
    process.env.AUTH_KEYCLOAK_ISSUER =
      "http://localhost:8080/realms/digix/";
    process.env.AUTH_KEYCLOAK_ID = "digix-web";
    process.env.AUTH_URL = "http://localhost:3000";

    const response = GET();
    const location = response.headers.get("location");

    expect(response.status).toBe(307);
    expect(location).toBe(
      "http://localhost:8080/realms/digix/protocol/openid-connect/logout?client_id=digix-web&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flogin",
    );
  });

  it("returns a configuration error when required settings are missing", () => {
    delete process.env.AUTH_KEYCLOAK_ISSUER;
    process.env.AUTH_KEYCLOAK_ID = "digix-web";
    process.env.AUTH_URL = "http://localhost:3000";

    const response = GET();

    expect(response.status).toBe(500);
  });
});
