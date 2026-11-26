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
      className="stat-card"
      style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      data-testid={`metric-${component.id}`}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h4 style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ws-muted)" }}>
          {displayTitle}
        </h4>
        <span style={{ color: "var(--ws-teal)" }} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </span>
      </div>

      <div style={{ margin: "14px 0 8px" }}>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ws-ink)" }}>
          {metricValue}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "var(--ws-muted)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--ws-teal)" }} />
        {subText}
      </p>
    </div>
  );
}
