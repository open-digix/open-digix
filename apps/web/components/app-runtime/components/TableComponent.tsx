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

import React, { useEffect, useState } from "react";
import type { NormalizedComponent, DataSource } from "@/lib/app-runtime/types";

export interface TableComponentProps {
  component: NormalizedComponent;
  dataSource: DataSource;
  onActionCompleted?: () => void;
}

export default function TableComponent({
  component,
  dataSource,
}: TableComponentProps) {
  const { resource, label } = component;
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const RESOURCE_TITLES: Record<string, string> = {
    materials: "Danh sách vật tư",
    requests: "Danh sách yêu cầu mua",
    receipts: "Danh sách phiếu nhập kho",
    stock: "Tồn kho vật tư",
    customers: "Danh sách khách hàng",
    opportunities: "Danh sách cơ hội bán hàng",
    deals: "Danh sách cơ hội bán hàng",
  };
  const displayTitle = label || RESOURCE_TITLES[resource] || `Danh sách ${resource}`;

  const COLUMN_LABELS: Record<string, string> = {
    id: "Mã",
    code: "Mã",
    title: "Tiêu đề",
    requester: "Người đề xuất",
    date: "Ngày",
    totalEstimated: "Dự toán (VNĐ)",
    name: "Tên",
    unit: "Đơn vị",
    stock: "Tồn kho",
    unitPrice: "Đơn giá (VNĐ)",
    category: "Phân loại",
    industry: "Ngành nghề",
    contactPerson: "Người liên hệ",
    phone: "Số điện thoại",
    customerName: "Khách hàng",
    value: "Giá trị (VNĐ)",
    status: "Trạng thái",
    stage: "Giai đoạn",
    probability: "Xác suất (%)",
    description: "Mô tả",
    warehouse: "Kho",
    quantity: "Số lượng",
    reserved: "Đã giữ chỗ",
    createdAt: "Ngày tạo",
    updatedAt: "Ngày cập nhật",
  };

  const renderStatusPill = (val: unknown) => {
    const s = String(val).toLowerCase();
    if (s === "pending") {
      return <span className="app-badge draft">Chờ duyệt</span>;
    }
    if (s === "approved") {
      return <span className="app-badge published">Đã duyệt</span>;
    }
    if (s === "rejected") {
      return (
        <span
          className="app-badge"
          style={{
            background: "var(--ws-bg-danger-soft)",
            color: "var(--ws-danger)",
            border: "1px solid var(--ws-border-danger-soft)",
          }}
        >
          Từ chối
        </span>
      );
    }
    if (s === "active") {
      return <span className="app-badge published">Hoạt động</span>;
    }
    if (s === "lead") {
      return <span className="app-badge draft">Tiềm năng</span>;
    }
    if (s === "closed_won") {
      return <span className="app-badge published">Thành công</span>;
    }
    if (s === "negotiation") {
      return <span className="app-badge draft">Đàm phán</span>;
    }
    if (s === "proposal") {
      return <span className="app-badge draft">Đề xuất</span>;
    }
    if (s === "qualification") {
      return <span className="app-badge draft">Đánh giá</span>;
    }
    return String(val);
  };

  const formatDate = (val: unknown): string => {
    if (typeof val === "string") {
      const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
    }
    return String(val ?? "—");
  };

  const renderCellContent = (col: string, val: unknown) => {
    if (val === null || val === undefined) return "—";
    if (col === "status" || col === "stage") {
      return renderStatusPill(val);
    }
    if (col === "date" || col === "createdAt" || col === "updatedAt") {
      return formatDate(val);
    }
    if (col === "totalEstimated" || col === "unitPrice" || col === "value") {
      return typeof val === "number" ? val.toLocaleString("vi-VN") : String(val);
    }
    if (col === "code" || col === "id") {
      return <strong style={{ color: "var(--ws-accent)" }}>{String(val)}</strong>;
    }
    if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      return String(obj.name || obj.title || "—");
    }
    return String(val);
  };

  useEffect(() => {
    let isMounted = true;
    dataSource
      .list(resource, { limit: 10 })
      .then((res) => {
        if (!isMounted) return;
        setItems(res.items || []);
        setNextCursor(res.nextCursor);
      })
      .catch((err) => console.error("Lỗi tải danh sách:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dataSource, resource]);

  const handleReload = () => {
    setLoading(true);
    dataSource
      .list(resource, { limit: 10 })
      .then((res) => {
        setItems(res.items || []);
        setNextCursor(res.nextCursor);
      })
      .catch((err) => console.error("Lỗi tải lại danh sách:", err))
      .finally(() => {
        setLoading(false);
      });
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const res = await dataSource.list(resource, { limit: 10, cursor: nextCursor });
      setItems((prev) => [...prev, ...(res.items || [])]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error("Lỗi tải thêm:", err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc tìm kiếm cơ bản phía client
  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(searchTerm.toLowerCase());
  });

  // Xác định các cột hiển thị: loại bỏ id nếu đã có code để tránh trùng cột Mã
  const rawKeys = items.length > 0 ? Object.keys(items[0]) : [];
  const hasCode = rawKeys.includes("code");
  const columns = rawKeys
    .filter((k) => {
      if (k === "createdAt" || k === "updatedAt") return false;
      if (hasCode && k === "id") return false;
      return true;
    })
    .slice(0, 5);

  return (
    <div
      className="panel"
      style={{ padding: 20 }}
      data-testid={`table-${component.id}`}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {displayTitle}
          </h4>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm..."
            className="input"
            style={{ padding: "6px 12px", height: "auto", fontSize: 13 }}
          />
          <button
            type="button"
            onClick={handleReload}
            title="Tải lại dữ liệu"
            className="button secondary"
            style={{ padding: "6px 10px", height: "auto" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>
                  {COLUMN_LABELS[col] || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: "32px 16px", color: "var(--ws-muted)" }}>
                  {loading ? "Đang tải dữ liệu..." : "Chưa có bản ghi nào."}
                </td>
              </tr>
            ) : (
              filteredItems.map((row, idx) => (
                <tr key={String(row.id || idx)}>
                  {columns.map((col) => (
                    <td key={col}>
                      {renderCellContent(col, row[col])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="button secondary"
          >
            {loading ? "Đang tải thêm..." : "Xem thêm bản ghi"}
          </button>
        </div>
      )}
    </div>
  );
}
