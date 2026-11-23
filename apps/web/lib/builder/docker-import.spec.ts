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

function getAllCodeFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".next" || file === ".git") {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllCodeFiles(fullPath, fileList);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe("Point 0: Docker Build & Import Isolation", () => {
  it("ensures no code file in apps/web imports from apps/api", () => {
    // Current test file is in apps/web/lib/builder
    const webRoot = path.resolve(__dirname, "../..");
    const files = getAllCodeFiles(webRoot);

    expect(files.length).toBeGreaterThan(10);

    const violations: { file: string; line: string }[] = [];

    for (const filePath of files) {
      // Skip this test file itself so it doesn't self-flag
      if (filePath.endsWith("docker-import.spec.ts")) continue;

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (
          (line.includes("import ") || line.includes("from ") || line.includes("require(")) &&
          line.includes("apps/api")
        ) {
          violations.push({
            file: path.relative(webRoot, filePath),
            line: line.trim(),
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
