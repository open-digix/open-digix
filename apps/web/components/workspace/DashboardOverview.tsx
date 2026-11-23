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

import Link from "next/link";
import type { MeTenant, MeUser } from "../../lib/tenant/types";
import { getRoleLabel } from "../../lib/tenant/types";

interface DashboardOverviewProps {
  user: MeUser;
  tenant: MeTenant;
  roles: string[];
}

export function getGreetingVi(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "numeric",
      hourCycle: "h23",
    });
    const hourStr = formatter.format(date);
    const hour = parseInt(hourStr, 10);
    if (isNaN(hour)) return "Xin chào";

    if (hour < 11) return "Chào buổi sáng";
    if (hour < 13) return "Chào buổi trưa";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  } catch {
    return "Xin chào";
  }
}

export default function DashboardOverview({
  user,
  tenant,
  roles,
}: DashboardOverviewProps) {
  const displayName = user.displayName || user.email || "Bạn";
  const greeting = getGreetingVi();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">TỔNG QUAN DOANH NGHIỆP</div>
          <h1>
            {greeting}, {displayName}
          </h1>
          <p>
            Không gian làm việc của <strong>{tenant.name}</strong>
          </p>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            {roles.map((r) => (
              <span key={r} className="role-tag">
                {getRoleLabel(r)}
              </span>
            ))}
          </div>
        </div>

        <div className="page-header-actions">
          <Link href="/records" className="button primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="inline-icon"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Tạo hồ sơ
          </Link>
        </div>
      </header>

      {/* Hero Band */}
      <section className="hero-band">
        <div className="hero-copy">
          <span className="hero-label">DIGIX LAB · WORKSPACE</span>
          <h2>
            Quy trình rõ ràng.
            <br />
            Công việc liền mạch.
          </h2>
          <p>
            Theo dõi ứng dụng, xử lý việc được giao và thiết kế quy trình trong
            cùng một không gian.
          </p>
          <div className="hero-actions">
            <Link href="/tasks" className="button light">
              Xem việc cần xử lý →
            </Link>
            <Link href="/apps" className="button outline-light">
              Khám phá ứng dụng
            </Link>
          </div>
        </div>
        <div className="hero-flow" aria-hidden="true">
          <div className="flow-node">
            <b>01</b>
            <strong>Thiết kế</strong>
            <small>Cấu hình</small>
          </div>
          <span className="flow-arrow">→</span>
          <div className="flow-node">
            <b>02</b>
            <strong>Kiểm tra</strong>
            <small>Chạy thử</small>
          </div>
          <span className="flow-arrow">→</span>
          <div className="flow-node">
            <b>03</b>
            <strong>Vận hành</strong>
            <small>Truy vết</small>
          </div>
        </div>
      </section>

      {/* KPI Header with Sample Data Badge */}
      <div className="section-title">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2>Chỉ số hoạt động</h2>
          <span className="demo-pill" style={{ display: "inline-flex" }}>
            <span /> DỮ LIỆU MẪU
          </span>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="stats-grid">
        <Link href="/apps" className="stat-card">
          <div className="stat-top">
            <span>Ứng dụng</span>
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
          </div>
          <div className="stat-number">03</div>
          <div className="stat-note">Trong doanh nghiệp này (mẫu)</div>
        </Link>

        <Link href="/tasks" className="stat-card">
          <div className="stat-top">
            <span>Việc cần xử lý</span>
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m9 11 3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
          </div>
          <div className="stat-number">02</div>
          <div className="stat-note">Danh sách được giao (mẫu)</div>
        </Link>

        <Link href="/records" className="stat-card">
          <div className="stat-top">
            <span>Hồ sơ của tôi</span>
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>
          </div>
          <div className="stat-number">04</div>
          <div className="stat-note">Đã tạo trong kỳ (mẫu)</div>
        </Link>

        <Link href="/records" className="stat-card">
          <div className="stat-top">
            <span>Đã duyệt xong</span>
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
          </div>
          <div className="stat-number">02</div>
          <div className="stat-note">Hoàn tất quy trình (mẫu)</div>
        </Link>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Việc cần xử lý gần đây</h2>
              <p>Dữ liệu mẫu từ kịch bản kiểm thử</p>
            </div>
            <Link href="/tasks" className="text-link">
              Xem tất cả →
            </Link>
          </div>
          <div className="panel-body">
            <div className="task-row">
              <div className="app-icon" aria-hidden="true">
                ĐM
              </div>
              <div className="row-copy">
                <strong>Duyệt đề nghị mua laptop Dell XPS 15</strong>
                <small>Đề nghị mua sắm · Trần Văn Bình · Hạn 18/11/2026</small>
              </div>
              <span className="status warning">Chờ duyệt</span>
            </div>
            <div className="task-row">
              <div className="app-icon blue" aria-hidden="true">
                NP
              </div>
              <div className="row-copy">
                <strong>Duyệt đơn xin nghỉ phép 3 ngày</strong>
                <small>Nghỉ phép năm · Lê Thị Cúc · Hạn 19/11/2026</small>
              </div>
              <span className="status warning">Chờ duyệt</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Hồ sơ của tôi</h2>
              <p>Hồ sơ bạn đã gửi gần đây (mẫu)</p>
            </div>
            <Link href="/records" className="text-link">
              Chi tiết →
            </Link>
          </div>
          <div className="panel-body">
            <div className="app-row">
              <div className="app-icon" aria-hidden="true">
                ĐM
              </div>
              <div className="row-copy">
                <strong>Mua màn hình 27 inch 4K</strong>
                <small>HS-9021 · 15/11/2026</small>
              </div>
              <span className="status">Đã duyệt</span>
            </div>
            <div className="app-row">
              <div className="app-icon blue" aria-hidden="true">
                NP
              </div>
              <div className="row-copy">
                <strong>Nghỉ phép cưới</strong>
                <small>HS-8842 · 10/11/2026</small>
              </div>
              <span className="status">Đã duyệt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
