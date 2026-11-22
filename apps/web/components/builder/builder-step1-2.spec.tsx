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

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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

  it("SourceEditor renders 7 sections and fills sample data", () => {
    render(
      <SourceEditor
        appId="3fa85f64-5717-4562-b3fc-2c963f66afa6"
        tenantId="tenant-test"
        appName="Test App"
        version={1}
      />,
    );

    expect(screen.getByText("Mục tiêu quy trình *")).toBeInTheDocument();
    expect(
      screen.getByText("Dữ liệu đầu vào (inputs)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Vai trò tham gia (roles)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Các bước xử lý (steps)")).toBeInTheDocument();
    expect(
      screen.getByText("Rẽ nhánh & điều kiện (branches)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Kết quả đầu ra (outputs)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ngoại lệ & lưu ý (exceptions)"),
    ).toBeInTheDocument();

    const fillBtn = screen.getByText("✦ Điền ví dụ (MẪU THỬ)");
    fireEvent.click(fillBtn);

    const goalArea = screen.getByLabelText(/Mục tiêu quy trình \*/) as HTMLTextAreaElement;
    expect(goalArea.value).toBe(SAMPLE_SOURCE_SECTIONS.goal);
  });
});
