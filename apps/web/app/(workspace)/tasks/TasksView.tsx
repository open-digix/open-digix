"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_TASKS, type MockTask } from "../../../lib/mock/catalogs";
import { useMockToast } from "../../../components/workspace/MockToast";

export default function TasksView() {
  const [tasks, setTasks] = useState<MockTask[]>(SAMPLE_TASKS);
  const [tab, setTab] = useState<"pending" | "done" | "all">("pending");
  const { showToast, ToastContainer } = useMockToast();

  const filtered = tasks.filter((t) => {
    if (tab === "pending") return t.status === "pending";
    if (tab === "done") return t.status === "done" || t.status === "rejected";
    return true;
  });

  const handleQuickApprove = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "done" } : t)),
    );
    showToast("Đã duyệt công việc (mẫu — không gửi tới hệ thống).");
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">HỘP VIỆC ĐƯỢC GIAO</div>
          <h1>Việc của tôi</h1>
          <p>Danh sách các đầu việc bạn được chỉ định tham gia xử lý</p>
        </div>
      </header>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === "pending" ? "active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Chờ xử lý ({tasks.filter((t) => t.status === "pending").length})
        </button>
        <button
          type="button"
          className={`tab ${tab === "done" ? "active" : ""}`}
          onClick={() => setTab("done")}
        >
          Đã hoàn tất
        </button>
        <button
          type="button"
          className={`tab ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          Tất cả ({tasks.length})
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã việc</th>
              <th>Tiêu đề / Ứng dụng</th>
              <th>Người gửi</th>
              <th>Hạn xử lý</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.id}</strong>
                </td>
                <td>
                  <div>
                    <strong>
                      <Link href={`/tasks/${t.id}`} className="text-link">
                        {t.title}
                      </Link>
                    </strong>
                    <div style={{ color: "var(--ws-muted)", fontSize: 12 }}>
                      {t.app} · {t.step}
                    </div>
                  </div>
                </td>
                <td>{t.from}</td>
                <td>{t.due}</td>
                <td>
                  <span
                    className={`status ${t.status === "pending" ? "warning" : t.status === "rejected" ? "danger" : ""}`}
                  >
                    {t.status === "pending"
                      ? "Chờ duyệt"
                      : t.status === "rejected"
                        ? "Từ chối"
                        : "Đã duyệt"}
                  </span>
                </td>
                <td>
                  {t.status === "pending" ? (
                    <button
                      type="button"
                      className="button secondary"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      onClick={() => handleQuickApprove(t.id)}
                    >
                      Duyệt nhanh
                    </button>
                  ) : (
                    <span style={{ color: "var(--ws-muted)", fontSize: 12 }}>
                      Đã xử lý
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ToastContainer />
    </div>
  );
}
