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

import React from "react";
import type { NormalizedComponent, DataSource } from "@/lib/app-runtime/types";
import FormComponent from "./components/FormComponent";
import TableComponent from "./components/TableComponent";
import DetailComponent from "./components/DetailComponent";
import MetricComponent from "./components/MetricComponent";
import ActionComponent from "./components/ActionComponent";

export interface ComponentRendererProps {
  component: NormalizedComponent;
  dataSource: DataSource;
  onActionCompleted?: () => void;
}

export type ComponentRenderer = React.ComponentType<ComponentRendererProps>;

/**
 * Khối cảnh báo an toàn khi gặp component type lạ hoặc version không hỗ trợ.
 * Không throw error, không làm vỡ bố cục trang.
 */
export function FallbackComponentBlock({ component }: { component: NormalizedComponent }) {
  return (
    <div
      role="alert"
      className="info-banner"
      style={{
        borderColor: "var(--ws-warning)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 16,
      }}
      data-testid={`fallback-${component.id}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2, color: "var(--ws-warning)" }}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <p style={{ margin: 0, fontWeight: 600 }}>
          Thành phần chưa hỗ trợ: <code>{component.type}</code> (phiên bản {component.componentVersion})
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ws-muted)" }}>
          ID: {component.id} | Tài nguyên: {component.resource} | Vùng: {component.zone}
        </p>
      </div>
    </div>
  );
}

const SafeFallbackRenderer: ComponentRenderer = ({ component }) => (
  <FallbackComponentBlock component={component} />
);

const REGISTRY: Record<string, Record<number, ComponentRenderer>> = {
  form: { 1: FormComponent },
  table: { 1: TableComponent },
  detail: { 1: DetailComponent },
  metric: { 1: MetricComponent },
  action: { 1: ActionComponent },
};

/**
 * Lấy component renderer từ registry theo type và componentVersion.
 * Nếu không hỗ trợ, trả về FallbackComponentBlock.
 */
export function getComponentRenderer(
  type: string,
  version: number
): ComponentRenderer {
  const versionMap = REGISTRY[type];
  if (versionMap && versionMap[version]) {
    return versionMap[version];
  }

  return SafeFallbackRenderer;
}

/**
 * Component hiển thị một component bất kỳ thông qua registry.
 */
export function RenderDynamicComponent({
  component,
  dataSource,
  onActionCompleted,
}: ComponentRendererProps) {
  const { type, componentVersion } = component;

  if (componentVersion === 1) {
    switch (type) {
      case "form":
        return <FormComponent component={component} dataSource={dataSource} onActionCompleted={onActionCompleted} />;
      case "table":
        return <TableComponent component={component} dataSource={dataSource} onActionCompleted={onActionCompleted} />;
      case "detail":
        return <DetailComponent component={component} dataSource={dataSource} onActionCompleted={onActionCompleted} />;
      case "metric":
        return <MetricComponent component={component} dataSource={dataSource} onActionCompleted={onActionCompleted} />;
      case "action":
        return <ActionComponent component={component} dataSource={dataSource} onActionCompleted={onActionCompleted} />;
    }
  }

  return <FallbackComponentBlock component={component} />;
}
