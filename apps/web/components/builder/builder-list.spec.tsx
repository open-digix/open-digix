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
import { saveStoredBuilderApp } from "../../lib/builder/storage";
import { isValidUUID, isValidVersion } from "../../lib/builder/types";

describe("Builder App List & RBAC", () => {
  const tenantId = "tenant-test-uuid";

  beforeEach(() => {
    localStorage.clear();
  });

  it("validates UUID and positive integer versions correctly", () => {
    expect(isValidUUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(true);
    expect(isValidUUID("invalid-uuid-string")).toBe(false);

    expect(isValidVersion(1)).toBe(true);
    expect(isValidVersion(2)).toBe(true);
    expect(isValidVersion(0)).toBe(false);
    expect(isValidVersion(-1)).toBe(false);
    expect(isValidVersion("1")).toBe(false);
  });

  it("renders empty state when no apps are stored for tenant", () => {
    render(<BuilderAppList tenantId={tenantId} canEdit={true} />);

    expect(
      screen.getByText("Chưa có ứng dụng quy trình nào"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tạo ứng dụng ngay")).toBeInTheDocument();
  });

  it("renders stored apps from localStorage", () => {
    saveStoredBuilderApp(tenantId, {
      appId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      appKey: "purchase-request",
      name: "Đề nghị mua sắm laptop",
      version: 1,
      createdAt: "23/11/2026",
    });

    render(<BuilderAppList tenantId={tenantId} canEdit={true} />);

    expect(
      screen.getByText("Đề nghị mua sắm laptop"),
    ).toBeInTheDocument();
    expect(screen.getByText("purchase-request")).toBeInTheDocument();
    expect(screen.getByText("Tiếp tục thiết kế →")).toBeInTheDocument();
  });
});
