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
import type { StoredBuilderApp } from "../../lib/builder/types";

interface BuilderAppListProps {
  tenantId: string;
  canEdit: boolean;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function BuilderAppList({
  tenantId,
  canEdit,
}: BuilderAppListProps) {
  const rawData = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(`ws_builder_apps_${tenantId}`) ?? "[]";
      } catch {
        return "[]";
      }
    },
    () => "[]",
  );

  let apps: StoredBuilderApp[] = [];
  try {
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      apps = parsed.filter(
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
    apps = [];
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">THIẾT KẾ QUY TRÌNH</div>
          <h1>Ứng dụng đang thiết kế</h1>
          <p>
            Tạo và cấu hình quy trình nghiệp vụ thông qua mô tả nguồn và chuẩn hóa
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

      {/* Banner giải thích lưu trình duyệt */}
      <div className="info-banner" role="status">
        <div>
          <b>Lưu trữ tạm phía trình duyệt</b>
          <p style={{ margin: "4px 0 0" }}>
            Backend hiện chưa hỗ trợ API liệt kê ứng dụng (chờ BE-02). Các ứng dụng
            dưới đây được lưu trên trình duyệt của bạn cho doanh nghiệp này.
          </p>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <div className="empty">
            <strong>Chưa có ứng dụng quy trình nào</strong>
            <p>Bắt đầu bằng việc khởi tạo ứng dụng đầu tiên của bạn.</p>
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
        <div className="card-grid">
          {apps.map((app) => (
            <div key={app.appId} className="app-card">
              <div className="app-card-top">
                <div className="app-icon gold">
                  {app.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="status warning">Bản nháp v{app.version}</span>
              </div>
              <h3>{app.name}</h3>
              <p>
                Mã: <code>{app.appKey}</code>
              </p>
              <div className="app-card-foot">
                <span>Tạo lúc: {app.createdAt}</span>
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
      )}
    </div>
  );
}
