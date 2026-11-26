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

import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog";

function TestModalHost({ onCancel }: { onCancel: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <ConfirmDialog
      isOpen={true}
      // Truyền inline function mới mỗi lần render lại để giả lập re-render từ component cha
      onClose={() => onCancel()}
      title="Tiêu đề thử nghiệm"
    >
      <div>
        <label>
          <input
            type="checkbox"
            data-testid="test-checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          Chọn chức năng
        </label>
        <button type="button" data-autofocus="true" data-testid="autofocus-btn">
          Nút xác nhận
        </button>
      </div>
    </ConfirmDialog>
  );
}

describe("ConfirmDialog WCAG 2.1 Focus & Re-render Tests", () => {
  it("khi checkbox re-render component cha, focus vẫn ở checkbox (không bị kéo về nút autofocus)", async () => {
    const handleClose = vi.fn();
    render(<TestModalHost onCancel={handleClose} />);

    // Đợi autofocus lần đầu thiết lập
    await waitFor(() => {
      const btn = screen.getByTestId("autofocus-btn");
      expect(document.activeElement).toBe(btn);
    });

    const checkbox = screen.getByTestId<HTMLInputElement>("test-checkbox");

    // Người dùng Tab sang checkbox và bấm Space (kích hoạt onChange & re-render)
    checkbox.focus();
    expect(document.activeElement).toBe(checkbox);

    // Kích hoạt click / Space toggle
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    // Sau khi re-render với inline onClose mới, focus PHẢI VẪN Ở CHECKBOX
    // Không bị timer kéo về autofocus-btn
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(checkbox);
  });

  it("phím Escape kích hoạt onClose", () => {
    const handleClose = vi.fn();
    render(
      <ConfirmDialog isOpen={true} onClose={handleClose} title="Hộp thoại">
        <div>Nội dung</div>
      </ConfirmDialog>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
