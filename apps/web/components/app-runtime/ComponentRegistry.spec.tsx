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

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  getComponentRenderer,
  RenderDynamicComponent,
} from "./ComponentRegistry";
import { MockDataSource } from "@/lib/app-runtime/data-source";
import type { NormalizedComponent } from "@/lib/app-runtime/types";

describe("ComponentRegistry", () => {
  const dataSource = new MockDataSource();

  it("lấy đúng renderer đã đăng ký (form, table, detail, metric, action)", () => {
    const formRenderer = getComponentRenderer("form", 1);
    expect(formRenderer).toBeDefined();

    const tableRenderer = getComponentRenderer("table", 1);
    expect(tableRenderer).toBeDefined();

    const actionRenderer = getComponentRenderer("action", 1);
    expect(actionRenderer).toBeDefined();
  });

  it("trả về FallbackComponentBlock khi component type không xác định hoặc version không hỗ trợ", () => {
    const unknownComp: NormalizedComponent = {
      id: "unknown_1",
      type: "custom_chart",
      componentVersion: 1,
      featureId: "erp.materials",
      resource: "materials",
      zone: "main",
      order: 0,
      hidden: false,
    };

    render(
      <RenderDynamicComponent
        component={unknownComp}
        dataSource={dataSource}
      />
    );

    expect(screen.getByText(/Thành phần chưa hỗ trợ:/)).toBeDefined();
    expect(screen.getByText(/custom_chart/)).toBeDefined();
    expect(screen.getByTestId("fallback-unknown_1")).toBeDefined();
  });

  it("trả về FallbackComponentBlock khi version không hỗ trợ (ví dụ version 2)", () => {
    const v2Comp: NormalizedComponent = {
      id: "v2_comp",
      type: "table",
      componentVersion: 2,
      featureId: "erp.materials",
      resource: "materials",
      zone: "main",
      order: 0,
      hidden: false,
    };

    render(
      <RenderDynamicComponent
        component={v2Comp}
        dataSource={dataSource}
      />
    );

    expect(screen.getByText(/phiên bản 2/)).toBeDefined();
  });
});
