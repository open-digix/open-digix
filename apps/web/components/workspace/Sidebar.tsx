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

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
    ["designer", "publisher", "tenant_admin"].includes(r),
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
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
        href="/dashboard"
        aria-label="Về tổng quan DigiX Lab"
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
        {/* Nhóm CHUNG */}
        <div className="nav-group-label">CHUNG</div>
        <Link
          href="/dashboard"
          className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
          aria-current={isActive("/dashboard") ? "page" : undefined}
          data-tip="Tổng quan"
          onClick={onClose}
          onMouseEnter={handleTipEnter("Tổng quan")}
          onMouseLeave={onHideTip}
          onFocus={handleTipEnter("Tổng quan")}
          onBlur={onHideTip}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span className="lbl">Tổng quan</span>
        </Link>
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

        {/* Nhóm THIẾT KẾ - chỉ cho designer, publisher, tenant_admin */}
        {canAccessBuilder && (
          <>
            <div className="nav-group-label">THIẾT KẾ</div>
            <Link
              href="/builder"
              className={`nav-link ${isActive("/builder") ? "active" : ""}`}
              aria-current={isActive("/builder") ? "page" : undefined}
              data-tip="Thiết kế quy trình"
              onClick={onClose}
              onMouseEnter={handleTipEnter("Thiết kế quy trình")}
              onMouseLeave={onHideTip}
              onFocus={handleTipEnter("Thiết kế quy trình")}
              onBlur={onHideTip}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M6 9v3a6 6 0 0 0 6 6h3" />
              </svg>
              <span className="lbl">Thiết kế quy trình</span>
            </Link>
          </>
        )}

        {/* Nhóm VẬN HÀNH */}
        <div className="nav-group-label">VẬN HÀNH</div>
        <Link
          href="/tasks"
          className={`nav-link ${isActive("/tasks") ? "active" : ""}`}
          aria-current={isActive("/tasks") ? "page" : undefined}
          data-tip="Việc của tôi"
          onClick={onClose}
          onMouseEnter={handleTipEnter("Việc của tôi")}
          onMouseLeave={onHideTip}
          onFocus={handleTipEnter("Việc của tôi")}
          onBlur={onHideTip}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m9 11 3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span className="lbl">Việc của tôi</span>
        </Link>
        <Link
          href="/records"
          className={`nav-link ${isActive("/records") ? "active" : ""}`}
          aria-current={isActive("/records") ? "page" : undefined}
          data-tip="Hồ sơ của tôi"
          onClick={onClose}
          onMouseEnter={handleTipEnter("Hồ sơ của tôi")}
          onMouseLeave={onHideTip}
          onFocus={handleTipEnter("Hồ sơ của tôi")}
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
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
          <span className="lbl">Hồ sơ của tôi</span>
        </Link>
        <Link
          href="/reports"
          className={`nav-link ${isActive("/reports") ? "active" : ""}`}
          aria-current={isActive("/reports") ? "page" : undefined}
          data-tip="Báo cáo"
          onClick={onClose}
          onMouseEnter={handleTipEnter("Báo cáo")}
          onMouseLeave={onHideTip}
          onFocus={handleTipEnter("Báo cáo")}
          onBlur={onHideTip}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <span className="lbl">Báo cáo</span>
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
        <Link
          href="/settings"
          className={`nav-link ${isActive("/settings") ? "active" : ""}`}
          aria-current={isActive("/settings") ? "page" : undefined}
          data-tip="Quản trị"
          onClick={onClose}
          onMouseEnter={handleTipEnter("Quản trị")}
          onMouseLeave={onHideTip}
          onFocus={handleTipEnter("Quản trị")}
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
          <span className="lbl">Quản trị</span>
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
          DigiX Lab <span>Giao diện mẫu · 2026</span>
        </div>
      </div>
    </aside>
  );
}
