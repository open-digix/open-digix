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

import { describe, it, expect } from "vitest";
import { normalizeApp } from "./normalize";
import type { PublishedAppV25 } from "./types";

describe("normalizeApp", () => {
  it("bổ sung componentVersion=1, hidden=false và order mặc định khi thiếu", () => {
    const rawApp: PublishedAppV25 = {
      schemaVersion: "2.5",
      tenantId: "11111111-1111-4111-8111-111111111111",
      appId: "22222222-2222-4222-8222-222222222222",
      version: 1,
      name: "Test App",
      features: [{ id: "erp.materials", version: 1 }],
      roles: [{ id: "buyer", permissions: ["erp.materials.read"] }],
      pages: [
        {
          id: "p1",
          label: "Page 1",
          path: "p1",
          layout: "single",
          components: [
            {
              id: "c1",
              type: "table",
              featureId: "erp.materials",
              resource: "materials",
              zone: "main",
            },
            {
              id: "c2",
              type: "form",
              featureId: "erp.materials",
              resource: "materials",
              action: "create",
              zone: "main",
            },
          ],
        },
      ],
    };

    const normalized = normalizeApp(rawApp);
    const p1 = normalized.pages[0];
    expect(p1.menuOrder).toBe(0);
    expect(p1.hidden).toBe(false);

    expect(p1.components[0].componentVersion).toBe(1);
    expect(p1.components[0].hidden).toBe(false);
    expect(p1.components[0].order).toBe(0);

    expect(p1.components[1].componentVersion).toBe(1);
    expect(p1.components[1].hidden).toBe(false);
    expect(p1.components[1].order).toBe(1);
  });

  it("sắp xếp trang theo menuOrder và sắp xếp component theo order", () => {
    const rawApp: PublishedAppV25 = {
      schemaVersion: "2.5",
      tenantId: "11111111-1111-4111-8111-111111111111",
      appId: "22222222-2222-4222-8222-222222222222",
      version: 1,
      name: "Test App",
      features: [{ id: "erp.materials", version: 1 }],
      roles: [{ id: "buyer", permissions: ["erp.materials.read"] }],
      pages: [
        {
          id: "p_second",
          label: "Second",
          path: "p_second",
          layout: "single",
          menuOrder: 10,
          components: [
            {
              id: "c_second",
              type: "table",
              featureId: "erp.materials",
              resource: "materials",
              zone: "main",
              order: 5,
            },
            {
              id: "c_first",
              type: "form",
              featureId: "erp.materials",
              resource: "materials",
              action: "create",
              zone: "main",
              order: 1,
            },
          ],
        },
        {
          id: "p_first",
          label: "First",
          path: "p_first",
          layout: "single",
          menuOrder: 2,
          components: [],
        },
      ],
    };

    const normalized = normalizeApp(rawApp);
    expect(normalized.pages[0].id).toBe("p_first");
    expect(normalized.pages[1].id).toBe("p_second");

    const pSecond = normalized.pages[1];
    expect(pSecond.components[0].id).toBe("c_first");
    expect(pSecond.components[1].id).toBe("c_second");
  });
});
