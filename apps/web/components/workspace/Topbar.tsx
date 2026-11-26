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
import { usePathname } from "next/navigation";
import TenantSelect from "./TenantSelect";
import AppSelect from "./AppSelect";
import LogoutButton from "../../app/components/LogoutButton";
import type { MeMembership, MeUser } from "../../lib/tenant/types";
import { getRoleLabel } from "../../lib/tenant/types";
import { getRuntimeSync } from "../../lib/app-runtime/fixtures";
import { getRuntimeAction } from "../../lib/app-config/actions";
import type { PublishedAppV25 } from "../../lib/app-runtime/types";

interface TopbarProps {
  user: MeUser;
  activeMemberships: MeMembership[];
  currentTenantId: string | null;
  roles: string[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  "/apps": "Ứng dụng",
  "/builder": "Thiết kế ứng dụng",
  "/builder/new": "Tạo ứng dụng",
  "/builder/xem-mau": "Xem mẫu giao diện",
  "/assistant": "Trợ lý",
  "/settings": "Cài đặt",
};

export default function Topbar({
  user,
  activeMemberships,
  currentTenantId,
  roles,
  isSidebarOpen,
  onToggleSidebar,
}: TopbarProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // App routing detection
  const matchApp = pathname.match(/^\/app\/([^/]+)/);
  const currentAppId = matchApp ? matchApp[1] : null;

  const syncApp = currentAppId ? getRuntimeSync(currentAppId) : null;
  const [asyncApp, setAsyncApp] = useState<PublishedAppV25 | null>(null);

  useEffect(() => {
    if (!currentAppId) return;
    let isMounted = true;
    getRuntimeAction(currentAppId, { userRoles: roles })
      .then((data) => {
        if (isMounted) setAsyncApp(data);
      })
      .catch(() => {
        if (isMounted) setAsyncApp(null);
      });
    return () => {
      isMounted = false;
    };
  }, [currentAppId, roles]);

  const currentApp = currentAppId ? (asyncApp ?? syncApp) : null;

  // Compute breadcrumb title
  let pageTitle = "Không gian làm việc";
  for (const [route, title] of Object.entries(BREADCRUMB_MAP)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      pageTitle = title;
      break;
    }
  }

  // Tenant name
  const currentTenant = activeMemberships.find((m) => m.tenant.id === currentTenantId)?.tenant;
  const tenantName = currentTenant?.name || "Doanh nghiệp";

  // Determine if this is a sample data screen (apps, assistant, settings, or /app/...)
  const isSampleDataPage = [
    "/apps",
    "/tasks",
    "/records",
    "/reports",
    "/assistant",
    "/settings",
    "/app",
  ].some((p) => pathname.startsWith(p));

  // User display name & avatar initial
  const displayName = user.displayName || user.email || "Người dùng";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("") || "DX";

  return (
    <header className="topbar">
      <div className="top-left">
        <button
          className="icon-button mobile-menu"
          id="menu-button"
          type="button"
          aria-label="Mở điều hướng"
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar"
          onClick={onToggleSidebar}
        >
          <span className="menu-lines" />
        </button>

        <div className="breadcrumb" id="breadcrumb">
          <span className="root">Không gian làm việc</span>
          <span className="sep">/</span>
          {currentAppId ? (
            <>
              <span className="tenant-crumb">{tenantName}</span>
              <span className="sep">/</span>
              <strong>{currentApp ? `${currentApp.name} v${currentApp.version}` : "Ứng dụng"}</strong>
            </>
          ) : (
            <strong>{pageTitle}</strong>
          )}
        </div>
      </div>

      <div className="top-actions">
        {isSampleDataPage && (
          <span className="demo-pill">
            <span /> DỮ LIỆU MẪU
          </span>
        )}

        <TenantSelect
          activeMemberships={activeMemberships}
          currentTenantId={currentTenantId}
        />

        <AppSelect currentTenantId={currentTenantId} />

        <div style={{ position: "relative" }}>
          <button
            className="avatar-button"
            type="button"
            aria-label={`Tài khoản ${displayName}`}
            aria-expanded={isProfileOpen}
            onClick={() => setIsProfileOpen((v) => !v)}
          >
            {initials}
          </button>

          {isProfileOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 42,
                background: "var(--ws-surface)",
                border: "1px solid var(--ws-line)",
                borderRadius: 8,
                boxShadow: "var(--ws-shadow)",
                padding: "12px 16px",
                minWidth: 200,
                zIndex: 80,
                color: "var(--ws-ink)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 12 }}>{displayName}</div>
              {user.email && (
                <div style={{ fontSize: 10, color: "var(--ws-muted)" }}>
                  {user.email}
                </div>
              )}
              {roles.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    marginTop: 8,
                    marginBottom: 8,
                  }}
                >
                  {roles.map((r) => (
                    <span
                      key={r}
                      style={{
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "var(--ws-soft)",
                        color: "var(--ws-teal)",
                        fontWeight: 600,
                      }}
                    >
                      {getRoleLabel(r)}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--ws-line)", paddingTop: 8 }}>
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
