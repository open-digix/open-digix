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
import TwoColumnsLayout from "./TwoColumnsLayout";
import SingleLayout from "./SingleLayout";
import { MockDataSource } from "@/lib/app-runtime/data-source";
import type { NormalizedComponent } from "@/lib/app-runtime/types";

describe("layouts", () => {
  const dataSource = new MockDataSource();

  const mainComp: NormalizedComponent = {
    id: "main_c1",
    type: "table",
    componentVersion: 1,
    featureId: "erp.materials",
    resource: "materials",
    zone: "main",
    order: 0,
    hidden: false,
  };

  const sideComp: NormalizedComponent = {
    id: "side_c1",
    type: "action",
    componentVersion: 1,
    featureId: "erp.purchase_requests",
    resource: "requests",
    action: "approve",
    zone: "side",
    order: 1,
    hidden: false,
  };

  it("TwoColumnsLayout render container query @container và containerType inline-size", () => {
    const { container } = render(
      <TwoColumnsLayout
        components={[mainComp, sideComp]}
        dataSource={dataSource}
      />
    );

    const layoutContainer = container.querySelector('[data-testid="two-columns-layout"]');
    expect(layoutContainer).toBeDefined();
    expect(layoutContainer?.getAttribute("style")).toContain("container-type: inline-size");
    expect(layoutContainer?.className).toContain("@container");

    const mainZone = container.querySelector('[data-testid="zone-main"]');
    const sideZone = container.querySelector('[data-testid="zone-side"]');
    expect(mainZone).toBeDefined();
    expect(sideZone).toBeDefined();

    // Kiểm tra class grid responsive container query
    expect(mainZone?.className).toContain("@[768px]:col-span-8");
    expect(sideZone?.className).toContain("@[768px]:col-span-4");
  });

  it("hiển thị trạng thái trống khi trang không có component nào", () => {
    render(<SingleLayout components={[]} dataSource={dataSource} />);
    expect(
      screen.getByText("Bạn chưa có quyền xem nội dung trang này")
    ).toBeDefined();

    render(<TwoColumnsLayout components={[]} dataSource={dataSource} />);
    expect(
      screen.getAllByText("Bạn chưa có quyền xem nội dung trang này").length
    ).toBeGreaterThanOrEqual(1);
  });
});
