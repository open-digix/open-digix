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
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Thanh điều khiển xem mẫu phía trên */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tiêu đề & Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/builder"
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
            >
              ← Quay lại Builder
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Xem mẫu giao diện App v2.5
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono">
                WEB-F03
              </span>
            </div>
          </div>

          {/* Các bộ chọn: Fixture, Role, Viewport */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Chọn Fixture */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="fixture-select" className="font-medium text-zinc-600 dark:text-zinc-400">
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
                className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {FIXTURE_METAS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Vai trò (Role) */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="role-select" className="font-medium text-zinc-600 dark:text-zinc-400">
                Vai trò:
              </label>
              <select
                id="role-select"
                aria-label="Chọn vai trò người dùng"
                value={activeRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.permissions.length} quyền)
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Khổ màn hình (Viewport) */}
            <div className="flex items-center bg-zinc-200 dark:bg-zinc-800 rounded-lg p-0.5" role="group" aria-label="Chọn kích thước màn hình">
              <button
                type="button"
                onClick={() => setViewport("1280")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewport === "1280"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                aria-pressed={viewport === "1280"}
              >
                🖥️ 1280px
              </button>
              <button
                type="button"
                onClick={() => setViewport("375")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewport === "375"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
                aria-pressed={viewport === "375"}
              >
                📱 375px
              </button>
            </div>

            {/* Nút reset dữ liệu */}
            <button
              type="button"
              onClick={handleResetData}
              title="Đặt lại dữ liệu mẫu về ban đầu"
              className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
            >
              🔄 Làm mới dữ liệu
            </button>
          </div>
        </div>
      </header>

      {/* Khu vực hiển thị App Renderer */}
      <div className="flex-1 p-4 md:p-8 flex justify-center items-start">
        <div
          className={`w-full transition-all duration-300 ${
            viewport === "375"
              ? "max-w-[375px] my-4 rounded-2xl border-4 border-zinc-800 dark:border-zinc-700 shadow-2xl overflow-hidden bg-white dark:bg-zinc-900"
              : "max-w-7xl rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden"
          }`}
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
