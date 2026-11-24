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

import { useState, useEffect, useRef } from "react";
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
  const [isPinned, setIsPinned] = useState(false);
  const [isPeek, setIsPeek] = useState(false);
  const [tip, setTip] = useState<{ text: string; top: number; left: number } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("digix_sidebar_pinned");
        if (saved === "true") {
          setIsPinned(true);
        }
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  const handleTogglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("digix_sidebar_pinned", String(next));
      } catch {
        // ignore
      }
      return next;
    });
    setIsPeek(false);
    setTip(null);
  };

  const handleSidebarMouseEnter = () => {
    if (isPinned) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsPeek(true);
      setTip(null);
    }, 120);
  };

  const handleSidebarMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (!isPinned) {
      setIsPeek(false);
    }
    setTip(null);
  };

  const handleSidebarFocusIn = () => {
    if (!isPinned) {
      setIsPeek(true);
      setTip(null);
    }
  };

  const handleSidebarFocusOut = (e: React.FocusEvent<HTMLElement>) => {
    const sidebarEl = document.getElementById("sidebar");
    if (sidebarEl && !sidebarEl.contains(e.relatedTarget as Node) && !isPinned) {
      setIsPeek(false);
    }
    setTip(null);
  };

  const handleShowTip = (text: string, target: HTMLElement) => {
    if (isPinned || isPeek) return;
    const r = target.getBoundingClientRect();
    setTip({
      text,
      left: r.right + 10,
      top: r.top + r.height / 2 - 14,
    });
  };

  const handleHideTip = () => {
    setTip(null);
  };

  const modeClass = isPinned ? "pinned" : isPeek ? "peek" : "mini";

  return (
    <div className={`ws-root app-shell ${modeClass}`}>
      <Sidebar
        roles={roles}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isPinned={isPinned}
        isPeek={isPeek}
        onTogglePin={handleTogglePin}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        onFocusIn={handleSidebarFocusIn}
        onFocusOut={handleSidebarFocusOut}
        onShowTip={handleShowTip}
        onHideTip={handleHideTip}
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

      {tip && (
        <div
          className="tip on"
          id="tip"
          role="tooltip"
          style={{ left: `${tip.left}px`, top: `${tip.top}px` }}
        >
          {tip.text}
        </div>
      )}

      <div id="modal-root" />
      <div id="toast-root" role="status" aria-live="polite" />
    </div>
  );
}
