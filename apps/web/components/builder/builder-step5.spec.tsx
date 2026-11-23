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

import { describe, it, expect } from "vitest";
import { getValidationMessageVi } from "../../lib/builder/validation-messages";
import type { BuilderApplicationDefinitionV1 } from "../../lib/builder/types";

describe("Builder Step 05 Validation Messages", () => {
  it("translates validation issue codes into clear Vietnamese messages with stepId", () => {
    expect(
      getValidationMessageVi({
        severity: "error",
        code: "TASK_ROLE_REQUIRED",
        stepId: "manager_review",
        path: "steps[1].role",
        message: "Task role is required",
      }),
    ).toBe("Bước 'manager_review' chưa chọn người phụ trách");

    expect(
      getValidationMessageVi({
        severity: "error",
        code: "UNKNOWN_DECISION_FIELD",
        stepId: "manager_review",
        path: "steps[1].decisionField",
        message: "Unknown decision field",
      }),
    ).toBe("Bước 'manager_review': Trường quyết định không tồn tại");

    expect(
      getValidationMessageVi({
        severity: "error",
        code: "INVALID_START_COUNT",
        path: "steps",
        message: "Workflow must have exactly one start step",
      }),
    ).toBe("Quy trình phải có đúng một điểm bắt đầu");
  });

  it("extracts transition target from definition by path and formats natural message", () => {
    const mockDef: BuilderApplicationDefinitionV1 = {
      schemaVersion: "1.0",
      appId: "app-1",
      tenantId: "tenant-1",
      version: 1,
      name: "App 1",
      roles: ["employee", "manager"],
      fields: [],
      steps: [
        { id: "start", type: "start" },
        { id: "manager_review", type: "task" },
      ],
      transitions: [
        { from: "start", to: "manager_review" },
        { from: "manager_review", to: "step2" },
        { from: "step2", to: "step3" },
        { from: "step3", to: "step4" },
        { from: "manager_route", to: "director_review" },
      ],
    };

    expect(
      getValidationMessageVi(
        {
          severity: "error",
          code: "UNKNOWN_TRANSITION_TARGET",
          path: "/transitions/4/to",
          message: "Unknown transition target: director_review",
        },
        mockDef,
      ),
    ).toBe("Nhánh thứ 5 trỏ tới bước 'director_review' chưa khai báo");
  });

  it("formats UNHANDLED_EXCEPTION_NOTE with Vietnamese prefix", () => {
    expect(
      getValidationMessageVi({
        severity: "warning",
        code: "UNHANDLED_EXCEPTION_NOTE",
        message: "UNHANDLED_EXCEPTION_NOTE: Nếu người yêu cầu không có quản lý trực tiếp thì chuyển lên HR.",
      }),
    ).toBe(
      "Ngoại lệ trong mô tả chưa được đưa vào quy trình: Nếu người yêu cầu không có quản lý trực tiếp thì chuyển lên HR.",
    );
  });

  it("falls back to raw message for unrecognized codes", () => {
    expect(
      getValidationMessageVi({
        severity: "error",
        code: "CUSTOM_UNKNOWN_CODE",
        path: "custom.path",
        message: "Thông báo lỗi tùy chỉnh từ backend",
      }),
    ).toBe("Thông báo lỗi tùy chỉnh từ backend");
  });
});
