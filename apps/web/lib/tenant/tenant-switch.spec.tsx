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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  setUnsavedChanges,
  hasUnsavedChanges,
  confirmDiscardChanges,
  resetUnsavedChanges,
} from "./useUnsavedChangesGuard";
import {
  clearClientTenantData,
  getTenantAbortSignal,
} from "./tenant-switch";
import TenantSelect from "../../components/workspace/TenantSelect";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("./actions", () => ({
  selectTenantAction: vi.fn(),
}));

describe("Safe Tenant Switching (WEB-F00)", () => {
  beforeEach(() => {
    resetUnsavedChanges();
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("tracks unsaved changes state accurately", () => {
    expect(hasUnsavedChanges()).toBe(false);
    setUnsavedChanges(true);
    expect(hasUnsavedChanges()).toBe(true);
    setUnsavedChanges(false);
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("prompts confirmation when dirty, returns false if user cancels", () => {
    setUnsavedChanges(true);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    const allowed = confirmDiscardChanges("Rời đi?");
    expect(confirmSpy).toHaveBeenCalledWith("Rời đi?");
    expect(allowed).toBe(false);
    expect(hasUnsavedChanges()).toBe(true);
  });

  it("clears dirty state when user confirms discard", () => {
    setUnsavedChanges(true);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const allowed = confirmDiscardChanges("Rời đi?");
    expect(confirmSpy).toHaveBeenCalledWith("Rời đi?");
    expect(allowed).toBe(true);
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("clearClientTenantData aborts ongoing requests, clears storage filters, dispatches event and preserves DOM", () => {
    const signal = getTenantAbortSignal();
    expect(signal.aborted).toBe(false);

    // Create a mock DOM node to verify DOM nodes are preserved
    const testNode = document.createElement("div");
    testNode.id = "test-tenant-dom-node";
    testNode.textContent = "Tenant content";
    document.body.appendChild(testNode);

    // Spy on digix:context-switched event
    const eventSpy = vi.fn();
    window.addEventListener("digix:context-switched", eventSpy);

    sessionStorage.setItem("filter_status", "pending");
    sessionStorage.setItem("table_page", "2");
    sessionStorage.setItem("other_key", "keep-me");
    localStorage.setItem("filter_draft", "active");

    clearClientTenantData();

    expect(signal.aborted).toBe(true);
    expect(sessionStorage.getItem("filter_status")).toBeNull();
    expect(sessionStorage.getItem("table_page")).toBeNull();
    expect(sessionStorage.getItem("other_key")).toBe("keep-me");
    expect(localStorage.getItem("filter_draft")).toBeNull();

    // Verifies custom event dispatch
    expect(eventSpy).toHaveBeenCalledTimes(1);
    const customEvent = eventSpy.mock.calls[0][0] as CustomEvent;
    expect(customEvent.detail).toEqual({ kind: "tenant" });

    // Verifies DOM element is preserved (not removed)
    expect(document.getElementById("test-tenant-dom-node")).toBe(testNode);

    // Cleanup
    testNode.remove();
    window.removeEventListener("digix:context-switched", eventSpy);
  });

  it("TenantSelect prompts confirmation when dirty before switching tenant", async () => {
    const { selectTenantAction } = await import("./actions");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    setUnsavedChanges(true);

    const activeMemberships = [
      {
        id: "m1",
        roles: ["admin"],
        status: "active" as const,
        tenant: {
          id: "t1",
          slug: "tenant-a",
          name: "Doanh nghiệp A",
          status: "active" as const,
        },
      },
      {
        id: "m2",
        roles: ["member"],
        status: "active" as const,
        tenant: {
          id: "t2",
          slug: "tenant-b",
          name: "Doanh nghiệp B",
          status: "active" as const,
        },
      },
    ];

    render(
      <TenantSelect
        activeMemberships={activeMemberships}
        currentTenantId="t1"
      />,
    );

    const select = screen.getByLabelText("Chọn doanh nghiệp");
    fireEvent.change(select, { target: { value: "t2" } });

    expect(confirmSpy).toHaveBeenCalled();
    // Because user cancelled, action was NOT triggered
    expect(selectTenantAction).not.toHaveBeenCalled();
  });

  it("TenantSelect switches tenant and clears data when user confirms", async () => {
    const { selectTenantAction } = await import("./actions");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    setUnsavedChanges(true);
    sessionStorage.setItem("filter_search", "old-query");

    const activeMemberships = [
      {
        id: "m1",
        roles: ["admin"],
        status: "active" as const,
        tenant: {
          id: "t1",
          slug: "tenant-a",
          name: "Doanh nghiệp A",
          status: "active" as const,
        },
      },
      {
        id: "m2",
        roles: ["member"],
        status: "active" as const,
        tenant: {
          id: "t2",
          slug: "tenant-b",
          name: "Doanh nghiệp B",
          status: "active" as const,
        },
      },
    ];

    render(
      <TenantSelect
        activeMemberships={activeMemberships}
        currentTenantId="t1"
      />,
    );

    const select = screen.getByLabelText("Chọn doanh nghiệp");
    fireEvent.change(select, { target: { value: "t2" } });

    expect(selectTenantAction).toHaveBeenCalledWith("t2");
    expect(sessionStorage.getItem("filter_search")).toBeNull();
    expect(hasUnsavedChanges()).toBe(false);
  });
});
