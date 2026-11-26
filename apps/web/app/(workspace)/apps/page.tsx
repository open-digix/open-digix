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
import { listAppsAction } from "../../../lib/app-config/actions";
import type { AppSummary } from "../../../lib/app-config/types";
import { useMockToast } from "../../../components/workspace/MockToast";

function getAppInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (words[0]?.slice(0, 2) || "DX").toUpperCase();
}

export default function AppsPage() {
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [tab, setTab] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { ToastContainer } = useMockToast();

  useEffect(() => {
    let isMounted = true;
    listAppsAction()
      .then((data) => {
        if (!isMounted) return;
        setApps(data);
      })
      .catch((err) => {
        console.error("Lỗi tải ứng dụng:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = apps.filter((app) => {
    if (tab === "published" && app.status !== "published") return false;
    if (tab === "draft" && app.status !== "draft") return false;
    if (search && !app.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="page" data-testid="apps-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">DANH MỤC ỨNG DỤNG</div>
          <h1>Ứng dụng quy trình</h1>
          <p>Khởi tạo hồ sơ và theo dõi các ứng dụng đã được phát hành</p>
        </div>
      </header>

      <div className="filterbar">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="search-apps"
            name="search"
            type="search"
            placeholder="Tìm theo tên ứng dụng..."
            aria-label="Tìm kiếm ứng dụng"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          Tất cả ({apps.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === "published" ? "active" : ""}`}
          onClick={() => setTab("published")}
        >
          Đang dùng
        </button>
        <button
          type="button"
          className={`tab ${tab === "draft" ? "active" : ""}`}
          onClick={() => setTab("draft")}
        >
          Bản nháp
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ws-muted)" }}>
          Đang tải danh sách ứng dụng...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ws-muted)" }}>
          Không có ứng dụng nào phù hợp.
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((app) => (
            <div key={app.appId} className="app-card" data-testid={`app-card-${app.appId}`}>
              <div className="app-card-top">
                <div className="app-icon blue">
                  {getAppInitials(app.name)}
                </div>
                <span
                  className={`status ${app.status === "published" ? "" : "warning"}`}
                >
                  {app.status === "published" ? "Đang dùng" : "Bản nháp"}
                </span>
              </div>
              <h3>{app.name}</h3>
              <p>{`Ứng dụng quy trình ${app.name}`}</p>
              <div className="app-card-foot">
                <span>v{app.version}</span>
                {app.status === "published" ? (
                  <Link href={`/app/${app.appId}`} className="button secondary">
                    Mở ứng dụng →
                  </Link>
                ) : (
                  <Link href={`/builder/edit?appId=${app.appId}`} className="button secondary">
                    Chỉnh sửa →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
