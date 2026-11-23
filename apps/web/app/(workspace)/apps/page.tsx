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

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_APPS } from "../../../lib/mock/catalogs";
import { useMockToast } from "../../../components/workspace/MockToast";

export default function AppsPage() {
  const [tab, setTab] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");
  const { showToast, ToastContainer } = useMockToast();

  const filtered = SAMPLE_APPS.filter((app) => {
    if (tab === "published" && app.status !== "published") return false;
    if (tab === "draft" && app.status !== "draft") return false;
    if (search && !app.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">DANH MỤC ỨNG DỤNG</div>
          <h1>Ứng dụng quy trình</h1>
          <p>Khởi tạo hồ sơ và theo dõi các ứng dụng đã được phát hành</p>
        </div>
        <div className="page-header-actions">
          <Link href="/records" className="button primary">
            Tạo hồ sơ mới
          </Link>
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
          Tất cả ({SAMPLE_APPS.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === "published" ? "active" : ""}`}
          onClick={() => setTab("published")}
        >
          Đã phát hành
        </button>
        <button
          type="button"
          className={`tab ${tab === "draft" ? "active" : ""}`}
          onClick={() => setTab("draft")}
        >
          Bản nháp
        </button>
      </div>

      <div className="card-grid">
        {filtered.map((app) => (
          <div key={app.id} className="app-card">
            <div className="app-card-top">
              <div
                className={`app-icon ${app.tone === "blue" ? "blue" : app.tone === "gold" ? "gold" : ""}`}
              >
                {app.icon}
              </div>
              <span
                className={`status ${app.status === "published" ? "" : "warning"}`}
              >
                {app.status === "published" ? "Đã phát hành" : "Bản nháp"}
              </span>
            </div>
            <h3>{app.name}</h3>
            <p>{app.desc}</p>
            <div className="app-card-foot">
              <span>{app.version}</span>
              <button
                type="button"
                onClick={() =>
                  showToast(
                    `Mở ${app.name} (mẫu — không gửi tới hệ thống)`,
                  )
                }
              >
                Mở ứng dụng →
              </button>
            </div>
          </div>
        ))}
      </div>

      <ToastContainer />
    </div>
  );
}
