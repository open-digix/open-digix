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

import type { DigiXTheme } from "./types";
import { THEME_COOKIE_NAME, THEME_DEFAULT } from "./types";

/**
 * Parses and validates theme value from cookie.
 * Defaults to "system" if invalid or missing.
 */
export function parseTheme(value: string | null | undefined): DigiXTheme {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return THEME_DEFAULT;
}

/**
 * Updates the digix_theme cookie (1 year, Path=/, SameSite=Lax, Secure on HTTPS)
 * and syncs data-theme attribute on <html> document element immediately.
 */
export function setThemePreference(theme: DigiXTheme) {
  if (typeof document === "undefined") return;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isHttps ? "; Secure" : "";
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.documentElement.setAttribute("data-theme", theme);
}
