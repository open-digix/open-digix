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

export interface TwoColumnsLayoutProps {
  components: NormalizedComponent[];
  dataSource: DataSource;
  onActionCompleted?: () => void;
}

export default function TwoColumnsLayout({
  components,
  dataSource,
  onActionCompleted,
}: TwoColumnsLayoutProps) {
  const mainComponents = components.filter((c) => c.zone === "main");
  const sideComponents = components.filter((c) => c.zone === "side");

  if (mainComponents.length === 0 && sideComponents.length === 0) {
    return (
      <div
        className="p-12 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
        data-testid="empty-page-state"
      >
        <p className="text-zinc-600 dark:text-zinc-400 font-medium">
          Bạn chưa có quyền xem nội dung trang này
        </p>
      </div>
    );
  }

  return (
    // Dùng container query @container và containerType: "inline-size"
    // để layout thay đổi chính xác theo độ rộng khung (cả chế độ xem thử lẫn runtime)
    <div
      className="@container w-full"
      style={{ containerType: "inline-size" }}
      data-testid="two-columns-layout"
    >
      <div className="grid grid-cols-1 @[768px]:grid-cols-12 gap-6 w-full">
        {/* Vùng main: chiếm 12 cột trên màn nhỏ/mobile (<768px), 8 cột trên màn lớn (>=768px) */}
        <div
          className="col-span-1 @[768px]:col-span-8 flex flex-col gap-6"
          data-testid="zone-main"
        >
          {mainComponents.length > 0 ? (
            mainComponents.map((comp) => (
              <RenderDynamicComponent
                key={comp.id}
                component={comp}
                dataSource={dataSource}
                onActionCompleted={onActionCompleted}
              />
            ))
          ) : (
            <div className="p-6 text-center text-xs text-zinc-400 border border-dashed rounded-lg">
              Không có thành phần nào trong vùng chính.
            </div>
          )}
        </div>

        {/* Vùng side: tự động xếp xuống dưới main trên màn nhỏ/mobile (<768px), chiếm 4 cột trên màn lớn */}
        <div
          className="col-span-1 @[768px]:col-span-4 flex flex-col gap-6"
          data-testid="zone-side"
        >
          {sideComponents.length > 0 ? (
            sideComponents.map((comp) => (
              <RenderDynamicComponent
                key={comp.id}
                component={comp}
                dataSource={dataSource}
                onActionCompleted={onActionCompleted}
              />
            ))
          ) : (
            <div className="p-6 text-center text-xs text-zinc-400 border border-dashed rounded-lg">
              Không có thành phần nào trong vùng phụ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
