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
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeSelector from "./ThemeSelector";
import { THEME_COOKIE_NAME } from "../../lib/theme";

describe("ThemeSelector", () => {
  beforeEach(() => {
    document.cookie = `${THEME_COOKIE_NAME}=; Path=/; Max-Age=0`;
    document.documentElement.setAttribute("data-theme", "system");
  });

  it("renders radiogroup with light, dark, and system options", () => {
    render(<ThemeSelector />);

    const group = screen.getByRole("radiogroup", { name: /giao diện/i });
    expect(group).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);

    expect(screen.getByRole("radio", { name: /sáng/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /tối/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /hệ thống/i })).toBeInTheDocument();
  });

  it("selects theme on click and updates cookie and document data-theme", () => {
    render(<ThemeSelector />);

    const darkRadio = screen.getByRole("radio", { name: /tối/i });
    fireEvent.click(darkRadio);

    expect(darkRadio).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.cookie).toContain(`${THEME_COOKIE_NAME}=dark`);
  });

  it("navigates options via keyboard arrows and selects with space", () => {
    render(<ThemeSelector />);

    const lightRadio = screen.getByRole("radio", { name: /sáng/i });
    const darkRadio = screen.getByRole("radio", { name: /tối/i });

    lightRadio.focus();
    fireEvent.keyDown(lightRadio, { key: "ArrowRight" });

    expect(darkRadio).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    fireEvent.keyDown(darkRadio, { key: " " });
    expect(darkRadio).toHaveAttribute("aria-checked", "true");
  });
});
