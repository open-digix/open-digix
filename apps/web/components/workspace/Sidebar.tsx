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
}

export default function Sidebar({ roles, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const canAccessBuilder = roles.some((r) =>
    ["designer", "publisher", "tenant_admin"].includes(r),
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={`sidebar ${isOpen ? "open" : ""}`}
      id="sidebar"
      aria-label="Điều hướng chính"
    >
      <Link
        className="brand"
        href="/dashboard"
        aria-label="Về tổng quan DigiX Lab"
        onClick={onClose}
      >
        <Image
          src="/brand/digix-logo-dark.svg"
          width={151}
          height={40}
          alt="DigiX Lab"
        />
      </Link>
      <div className="workspace-tag">
        <span className="workspace-dot" /> KHÔNG GIAN LÀM VIỆC
      </div>

      <nav className="side-nav" id="side-nav">
        {/* Nhóm CHUNG */}
        <div className="nav-group-label">CHUNG</div>
        <Link
          href="/dashboard"
          className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
          aria-current={isActive("/dashboard") ? "page" : undefined}
          onClick={onClose}
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
          <span>Tổng quan</span>
        </Link>
        <Link
          href="/apps"
          className={`nav-link ${isActive("/apps") ? "active" : ""}`}
          aria-current={isActive("/apps") ? "page" : undefined}
          onClick={onClose}
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
          <span>Ứng dụng</span>
        </Link>

        {/* Nhóm THIẾT KẾ - chỉ cho designer, publisher, tenant_admin */}
        {canAccessBuilder && (
          <>
            <div className="nav-group-label">THIẾT KẾ</div>
            <Link
              href="/builder"
              className={`nav-link ${isActive("/builder") ? "active" : ""}`}
              aria-current={isActive("/builder") ? "page" : undefined}
              onClick={onClose}
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
              <span>Thiết kế quy trình</span>
            </Link>
          </>
        )}

        {/* Nhóm VẬN HÀNH */}
        <div className="nav-group-label">VẬN HÀNH</div>
        <Link
          href="/tasks"
          className={`nav-link ${isActive("/tasks") ? "active" : ""}`}
          aria-current={isActive("/tasks") ? "page" : undefined}
          onClick={onClose}
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
          <span>Việc của tôi</span>
        </Link>
        <Link
          href="/records"
          className={`nav-link ${isActive("/records") ? "active" : ""}`}
          aria-current={isActive("/records") ? "page" : undefined}
          onClick={onClose}
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
          <span>Hồ sơ của tôi</span>
        </Link>
        <Link
          href="/reports"
          className={`nav-link ${isActive("/reports") ? "active" : ""}`}
          aria-current={isActive("/reports") ? "page" : undefined}
          onClick={onClose}
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
          <span>Báo cáo</span>
        </Link>
        <Link
          href="/assistant"
          className={`nav-link ${isActive("/assistant") ? "active" : ""}`}
          aria-current={isActive("/assistant") ? "page" : undefined}
          onClick={onClose}
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
          <span>Trợ lý</span>
        </Link>
        <Link
          href="/settings"
          className={`nav-link ${isActive("/settings") ? "active" : ""}`}
          aria-current={isActive("/settings") ? "page" : undefined}
          onClick={onClose}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Quản trị</span>
        </Link>
      </nav>

      <div className="side-bottom">
        <div className="side-foot">
          DigiX Lab <span>Giao diện mẫu · 2026</span>
        </div>
      </div>
    </aside>
  );
}
