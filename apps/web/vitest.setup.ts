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

import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const mockCookieStore = {
  get: vi.fn().mockReturnValue(undefined),
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
  headers: () => Promise.resolve(new Headers()),
  connection: () => Promise.resolve(),
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    connection: () => Promise.resolve(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/builder",
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  },
}));

vi.mock("next-auth/jwt", () => ({
  getToken: () => Promise.resolve({ accessToken: "mock-token" }),
}));
