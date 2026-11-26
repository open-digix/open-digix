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
import { getTenantContext } from "../../../../lib/api/server";
import {
  getCatalogFeatures,
  getPresets,
  getAppConfigApiMode,
} from "../../../../lib/app-config/client";
import NewAppWizard from "../../../../components/app-builder/NewAppWizard";

export const metadata: Metadata = {
  title: "Tạo ứng dụng · DigiX",
};

export default async function NewAppPage() {
  await connection();
  const context = await getTenantContext();

  if (!context) {
    redirect("/login");
  }

  const { roles, currentTenant } = context;
  const canEdit = roles.some((r) => ["designer", "tenant_admin"].includes(r));

  if (!canEdit) {
    return (
      <div className="page">
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <div className="empty">
            <strong style={{ fontSize: 18, color: "var(--ws-danger)" }}>
              403 - Quyền truy cập bị từ chối
            </strong>
            <p style={{ marginTop: 8 }}>
              Bạn cần có vai trò Thiết kế (designer) hoặc Quản trị doanh nghiệp
              (tenant_admin) để tạo ứng dụng mới.
            </p>
            <div style={{ marginTop: 20 }}>
              <Link href="/builder" className="button secondary">
                ← Về danh sách ứng dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMockMode = getAppConfigApiMode() === "mock";
  const [catalogRes, presetsRes] = await Promise.all([
    getCatalogFeatures(),
    getPresets(),
  ]);

  return (
    <div className="page new-app-page">
      <NewAppWizard
        initialFeatures={catalogRes.features}
        initialPresets={presetsRes.presets}
        tenantName={currentTenant?.name}
        isMockMode={isMockMode}
      />
    </div>
  );
}
