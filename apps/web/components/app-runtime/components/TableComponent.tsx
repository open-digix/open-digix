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

  const displayTitle = label || `Danh sách: ${resource}`;

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

  // Tự động nhận diện các cột hiển thị từ bản ghi đầu tiên
  const columns = items.length > 0
    ? Object.keys(items[0]).filter((k) => k !== "id" && k !== "createdAt").slice(0, 4)
    : ["Tên / Mã", "Trạng thái"];

  return (
    <div
      className="panel"
      style={{ padding: 20 }}
      data-testid={`table-${component.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 600 }}>
            {displayTitle}
          </h4>
          <span style={{ fontSize: 12, color: "var(--ws-muted)" }}>
            Tài nguyên: <code>{resource}</code>
          </span>
        </div>

        <div className="flex items-center gap-2">
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
              <th style={{ width: 80 }}>ID</th>
              {columns.map((col) => (
                <th key={col} style={{ textTransform: "capitalize" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: "center", padding: "32px 16px", color: "var(--ws-muted)" }}>
                  {loading ? "Đang tải dữ liệu..." : "Chưa có bản ghi nào."}
                </td>
              </tr>
            ) : (
              filteredItems.map((row) => (
                <tr key={String(row.id)}>
                  <td style={{ fontWeight: 600, color: "var(--ws-teal)" }}>
                    {String(row.id)}
                  </td>
                  {columns.map((col) => (
                    <td key={col}>
                      {typeof row[col] === "object"
                        ? JSON.stringify(row[col])
                        : String(row[col] ?? "-")}
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
