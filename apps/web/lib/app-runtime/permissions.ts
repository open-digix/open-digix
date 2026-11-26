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

import type { AppRole } from "./types";

export interface PermissionTarget {
  featureId: string;
  resource: string;
  action: string;
}

/**
 * Kiểm tra quyền của một vai trò trên feature/resource/action theo Hợp đồng v2.5.
 *
 * CHỈ nhận 2 dạng tên quyền trong role.permissions:
 * 1. `<featureId>.<action>` (ví dụ: `erp.purchase_requests.approve`, `erp.materials.read`)
 * 2. `<featureId>.<resource>.<action>` (ví dụ: `erp.purchase_requests.requests.create`)
 *
 * TUYỆT ĐỐI KHÔNG chấp nhận `<resource>.<action>` đứng một mình (ví dụ `stock.read`),
 * vì thiếu featureId sẽ có nguy cơ khớp nhầm sang feature khác có cùng tên resource.
 *
 * Các quyền hệ thống (ví dụ `share.manage`, `ai.sources.manage`) được quản lý riêng và không suy ra từ feature.
 */
export function hasPermission(
  role: AppRole | undefined | null,
  target: PermissionTarget
): boolean {
  if (!role || !Array.isArray(role.permissions) || role.permissions.length === 0) {
    return false;
  }

  const { featureId, resource, action } = target;
  if (!featureId || !action) {
    return false;
  }

  // Dạng 1: <featureId>.<action>
  const format1 = `${featureId}.${action}`;

  // Dạng 2: <featureId>.<resource>.<action>
  const format2 = resource ? `${featureId}.${resource}.${action}` : "";

  return role.permissions.includes(format1) || (format2 ? role.permissions.includes(format2) : false);
}

/**
 * Kiểm tra quyền hệ thống (ví dụ: share.manage, ai.sources.manage).
 */
export function hasSystemPermission(
  role: AppRole | undefined | null,
  systemPermission: string
): boolean {
  if (!role || !Array.isArray(role.permissions)) {
    return false;
  }
  return role.permissions.includes(systemPermission);
}
