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
import fs from "fs";
import path from "path";
import { FIXTURE_METAS } from "./fixtures";

describe("fixtures sync check", () => {
  it("so khớp nội dung fixture trong apps/web với docs/examples/", () => {
    // Đường dẫn tới docs/examples từ apps/web/lib/app-runtime
    const docsExamplesDir = path.resolve(process.cwd(), "../../docs/examples");

    // Nếu test chạy ở context apps/web
    const exists = fs.existsSync(docsExamplesDir);
    if (!exists) {
      // Khi chạy trong standalone container hoặc context độc lập, bỏ qua nếu thư mục docs không tồn tại
      return;
    }

    for (const meta of FIXTURE_METAS) {
      const docPath = path.join(docsExamplesDir, meta.filename);
      expect(fs.existsSync(docPath), `File docs/examples/${meta.filename} phai ton tai`).toBe(true);

      const docContent = JSON.parse(fs.readFileSync(docPath, "utf-8"));
      expect(meta.app).toEqual(docContent);
    }
  });
});
