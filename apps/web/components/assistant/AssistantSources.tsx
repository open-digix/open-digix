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

import React, { useEffect } from "react";
import Link from "next/link";
import type { AiSource } from "../../lib/assistant/types";

export interface AssistantSourcesProps {
  isOpen: boolean;
  onClose: () => void;
  sources: AiSource[];
  selectedSourceId: string | null;
  onSelectSource: (sourceId: string) => void;
  canManageSources?: boolean;
}

export default function AssistantSources({
  isOpen,
  onClose,
  sources,
  selectedSourceId,
  onSelectSource,
  canManageSources = false,
}: AssistantSourcesProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const activeSources = sources.filter((s) => s.status === "active");
  const scanningSources = sources.filter((s) => s.status === "scanning");

  return (
    <>
      {isOpen && (
        <div
          className="assistant-drawer-scrim"
          aria-hidden="true"
          onClick={onClose}
        />
      )}
      <aside
        aria-label="Nguồn của ứng dụng"
        className={`assistant-sidebar-right ${isOpen ? "drawer-open" : ""}`}
      >
        <div className="assistant-sources-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Nguồn đang dùng</span>
            <span style={{ fontSize: 12, color: "var(--ws-muted)" }}>
              {activeSources.length} nguồn
            </span>
          </div>
          <button
            type="button"
            className="assistant-drawer-close"
            onClick={onClose}
            aria-label="Đóng nguồn"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="assistant-sources-list">
          {activeSources.map((s) => {
            const isSelected = s.id === selectedSourceId;
            const metaParts = [s.type, s.version, s.updatedAt ? `cập nhật ${s.updatedAt}` : ""]
              .filter(Boolean)
              .join(" · ");

            return (
              <button
                key={s.id}
                type="button"
                className={`assistant-source-card ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectSource(s.id)}
                aria-pressed={isSelected}
              >
                <div className="assistant-source-card-title">
                  <strong>{s.number}</strong> {s.name}
                </div>
                {metaParts && (
                  <div className="assistant-source-card-meta">{metaParts}</div>
                )}
                {isSelected && s.snippet && (
                  <div className="assistant-source-card-snippet">
                    {s.snippet}
                  </div>
                )}
              </button>
            );
          })}

          {scanningSources.map((s) => (
            <div key={s.id} className="assistant-source-scanning">
              <strong style={{ color: "var(--ws-warning)" }}>Đang quét:</strong>{" "}
              {s.name}. Chưa dùng để trả lời.
            </div>
          ))}
        </div>

        {canManageSources && (
          <div className="assistant-sources-footer">
            <Link href="/settings" className="assistant-link-manage">
              Quản lý nguồn của ứng dụng →
            </Link>
            <div className="assistant-link-manage-hint">
              Chỉ hiện với người có quyền quản lý nguồn AI của ứng dụng.
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
