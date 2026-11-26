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
      className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3"
      data-testid={`fallback-${component.id}`}
    >
      <span className="text-lg leading-none">⚠️</span>
      <div>
        <p className="font-medium">
          Thành phần chưa hỗ trợ: <code className="font-mono px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40">{component.type}</code> (phiên bản {component.componentVersion})
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
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
