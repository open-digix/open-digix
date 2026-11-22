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

"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import type { MeMembership, MeUser } from "../../lib/tenant/types";

interface AppShellProps {
  user: MeUser;
  activeMemberships: MeMembership[];
  currentTenantId: string | null;
  roles: string[];
  children: React.ReactNode;
}

export default function AppShell({
  user,
  activeMemberships,
  currentTenantId,
  roles,
  children,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  return (
    <div className="ws-root app-shell">
      <Sidebar
        roles={roles}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div
        className="sidebar-scrim"
        id="sidebar-scrim"
        hidden={!isSidebarOpen}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className="main-column">
        <Topbar
          user={user}
          activeMemberships={activeMemberships}
          currentTenantId={currentTenantId}
          roles={roles}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      <div id="modal-root" />
      <div id="toast-root" role="status" aria-live="polite" />
    </div>
  );
}
