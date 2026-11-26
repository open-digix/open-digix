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
import { render, screen } from "@testing-library/react";
import LogoutButton from "./LogoutButton";

describe("LogoutButton component", () => {
  it("renders a form with POST method and /api/auth/keycloak-logout action", () => {
    const { container } = render(<LogoutButton />);

    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/auth/keycloak-logout");

    const button = screen.getByRole("button", { name: "Đăng xuất" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("applies custom className to the button when provided", () => {
    render(<LogoutButton className="custom-logout-btn" />);

    const button = screen.getByRole("button", { name: "Đăng xuất" });
    expect(button).toHaveClass("custom-logout-btn");
  });
});
