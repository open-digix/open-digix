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
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getRuntimeSync } from "../../lib/app-runtime/fixtures";
import { getRuntimeAction } from "../../lib/app-config/actions";
import type { PublishedAppV25 } from "../../lib/app-runtime/types";

interface SidebarProps {
  roles: string[];
  isOpen: boolean;
  onClose: () => void;
  isPinned?: boolean;
  isPeek?: boolean;
  onTogglePin?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocusIn?: () => void;
  onFocusOut?: (e: React.FocusEvent<HTMLElement>) => void;
  onShowTip?: (text: string, target: HTMLElement) => void;
  onHideTip?: () => void;
}

export default function Sidebar({
  roles,
  isOpen,
  onClose,
  isPinned = false,
  isPeek = false,
  onTogglePin,
  onMouseEnter,
  onMouseLeave,
  onFocusIn,
  onFocusOut,
  onShowTip,
  onHideTip,
}: SidebarProps) {
  const pathname = usePathname();

  const canAccessBuilder = roles.some((r) =>
    ["designer", "publisher", "tenant_admin", "admin", "owner"].includes(r),
  );

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

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const handleTipEnter =
    (text: string) =>
    (e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
      onShowTip?.(text, e.currentTarget);
    };

  return (
    <aside
      className={`sidebar ${isOpen ? "open" : ""} ${isPeek ? "peek" : ""}`}
      id="sidebar"
      aria-label="Điều hướng chính"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    >
      <Link
        className="brand"
        href="/apps"
        aria-label="Về danh mục ứng dụng DigiX Lab"
        onClick={onClose}
      >
        <Image
          className="full"
          src="/brand/digix-logo-dark.svg"
          width={154}
          height={32}
          alt="DigiX Lab"
          priority
        />
        <svg className="mini" viewBox="0 0 512 512" aria-hidden="true">
          <rect width="512" height="512" rx="116" fill="#112B45" />
          <g transform="translate(26 26) scale(.9)">
            <path d="M136 120H200L240 200V232H208L136 160Z" fill="#FFFFFF" />
            <path d="M376 120V184L296 240H264V208L336 120Z" fill="#2DD4BF" />
            <path d="M376 392H312L272 312V280H304L376 352Z" fill="#FFFFFF" />
            <path d="M136 392V328L216 272H248V304L176 392Z" fill="#FFFFFF" />
          </g>
        </svg>
      </Link>
      <div className="workspace-tag">
        <span className="workspace-dot" /> <span className="t">KHÔNG GIAN LÀM VIỆC</span>
      </div>

      <nav className="side-nav" id="side-nav">
        {/* Nhóm ứng dụng hiện tại (nếu đang trong /app/[appId]) */}
        {currentAppId && currentApp && (
          <div className="nav-app-group">
            <div className="nav-group-label" style={{ textTransform: "uppercase" }}>
              {currentApp.name}
            </div>
            {currentApp.pages.map((page, index) => {
              const pageHref = `/app/${currentAppId}/${page.id}`;
              const pageTitle = page.label || page.id;
              const isPageActive =
                pathname === pageHref ||
                (pathname === `/app/${currentAppId}` && index === 0);

              return (
                <Link
                  key={page.id}
                  href={pageHref}
                  className={`nav-link ${isPageActive ? "active" : ""}`}
                  aria-current={isPageActive ? "page" : undefined}
                  data-tip={pageTitle}
                  onClick={onClose}
                  onMouseEnter={handleTipEnter(pageTitle)}
                  onMouseLeave={onHideTip}
                  onFocus={handleTipEnter(pageTitle)}
                  onBlur={onHideTip}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                  <span className="lbl">{pageTitle}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Nhóm HỆ THỐNG */}
        <div className="nav-group-label">HỆ THỐNG</div>
        <Link
          href="/apps"
          className={`nav-link ${isActive("/apps") ? "active" : ""}`}
          aria-current={isActive("/apps") ? "page" : undefined}
          data-tip="Ứng dụng"
          onClick={onClose}
          onMouseEnter={handleTipEnter("Ứng dụng")}
          onMouseLeave={onHideTip}
          onFocus={handleTipEnter("Ứng dụng")}
          onBlur={onHideTip}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span className="lbl">Ứng dụng</span>
        </Link>

        <Link
          href="/assistant"
          className={`nav-link ${isActive("/assistant") ? "active" : ""}`}
          aria-current={isActive("/assistant") ? "page" : undefined}
          data-tip="Trợ lý"
          onClick={onClose}
          onMouseEnter={handleTipEnter("Trợ lý")}
          onMouseLeave={onHideTip}
          onFocus={handleTipEnter("Trợ lý")}
          onBlur={onHideTip}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10a9.96 9.96 0 0 1-4.7-1.16L2 22l1.16-5.3A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2z" />
          </svg>
          <span className="lbl">Trợ lý</span>
        </Link>

        {/* Thiết kế ứng dụng - chỉ cho designer, publisher, tenant_admin, admin, owner */}
        {canAccessBuilder && (
          <Link
            href="/apps?tab=draft"
            className={`nav-link ${isActive("/builder") ? "active" : ""}`}
            aria-current={isActive("/builder") ? "page" : undefined}
            data-tip="Thiết kế ứng dụng"
            onClick={onClose}
            onMouseEnter={handleTipEnter("Thiết kế ứng dụng")}
            onMouseLeave={onHideTip}
            onFocus={handleTipEnter("Thiết kế ứng dụng")}
            onBlur={onHideTip}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span className="lbl">Thiết kế ứng dụng</span>
          </Link>
        )}

        <Link
          href="/settings"
          className={`nav-link ${isActive("/settings") ? "active" : ""}`}
          aria-current={isActive("/settings") ? "page" : undefined}
          data-tip="Cài đặt"
          onClick={onClose}
          onMouseEnter={handleTipEnter("Cài đặt")}
          onMouseLeave={onHideTip}
          onFocus={handleTipEnter("Cài đặt")}
          onBlur={onHideTip}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="lbl">Cài đặt</span>
        </Link>
      </nav>

      <div className="side-bottom">
        <button
          type="button"
          className="collapse-btn pin-btn js-pin"
          aria-pressed={isPinned}
          onClick={onTogglePin}
          title={isPinned ? "Bỏ ghim (tự thu gọn)" : "Ghim thanh bên"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            aria-hidden="true"
          >
            <path d="M12 17v5" />
            <path d="M9 10.76V6h6v4.76a2 2 0 0 0 1.11 1.79l1.78.9A2 2 0 0 1 19 15.24V16H5v-.76a2 2 0 0 1 1.11-1.79l1.78-.9A2 2 0 0 0 9 10.76z" />
            <path d="M8 2h8" />
          </svg>
          <span className="lbl">{isPinned ? "Bỏ ghim (tự thu gọn)" : "Ghim thanh bên"}</span>
        </button>
        <div className="side-foot">
          DigiX Lab <span>Khung ứng dụng · v2.5</span>
        </div>
      </div>
    </aside>
  );
}
