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
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  refreshExpiresAt?: number;
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
  const rawToken = token as Record<string, unknown>;

  // Migration: migrate old snake_case keys if present, then delete them
  if (rawToken.access_token && !token.accessToken) {
    token.accessToken = rawToken.access_token as string;
  }
  if (rawToken.refresh_token && !token.refreshToken) {
    token.refreshToken = rawToken.refresh_token as string;
  }
  if (rawToken.id_token && !token.idToken) {
    token.idToken = rawToken.id_token as string;
  }
  if (rawToken.expires_at && !token.expiresAt) {
    token.expiresAt = Number(rawToken.expires_at);
  }
  if (rawToken.refresh_expires_at && !token.refreshExpiresAt) {
    token.refreshExpiresAt = Number(rawToken.refresh_expires_at);
  }
  delete rawToken.access_token;
  delete rawToken.refresh_token;
  delete rawToken.id_token;
  delete rawToken.expires_at;
  delete rawToken.refresh_expires_at;

  // If token already has an error, do not attempt refresh
  if (token.error) {
    return token;
  }

  const now = Math.floor(Date.now() / 1000);
  const refreshExpiresAt = Number(token.refreshExpiresAt ?? 0);

  // If refresh token has expired, return error immediately
  if (refreshExpiresAt > 0 && now >= refreshExpiresAt) {
    const rest = { ...token };
    delete rest.accessToken;
    return {
      ...rest,
      error: "RefreshTokenError",
    };
  }

  const refreshToken = token.refreshToken;

  if (!refreshToken || typeof refreshToken !== "string") {
    const rest = { ...token };
    delete rest.accessToken;
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
        expiresAt: newExpiresAt,
        refreshToken: newRefreshToken,
        refreshExpiresAt: newRefreshExpiresAt,
        idToken: data.id_token ?? token.idToken,
        error: undefined,
      };

      // Ensure no snake_case keys remain
      const rawUpdated = updatedToken as Record<string, unknown>;
      delete rawUpdated.access_token;
      delete rawUpdated.refresh_token;
      delete rawUpdated.id_token;
      delete rawUpdated.expires_at;
      delete rawUpdated.refresh_expires_at;

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
