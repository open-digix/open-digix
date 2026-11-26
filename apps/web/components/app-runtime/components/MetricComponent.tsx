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

export interface MetricComponentProps {
  component: NormalizedComponent;
  dataSource: DataSource;
  onActionCompleted?: () => void;
}

export default function MetricComponent({
  component,
  dataSource,
}: MetricComponentProps) {
  const { resource, label } = component;
  const [metricValue, setMetricValue] = useState<number | string>("—");
  const [subText, setSubText] = useState<string>("Đang tính toán...");

  const displayTitle = label || `Chỉ số: ${resource}`;

  useEffect(() => {
    let isMounted = true;
    dataSource
      .list(resource, { limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        const count = res.items.length;
        setMetricValue(count);

        if (resource === "requests") {
          const pending = res.items.filter((it) => (it as Record<string, unknown>).status === "pending").length;
          setSubText(`${pending} yêu cầu chờ phê duyệt`);
        } else if (resource === "opportunities") {
          const active = res.items.filter((it) => (it as Record<string, unknown>).stage !== "closed_won").length;
          setSubText(`${active} cơ hội đang mở`);
        } else {
          setSubText(`Tổng số ${count} mục đang quản lý`);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMetricValue("—");
          setSubText("Không thể tải chỉ số");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dataSource, resource]);

  return (
    <div
      className="p-5 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
      data-testid={`metric-${component.id}`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {displayTitle}
        </h4>
        <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 text-xs">
          📊
        </span>
      </div>

      <div className="my-3">
        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {metricValue}
        </span>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        {subText}
      </p>
    </div>
  );
}
