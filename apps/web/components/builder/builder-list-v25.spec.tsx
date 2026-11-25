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

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BuilderAppList from "./BuilderAppList";
import type { AppSummary } from "../../lib/app-config/types";

describe("BuilderAppList Component (v2.5 & legacy v1)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleV25Apps: AppSummary[] = [
    {
      appId: "app-v25-1",
      appKey: "erp_v25",
      name: "ERP Vật tư v2.5",
      schemaVersion: "2.5",
      startingPoint: "erp",
      version: 1,
      status: "draft",
      updatedAt: new Date().toISOString(),
      featureCount: 3,
    },
    {
      appId: "app-v25-2",
      appKey: "crm_v25",
      name: "CRM Khách hàng v2.5",
      schemaVersion: "2.5",
      startingPoint: "crm",
      version: 1,
      status: "draft",
      updatedAt: new Date().toISOString(),
      featureCount: 2,
    },
  ];

  it("renders v2.5 apps list from server props without depending on localStorage as primary source", () => {
    render(
      <BuilderAppList
        tenantId="t1"
        canEdit={true}
        apps={sampleV25Apps}
        isMockMode={true}
      />,
    );

    expect(screen.getByText("ERP Vật tư v2.5")).toBeInTheDocument();
    expect(screen.getByText("CRM Khách hàng v2.5")).toBeInTheDocument();
    expect(screen.getByText(/MẪU THỬ/)).toBeInTheDocument();
  });

  it("renders legacy v1 apps from localStorage in a separate read-only section", () => {
    // Save a legacy v1 app in localStorage
    localStorage.setItem(
      "ws_builder_apps_t1",
      JSON.stringify([
        {
          appId: "app-v1-legacy",
          appKey: "quy_trinh_v1",
          name: "Quy trình phê duyệt v1 cũ",
          version: 1,
          createdAt: "2026-11-20",
        },
      ]),
    );

    render(
      <BuilderAppList
        tenantId="t1"
        canEdit={true}
        apps={sampleV25Apps}
        isMockMode={true}
      />,
    );

    // v2.5 apps are rendered in main grid
    expect(screen.getByText("ERP Vật tư v2.5")).toBeInTheDocument();

    // v1 app is rendered in separate section with badge
    expect(
      screen.getByRole("heading", { name: "Quy trình v1 (lưu trên trình duyệt này)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Quy trình phê duyệt v1 cũ")).toBeInTheDocument();
    expect(screen.getByText("Tiếp tục thiết kế →")).toBeInTheDocument();
  });

  it("suppresses local v1 section when suppressLocalV1 prop is true (e.g. in api mode when server returns all apps)", () => {
    localStorage.setItem(
      "ws_builder_apps_t1",
      JSON.stringify([
        {
          appId: "app-v1-legacy",
          appKey: "quy_trinh_v1",
          name: "Quy trình phê duyệt v1 cũ",
          version: 1,
          createdAt: "2026-11-20",
        },
      ]),
    );

    render(
      <BuilderAppList
        tenantId="t1"
        canEdit={true}
        apps={sampleV25Apps}
        isMockMode={false}
        suppressLocalV1={true}
      />,
    );

    expect(screen.getByText("ERP Vật tư v2.5")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Quy trình v1 (lưu trên trình duyệt này)" }),
    ).not.toBeInTheDocument();
  });

  it("renders empty state when no v2.5 apps and no local v1 apps", () => {
    render(
      <BuilderAppList
        tenantId="t1"
        canEdit={true}
        apps={[]}
        isMockMode={true}
      />,
    );

    expect(screen.getByText("Chưa có ứng dụng quy trình nào")).toBeInTheDocument();
  });
});
