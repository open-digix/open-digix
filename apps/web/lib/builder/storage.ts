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

import type { StoredBuilderApp } from "./types";

function getStorageKey(tenantId: string): string {
  return `ws_builder_apps_${tenantId}`;
}

export function getStoredBuilderApps(tenantId: string): StoredBuilderApp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoredBuilderApp =>
        Boolean(
          item &&
            typeof item.appId === "string" &&
            typeof item.appKey === "string" &&
            typeof item.name === "string" &&
            typeof item.version === "number",
        ),
    );
  } catch {
    return [];
  }
}

export function saveStoredBuilderApp(
  tenantId: string,
  app: StoredBuilderApp,
): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredBuilderApps(tenantId);
    const updated = [app, ...current.filter((a) => a.appId !== app.appId)];
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(updated));
  } catch {
    // Ignore localStorage write failures
  }
}

export function removeStoredBuilderApp(tenantId: string, appId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredBuilderApps(tenantId);
    const updated = current.filter((a) => a.appId !== appId);
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(updated));
  } catch {
    // Ignore failures
  }
}
