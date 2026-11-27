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

export interface MeUser {
  id: string;
  subject: string;
  email: string | null;
  displayName: string | null;
  status: string;
}

export interface MeTenant {
  id: string;
  slug: string;
  name: string;
  status: string;
}

export interface MeMembership {
  id: string;
  status: string;
  tenant: MeTenant;
  roles: string[];
}

export interface MeResponse {
  user: MeUser;
  memberships: MeMembership[];
  activeMembership: MeMembership | null;
}

export interface TenantContext {
  me: MeResponse;
  activeMemberships: MeMembership[];
  currentMembership: MeMembership | null;
  currentTenant: MeTenant | null;
  roles: string[];
  needsTenantSelection: boolean;
}

export const ROLE_LABELS: Record<string, string> = {
  employee: "Nhân viên",
  manager: "Quản lý",
  designer: "Thiết kế",
  publisher: "Xuất bản",
  tenant_admin: "Quản trị doanh nghiệp",
  admin: "Quản trị viên",
  owner: "Chủ sở hữu",
  buyer: "Người mua hàng",
  approver: "Người duyệt",
  sales: "Nhân viên bán hàng",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
