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
import { render, screen, fireEvent } from "@testing-library/react";
import XemMauPage from "./page";

describe("XemMauPage", () => {
  it("render thanh điều khiển xem mẫu, dropdown chọn fixture và vai trò", () => {
    render(<XemMauPage />);

    expect(screen.getByText("Xem mẫu giao diện App v2.5")).toBeDefined();
    expect(screen.getByLabelText("Chọn mẫu thử")).toBeDefined();
    expect(screen.getByLabelText("Chọn vai trò người dùng")).toBeDefined();
    expect(screen.getByRole("button", { name: /1280px/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /375px/i })).toBeDefined();
  });

  it("thay đổi fixture khi chọn từ dropdown", () => {
    render(<XemMauPage />);

    const fixtureSelect = screen.getByLabelText("Chọn mẫu thử");
    fireEvent.change(fixtureSelect, { target: { value: "crm-a" } });

    // Tên app đổi thành Khách hàng của đội kinh doanh
    expect(screen.getByText("Khách hàng của đội kinh doanh")).toBeDefined();
  });

  it("chuyển đổi viewport giữa 1280px và 375px", () => {
    render(<XemMauPage />);

    const phoneBtn = screen.getByRole("button", { name: /375px/i });
    fireEvent.click(phoneBtn);

    const appRoot = screen.getByTestId("app-renderer-root");
    expect(appRoot.getAttribute("data-viewport")).toBe("375");
  });
});
