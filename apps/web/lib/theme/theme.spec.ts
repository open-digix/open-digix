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

import { describe, it, expect, beforeEach } from "vitest";
import { parseTheme, setThemePreference, THEME_COOKIE_NAME } from "./index";

describe("Theme utilities", () => {
  beforeEach(() => {
    document.cookie = `${THEME_COOKIE_NAME}=; Path=/; Max-Age=0`;
    document.documentElement.removeAttribute("data-theme");
  });

  describe("parseTheme", () => {
    it("returns theme if valid", () => {
      expect(parseTheme("light")).toBe("light");
      expect(parseTheme("dark")).toBe("dark");
      expect(parseTheme("system")).toBe("system");
    });

    it("defaults to system for invalid or undefined values", () => {
      expect(parseTheme(undefined)).toBe("system");
      expect(parseTheme(null)).toBe("system");
      expect(parseTheme("")).toBe("system");
      expect(parseTheme("random")).toBe("system");
      expect(parseTheme("dark-mode")).toBe("system");
    });
  });

  describe("setThemePreference", () => {
    it("sets cookie and updates documentElement data-theme attribute", () => {
      setThemePreference("dark");
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect(document.cookie).toContain(`${THEME_COOKIE_NAME}=dark`);

      setThemePreference("light");
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect(document.cookie).toContain(`${THEME_COOKIE_NAME}=light`);

      setThemePreference("system");
      expect(document.documentElement.getAttribute("data-theme")).toBe("system");
      expect(document.cookie).toContain(`${THEME_COOKIE_NAME}=system`);
    });
  });
});
