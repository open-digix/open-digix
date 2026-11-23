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
    }) as any;

    const res = await getDraftAction("00000000-0000-0000-0000-000000000001", 1);
    expect(res.ok).toBe(true);
    expect(res.data?.sourceMappings).toHaveLength(1);
    expect(res.data?.sourceMappings?.[0].targetId).toBe("amount");
    expect(res.data?.openIssues).toHaveLength(1);
    expect(res.data?.openIssues?.[0].code).toBe("FIELD_ORPHAN");
  });
});
