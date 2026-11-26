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

export interface DetailComponentProps {
  component: NormalizedComponent;
  dataSource: DataSource;
  onActionCompleted?: () => void;
}

export default function DetailComponent({
  component,
  dataSource,
}: DetailComponentProps) {
  const { resource, label } = component;
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const displayTitle = label || `Chi tiết: ${resource}`;

  useEffect(() => {
    let isMounted = true;
    dataSource
      .list(resource, { limit: 1 })
      .then((res) => {
        if (isMounted && res.items.length > 0) {
          setRecord(res.items[0]);
        }
      })
      .catch((err) => console.error("Lỗi tải chi tiết:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dataSource, resource]);

  return (
    <div
      className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
      data-testid={`detail-${component.id}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {displayTitle}
        </h4>
        <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
          {resource}
        </span>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-zinc-500">Đang tải bản ghi...</div>
      ) : !record ? (
        <div className="py-6 text-center text-sm text-zinc-500">Không có bản ghi nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(record).map(([key, val]) => (
            <div key={key} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 capitalize mb-1">
                {key}
              </span>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 break-words">
                {typeof val === "object" ? JSON.stringify(val) : String(val ?? "-")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
