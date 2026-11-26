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

import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTenantContext } from "../../../lib/api/server";
import { listApps, getAppConfigApiMode } from "../../../lib/app-config/client";
import BuilderAppList from "../../../components/builder/BuilderAppList";
import type { AppSummary } from "../../../lib/app-config/types";

export const metadata: Metadata = {
  title: "Thiết kế ứng dụng · DigiX",
};

export default async function BuilderPage() {
  await connection();
  const context = await getTenantContext();

  if (!context) {
    redirect("/login");
  }

  const { roles, currentTenant } = context;

  const canAccess = roles.some((r) =>
    ["designer", "publisher", "tenant_admin"].includes(r),
  );

  if (!canAccess) {
    return (
      <div className="page">
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <div className="empty">
            <strong style={{ fontSize: 18, color: "var(--ws-danger)" }}>
              403 - Không có quyền truy cập
            </strong>
            <p style={{ marginTop: 8 }}>
              Tính năng Thiết kế quy trình chỉ dành cho các vai trò Thiết kế (designer),
              Xuất bản (publisher) hoặc Quản trị doanh nghiệp (tenant_admin).
            </p>
            <div style={{ marginTop: 20 }}>
              <Link href="/dashboard" className="button secondary">
                ← Về trang tổng quan
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = roles.some((r) => ["designer", "tenant_admin"].includes(r));
  const isMockMode = getAppConfigApiMode() === "mock";
  let apps: AppSummary[] = [];

  try {
    apps = await listApps();
  } catch {
    apps = [];
  }

  return (
    <BuilderAppList
      tenantId={currentTenant?.id ?? "default"}
      canEdit={canEdit}
      apps={apps}
      isMockMode={isMockMode}
    />
  );
}
