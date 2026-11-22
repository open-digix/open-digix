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
import type { BuilderApplicationDefinitionV1 } from "../../../../apps/api/src/builder/builder.types";

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
});
