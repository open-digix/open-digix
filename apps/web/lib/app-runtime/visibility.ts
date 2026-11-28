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

import type {
  NormalizedApp,
  NormalizedPage,
  NormalizedComponent,
  AppRole,
} from "./types";
import { hasPermission } from "./permissions";

/**
 * Kiểm tra xem một component có được phép hiển thị hay không theo vai trò và cấu hình.
 *
 * Quy tắc:
 * 1. component.hidden === true -> ẩn.
 * 2. featureId của component không có trong app.features -> ẩn.
 * 3. Nếu component có visibleToRoles và roleId hiện tại không nằm trong đó -> ẩn.
 * 4. Phân quyền:
 *    - "form" / "action": cần quyền đúng `action` của component.
 *    - "table" / "detail" / "metric": cần quyền `read` trên `resource` của component.
 *    - type chưa rõ / lạ: nếu thỏa mãn visibleToRoles thì vẫn cho phép hiển thị để registry dựng khối cảnh báo an toàn.
 */
export function isComponentVisible(
  component: NormalizedComponent,
  app: NormalizedApp,
  role: AppRole | undefined | null,
  roleId?: string
): boolean {
  if (component.hidden) {
    return false;
  }

  // Feature phải được bật trong app
  const featureEnabled = (app.features || []).some((f) => f.id === component.featureId);
  if (!featureEnabled) {
    return false;
  }

  // Kiểm tra visibleToRoles nếu có
  if (
    Array.isArray(component.visibleToRoles) &&
    component.visibleToRoles.length > 0
  ) {
    if (!roleId || !component.visibleToRoles.includes(roleId)) {
      return false;
    }
  }

  // Kiểm tra quyền theo type
  const type = component.type;
  if (type === "form" || type === "action") {
    const actionName = component.action || "";
    if (!actionName) {
      return false;
    }
    return hasPermission(role, {
      featureId: component.featureId,
      resource: component.resource,
      action: actionName,
    });
  }

  if (type === "table" || type === "detail" || type === "metric") {
    return hasPermission(role, {
      featureId: component.featureId,
      resource: component.resource,
      action: "read",
    });
  }

  // Đối với component type lạ hoặc version không hỗ trợ:
  // Cho phép hiển thị để registry hiển thị ô cảnh báo an toàn FallbackComponentBlock
  return true;
}

/**
 * Kiểm tra xem một trang có được phép hiển thị trên menu không.
 */
export function isPageVisible(
  page: NormalizedPage,
  app: NormalizedApp,
  roleId?: string
): boolean {
  if (page.hidden) {
    return false;
  }

  if (Array.isArray(page.visibleToRoles) && page.visibleToRoles.length > 0) {
    if (!roleId || !page.visibleToRoles.includes(roleId)) {
      return false;
    }
  }

  // Khi page không khai báo visibleToRoles cụ thể (hoặc rỗng),
  // kiểm tra xem roleId hiện tại có quyền xem ít nhất 1 component trong trang hay không.
  // Nếu có roleId (và không phải quyền quản trị) mà không xem được component nào thì ẩn trang.
  if (
    roleId &&
    !["admin", "owner", "tenant_admin"].includes(roleId) &&
    Array.isArray(page.components) &&
    page.components.length > 0
  ) {
    const role = (app.roles || []).find((r) => r.id === roleId);
    if (role) {
      const hasAnyVisibleComponent = page.components.some((comp) =>
        isComponentVisible(comp, app, role, roleId)
      );
      if (!hasAnyVisibleComponent) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Lọc danh sách component hiển thị trong trang cho vai trò hiện tại.
 */
export function resolveVisibleComponents(
  page: NormalizedPage,
  app: NormalizedApp,
  role: AppRole | undefined | null,
  roleId?: string
): NormalizedComponent[] {
  return (page.components || []).filter((comp) =>
    isComponentVisible(comp, app, role, roleId)
  );
}
