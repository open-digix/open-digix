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
 * Kiểm tra quyền của một vai trò trên feature/resource/action theo Hợp đồng v2.5 (#67).
 *
 * QUY TẮC: Quyền nghiệp vụ CHỈ nhận duy nhất định dạng:
 * `<featureId>.<resource>.<action>` (ví dụ: `erp.inventory.stock.read`, `erp.purchase_requests.requests.create`).
 *
 * Không chấp nhận dạng rút gọn 2 phần `<featureId>.<action>` hay `<resource>.<action>`.
 * Các quyền hệ thống (ví dụ `share.manage`, `ai.sources.manage`) được quản lý riêng qua hasSystemPermission.
 */
export function hasPermission(
  role: AppRole | undefined | null,
  target: PermissionTarget
): boolean {
  if (!role || !Array.isArray(role.permissions) || role.permissions.length === 0) {
    return false;
  }

  const { featureId, resource, action } = target;
  if (!featureId || !resource || !action) {
    return false;
  }

  // Định dạng chuẩn duy nhất: <featureId>.<resource>.<action>
  const permission = `${featureId}.${resource}.${action}`;
  return role.permissions.includes(permission);
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
