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
import fs from "node:fs";
import path from "node:path";

describe("CSS variables validation across builder components", () => {
  const cssPath = path.resolve(__dirname, "../../app/(workspace)/workspace.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  // Extract all defined --ws-* variables from workspace.css
  const declaredVars = new Set<string>();
  const varMatches = cssContent.matchAll(/(--ws-[a-z0-9-]+)\s*:/g);
  for (const match of varMatches) {
    declaredVars.add(match[1]);
  }

  function getFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getFiles(fullPath));
      } else if (/\.(tsx|css)$/.test(entry.name) && !entry.name.includes(".spec.")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("declares standard workspace variables in workspace.css", () => {
    expect(declaredVars.size).toBeGreaterThan(5);
    expect(declaredVars.has("--ws-teal")).toBe(true);
    expect(declaredVars.has("--ws-surface")).toBe(true);
    expect(declaredVars.has("--ws-line")).toBe(true);
    expect(declaredVars.has("--ws-ink")).toBe(true);
    expect(declaredVars.has("--ws-muted")).toBe(true);
    expect(declaredVars.has("--ws-canvas")).toBe(true);
  });

  it("ensures every var(--ws-*) used in components/app-builder and components/builder is defined in workspace.css", () => {
    const targetDirs = [
      path.resolve(__dirname, "../app-builder"),
      path.resolve(__dirname, "../builder"),
    ];

    const allFiles = targetDirs.flatMap(getFiles);
    expect(allFiles.length).toBeGreaterThan(0);

    const invalidUsages: { file: string; variable: string; line: number }[] = [];

    for (const filePath of allFiles) {
      const relativePath = path.relative(path.resolve(__dirname, "../.."), filePath);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((lineText, index) => {
        const matches = lineText.matchAll(/var\((--ws-[a-z0-9-]+)/g);
        for (const match of matches) {
          const varName = match[1];
          if (!declaredVars.has(varName)) {
            invalidUsages.push({
              file: relativePath,
              variable: varName,
              line: index + 1,
            });
          }
        }
      });
    }

    expect(invalidUsages).toEqual([]);
  });
});
