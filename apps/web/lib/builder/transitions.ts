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

import type { BuilderTransitionDefinition } from "./types";

const OP_MAP: Record<string, string> = {
  eq: "=",
  lt: "<",
  gte: "≥",
};

export function formatTransitionToVietnamese(
  trans: BuilderTransitionDefinition,
): string {
  if (!trans.when?.all || trans.when.all.length === 0) {
    return `Từ "${trans.from}" sang "${trans.to}" (luôn chuyển tiếp)`;
  }

  const conditions = trans.when.all.map((c) => {
    const op = OP_MAP[c.op] || c.op;
    let formattedVal = String(c.value);
    if (typeof c.value === "number") {
      formattedVal = c.value.toLocaleString("vi-VN");
    }
    return `${c.field} ${op} ${formattedVal}`;
  });

  return `Từ ${trans.from} sang ${trans.to} khi ${conditions.join(" và ")}`;
}
