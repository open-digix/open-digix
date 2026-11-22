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

import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTenantContext } from "../../../../lib/api/server";
import Stepper from "../../../../components/builder/Stepper";
import CreateAppForm from "../../../../components/builder/CreateAppForm";

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

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">THIẾT KẾ / BƯỚC 01</div>
          <h1>Tạo ứng dụng mới</h1>
          <p>
            Khởi tạo ứng dụng và bản nháp phiên bản 1 trong{" "}
            <strong>{currentTenant?.name}</strong>
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/builder" className="button secondary">
            ← Danh sách ứng dụng
          </Link>
        </div>
      </header>

      <Stepper currentStep="create" />
      <CreateAppForm tenantId={currentTenant?.id ?? "default"} />
    </div>
  );
}
