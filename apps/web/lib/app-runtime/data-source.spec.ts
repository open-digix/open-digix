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
import { MockDataSource, encodeCursor, decodeCursor } from "./data-source";

describe("MockDataSource", () => {
  it("phân trang theo cursor (không trả tổng số bản ghi)", async () => {
    const ds = new MockDataSource();

    // Lấy trang 1 với limit = 2 (offset 0 -> 2, còn 4 items)
    const page1 = await ds.list("materials", { limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.nextCursor).toBeDefined();
    // Đảm bảo không có trường total hay page
    const page1Record = page1 as unknown as Record<string, unknown>;
    expect(page1Record.total).toBeUndefined();
    expect(page1Record.page).toBeUndefined();

    // Lấy trang 2 từ nextCursor (offset 2 -> 4, còn 2 items)
    const page2 = await ds.list("materials", { limit: 2, cursor: page1.nextCursor });
    expect(page2.items.length).toBe(2);
    expect(page2.items[0].id).not.toBe(page1.items[0].id);
    expect(page2.nextCursor).toBeDefined();

    // Lấy trang 3 từ nextCursor (offset 4 -> 6, hết items)
    const page3 = await ds.list("materials", { limit: 2, cursor: page2.nextCursor });
    expect(page3.items.length).toBe(2);
    // Sau trang 3 hết dữ liệu (tổng 6 items), nextCursor phải là undefined
    expect(page3.nextCursor).toBeUndefined();
  });

  it("mã hóa và giải mã cursor an toàn", () => {
    const encoded = encodeCursor(15);
    const decoded = decodeCursor(encoded);
    expect(decoded).toBe(15);

    expect(decodeCursor(undefined)).toBe(0);
    expect(decodeCursor("invalid-cursor")).toBe(0);
  });

  it("thêm bản ghi qua submit() và cập nhật danh sách", async () => {
    const ds = new MockDataSource();

    const submitRes = await ds.submit("requests", "create", {
      title: "Yêu cầu thử nghiệm",
      requester: "Tester",
    });

    expect(submitRes.success).toBe(true);
    expect(submitRes.id).toBeDefined();

    const list = await ds.list("requests", { limit: 10 });
    expect(list.items[0].id).toBe(submitRes.id);
    expect(list.items[0].title).toBe("Yêu cầu thử nghiệm");
  });

  it("thực hiện hành động qua runAction()", async () => {
    const ds = new MockDataSource();

    const actionRes = await ds.runAction("requests", "approve", { id: "PR-2026-001" });
    expect(actionRes.success).toBe(true);

    const record = await ds.get("requests", "PR-2026-001");
    expect(record?.status).toBe("approved");
  });
});
