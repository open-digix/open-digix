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

import Link from "next/link";
import { getTenantContext } from "@/lib/api/server";
import { getRuntime } from "@/lib/app-config/client";
import AppPageClient from "./AppPageClient";

interface PageProps {
  params: Promise<{ appId: string; page?: string[] }>;
}

export default async function AppPage({ params }: PageProps) {
  const { appId, page } = await params;
  const context = await getTenantContext();
  const roles = context?.roles || [];

  const app = await getRuntime(appId, { userRoles: roles });

  if (!app) {
    return (
      <div className="page" data-testid="app-not-found-page">
        <div
          className="card"
          style={{
            maxWidth: 480,
            margin: "40px auto",
            textAlign: "center",
            padding: 32,
          }}
        >
          <div
            className="info-banner"
            style={{ marginBottom: 16 }}
            role="alert"
          >
            <b>Không tìm thấy hoặc bạn không có quyền xem</b>
          </div>
          <p
            style={{
              color: "var(--ws-muted)",
              marginBottom: 24,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Ứng dụng này không tồn tại hoặc tài khoản của bạn chưa được cấp quyền truy cập.
          </p>
          <Link href="/apps" className="button primary">
            Quay lại danh mục ứng dụng
          </Link>
        </div>
      </div>
    );
  }

  const activePageId = page?.[0] || app.pages[0]?.id;

  // Chọn vai trò phù hợp nhất với quyền của người dùng trong app
  const matchingRole = (app.roles || []).find((r) =>
    roles.includes(r.id) ||
    (roles.includes("employee") && (r.id === "buyer" || r.id === "sales")) ||
    (roles.includes("manager") && (r.id === "approver" || r.id === "manager")) ||
    roles.some((userRole) => ["admin", "owner", "tenant_admin", "designer"].includes(userRole))
  );
  const activeRoleId = matchingRole?.id || app.roles?.[0]?.id;

  return (
    <div className="page" style={{ padding: "0 0 24px" }}>
      <AppPageClient
        app={app}
        activePageId={activePageId}
        roleId={activeRoleId}
      />
    </div>
  );
}
