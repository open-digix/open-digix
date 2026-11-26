"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_RECORDS } from "../../../lib/mock/catalogs";

export default function RecordsView() {
  const [filter, setFilter] = useState("all");

  const filtered = SAMPLE_RECORDS.filter((r) => {
    if (filter === "approved") return r.status === "approved";
    if (filter === "pending") return r.status === "pending";
    if (filter === "draft") return r.status === "draft";
    return true;
  });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">THEO DÕI HỒ SƠ</div>
          <h1>Hồ sơ của tôi</h1>
          <p>Danh sách các yêu cầu và đề xuất bạn đã khởi tạo</p>
        </div>
        <div className="page-header-actions">
          <Link href="/apps" className="button primary">
            + Tạo hồ sơ mới
          </Link>
        </div>
      </header>

      <div className="filterbar">
        <select
          id="records-filter"
          name="statusFilter"
          className="select"
          aria-label="Lọc theo trạng thái hồ sơ"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Đang chờ duyệt</option>
          <option value="approved">Đã phê duyệt</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã hồ sơ</th>
              <th>Tiêu đề / Ứng dụng</th>
              <th>Chi tiết</th>
              <th>Cập nhật</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.id}</strong>
                </td>
                <td>
                  <div>
                    <strong>{r.title}</strong>
                    <div style={{ color: "var(--ws-muted)", fontSize: 12 }}>
                      {r.app} · {r.version}
                    </div>
                  </div>
                </td>
                <td>{r.detail}</td>
                <td>{r.updated}</td>
                <td>
                  <span
                    className={`status ${r.status === "approved" ? "" : r.status === "pending" ? "warning" : "neutral"}`}
                  >
                    {r.status === "approved"
                      ? "Đã duyệt"
                      : r.status === "pending"
                        ? "Chờ duyệt"
                        : "Bản nháp"}
                  </span>
                </td>
                <td>
                  <Link href={`/records/${r.id}`} className="text-link">
                    Xem chi tiết →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
