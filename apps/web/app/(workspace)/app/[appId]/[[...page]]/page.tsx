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
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/api/server";
import { getRuntime } from "@/lib/app-config/client";
import { normalizeApp } from "@/lib/app-runtime/normalize";
import { isPageVisible } from "@/lib/app-runtime/visibility";
import AppPageClient from "./AppPageClient";

interface PageProps {
  params: Promise<{ appId: string; page?: string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { appId } = await params;
  const context = await getTenantContext();
  const roles = context?.roles || [];
  const app = await getRuntime(appId, { userRoles: roles });
  if (app) {
    return {
      title: `${app.name} · DigiX`,
    };
  }
  return {
    title: "Ứng dụng · DigiX",
  };
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

  const normalized = normalizeApp(app);

  // Chọn vai trò phù hợp nhất với quyền của người dùng trong app
  const matchingRole = (normalized.roles || []).find((r) =>
    roles.includes(r.id) ||
    (roles.includes("employee") && (r.id === "buyer" || r.id === "sales")) ||
    (roles.includes("manager") && (r.id === "approver" || r.id === "manager")) ||
    roles.some((userRole) => ["admin", "owner", "tenant_admin", "designer"].includes(userRole))
  );
  const activeRoleId = matchingRole?.id || normalized.roles?.[0]?.id;

  // Lọc các trang được phép hiển thị theo vai trò
  const visiblePages = normalized.pages.filter((p) =>
    isPageVisible(p, normalized, activeRoleId)
  );

  const requestedPageId = page?.[0];
  const isRequestedAllowed =
    requestedPageId && visiblePages.some((p) => p.id === requestedPageId);

  // Nếu người dùng nhập trực tiếp URL trang không có quyền xem, chuyển hướng về trang hợp lệ đầu tiên
  if (requestedPageId && !isRequestedAllowed && visiblePages.length > 0) {
    redirect(`/app/${appId}/${visiblePages[0].id}`);
  }

  const activePageId = isRequestedAllowed ? requestedPageId : visiblePages[0]?.id;

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
