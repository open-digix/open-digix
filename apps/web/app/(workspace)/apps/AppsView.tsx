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
import { useRouter, useSearchParams } from "next/navigation";
import { listAppsAction } from "@/lib/app-config/actions";
import type { AppSummary } from "@/lib/app-config/types";
import { useMockToast } from "@/components/workspace/MockToast";
import { getAppInitials } from "@/lib/app-runtime/initials";

export default function AppsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Redirect draft tab to dedicated /builder page
  useEffect(() => {
    if (tabParam === "draft" || tabParam === "drafts") {
      router.replace("/builder");
    }
  }, [tabParam, router]);

  const [apps, setApps] = useState<AppSummary[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "published">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { ToastContainer } = useMockToast();

  useEffect(() => {
    document.title = "Ứng dụng · DigiX";
  }, []);

  useEffect(() => {
    let isMounted = true;
    listAppsAction()
      .then((data) => {
        if (!isMounted) return;
        // Only published applications belong in /apps
        setApps(data.filter((a) => a.status === "published"));
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
    <div className="page apps-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">KHÔNG GIAN LÀM VIỆC</div>
          <h1>Ứng dụng doanh nghiệp</h1>
          <p>
            Chọn ứng dụng để làm việc hoặc theo dõi tiến trình thực hiện.
          </p>
        </div>
      </header>

      <div
        className="app-filter-tabs"
        role="tablist"
        aria-label="Bộ lọc ứng dụng"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedFilter === "all"}
          className={`app-filter-tab ${selectedFilter === "all" ? "active" : ""}`}
          onClick={() => setSelectedFilter("all")}
        >
          Tất cả ({apps.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectedFilter === "published"}
          className={`app-filter-tab ${selectedFilter === "published" ? "active" : ""}`}
          onClick={() => setSelectedFilter("published")}
        >
          Đang dùng ({apps.length})
        </button>
      </div>

      <div className="app-search-bar">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã ứng dụng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input search-input"
        />
      </div>

      {loading ? (
        <div className="panel empty-state">
          <p>Đang tải danh sách ứng dụng...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="panel empty-state" style={{ padding: 36, textAlign: "center" }}>
          <p style={{ margin: 0, color: "var(--ws-text-muted)" }}>
            Không tìm thấy ứng dụng nào phù hợp với bộ lọc.
          </p>
        </div>
      ) : (
        <div className="app-grid" style={{ gap: 20 }}>
          {filteredApps.map((app) => (
            <div key={app.appId} className="panel app-card">
              <div className="app-card-head">
                <span className="app-icon">{getAppInitials(app.name)}</span>
                <span className="app-badge published">Đang dùng</span>
              </div>
              <h3>{app.name}</h3>
              <p>{`Ứng dụng quy trình ${app.name}`}</p>
              <div className="app-card-foot">
                <span>v{app.version}</span>
                <Link href={`/app/${app.appId}`} className="button secondary">
                  <span>Mở ứng dụng</span>
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
