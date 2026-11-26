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

/**
 * Returns a 2-character uppercase abbreviation for an application name.
 * - If name has 2 or more words: takes the first character of the first 2 words (e.g. "Đề nghị mua sắm" -> "ĐN", "Khách hàng" -> "KH").
 * - If name has only 1 word: takes the first 2 characters of that word (e.g. "DigiX" -> "DI").
 * - If name is empty: defaults to "DX".
 */
export function getAppInitials(name: string): string {
  if (!name) return "DX";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1 && words[0]) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return "DX";
}
