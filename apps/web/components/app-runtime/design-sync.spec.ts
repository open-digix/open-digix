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

function getAllSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllSourceFiles(fullPath));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.includes("design-sync.spec")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Design System Synchronization (PR #69 / WEB-F03)", () => {
  const runtimeDir = path.resolve(__dirname);
  const xemMauDir = path.resolve(__dirname, "../../app/(workspace)/builder/xem-mau");

  const targetFiles = [
    ...getAllSourceFiles(runtimeDir),
    ...getAllSourceFiles(xemMauDir),
  ];

  it("found target files to verify", () => {
    expect(targetFiles.length).toBeGreaterThan(5);
  });

  it("does not contain any emoji in source code or UI strings", () => {
    // Unicode Extended_Pictographic regex
    const emojiRegex = /\p{Extended_Pictographic}/u;

    const filesWithEmoji: { file: string; match: string }[] = [];

    for (const file of targetFiles) {
      const content = fs.readFileSync(file, "utf-8");
      // Split into lines to inspect
      const lines = content.split("\n");
      lines.forEach((line) => {
        // Skip comment lines or test files if needed, but per rule: NO emoji anywhere
        const match = line.match(emojiRegex);
        if (match) {
          filesWithEmoji.push({
            file: path.relative(process.cwd(), file),
            match: match[0],
          });
        }
      });
    }

    expect(filesWithEmoji).toEqual([]);
  });

  it("does not use raw 'dark:' variant or 'zinc-' classes", () => {
    const forbiddenPatterns = [
      /\bdark:/,
      /\bzinc-\d+/,
    ];

    const violations: { file: string; line: string }[] = [];

    for (const file of targetFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line) => {
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(process.cwd(), file),
              line: line.trim(),
            });
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("does not contain internal ticket code 'WEB-F03' in user-facing UI", () => {
    for (const file of targetFiles) {
      if (file.endsWith(".spec.tsx") || file.endsWith(".spec.ts")) continue;
      const content = fs.readFileSync(file, "utf-8");
      expect(content).not.toContain("WEB-F03");
    }
  });
});
