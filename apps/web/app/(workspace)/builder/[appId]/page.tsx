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
import { isValidUUID } from "../../../../lib/builder/types";
import Stepper from "../../../../components/builder/Stepper";
import SourceEditor from "../../../../components/builder/SourceEditor";

interface BuilderAppPageProps {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function BuilderAppPage({
  params,
  searchParams,
}: BuilderAppPageProps) {
  await connection();
  const context = await getTenantContext();

  if (!context) {
    redirect("/login");
  }

  const { appId } = await params;
  const { step = "source" } = await searchParams;

  if (!isValidUUID(appId)) {
    return (
      <div className="page">
        <div className="info-banner" style={{ borderColor: "var(--ws-danger)" }}>
          <b>Lỗi:</b> Mã ứng dụng &quot;{appId}&quot; không đúng định dạng UUID.
        </div>
        <Link href="/builder" className="button secondary" style={{ marginTop: 16 }}>
          ← Về danh sách ứng dụng
        </Link>
      </div>
    );
  }

  const { roles, currentTenant } = context;
  const canAccess = roles.some((r) =>
    ["designer", "publisher", "tenant_admin"].includes(r),
  );

  if (!canAccess) {
    return (
      <div className="page">
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <strong style={{ color: "var(--ws-danger)", fontSize: 18 }}>
            403 - Quyền truy cập bị từ chối
          </strong>
          <p style={{ marginTop: 8 }}>
            Bạn không có quyền truy cập ứng dụng quy trình này.
          </p>
          <Link href="/dashboard" className="button secondary" style={{ marginTop: 16 }}>
            ← Về tổng quan
          </Link>
        </div>
      </div>
    );
  }

  const validStep = (
    ["source", "normalize", "edit", "validate"].includes(step)
      ? step
      : "source"
  ) as "source" | "normalize" | "edit" | "validate";

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">
            THIẾT KẾ / BƯỚC{" "}
            {validStep === "source"
              ? "02"
              : validStep === "normalize"
                ? "03"
                : validStep === "edit"
                  ? "04"
                  : "05"}
          </div>
          <h1>Thiết kế ứng dụng</h1>
          <p>
            Mã định danh: <code>{appId}</code> · Doanh nghiệp:{" "}
            <strong>{currentTenant?.name}</strong>
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/builder" className="button secondary">
            ← Danh sách ứng dụng
          </Link>
        </div>
      </header>

      <Stepper currentStep={validStep} />

      {validStep === "source" && (
        <SourceEditor
          appId={appId}
          tenantId={currentTenant?.id ?? "default"}
          appName="Bản nháp quy trình"
          version={1}
        />
      )}

      {validStep !== "source" && (
        <div className="panel" style={{ padding: 32 }}>
          <div className="info-banner">
            <div>
              <b>Chuyển bước trong tiến trình</b>
              <p style={{ margin: "4px 0 0" }}>
                Giai đoạn {validStep} đang sẵn sàng kết nối.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link
              href={`/builder/${appId}?step=source`}
              className="button secondary"
            >
              ← Quay lại Bước 02: Mô tả nguồn
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
