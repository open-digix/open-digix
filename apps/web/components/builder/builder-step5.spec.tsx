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

describe("Builder Step 05 Validation Messages", () => {
  it("translates validation issue codes into clear Vietnamese messages", () => {
    expect(
      getValidationMessageVi({
        severity: "error",
        code: "TASK_ROLE_REQUIRED",
        stepId: "manager_review",
        path: "steps[1].role",
        message: "Task role is required",
      }),
    ).toBe('Bước "manager_review": Bước xử lý chưa chọn người phụ trách');

    expect(
      getValidationMessageVi({
        severity: "error",
        code: "UNKNOWN_DECISION_FIELD",
        stepId: "manager_review",
        path: "steps[1].decisionField",
        message: "Unknown decision field",
      }),
    ).toBe('Bước "manager_review": Trường quyết định không tồn tại');

    expect(
      getValidationMessageVi({
        severity: "error",
        code: "INVALID_START_COUNT",
        path: "steps",
        message: "Workflow must have exactly one start step",
      }),
    ).toBe("Quy trình phải có đúng một điểm bắt đầu (steps)");
  });

  it("falls back to raw message for unrecognized codes", () => {
    expect(
      getValidationMessageVi({
        severity: "error",
        code: "CUSTOM_UNKNOWN_CODE",
        path: "custom.path",
        message: "Thông báo lỗi tùy chỉnh từ backend",
      }),
    ).toBe("Thông báo lỗi tùy chỉnh từ backend (custom.path)");
  });
});
