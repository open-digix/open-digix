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
import {
  ask,
  listSources,
  listAiApps,
  setMockUnavailable,
  isMockUnavailable,
} from "./client";

describe("Assistant client mock", () => {
  beforeEach(() => {
    setMockUnavailable(false);
  });

  it("lists available apps for assistant", async () => {
    const apps = await listAiApps();
    expect(apps).toHaveLength(2);
    expect(apps[0].key).toBe("erp");
    expect(apps[0].hasSources).toBe(true);
    expect(apps[1].key).toBe("crm");
    expect(apps[1].hasSources).toBe(false);
  });

  it("lists sources for ERP app", async () => {
    const sources = await listSources("app-erp");
    expect(sources).toHaveLength(4);
    expect(sources[0].name).toBe("Quy chế mua sắm nội bộ");
    expect(sources[3].status).toBe("scanning");
  });

  it("returns empty sources for CRM app", async () => {
    const sources = await listSources("app-crm");
    expect(sources).toHaveLength(0);
  });

  it("answers sample approval question on ERP app", async () => {
    const res = await ask("app-erp", "Yêu cầu mua vật tư trên 50 triệu cần những ai duyệt?");
    expect(res.status).toBe("answered");
    if (res.status === "answered") {
      expect(res.citations).toHaveLength(2);
      expect(res.items).toHaveLength(3);
      expect(res.answerIntro).toContain("50.000.000");
    }
  });

  it("returns no_evidence for unknown question", async () => {
    const res = await ask("app-erp", "Kiểm kê cuối năm làm vào ngày nào?");
    expect(res.status).toBe("no_evidence");
  });

  it("returns unavailable when forced or flagged", async () => {
    setMockUnavailable(true);
    expect(isMockUnavailable()).toBe(true);

    const res = await ask("app-erp", "Yêu cầu mua vật tư trên 50 triệu cần những ai duyệt?");
    expect(res.status).toBe("unavailable");

    setMockUnavailable(false);
    const resForced = await ask("app-erp", "Yêu cầu mua vật tư trên 50 triệu cần những ai duyệt?", {
      forceUnavailable: true,
    });
    expect(resForced.status).toBe("unavailable");
  });
});
