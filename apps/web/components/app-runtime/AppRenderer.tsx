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

import React, { useMemo, useState } from "react";
import type {
  PublishedAppV25,
  DataSource,
} from "@/lib/app-runtime/types";
import { normalizeApp } from "@/lib/app-runtime/normalize";
import { isPageVisible, resolveVisibleComponents } from "@/lib/app-runtime/visibility";
import SingleLayout from "./layouts/SingleLayout";
import TwoColumnsLayout from "./layouts/TwoColumnsLayout";

export interface AppRendererProps {
  app: PublishedAppV25;
  roleId?: string;
  dataSource: DataSource;
  viewport?: "1280" | "375";
  activePageId?: string;
  onPageChange?: (pageId: string) => void;
  showMockBanner?: boolean;
}

export default function AppRenderer({
  app,
  roleId,
  dataSource,
  viewport = "1280",
  activePageId: controlledPageId,
  onPageChange,
  showMockBanner,
}: AppRendererProps) {
  const normalizedApp = useMemo(() => normalizeApp(app), [app]);

  // Tìm role hiện tại
  const currentRole = useMemo(() => {
    if (!roleId) return undefined;
    return (normalizedApp.roles || []).find((r) => r.id === roleId);
  }, [normalizedApp.roles, roleId]);

  // Các trang được phép hiển thị trên menu theo vai trò
  const visiblePages = useMemo(() => {
    return normalizedApp.pages.filter((p) =>
      isPageVisible(p, normalizedApp, roleId)
    );
  }, [normalizedApp, roleId]);

  // Trang đang được chọn (internal state)
  const [internalPageId, setInternalPageId] = useState<string>("");

  const activePage = useMemo(() => {
    if (controlledPageId) {
      const match = visiblePages.find((p) => p.id === controlledPageId);
      if (match) return match;
    }
    if (internalPageId) {
      const match = visiblePages.find((p) => p.id === internalPageId);
      if (match) return match;
    }
    return visiblePages[0];
  }, [visiblePages, controlledPageId, internalPageId]);

  // Các component được phép hiển thị trên trang đang chọn
  const visibleComponents = useMemo(() => {
    if (!activePage) return [];
    return resolveVisibleComponents(activePage, normalizedApp, currentRole, roleId);
  }, [activePage, normalizedApp, currentRole, roleId]);

  const handleSelectPage = (pageId: string) => {
    setInternalPageId(pageId);
    onPageChange?.(pageId);
  };

  const isMock = showMockBanner !== undefined ? showMockBanner : dataSource.isMock;

  return (
    <div
      className={`app-runtime-root flex flex-col w-full transition-all duration-200 ${
        viewport === "375"
          ? "max-w-[375px] mx-auto border-x border-zinc-200 dark:border-zinc-800 shadow-md bg-zinc-50 dark:bg-zinc-950 min-h-[640px]"
          : "w-full max-w-7xl mx-auto"
      }`}
      data-testid="app-renderer-root"
      data-viewport={viewport}
    >
      {/* Banner MẪU THỬ (PREVIEW) */}
      {isMock && (
        <div
          role="note"
          aria-label="Thông báo chế độ mẫu thử"
          className="px-4 py-2 bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-b border-amber-300/40 dark:border-amber-700/50 text-xs font-medium flex items-center justify-between"
          data-testid="mock-preview-banner"
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 font-bold">⚠️ MẪU THỬ (PREVIEW)</span>
            <span className="hidden sm:inline text-amber-800/80 dark:text-amber-200/80">
              Dữ liệu mô phỏng, thao tác không ghi vào cơ sở dữ liệu thật
            </span>
          </div>
          {roleId && (
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/40">
              Role: {roleId}
            </span>
          )}
        </div>
      )}

      {/* Header ứng dụng & Tabs chuyển trang */}
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {normalizedApp.name}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
            v{normalizedApp.version}
          </span>
        </div>

        {/* Thanh tab trang */}
        {visiblePages.length > 0 && (
          <nav aria-label="Menu các trang trong ứng dụng" className="flex items-center gap-1 overflow-x-auto">
            {visiblePages.map((page) => {
              const isActive = activePage?.id === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => handleSelectPage(page.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {page.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Vùng nội dung trang */}
      <main className="p-4 sm:p-6 flex-1">
        {!activePage ? (
          <div className="p-12 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <p className="text-zinc-500 text-sm">
              Không có trang nào phù hợp với vai trò hiện tại.
            </p>
          </div>
        ) : activePage.layout === "two_columns" ? (
          <TwoColumnsLayout
            components={visibleComponents}
            dataSource={dataSource}
          />
        ) : (
          <SingleLayout
            components={visibleComponents}
            dataSource={dataSource}
          />
        )}
      </main>
    </div>
  );
}
