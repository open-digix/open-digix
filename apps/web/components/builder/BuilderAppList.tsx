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

"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { AppSummary } from "../../lib/app-config/types";
import type { StoredBuilderApp } from "../../lib/builder/types";

interface BuilderAppListProps {
  tenantId: string;
  canEdit: boolean;
  apps?: AppSummary[];
  isMockMode?: boolean;
  suppressLocalV1?: boolean;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function BuilderAppList({
  tenantId,
  canEdit,
  apps = [],
  isMockMode = true,
  suppressLocalV1 = false,
}: BuilderAppListProps) {
  // Read legacy local v1 apps from browser localStorage
  const rawData = useSyncExternalStore(
    subscribe,
    () => {
      if (suppressLocalV1) return "[]";
      try {
        return localStorage.getItem(`ws_builder_apps_${tenantId}`) ?? "[]";
      } catch {
        return "[]";
      }
    },
    () => "[]",
  );

  let localV1Apps: StoredBuilderApp[] = [];
  try {
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      localV1Apps = parsed.filter(
        (item): item is StoredBuilderApp =>
          Boolean(
            item &&
              typeof item.appId === "string" &&
              typeof item.appKey === "string" &&
              typeof item.name === "string" &&
              typeof item.version === "number",
          ),
      );
    }
  } catch {
    localV1Apps = [];
  }

  return (
    <div className="page builder-app-list-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">THIẾT KẾ ỨNG DỤNG v2.5</div>
          <h1>Ứng dụng doanh nghiệp</h1>
          <p>
            Quản trị và thiết kế các ứng dụng composable lắp ghép cho doanh nghiệp
          </p>
        </div>
        {canEdit && (
          <div className="page-header-actions">
            <Link href="/builder/new" className="button primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="inline-icon"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tạo ứng dụng mới
            </Link>
          </div>
        )}
      </header>

      {/* Banner Chế độ Mock */}
      {isMockMode && (
        <div className="info-banner" role="status" style={{ marginBottom: 20 }}>
          <div>
            <strong>MẪU THỬ</strong> – Dữ liệu ứng dụng v2.5 được lưu trong bộ nhớ máy chủ và sẽ mất khi khởi động lại máy chủ.
          </div>
        </div>
      )}

      {/* Danh sách ứng dụng chính v2.5 */}
      {apps.length === 0 ? (
        <div className="panel" style={{ padding: 48, textAlign: "center", marginBottom: 32 }}>
          <div className="empty">
            <strong>Chưa có ứng dụng quy trình nào</strong>
            <p>Bắt đầu bằng việc khởi tạo ứng dụng đầu tiên với các khối nghiệp vụ ERP/CRM.</p>
            {canEdit && (
              <div style={{ marginTop: 16 }}>
                <Link href="/builder/new" className="button primary">
                  Tạo ứng dụng ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card-grid" style={{ marginBottom: 36 }}>
          {apps.map((app) => {
            const spLabel =
              app.startingPoint === "erp"
                ? "ERP"
                : app.startingPoint === "crm"
                  ? "CRM"
                  : app.startingPoint === "blank"
                    ? "Từ trống"
                    : "Không ghi nhận lối vào";

            return (
              <div key={app.appId} className="app-card">
                <div className="app-card-top">
                  <div className="app-icon gold">
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="status warning">
                    {app.status === "published"
                      ? `Đã xuất bản · phiên bản ${app.version}`
                      : `Nháp · phiên bản ${app.version}`}
                  </span>
                </div>
                <h3>{app.name}</h3>
                <p>
                  Mã: <code>{app.appKey}</code>
                </p>
                <div style={{ fontSize: 13, color: "var(--ws-muted)", marginBottom: 12 }}>
                  <span>Lối vào: <strong>{spLabel}</strong></span>
                  {app.featureCount !== undefined && (
                    <span style={{ marginLeft: 12 }}>
                      · Chức năng: <strong>{app.featureCount}</strong>
                    </span>
                  )}
                </div>
                <div className="app-card-foot">
                  <span style={{ fontSize: 12, color: "var(--ws-muted)" }}>
                    Cập nhật: {new Date(app.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                  <Link
                    href={`/builder/${app.appId}`}
                    className="button ghost"
                    style={{ fontWeight: 800 }}
                  >
                    Quản trị nháp →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nhóm riêng: Quy trình v1 lưu trên trình duyệt */}
      {!suppressLocalV1 && localV1Apps.length > 0 && (
        <section
          className="local-v1-apps-section"
          aria-labelledby="local-v1-heading"
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px dashed var(--ws-line)",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h2 id="local-v1-heading" style={{ fontSize: 18, margin: "0 0 4px" }}>
              Quy trình v1 (lưu trên trình duyệt này)
            </h2>
            <p style={{ fontSize: 13, color: "var(--ws-muted)", margin: 0 }}>
              Các bản nháp quy trình thiết kế theo kiến trúc v1.0 cũ, được lưu trong bộ nhớ trình duyệt (chỉ đọc). Bạn có thể tiếp tục mở để xem hoặc xuất khẩu.
            </p>
          </div>

          <div className="card-grid">
            {localV1Apps.map((app) => (
              <div
                key={app.appId}
                className="app-card"
                style={{ opacity: 0.9, borderStyle: "dashed" }}
              >
                <div className="app-card-top">
                  <div className="app-icon" style={{ background: "var(--ws-canvas)" }}>
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="badge" style={{ fontSize: 11, background: "var(--ws-line)" }}>
                    Quy trình v1
                  </span>
                </div>
                <h3>{app.name}</h3>
                <p>
                  Mã: <code>{app.appKey}</code>
                </p>
                <div className="app-card-foot">
                  <span style={{ fontSize: 12, color: "var(--ws-muted)" }}>
                    Tạo lúc: {app.createdAt}
                  </span>
                  <Link
                    href={`/builder/${app.appId}?step=source`}
                    className="button ghost"
                    style={{ fontWeight: 800 }}
                  >
                    Tiếp tục thiết kế →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
