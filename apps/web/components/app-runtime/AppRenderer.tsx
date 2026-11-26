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
      className={`app-runtime-root ${viewport === "375" ? "max-w-[375px]" : ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: viewport === "375" ? "375px" : "100%",
        margin: "0 auto",
      }}
      data-testid="app-renderer-root"
      data-viewport={viewport}
    >
      {/* Banner MẪU THỬ (PREVIEW) sử dụng info-banner */}
      {isMock && (
        <div
          role="status"
          aria-label="Thông báo chế độ mẫu thử"
          className="info-banner"
          style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}
          data-testid="mock-preview-banner"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <strong style={{ whiteSpace: "nowrap", flexShrink: 0 }}>MẪU THỬ</strong>
            <span>– Dữ liệu mô phỏng, thao tác không ghi vào cơ sở dữ liệu thật.</span>
          </div>
          {roleId && (
            <span className="badge" style={{ fontSize: 11, background: "var(--ws-soft)", color: "var(--ws-teal)" }}>
              Vai trò: {roleId}
            </span>
          )}
        </div>
      )}

      {/* Header ứng dụng & Tabs chuyển trang */}
      <div className="panel" style={{ padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {normalizedApp.name}
          </h2>
          <span className="badge" style={{ fontSize: 11, background: "var(--ws-canvas)", color: "var(--ws-muted)" }}>
            v{normalizedApp.version}
          </span>
        </div>

        {/* Thanh tab trang của hệ thống */}
        {visiblePages.length > 0 && (
          <nav aria-label="Menu các trang trong ứng dụng" className="tabs" style={{ borderBottom: "none", margin: 0 }}>
            {visiblePages.map((page) => {
              const isActive = activePage?.id === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => handleSelectPage(page.id)}
                  className={`tab ${isActive ? "active" : ""}`}
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
      <main className="flex-1 w-full">
        {!activePage ? (
          <div className="panel" style={{ padding: 48, textAlign: "center" }}>
            <p style={{ margin: 0, color: "var(--ws-muted)", fontSize: 14 }}>
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
