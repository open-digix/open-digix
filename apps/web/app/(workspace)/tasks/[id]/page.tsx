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

import { use, useState } from "react";
import Link from "next/link";
import { SAMPLE_TASKS } from "../../../../lib/mock/catalogs";
import { useMockToast } from "../../../../components/workspace/MockToast";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const task = SAMPLE_TASKS.find((t) => t.id === id) || SAMPLE_TASKS[0];
  const [status, setStatus] = useState(task.status);
  const { showToast, ToastContainer } = useMockToast();

  const handleDecision = (decision: "approved" | "rejected") => {
    setStatus(decision === "approved" ? "done" : "rejected");
    showToast(
      decision === "approved"
        ? "Đã duyệt công việc (mẫu — không gửi tới hệ thống)."
        : "Đã từ chối công việc (mẫu — không gửi tới hệ thống).",
    );
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">CHI TIẾT CÔNG VIỆC</div>
          <h1>
            {task.title} ({task.id})
          </h1>
          <p>
            Ứng dụng: <strong>{task.app}</strong> · Bước hiện tại:{" "}
            <strong>{task.step}</strong>
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/tasks" className="button secondary">
            ← Quay lại hộp việc
          </Link>
        </div>
      </header>

      <div className="detail-layout">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Nội dung đề nghị</h2>
              <p>Thông tin chi tiết từ người tạo hồ sơ</p>
            </div>
            <span
              className={`status ${status === "pending" ? "warning" : status === "rejected" ? "danger" : ""}`}
            >
              {status === "pending"
                ? "Chờ duyệt"
                : status === "rejected"
                  ? "Đã từ chối"
                  : "Đã duyệt"}
            </span>
          </div>

          <div className="detail-block">
            <div className="detail-pair">
              <span>Người gửi:</span>
              <strong>{task.from}</strong>
            </div>
            <div className="detail-pair">
              <span>Giá trị / Số lượng:</span>
              <strong>{task.amount}</strong>
            </div>
            <div className="detail-pair">
              <span>Lý do / Mục tiêu:</span>
              <strong>{task.reason}</strong>
            </div>
            <div className="detail-pair">
              <span>Hạn xử lý:</span>
              <strong>{task.due}</strong>
            </div>
          </div>

          {status === "pending" && (
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--ws-line)",
                display: "flex",
                gap: 10,
              }}
            >
              <button
                type="button"
                className="button primary"
                onClick={() => handleDecision("approved")}
              >
                ✓ Phê duyệt yêu cầu
              </button>
              <button
                type="button"
                className="button danger"
                onClick={() => handleDecision("rejected")}
              >
                ✕ Từ chối yêu cầu
              </button>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Tiến trình phê duyệt</h2>
              <p>Nhật ký xử lý hồ sơ</p>
            </div>
          </div>
          <div className="panel-body">
            <ul className="timeline">
              <li>
                <strong>Khởi tạo hồ sơ</strong>
                <small>{task.from} đã gửi · 15/11/2026</small>
              </li>
              <li className={status === "pending" ? "pending" : ""}>
                <strong>{task.step}</strong>
                <small>
                  {status === "pending"
                    ? "Đang chờ bạn xử lý"
                    : status === "rejected"
                      ? "Đã từ chối (mẫu)"
                      : "Đã phê duyệt (mẫu)"}
                </small>
              </li>
              <li className="pending">
                <strong>Hoàn tất quy trình</strong>
                <small>Hệ thống tự động cập nhật</small>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
