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

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { formatTransitionToVietnamese } from "../../lib/builder/transitions";
import EditModal from "./EditModal";
import BuilderView from "./BuilderView";
import NormalizeView from "./NormalizeView";
import type { BuilderApplicationDefinitionV1 } from "../../lib/builder/types";

describe("Builder Step 03 & 04 Components", () => {
  it("formatTransitionToVietnamese formats transitions into natural Vietnamese sentences", () => {
    const directTrans = {
      from: "start",
      to: "manager_review",
    };
    expect(formatTransitionToVietnamese(directTrans)).toBe(
      'Từ "start" sang "manager_review" (luôn chuyển tiếp)',
    );

    const conditionalTrans = {
      from: "manager_route",
      to: "accepted",
      when: {
        all: [
          { field: "manager_decision", op: "eq" as const, value: "approved" },
          { field: "estimated_price", op: "lt" as const, value: 20000000 },
        ],
      },
    };
    expect(formatTransitionToVietnamese(conditionalTrans)).toBe(
      "Từ manager_route sang accepted khi manager_decision = approved và estimated_price < 20.000.000",
    );
  });

  it("EditModal enforces min <= max constraint for integer fields", () => {
    render(
      <EditModal
        kind="field"
        allRoles={[]}
        allFields={[]}
        allSteps={[]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const typeSelect = screen.getByLabelText(/Kiểu dữ liệu/);
    fireEvent.change(typeSelect, { target: { value: "integer" } });

    const idInput = screen.getByLabelText(/Mã trường \(ID\)/);
    fireEvent.change(idInput, { target: { value: "amount" } });

    const minInput = screen.getByLabelText(/Giá trị nhỏ nhất/);
    const maxInput = screen.getByLabelText(/Giá trị lớn nhất/);
    fireEvent.change(minInput, { target: { value: "100" } });
    fireEvent.change(maxInput, { target: { value: "50" } });

    const saveBtn = screen.getByText("Lưu thay đổi");
    fireEvent.click(saveBtn);

    expect(
      screen.getByText("Giá trị nhỏ nhất không được lớn hơn giá trị lớn nhất."),
    ).toBeInTheDocument();
  });

  it("BuilderView renders field cards and allows tab switching", () => {
    const sampleDef: BuilderApplicationDefinitionV1 = {
      schemaVersion: "1.0",
      appId: "app-uuid",
      tenantId: "tenant-uuid",
      version: 1,
      name: "Purchase Request",
      roles: ["employee", "manager"],
      fields: [
        { id: "device_name", type: "string", required: true },
        { id: "estimated_price", type: "integer", required: true, min: 1, max: 50000000 },
      ],
      steps: [
        { id: "start", type: "start" },
        { id: "manager_review", type: "task", role: "manager" },
      ],
      transitions: [
        { from: "start", to: "manager_review" },
      ],
    };

    render(
      <BuilderView
        appId="app-uuid"
        tenantId="tenant-uuid"
        version={1}
        initialDefinition={sampleDef}
        initialLockVersion={1}
        initialRevisionNo={1}
      />,
    );

    expect(screen.getByText(/device_name/)).toBeInTheDocument();
    expect(screen.getByText(/estimated_price/)).toBeInTheDocument();

    const rolesTab = screen.getByText(/Vai trò \(2\)/);
    fireEvent.click(rolesTab);

    expect(screen.getByText("employee")).toBeInTheDocument();
    expect(screen.getByText("manager")).toBeInTheDocument();
  });

  it("Point 2: getDraftAction parses top-level sourceMappings and openIssues", async () => {
    const { getDraftAction } = await import("../../lib/builder/actions");
    const mockDraftResponse = {
      definition: {
        schemaVersion: "1.0",
        appId: "00000000-0000-0000-0000-000000000001",
        tenantId: "tenant-1",
        version: 1,
        name: "Test App",
        roles: ["designer"],
        fields: [],
        steps: [],
        transitions: [],
      },
      sourceMappings: [
        {
          targetType: "field",
          targetId: "amount",
          sourceRevisionId: "rev-1",
          segmentIds: ["seg-1"],
        },
      ],
      openIssues: [
        {
          code: "FIELD_ORPHAN",
          message: "Trường chưa dùng",
          blocking: false,
        },
      ],
      lockVersion: 3,
      revisionNo: 5,
    };

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/v1/me")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: { id: "u1", email: "a@b.com", displayName: "A", status: "active" },
              memberships: [
                {
                  id: "m1",
                  status: "active",
                  tenant: { id: "t1", name: "Tenant 1", status: "active" },
                  roles: ["designer"],
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDraftResponse),
      });
    }) as unknown as typeof fetch;

    const res = await getDraftAction("00000000-0000-0000-0000-000000000001", 1);
    expect(res.ok).toBe(true);
    expect(res.data?.sourceMappings).toHaveLength(1);
    expect(res.data?.sourceMappings?.[0].targetId).toBe("amount");
    expect(res.data?.openIssues).toHaveLength(1);
    expect(res.data?.openIssues?.[0].code).toBe("FIELD_ORPHAN");
  });

  it("Point 3: blocks edit and validate step when draft is unnormalized, showing clear notice", async () => {
    const BuilderAppPage = (
      await import("../../app/(workspace)/builder/[appId]/page")
    ).default;

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/v1/me")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: { id: "u1", email: "a@b.com", displayName: "A", status: "active" },
              memberships: [
                {
                  id: "m1",
                  status: "active",
                  tenant: { id: "t1", name: "Tenant 1", status: "active" },
                  roles: ["designer"],
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            definition: {},
            lockVersion: 1,
            revisionNo: 1,
          }),
      });
    }) as unknown as typeof fetch;

    const pageElement = await BuilderAppPage({
      params: Promise.resolve({ appId: "00000000-0000-0000-0000-000000000001" }),
      searchParams: Promise.resolve({ step: "edit" }),
    });

    render(pageElement);

    expect(
      screen.getByText("Bản nháp chưa có nội dung — hãy lưu mô tả và chuẩn hóa trước"),
    ).toBeInTheDocument();
    expect(screen.getByText("← Về bước Mô tả")).toBeInTheDocument();
  });

  it("Point 4: prompts user when navigating to validate with unsaved changes and only proceeds after save", async () => {
    const sampleDef: BuilderApplicationDefinitionV1 = {
      schemaVersion: "1.0",
      appId: "00000000-0000-0000-0000-000000000001",
      tenantId: "tenant-1",
      version: 1,
      name: "Purchase Request",
      roles: ["employee", "manager"],
      fields: [
        { id: "device_name", type: "string", required: true },
      ],
      steps: [
        { id: "start", type: "start" },
      ],
      transitions: [],
    };

    render(
      <BuilderView
        appId="00000000-0000-0000-0000-000000000001"
        tenantId="tenant-1"
        version={1}
        initialDefinition={sampleDef}
        initialLockVersion={1}
        initialRevisionNo={1}
      />,
    );

    // Switch to roles tab and add a role to create unsaved change
    const rolesTab = screen.getByText(/Vai trò \(2\)/);
    fireEvent.click(rolesTab);
    const addRoleBtn = screen.getByRole("button", { name: "+ Thêm vai trò" });
    fireEvent.click(addRoleBtn);

    const input = screen.getByLabelText(/Mã vai trò/i);
    fireEvent.change(input, { target: { value: "lead_role" } });
    fireEvent.click(screen.getByRole("button", { name: "Thêm vai trò" }));

    // Click Validate button
    const validateBtn = screen.getByRole("button", { name: "Kiểm tra quy trình →" });
    fireEvent.click(validateBtn);

    // Prompt modal should appear
    expect(screen.getByText("Thay đổi chưa được lưu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu rồi kiểm tra" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeInTheDocument();

    // Clicking cancel closes the prompt
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(screen.queryByText("Thay đổi chưa được lưu")).not.toBeInTheDocument();
  });

  it("Point 5: publisher can view draft and validate, but edit/save/add buttons are hidden and server rejects update", async () => {
    const sampleDef: BuilderApplicationDefinitionV1 = {
      schemaVersion: "1.0",
      appId: "00000000-0000-0000-0000-000000000001",
      tenantId: "tenant-1",
      version: 1,
      name: "Purchase Request",
      roles: ["employee", "manager"],
      fields: [{ id: "device_name", type: "string", required: true }],
      steps: [{ id: "start", type: "start" }],
      transitions: [],
    };

    render(
      <BuilderView
        appId="00000000-0000-0000-0000-000000000001"
        tenantId="tenant-1"
        version={1}
        initialDefinition={sampleDef}
        initialLockVersion={1}
        initialRevisionNo={1}
        canEdit={false}
      />,
    );

    // Read-only indicator present
    expect(screen.getByText("Chỉ xem (publisher)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lưu bản nháp" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kiểm tra quy trình →" })).toBeInTheDocument();

    // No add or edit buttons in fields
    expect(screen.queryByRole("button", { name: "+ Thêm trường" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sửa" })).not.toBeInTheDocument();

    // Test server block in updateDraftAction
    const { updateDraftAction } = await import("../../lib/builder/actions");
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/v1/me")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: { id: "u2", email: "pub@b.com", displayName: "Pub", status: "active" },
              memberships: [
                {
                  id: "m2",
                  status: "active",
                  tenant: { id: "t1", name: "Tenant 1", status: "active" },
                  roles: ["publisher"],
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as unknown as typeof fetch;

    const updateRes = await updateDraftAction(
      "00000000-0000-0000-0000-000000000001",
      1,
      1,
      sampleDef,
    );
    expect(updateRes.ok).toBe(false);
    expect(updateRes.error?.code).toBe("FORBIDDEN");
  });

  it("Step 03 NormalizeView highlights source segment on click and renders source revision", () => {
    sessionStorage.setItem(
      "ws_source_tenant-1_app-1",
      JSON.stringify({
        revisionNo: 3,
        sourceRevisionId: "rev-id-3",
        segments: [
          { id: "inputs_1", section: "inputs", text: "device_name: string, required" },
          { id: "inputs_2", section: "inputs", text: "estimated_price: integer" },
        ],
      }),
    );
    sessionStorage.setItem(
      "ws_normalize_tenant-1_app-1",
      JSON.stringify({
        revisionNo: 1,
        lockVersion: 2,
        definition: {
          roles: ["employee"],
          fields: [{ id: "device_name", type: "string", required: true }],
          steps: [{ id: "start", type: "start" }],
        },
        sourceMappings: [
          {
            targetType: "field",
            targetId: "device_name",
            sourceRevisionId: "rev-id-3",
            segmentIds: ["inputs_1"],
          },
        ],
        openIssues: [],
      }),
    );

    render(
      <NormalizeView
        appId="app-1"
        tenantId="tenant-1"
        appName="Test App"
        version={1}
      />,
    );

    expect(screen.getByText(/Bản mô tả số 3/)).toBeInTheDocument();
    expect(screen.getByText(/Lần lưu bản nháp 1/)).toBeInTheDocument();
    expect(screen.getByText("device_name: string, required")).toBeInTheDocument();

    // Click on device_name field in right column
    const fieldItem = screen.getByText("device_name *");
    fireEvent.click(fieldItem);

    // The segment should have highlighted class
    const segElement = document.getElementById("source-seg-inputs_1");
    expect(segElement?.className).toContain("highlighted");
  });

  it("Step 04 BuilderView displays segment text in related sources panel, not just ID", () => {
    sessionStorage.setItem(
      "ws_source_tenant-1_app-1",
      JSON.stringify({
        revisionNo: 2,
        segments: [
          { id: "inputs_1", section: "inputs", text: "device_name: string, required" },
        ],
      }),
    );

    const sampleDef: BuilderApplicationDefinitionV1 = {
      schemaVersion: "1.0",
      appId: "app-1",
      tenantId: "tenant-1",
      version: 1,
      name: "Purchase Request",
      roles: ["employee"],
      fields: [{ id: "device_name", type: "string", required: true }],
      steps: [{ id: "start", type: "start" }],
      transitions: [],
    };

    render(
      <BuilderView
        appId="app-1"
        tenantId="tenant-1"
        version={1}
        initialDefinition={sampleDef}
        initialLockVersion={1}
        initialRevisionNo={1}
        initialSourceMappings={[
          {
            targetType: "field",
            targetId: "device_name",
            sourceRevisionId: "rev-1",
            segmentIds: ["inputs_1"],
          },
        ]}
      />,
    );

    expect(screen.getByText(/Bản mô tả số 2/)).toBeInTheDocument();
    expect(screen.getByText(/Lần lưu bản nháp 1/)).toBeInTheDocument();

    // Select the field row
    const row = screen.getByText("device_name *");
    fireEvent.click(row);

    // In panel, the text content should be displayed
    expect(screen.getByText("device_name: string, required")).toBeInTheDocument();
    expect(screen.getByText(/\[INPUTS\] inputs_1/)).toBeInTheDocument();
  });

  it("Step 04 BuilderView shows fallback message when source text is not in session", () => {
    sessionStorage.clear();

    const sampleDef: BuilderApplicationDefinitionV1 = {
      schemaVersion: "1.0",
      appId: "app-2",
      tenantId: "tenant-2",
      version: 1,
      name: "Purchase Request",
      roles: ["employee"],
      fields: [{ id: "amount", type: "integer", required: true }],
      steps: [{ id: "start", type: "start" }],
      transitions: [],
    };

    render(
      <BuilderView
        appId="app-2"
        tenantId="tenant-2"
        version={1}
        initialDefinition={sampleDef}
        initialLockVersion={1}
        initialRevisionNo={1}
        initialSourceMappings={[
          {
            targetType: "field",
            targetId: "amount",
            sourceRevisionId: "rev-1",
            segmentIds: ["inputs_99"],
          },
        ]}
      />,
    );

    expect(screen.getByText(/Chưa lưu bản mô tả/)).toBeInTheDocument();

    // Select the field row
    const row = screen.getByText("amount *");
    fireEvent.click(row);

    expect(
      screen.getByText("Mô tả gốc chỉ xem được trong phiên đã nhập"),
    ).toBeInTheDocument();
  });
});
