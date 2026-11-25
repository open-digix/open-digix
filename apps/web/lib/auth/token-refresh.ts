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

import crypto from "crypto";

export interface JWTToken {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  idToken?: string;
  id_token?: string;
  expiresAt?: number;
  expires_at?: number;
  refreshExpiresAt?: number;
  refresh_expires_at?: number;
  error?: string;
  [key: string]: unknown;
}

interface InFlightRefresh {
  promise: Promise<JWTToken>;
  expiresAt: number;
}

// In-memory cache to deduplicate simultaneous token refresh calls
const refreshCache = new Map<string, InFlightRefresh>();

/**
 * Calculates SHA-256 hash of a refresh token to use as cache key.
 */
export function hashRefreshToken(refreshToken: string): string {
  return crypto.createHash("sha256").update(refreshToken).digest("hex");
}

/**
 * Clears the refresh cache (useful for testing).
 */
export function clearRefreshCache(): void {
  refreshCache.clear();
}

/**
 * Refreshes access token with Keycloak internal endpoint.
 * Deduplicates simultaneous requests using hash of refresh token.
 */
export async function refreshAccessToken(token: JWTToken): Promise<JWTToken> {
  // If token already has an error, do not attempt refresh
  if (token.error) {
    return token;
  }

  const now = Math.floor(Date.now() / 1000);
  const refreshExpiresAt = Number(
    token.refreshExpiresAt ?? token.refresh_expires_at ?? 0,
  );

  // If refresh token has expired, return error immediately
  if (refreshExpiresAt > 0 && now >= refreshExpiresAt) {
    const rest = { ...token };
    delete rest.accessToken;
    delete rest.access_token;
    return {
      ...rest,
      error: "RefreshTokenError",
    };
  }

  const refreshToken = (token.refreshToken ?? token.refresh_token) as
    | string
    | undefined;

  if (!refreshToken || typeof refreshToken !== "string") {
    const rest = { ...token };
    delete rest.accessToken;
    delete rest.access_token;
    return {
      ...rest,
      error: "RefreshTokenError",
    };
  }

  const hash = hashRefreshToken(refreshToken);

  // Check if an in-flight or cached refresh exists
  const cached = refreshCache.get(hash);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.promise;
  }

  const refreshPromise = (async (): Promise<JWTToken> => {
    const internalKeycloakUrl =
      process.env.AUTH_KEYCLOAK_INTERNAL_URL ?? "http://localhost:8080";
    const tokenUrl = `${internalKeycloakUrl}/realms/digix/protocol/openid-connect/token`;
    const clientId = process.env.AUTH_KEYCLOAK_ID ?? "digix-web";

    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: refreshToken,
      });

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        refreshCache.delete(hash);
        const rest = { ...token };
        delete rest.accessToken;
        delete rest.access_token;
        return {
          ...rest,
          error: "RefreshTokenError",
        };
      }

      const data = (await res.json()) as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
        refresh_expires_in?: number;
        id_token?: string;
      };

      const currentNow = Math.floor(Date.now() / 1000);
      const newExpiresAt = currentNow + data.expires_in;
      const newRefreshExpiresAt = data.refresh_expires_in
        ? currentNow + data.refresh_expires_in
        : refreshExpiresAt > 0
          ? refreshExpiresAt
          : currentNow + 1800;

      const newRefreshToken = data.refresh_token ?? refreshToken;

      const updatedToken: JWTToken = {
        ...token,
        accessToken: data.access_token,
        access_token: data.access_token,
        expiresAt: newExpiresAt,
        expires_at: newExpiresAt,
        refreshToken: newRefreshToken,
        refresh_token: newRefreshToken,
        refreshExpiresAt: newRefreshExpiresAt,
        refresh_expires_at: newRefreshExpiresAt,
        idToken: data.id_token ?? token.idToken ?? token.id_token,
        id_token: data.id_token ?? token.idToken ?? token.id_token,
        error: undefined,
      };

      // Keep cache for ~60s (or until new token has ~60s remaining)
      const cacheDurationMs = Math.min(
        60_000,
        Math.max(5_000, (data.expires_in - 60) * 1000),
      );
      const entry = refreshCache.get(hash);
      if (entry) {
        entry.expiresAt = Date.now() + cacheDurationMs;
      }

      return updatedToken;
    } catch {
      refreshCache.delete(hash);
      const rest = { ...token };
      delete rest.accessToken;
      delete rest.access_token;
      return {
        ...rest,
        error: "RefreshTokenError",
      };
    }
  })();

  refreshCache.set(hash, {
    promise: refreshPromise,
    expiresAt: Date.now() + 60_000,
  });

  return refreshPromise;
}
