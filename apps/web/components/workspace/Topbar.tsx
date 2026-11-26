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

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import TenantSelect from "./TenantSelect";
import AppSelect from "./AppSelect";
import LogoutButton from "../../app/components/LogoutButton";
import ThemeSelector from "./ThemeSelector";
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
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
        avatarBtnRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        avatarBtnRef.current &&
        !avatarBtnRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
        avatarBtnRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

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
            ref={avatarBtnRef}
            className="avatar-button"
            type="button"
            aria-label={`Tài khoản ${displayName}`}
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            onClick={() => setIsProfileOpen((v) => !v)}
          >
            {initials}
          </button>

          {isProfileOpen && (
            <div
              ref={dropdownRef}
              role="menu"
              aria-label="Menu người dùng"
              style={{
                position: "absolute",
                right: 0,
                top: 42,
                background: "var(--ws-glass-bg-strong, var(--ws-bg-surface))",
                backdropFilter: "var(--ws-glass-blur)",
                WebkitBackdropFilter: "var(--ws-glass-blur)",
                border: "1px solid var(--ws-glass-border, var(--ws-border))",
                borderRadius: 10,
                boxShadow: "var(--ws-shadow)",
                padding: "12px 16px",
                minWidth: 220,
                zIndex: 80,
                color: "var(--ws-text)",
                animation: "ws-fade-in-scale var(--ws-dur-fast) var(--ws-ease)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 12 }}>{displayName}</div>
              {user.email && (
                <div style={{ fontSize: 12, color: "var(--ws-text-muted)", marginTop: 2 }}>
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
                      className="role-tag"
                      style={{ fontSize: 11, padding: "2px 6px" }}
                    >
                      {getRoleLabel(r)}
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  borderTop: "1px solid var(--ws-glass-border, var(--ws-border))",
                  marginTop: 8,
                  paddingTop: 8,
                }}
              >
                <ThemeSelector />
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--ws-glass-border, var(--ws-border))",
                  marginTop: 8,
                  paddingTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <a
                  href={`${process.env.NEXT_PUBLIC_KEYCLOAK_ACCOUNT_URL || "http://localhost:8080/realms/digix/account"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                  role="menuitem"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "var(--ws-text)",
                    textDecoration: "none",
                    padding: "4px 0",
                  }}
                >
                  <span>Đổi mật khẩu</span>
                  <span aria-hidden="true" style={{ fontSize: 11, opacity: 0.7 }}>↗</span>
                </a>
                <div role="menuitem">
                  <LogoutButton className="text-link" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}