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

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { FIXTURE_METAS } from "@/lib/app-runtime/fixtures";
import { MockDataSource } from "@/lib/app-runtime/data-source";
import AppRenderer from "@/components/app-runtime/AppRenderer";

export default function XemMauPage() {
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>("erp-a");
  const [viewport, setViewport] = useState<"1280" | "375">("1280");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [dataSourceKey, setDataSourceKey] = useState<number>(0);

  // Khởi tạo và giữ DataSource in-memory cho phiên xem thử
  const dataSource = useMemo(() => {
    return new MockDataSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSourceKey]);

  const currentFixture = useMemo(() => {
    return (
      FIXTURE_METAS.find((f) => f.id === selectedFixtureId) || FIXTURE_METAS[0]
    );
  }, [selectedFixtureId]);

  // Danh sách vai trò có sẵn trong fixture đang chọn
  const availableRoles = useMemo(() => {
    return currentFixture.app.roles || [];
  }, [currentFixture]);

  // Tự động gán vai trò đầu tiên khi đổi fixture hoặc khi vai trò hiện tại không hợp lệ
  const activeRoleId = useMemo(() => {
    if (availableRoles.some((r) => r.id === selectedRoleId)) {
      return selectedRoleId;
    }
    return availableRoles[0]?.id || "";
  }, [availableRoles, selectedRoleId]);

  const handleResetData = () => {
    dataSource.resetData();
    setDataSourceKey((prev) => prev + 1);
  };

  return (
    <div className="page xem-mau-page">
      {/* Page Header theo khuôn trang workspace chuẩn */}
      <header className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="eyebrow">XEM THỬ GIAO DIỆN</div>
          <h1 style={{ margin: "4px 0" }}>Xem mẫu giao diện ứng dụng</h1>
          <p style={{ margin: 0, color: "var(--ws-muted)" }}>
            Xem trước trải nghiệm hiển thị và phân quyền của ứng dụng v2.5 theo từng vai trò và khổ màn hình.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/builder" className="button secondary">
            ← Quay lại danh sách ứng dụng
          </Link>
        </div>
      </header>

      {/* Panel bộ chọn: Mẫu thử, Vai trò, Khổ màn hình, Làm mới dữ liệu */}
      <section className="panel" style={{ padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, fontSize: 12 }}>
            {/* Chọn Fixture */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="fixture-select" style={{ fontWeight: 600, color: "var(--ws-muted)" }}>
                Mẫu thử:
              </label>
              <select
                id="fixture-select"
                aria-label="Chọn mẫu thử"
                value={selectedFixtureId}
                onChange={(e) => {
                  setSelectedFixtureId(e.target.value);
                  setSelectedRoleId("");
                }}
                className="input"
                style={{ padding: "6px 12px", height: "auto", fontSize: 13 }}
              >
                {FIXTURE_METAS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Vai trò */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="role-select" style={{ fontWeight: 600, color: "var(--ws-muted)" }}>
                Vai trò:
              </label>
              <select
                id="role-select"
                aria-label="Chọn vai trò người dùng"
                value={activeRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="input"
                style={{ padding: "6px 12px", height: "auto", fontSize: 13 }}
              >
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.permissions.length} quyền)
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Khổ màn hình */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, color: "var(--ws-muted)" }}>Khổ hiển thị:</span>
              <div
                role="group"
                aria-label="Chọn kích thước màn hình"
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--ws-line)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewport("1280")}
                  style={{
                    border: "none",
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: viewport === "1280" ? 600 : 400,
                    background: viewport === "1280" ? "var(--ws-accent)" : "transparent",
                    color: viewport === "1280" ? "var(--ws-white)" : "var(--ws-ink)",
                    cursor: "pointer",
                  }}
                  aria-pressed={viewport === "1280"}
                >
                  Máy tính
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("375")}
                  style={{
                    border: "none",
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: viewport === "375" ? 600 : 400,
                    background: viewport === "375" ? "var(--ws-accent)" : "transparent",
                    color: viewport === "375" ? "var(--ws-white)" : "var(--ws-ink)",
                    cursor: "pointer",
                  }}
                  aria-pressed={viewport === "375"}
                >
                  Điện thoại (375px)
                </button>
              </div>
            </div>
          </div>

          {/* Nút reset dữ liệu */}
          <div>
            <button
              type="button"
              onClick={handleResetData}
              title="Đặt lại dữ liệu mẫu về ban đầu"
              className="button secondary"
              style={{ fontSize: 12, padding: "6px 14px", height: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
              Làm mới dữ liệu
            </button>
          </div>
        </div>
      </section>

      {/* Khu vực hiển thị App Renderer */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", width: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: viewport === "375" ? "375px" : "100%",
            margin: viewport === "375" ? "0 auto" : "0",
            borderRadius: viewport === "375" ? 16 : 8,
            boxShadow: viewport === "375" ? "0 10px 30px rgba(0,0,0,0.12)" : "none",
            border: viewport === "375" ? "2px solid var(--ws-line)" : "none",
            overflow: "hidden",
            transition: "max-width 300ms ease",
          }}
        >
          <AppRenderer
            app={currentFixture.app}
            roleId={activeRoleId}
            dataSource={dataSource}
            viewport={viewport}
          />
        </div>
      </div>
    </div>
  );
}
