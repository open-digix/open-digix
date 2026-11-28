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
import Sidebar from "./Sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/apps",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("WEB-UI05: Sidebar Logo & Spin Animation", () => {
  it("renders 2-part logo: 40px mark X without navy background and wordmark image", () => {
    const { container } = render(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={false}
      />
    );

    const brandLink = screen.getByRole("link", { name: "Về danh mục ứng dụng DigiX Lab" });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute("href", "/apps");

    const mark = container.querySelector(".brand-mark");
    expect(mark).toBeInTheDocument();
    expect(mark).toHaveAttribute("viewBox", "106 106 300 300");
    expect(mark).toHaveAttribute("width", "40");
    expect(mark).toHaveAttribute("height", "40");
    expect(mark).toHaveAttribute("aria-hidden", "true");

    // Must NOT have navy rectangle background
    const rect = mark?.querySelector("rect");
    expect(rect).toBeNull();

    // Wordmark
    const wordmark = container.querySelector(".brand-wordmark");
    expect(wordmark).toBeInTheDocument();
    expect(wordmark).toHaveAttribute("aria-hidden", "true");
  });

  it("adds spin class when transitioning from mini to peek", () => {
    const { container, rerender } = render(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={false}
        isPeek={false}
      />
    );

    const mark = container.querySelector(".brand-mark");
    expect(mark).not.toHaveClass("spin");

    // Transition mini -> peek
    rerender(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={false}
        isPeek={true}
      />
    );

    expect(mark).toHaveClass("spin");
  });

  it("adds spin class when transitioning from mini to pinned", () => {
    const { container, rerender } = render(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={false}
        isPeek={false}
      />
    );

    const mark = container.querySelector(".brand-mark");
    expect(mark).not.toHaveClass("spin");

    // Transition mini -> pinned
    rerender(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={true}
        isPeek={false}
      />
    );

    expect(mark).toHaveClass("spin");
  });

  it("does NOT spin when initially rendered in pinned state (page reload when already pinned)", () => {
    const { container } = render(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={true}
        isPeek={false}
      />
    );

    const mark = container.querySelector(".brand-mark");
    expect(mark).not.toHaveClass("spin");
  });

  it("does NOT spin when transitioning between peek and pinned while already expanded", () => {
    const { container, rerender } = render(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={false}
        isPeek={true}
      />
    );

    const mark = container.querySelector(".brand-mark")!;
    // Finish the initial expansion spin
    fireEvent.animationEnd(mark);
    expect(mark).not.toHaveClass("spin");

    // Change peek -> pinned while remaining expanded
    rerender(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={true}
        isPeek={false}
      />
    );

    expect(mark).not.toHaveClass("spin");
  });

  it("removes spin class after animationend event", () => {
    const { container, rerender } = render(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={false}
        isPeek={false}
      />
    );

    rerender(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={false}
        isPeek={true}
      />
    );

    const mark = container.querySelector(".brand-mark")!;
    expect(mark).toHaveClass("spin");

    // Trigger animationend
    fireEvent.animationEnd(mark);

    expect(container.querySelector(".brand-mark")).not.toHaveClass("spin");
  });

  it("spins on mobile when drawer opens (isOpen: false -> true)", () => {
    const { container, rerender } = render(
      <Sidebar
        roles={["employee"]}
        isOpen={false}
        onClose={vi.fn()}
        isPinned={false}
        isPeek={false}
      />
    );

    const mark = container.querySelector(".brand-mark")!;
    expect(mark).not.toHaveClass("spin");

    rerender(
      <Sidebar
        roles={["employee"]}
        isOpen={true}
        onClose={vi.fn()}
        isPinned={false}
        isPeek={false}
      />
    );

    expect(mark).toHaveClass("spin");
  });
});
