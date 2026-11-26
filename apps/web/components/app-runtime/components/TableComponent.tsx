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
      className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col"
      data-testid={`table-${component.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {displayTitle}
          </h4>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Tài nguyên: {resource}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm..."
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleReload}
            title="Tải lại"
            className="p-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm text-zinc-800 dark:text-zinc-200 border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400 uppercase font-medium">
            <tr>
              <th className="px-4 py-2.5">ID</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2.5 capitalize">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  {loading ? "Đang tải dữ liệu..." : "Chưa có bản ghi nào."}
                </td>
              </tr>
            ) : (
              filteredItems.map((row) => (
                <tr key={String(row.id)} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {String(row.id)}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2.5 text-xs">
                      {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="px-4 py-1.5 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang tải thêm..." : "Tải thêm"}
          </button>
        </div>
      )}
    </div>
  );
}
