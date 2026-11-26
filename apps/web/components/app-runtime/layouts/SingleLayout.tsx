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
import { RenderDynamicComponent } from "../ComponentRegistry";

export interface SingleLayoutProps {
  components: NormalizedComponent[];
  dataSource: DataSource;
  onActionCompleted?: () => void;
}

export default function SingleLayout({
  components,
  dataSource,
  onActionCompleted,
}: SingleLayoutProps) {
  // Bố cục single: chỉ có vùng main
  const mainComponents = components.filter(
    (c) => c.zone === "main" || !c.zone
  );

  if (mainComponents.length === 0) {
    return (
      <div
        className="panel"
        style={{ padding: 48, textAlign: "center" }}
        data-testid="empty-page-state"
      >
        <p style={{ margin: 0, color: "var(--ws-muted)", fontWeight: 500 }}>
          Bạn chưa có quyền xem nội dung trang này
        </p>
      </div>
    );
  }

  return (
    <div className="single-layout-container" data-testid="single-layout">
      {mainComponents.map((comp) => (
        <RenderDynamicComponent
          key={comp.id}
          component={comp}
          dataSource={dataSource}
          onActionCompleted={onActionCompleted}
        />
      ))}
    </div>
  );
}
