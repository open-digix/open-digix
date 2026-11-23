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
import CreateAppForm, { generateAppKey } from "./CreateAppForm";
import SourceEditor, { SAMPLE_SOURCE_SECTIONS } from "./SourceEditor";
import { saveDescriptionsAction } from "../../lib/builder/actions";
import { apiCall } from "../../lib/api/server";
import { saveStoredBuilderApp } from "../../lib/builder/storage";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../lib/api/server", () => ({
  apiCall: vi.fn(),
  getTenantContext: vi.fn().mockResolvedValue({
    roles: ["designer"],
    currentTenant: { id: "tenant-test" },
  }),
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;
    readonly issues?: readonly { path: string; message: string }[];
    constructor(
      status: number,
      code: string,
      message: string,
      details?: unknown,
      issues?: readonly { path: string; message: string }[],
    ) {
      super(message);
      this.status = status;
      this.code = code;
      this.details = details;
      this.issues = issues;
    }
  },
}));

describe("Builder Step 01 & 02 Components", () => {
  it("generateAppKey correctly converts Vietnamese names into valid slugs", () => {
    expect(generateAppKey("Đề nghị mua sắm")).toBe("de-nghi-mua-sam");
    expect(generateAppKey("Đăng ký nghỉ phép năm 2026")).toBe(
      "dang-ky-nghi-phep-nam-2026",
    );
    expect(generateAppKey(" Quy trình IT   ")).toBe("quy-trinh-it");
  });

  it("CreateAppForm auto-generates appKey and fills sample data", () => {
    render(<CreateAppForm tenantId="tenant-test" />);

    const fillButton = screen.getByText("✦ Điền ví dụ (MẪU THỬ)");
    fireEvent.click(fillButton);

    const nameInput = screen.getByLabelText(/Tên ứng dụng \*/) as HTMLInputElement;
    const keyInput = screen.getByLabelText(/Mã ứng dụng \(appKey\) \*/) as HTMLInputElement;

    expect(nameInput.value).toBe("Đề nghị mua sắm");
    expect(keyInput.value).toBe("de-nghi-mua-sam");
  });

  it("CreateAppForm detects invalid appKey starting with number", () => {
    render(<CreateAppForm tenantId="tenant-test" />);

    const keyInput = screen.getByLabelText(/Mã ứng dụng \(appKey\) \*/) as HTMLInputElement;
    fireEvent.change(keyInput, { target: { value: "1invalid-key" } });

    const submitBtn = screen.getByText("Tạo bản nháp & tiếp tục →");
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/Mã ứng dụng phải bắt đầu bằng chữ thường/),
    ).toBeInTheDocument();
  });

  it("SourceEditor renders goal as read-only from stored app and fills only 6 editable sections", () => {
    saveStoredBuilderApp("tenant-test", {
      appId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      appKey: "test-app",
      name: "Test App",
      goal: "Mục tiêu mua sắm ban đầu",
      version: 1,
      createdAt: "2026-11-23",
    });

    render(
      <SourceEditor
        appId="3fa85f64-5717-4562-b3fc-2c963f66afa6"
        tenantId="tenant-test"
        appName="Test App"
        version={1}
      />,
    );

    expect(screen.getByText(/Mục tiêu quy trình/)).toBeInTheDocument();
    expect(
      screen.getByText("(Chỉ đọc từ lúc tạo ứng dụng)"),
    ).toBeInTheDocument();

    const goalArea = screen.getByLabelText(
      /Mục tiêu quy trình/,
    ) as HTMLTextAreaElement;
    expect(goalArea.readOnly).toBe(true);
    expect(goalArea.value).toBe("Mục tiêu mua sắm ban đầu");

    const fillBtn = screen.getByText("✦ Điền ví dụ (MẪU THỬ)");
    fireEvent.click(fillBtn);

    // Goal remains unchanged
    expect(goalArea.value).toBe("Mục tiêu mua sắm ban đầu");

    // The other 6 fields are filled
    const inputsArea = screen.getByLabelText(
      /Dữ liệu đầu vào/,
    ) as HTMLTextAreaElement;
    expect(inputsArea.value).toBe(SAMPLE_SOURCE_SECTIONS.inputs);
  });

  it("SourceEditor blocks saving and shows error if all 6 notes are empty", async () => {
    render(
      <SourceEditor
        appId="3fa85f64-5717-4562-b3fc-2c963f66afa6"
        tenantId="tenant-test"
        appName="Test App"
        version={1}
      />,
    );

    const saveBtn = screen.getByText("Lưu mô tả");
    fireEvent.click(saveBtn);

    expect(
      await screen.findByText(/Cần nhập ít nhất một mục mô tả/),
    ).toBeInTheDocument();
  });

  it("saveDescriptionsAction sends a flat body with only valid notes and fileRefs, omitting goal and sections", async () => {
    const mockApiCall = vi.mocked(apiCall);
    mockApiCall.mockResolvedValueOnce({
      sourceRevisionId: "rev-uuid-1",
      revisionNo: 1,
      segments: [],
    });

    const res = await saveDescriptionsAction(
      "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      {
        goal: "This goal should NOT be sent to descriptions API",
        sections: "This sections key should NOT be sent",
        inputs: "   device_name: string   ",
        roles: "   employee: Nhan vien   ",
        steps: "",
        branches: "   ",
        outputs: "",
        exceptions: "",
      },
    );

    expect(res.ok).toBe(true);
    expect(mockApiCall).toHaveBeenCalledTimes(1);
    const callArgs = mockApiCall.mock.calls[0];
    expect(callArgs[0]).toBe(
      "/v1/apps/3fa85f64-5717-4562-b3fc-2c963f66afa6/descriptions",
    );
    const body = (callArgs[1] as { body: Record<string, unknown> }).body;
    expect(body).toEqual({
      fileRefs: [],
      inputNotes: "device_name: string",
      roleNotes: "employee: Nhan vien",
    });
    expect(body).not.toHaveProperty("goal");
    expect(body).not.toHaveProperty("sections");
    expect(body).not.toHaveProperty("stepNotes");
    expect(body).not.toHaveProperty("branchNotes");
  });

  it("saveDescriptionsAction blocks if all 6 notes are empty", async () => {
    const mockApiCall = vi.mocked(apiCall);
    mockApiCall.mockClear();

    const res = await saveDescriptionsAction(
      "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      {
        goal: "This is a goal but notes are empty",
        inputs: "",
        roles: "   ",
        steps: "",
        branches: "",
        outputs: "",
        exceptions: "",
      },
    );

    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("INVALID_SOURCE_INPUT");
    expect(res.error?.message).toBe("Cần nhập ít nhất một mục mô tả.");
    expect(mockApiCall).not.toHaveBeenCalled();
  });
});
