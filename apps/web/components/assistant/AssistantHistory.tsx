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
import type { AiHistoryItem } from "../../lib/assistant/types";

export interface AssistantHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: AiHistoryItem[];
  selectedId: string | null;
  onSelectHistory: (item: AiHistoryItem) => void;
  onNewChat: () => void;
}

export default function AssistantHistory({
  isOpen,
  onClose,
  historyItems,
  selectedId,
  onSelectHistory,
  onNewChat,
}: AssistantHistoryProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const todayItems = historyItems.filter((i) => i.group === "today");
  const pastItems = historyItems.filter((i) => i.group === "past_7_days");

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
        aria-label="Cuộc trò chuyện"
        className={`assistant-sidebar-left ${isOpen ? "drawer-open" : ""}`}
      >
        <div className="assistant-sidebar-header-mobile">
          <span style={{ fontWeight: 600, fontSize: 14 }}>Lịch sử hội thoại</span>
          <button
            type="button"
            className="assistant-drawer-close"
            onClick={onClose}
            aria-label="Đóng lịch sử"
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

        <button
          type="button"
          className="assistant-btn-new-chat"
          onClick={() => {
            onNewChat();
            if (isOpen) onClose();
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Cuộc trò chuyện mới
        </button>

        <div className="assistant-history-list">
          {todayItems.length > 0 && (
            <div className="assistant-history-group">
              <div className="assistant-history-group-title">HÔM NAY</div>
              {todayItems.map((item) => {
                const isActive = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`assistant-history-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      onSelectHistory(item);
                      if (isOpen) onClose();
                    }}
                  >
                    <div className="assistant-history-item-title">{item.title}</div>
                    <div className="assistant-history-item-sub">
                      {item.appName} · {item.timestamp}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {pastItems.length > 0 && (
            <div className="assistant-history-group">
              <div className="assistant-history-group-title">7 NGÀY TRƯỚC</div>
              {pastItems.map((item) => {
                const isActive = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`assistant-history-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      onSelectHistory(item);
                      if (isOpen) onClose();
                    }}
                  >
                    <div className="assistant-history-item-title">{item.title}</div>
                    <div className="assistant-history-item-sub">
                      {item.appName} · {item.timestamp}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="assistant-history-footer">
          Lịch sử chỉ bạn xem được. Hệ thống không lưu nội dung câu hỏi để huấn luyện.
        </div>
      </aside>
    </>
  );
}
