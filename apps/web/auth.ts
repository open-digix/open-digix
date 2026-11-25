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

import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { refreshAccessToken } from "./lib/auth/token-refresh";

const publicIssuer = process.env.AUTH_KEYCLOAK_ISSUER;
const internalKeycloakUrl = process.env.AUTH_KEYCLOAK_INTERNAL_URL;

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
    error: "/login/error",
  },
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      issuer: publicIssuer,

      authorization: `${publicIssuer}/protocol/openid-connect/auth`,
      token: `${internalKeycloakUrl}/realms/digix/protocol/openid-connect/token`,
      userinfo: `${internalKeycloakUrl}/realms/digix/protocol/openid-connect/userinfo`,

      client: {
        token_endpoint_auth_method: "none",
      },

      checks: ["pkce", "state"],
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: capture all tokens and expiration times
      if (account) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = account.expires_in
          ? Number(account.expires_in)
          : account.expires_at
            ? Number(account.expires_at) - now
            : 300;
        const expiresAt = now + expiresIn;

        const rawAccount = account as Record<string, unknown>;
        const refreshExpiresIn = rawAccount.refresh_expires_in
          ? Number(rawAccount.refresh_expires_in)
          : 1800;
        const refreshExpiresAt = now + refreshExpiresIn;

        token.accessToken = account.access_token;
        token.access_token = account.access_token;
        token.refreshToken = account.refresh_token;
        token.refresh_token = account.refresh_token;
        token.idToken = account.id_token;
        token.id_token = account.id_token;
        token.expiresAt = expiresAt;
        token.expires_at = expiresAt;
        token.refreshExpiresAt = refreshExpiresAt;
        token.refresh_expires_at = refreshExpiresAt;
        token.error = undefined;
        return token;
      }

      // If token already has an error, skip refresh
      if (token.error) {
        return token;
      }

      const now = Math.floor(Date.now() / 1000);
      const refreshExpiresAt = Number(
        token.refreshExpiresAt ?? token.refresh_expires_at ?? 0,
      );

      // If refresh token has expired, mark as error and clear access token
      if (refreshExpiresAt > 0 && now >= refreshExpiresAt) {
        delete token.accessToken;
        delete token.access_token;
        token.error = "RefreshTokenError";
        return token;
      }

      // Check if access token is still valid (> 30 seconds remaining)
      const expiresAt = Number(token.expiresAt ?? token.expires_at ?? 0);
      if (expiresAt > 0 && expiresAt - now > 30) {
        return token;
      }

      // Token has expired or is expiring within 30 seconds -> refresh
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      // Do NOT expose tokens (accessToken, refreshToken, idToken) to the client
      return {
        user: session.user,
        expires: session.expires,
        ...(token.error ? { error: token.error as string } : {}),
      };
    },
  },
});
