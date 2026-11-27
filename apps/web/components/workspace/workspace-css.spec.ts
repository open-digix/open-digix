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

describe("workspace.css isolation and tokenization", () => {
  const cssPath = path.resolve(__dirname, "../../app/(workspace)/workspace.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  it("should define .ws-root token block with base variables", () => {
    expect(content).toContain(".ws-root {");
    expect(content).toContain("--teal: var(--ws-accent);");
    expect(content).toContain("--white: var(--ws-bg-surface);");
  });

  it("should have zero hex and zero rgb() colors outside the .ws-root token block", () => {
    const tokenStart = content.indexOf(".ws-root {");
    expect(tokenStart).toBeGreaterThan(-1);

    // Find the end of the first .ws-root { ... } block
    let depth = 0;
    let tokenEnd = -1;
    for (let i = tokenStart; i < content.length; i++) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") {
        depth--;
        if (depth === 0) {
          tokenEnd = i;
          break;
        }
      }
    }
    expect(tokenEnd).toBeGreaterThan(tokenStart);

    const outsideTokens = content.slice(tokenEnd + 1);

    // Check for hardcoded hex colors
    const hexMatches = outsideTokens.match(/#[0-9a-fA-F]{3,8}/g) || [];
    expect(hexMatches).toEqual([]);

    // Check for hardcoded rgb/rgba colors
    const rgbMatches = outsideTokens.match(/rgba?\([^)]+\)/g) || [];
    expect(rgbMatches).toEqual([]);
  });

  it("should ensure selectors are scoped under .ws-root", () => {
    expect(content).toContain(".ws-root .sidebar {");
    expect(content).toContain(".ws-root .topbar {");
    expect(content).toContain(".ws-root .page {");
    expect(content).not.toMatch(/\n\.sidebar\s*\{/);
    expect(content).not.toMatch(/\n\.topbar\s*\{/);
    expect(content).not.toMatch(/\n\.page\s*\{/);
  });
});
