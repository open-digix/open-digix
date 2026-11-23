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

import { use } from "react";
import Link from "next/link";
import { SAMPLE_RECORDS } from "../../../../lib/mock/catalogs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RecordDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const record = SAMPLE_RECORDS.find((r) => r.id === id) || SAMPLE_RECORDS[0];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">CHI TIẾT HỒ SƠ</div>
          <h1>
            {record.title} ({record.id})
          </h1>
          <p>
            Ứng dụng: <strong>{record.app}</strong> · Phiên bản:{" "}
            <strong>{record.version}</strong>
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/records" className="button secondary">
            ← Quay lại danh sách hồ sơ
          </Link>
        </div>
      </header>

      <div className="detail-layout">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Thông tin hồ sơ</h2>
              <p>Chi tiết dữ liệu đã nhập (mẫu)</p>
            </div>
            <span
              className={`status ${record.status === "approved" ? "" : record.status === "pending" ? "warning" : "neutral"}`}
            >
              {record.status === "approved"
                ? "Đã duyệt"
                : record.status === "pending"
                  ? "Chờ duyệt"
                  : "Bản nháp"}
            </span>
          </div>
          <div className="detail-block">
            <div className="detail-pair">
              <span>Mã hồ sơ:</span>
              <strong>{record.id}</strong>
            </div>
            <div className="detail-pair">
              <span>Nội dung yêu cầu:</span>
              <strong>{record.detail}</strong>
            </div>
            <div className="detail-pair">
              <span>Ngày gửi:</span>
              <strong>{record.updated}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Lộ trình xử lý</h2>
              <p>Lịch sử các bước (mẫu)</p>
            </div>
          </div>
          <div className="panel-body">
            <ul className="timeline">
              <li>
                <strong>Tạo hồ sơ thành công</strong>
                <small>{record.updated} · Người dùng</small>
              </li>
              <li className={record.status === "approved" ? "" : "pending"}>
                <strong>Phê duyệt bởi Quản lý</strong>
                <small>
                  {record.status === "approved"
                    ? "Đã phê duyệt"
                    : "Đang chờ duyệt"}
                </small>
              </li>
              <li className={record.status === "approved" ? "" : "pending"}>
                <strong>Kết thúc quy trình</strong>
                <small>
                  {record.status === "approved"
                    ? "Đã chấp thuận"
                    : "Chưa hoàn tất"}
                </small>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
