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
import LogoutButton from "../../app/components/LogoutButton";
import type { MeMembership, MeUser } from "../../lib/tenant/types";
import { getRoleLabel } from "../../lib/tenant/types";

interface TopbarProps {
  user: MeUser;
  activeMemberships: MeMembership[];
  currentTenantId: string | null;
  roles: string[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/apps": "Ứng dụng",
  "/builder": "Thiết kế quy trình",
  "/builder/new": "Tạo ứng dụng",
  "/tasks": "Việc của tôi",
  "/records": "Hồ sơ của tôi",
  "/reports": "Báo cáo",
  "/assistant": "Trợ lý",
  "/settings": "Quản trị",
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

  // Compute breadcrumb title
  let pageTitle = "Không gian làm việc";
  for (const [route, title] of Object.entries(BREADCRUMB_MAP)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      pageTitle = title;
      break;
    }
  }

  // Determine if this is a sample data screen (apps, tasks, records, reports, assistant, settings)
  const isSampleDataPage = [
    "/apps",
    "/tasks",
    "/records",
    "/reports",
    "/assistant",
    "/settings",
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
          <strong>{pageTitle}</strong>
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
                background: "var(--ws-bg-surface)",
                border: "1px solid var(--ws-border)",
                borderRadius: 8,
                boxShadow: "var(--ws-shadow)",
                padding: "12px 16px",
                minWidth: 200,
                zIndex: 80,
                color: "var(--ws-text)",
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
                    gap: 4,
                    flexWrap: "wrap",
                    margin: "8px 0",
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
                  borderTop: "1px solid var(--ws-border)",
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
