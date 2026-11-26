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
      className="panel"
      style={{ padding: 20 }}
      data-testid={`detail-${component.id}`}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          {displayTitle}
        </h4>
        <span className="badge" style={{ fontSize: 11 }}>
          {resource}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--ws-muted)" }}>
          Đang tải bản ghi...
        </div>
      ) : !record ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--ws-muted)" }}>
          Không có bản ghi nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(record).map(([key, val]) => (
            <div
              key={key}
              className="detail-pair"
              style={{
                padding: 12,
                border: "1px solid var(--ws-line)",
                borderRadius: 6,
                background: "var(--ws-canvas)",
              }}
            >
              <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--ws-muted)", textTransform: "capitalize", marginBottom: 4 }}>
                {key}
              </span>
              <strong style={{ fontSize: 13, wordBreak: "break-word" }}>
                {typeof val === "object" ? JSON.stringify(val) : String(val ?? "-")}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
