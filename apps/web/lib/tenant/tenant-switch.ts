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

let activeTenantAbortController: AbortController | null = null;

/**
 * Gets or creates the current active AbortSignal for tenant-scoped client requests.
 */
export function getTenantAbortSignal(): AbortSignal {
  if (
    !activeTenantAbortController ||
    activeTenantAbortController.signal.aborted
  ) {
    activeTenantAbortController = new AbortController();
  }
  return activeTenantAbortController.signal;
}

/**
 * Aborts any ongoing client requests scoped to the previous tenant.
 */
export function abortTenantRequests(): void {
  if (
    activeTenantAbortController &&
    !activeTenantAbortController.signal.aborted
  ) {
    activeTenantAbortController.abort("Tenant switched");
  }
  activeTenantAbortController = new AbortController();
}

/**
 * Clears client-side filters, toasts, and cached data of the previous tenant.
 */
export function clearClientTenantData(): void {
  // Abort running network requests
  abortTenantRequests();

  if (typeof window === "undefined") return;

  // Clear sessionStorage filters / table states / tenant-specific caches
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (
        key &&
        (key.startsWith("filter_") ||
          key.startsWith("table_") ||
          key.startsWith("tenant_") ||
          key.startsWith("ws_") ||
          key.startsWith("search_") ||
          key.includes("filter") ||
          key.includes("cache"))
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }

  // Clear tenant-specific localStorage caches (excluding auth flags)
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        key &&
        (key.startsWith("filter_") ||
          key.startsWith("table_") ||
          key.startsWith("tenant_cache_") ||
          key.startsWith("draft_filter_"))
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }

  // Remove any active toast elements from DOM
  try {
    const toastElements = document.querySelectorAll(
      ".toast, [role='status'], .alert-toast",
    );
    toastElements.forEach((el) => el.remove());
  } catch {
    // ignore
  }
}
