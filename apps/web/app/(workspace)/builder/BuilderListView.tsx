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

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAppsAction } from "@/lib/app-config/actions";
import type { AppSummary } from "@/lib/app-config/types";
import { useMockToast } from "@/components/workspace/MockToast";
import { getAppInitials } from "@/lib/app-runtime/initials";

export default function BuilderListView() {
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { ToastContainer } = useMockToast();

  useEffect(() => {
    document.title = "Thiết kế ứng dụng · DigiX";
  }, []);

  useEffect(() => {
    let isMounted = true;
    listAppsAction()
      .then((data) => {
        if (!isMounted) return;
        setApps(data.filter((a) => a.status === "draft"));
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách bản nháp:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredApps = apps.filter((app) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.appKey.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page apps-page builder-list-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">THIẾT KẾ ỨNG DỤNG</div>
          <h1>Thiết kế ứng dụng</h1>
          <p>
            Tùy chỉnh và tạo cấu hình cho các ứng dụng composable trong tổ chức.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/builder/new" className="button primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Tạo ứng dụng mới</span>
          </Link>
        </div>
      </header>

      <div className="app-search-bar" style={{ marginTop: 16 }}>
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã bản nháp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input search-input"
        />
      </div>

      {loading ? (
        <div className="panel empty-state">
          <p>Đang tải danh sách bản nháp...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="panel empty-state" style={{ padding: 36, textAlign: "center" }}>
          <p style={{ margin: "0 0 16px", color: "var(--ws-text-muted)" }}>
            {search.trim()
              ? "Không tìm thấy bản nháp nào phù hợp với từ khóa tìm kiếm."
              : "Chưa có bản nháp nào. Bấm 'Tạo ứng dụng mới' để bắt đầu thiết kế."}
          </p>
          <Link href="/builder/new" className="button primary">
            Tạo ứng dụng mới
          </Link>
        </div>
      ) : (
        <div className="app-grid" style={{ gap: 20 }}>
          {filteredApps.map((app) => (
            <div key={app.appId} className="panel app-card">
              <div className="app-card-head">
                <span className="app-icon">{getAppInitials(app.name)}</span>
                <span className="app-badge draft">Bản nháp</span>
              </div>
              <h3>{app.name}</h3>
              <p>{`Bản nháp quy trình ${app.name}`}</p>
              <div className="app-card-foot">
                <span>v{app.version}</span>
                <Link href={`/builder/${app.appId}`} className="button secondary">
                  <span>Chỉnh sửa</span>
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
