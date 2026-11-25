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
 * Chuyển tên doanh nghiệp thành tenant slug hợp lệ:
 * - bỏ dấu tiếng Việt, đổi 'đ'/'Đ' thành 'd'
 * - chữ thường, khoảng trắng và ký tự lạ thành '-'
 * - gộp các '-' liền nhau, bỏ '-' ở đầu và cuối
 * - dài tối đa 40 ký tự
 */
export function toTenantSlug(name: string): string {
  if (!name) return "";

  let str = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();

  // Ký tự không phải a-z0-9 chuyển thành -
  str = str.replace(/[^a-z0-9]+/g, "-");
  // Gộp các - liền nhau
  str = str.replace(/-+/g, "-");
  // Bỏ - ở đầu và cuối
  str = str.replace(/^-+|-+$/g, "");

  // Nếu kết quả bắt đầu bằng số (ví dụ "3M Việt Nam" -> 3m-viet-nam) thì thêm tiền tố dn-
  if (/^[0-9]/.test(str)) {
    str = `dn-${str}`;
  }

  // Giới hạn tối đa 40 ký tự, không kết thúc bằng dấu -
  if (str.length > 40) {
    str = str.slice(0, 40).replace(/-+$/, "");
  }

  return str;
}

/**
 * Kiểm tra mã tenant slug hợp lệ theo mẫu:
 * ^[a-z][a-z0-9-]{1,38}[a-z0-9]$
 * Bắt đầu bằng chữ cái thường, kết thúc bằng chữ hoặc số, ở giữa là chữ số hoặc dấu '-', dài từ 3 đến 40 ký tự.
 */
export const TENANT_SLUG_REGEX = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

export function isValidTenantSlug(slug: string): boolean {
  if (!slug || slug.length > 40) return false;
  return TENANT_SLUG_REGEX.test(slug);
}
