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

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AssistantHistory from "./AssistantHistory";
import AssistantSources from "./AssistantSources";
import ConfirmDialog from "../common/ConfirmDialog";
import {
  ask,
  listSources,
  isMockUnavailable,
  setMockUnavailable,
  MOCK_APPS,
  MOCK_INITIAL_HISTORY,
} from "../../lib/assistant/client";
import type {
  AiAppOption,
  AiSource,
  AiHistoryItem,
  AiChatMessage,
} from "../../lib/assistant/types";

export interface AssistantViewProps {
  initialApps?: AiAppOption[];
  initialHistory?: AiHistoryItem[];
  userName?: string;
  canManageSources?: boolean;
}

export default function AssistantView({
  initialApps = MOCK_APPS,
  initialHistory = MOCK_INITIAL_HISTORY,
  userName = "Dung",
  canManageSources = true,
}: AssistantViewProps) {
  const [apps] = useState<AiAppOption[]>(initialApps);
  const [currentAppId, setCurrentAppId] = useState<string>(
    initialApps[0]?.id || "app-erp"
  );
  const [sources, setSources] = useState<AiSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>("src-1");
  const [history] = useState<AiHistoryItem[]>(initialHistory);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>("hist-1");

  // Initial demo conversation matching 1-dang-tro-chuyen.html
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "msg-1",
      role: "user",
      question: "Yêu cầu mua vật tư trên 50 triệu cần những ai duyệt?",
    },
    {
      id: "msg-2",
      role: "assistant",
      status: "answered",
      answerIntro:
        "Với ứng dụng Mua sắm – Kho, yêu cầu mua có tổng giá trị trên 50.000.000 đ cần qua hai bước duyệt:",
      items: [
        {
          text: "Trưởng bộ phận đề xuất duyệt nhu cầu và số lượng.",
          citeNum: 1,
        },
        {
          text: "Kế toán trưởng duyệt ngân sách trước khi chuyển kho.",
          citeNum: 1,
        },
        {
          text: "Người tạo yêu cầu không được tự duyệt yêu cầu của chính mình.",
          citeNum: 2,
        },
      ],
      citations: [
        {
          sourceId: "src-1",
          number: 1,
          title: "Quy chế mua sắm nội bộ",
          location: "mục 4.2",
          snippet:
            "Mục 4.2: Yêu cầu trên 50.000.000 đ do trưởng bộ phận và kế toán trưởng lần lượt duyệt. (Nội dung MẪU THỬ)",
        },
        {
          sourceId: "src-2",
          number: 2,
          title: "Cấu hình ứng dụng",
          location: "bản v1.2",
        },
      ],
    },
    {
      id: "msg-3",
      role: "user",
      question: "Kiểm kê cuối năm làm vào ngày nào?",
    },
    {
      id: "msg-4",
      role: "assistant",
      status: "no_evidence",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(isMockUnavailable());

  // Drawer states
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isSourcesDrawerOpen, setIsSourcesDrawerOpen] = useState(false);

  // App switch confirmation
  const [pendingSwitchAppId, setPendingSwitchAppId] = useState<string | null>(null);
  const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);

  // Copy feedback tracking
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Abort controller for streaming/cancelling
  const abortRef = useRef<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load apps & sources on mount or app change
  useEffect(() => {
    let mounted = true;
    listSources(currentAppId).then((res) => {
      if (mounted) {
        setSources(res);
        setSelectedSourceId((prev) => (prev ? prev : res[0]?.id || null));
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentAppId]);

  const currentApp = apps.find((a) => a.id === currentAppId) || apps[0];

  const handleSelectHistory = (item: AiHistoryItem) => {
    setSelectedHistoryId(item.id);
    if (item.appId !== currentAppId) {
      setCurrentAppId(item.appId);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSelectedHistoryId(null);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleAppChangeRequest = (newAppId: string) => {
    if (newAppId === currentAppId) return;

    if (messages.length > 0) {
      setPendingSwitchAppId(newAppId);
      setIsSwitchConfirmOpen(true);
    } else {
      executeAppSwitch(newAppId);
    }
  };

  const executeAppSwitch = (newAppId: string) => {
    setCurrentAppId(newAppId);
    setMessages([]);
    setSelectedHistoryId(null);
    setSelectedSourceId(null);
    setInput("");
    setIsSwitchConfirmOpen(false);
    setPendingSwitchAppId(null);
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading || isUnavailable) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        question: textToSend,
      },
    ]);

    setIsLoading(true);
    abortRef.current = false;

    try {
      const res = await ask(currentAppId, textToSend);

      if (abortRef.current) {
        return;
      }

      if (res.status === "unavailable") {
        setIsUnavailable(true);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            status: "unavailable",
          },
        ]);
      } else if (res.status === "no_evidence") {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            status: "no_evidence",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            status: "answered",
            answerIntro: res.answerIntro,
            items: res.items,
            citations: res.citations,
          },
        ]);
      }
    } catch {
      if (!abortRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            status: "unavailable",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-expand textarea from 2 to 6 rows
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleCopyMessage = (msg: AiChatMessage) => {
    let textToCopy = "";
    if (msg.answerIntro) {
      textToCopy += msg.answerIntro + "\n";
    }
    if (msg.items) {
      msg.items.forEach((it, idx) => {
        textToCopy += `${idx + 1}. ${it.text}\n`;
      });
    }
    if (msg.citations && msg.citations.length > 0) {
      textToCopy +=
        "Nguồn: " +
        msg.citations.map((c) => `${c.number} ${c.title}`).join(", ");
    }

    navigator.clipboard?.writeText(textToCopy.trim()).catch(() => {
      // fallback
    });

    setCopiedMsgId(msg.id);
    setTimeout(() => {
      setCopiedMsgId(null);
    }, 2000);
  };

  const handleFeedback = (msgId: string, type: "helpful" | "incorrect") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: type } : m))
    );
  };

  const handleCiteClick = (num: number) => {
    const found = sources.find((s) => s.number === num);
    if (found) {
      setSelectedSourceId(found.id);
      setIsSourcesDrawerOpen(true);
    }
  };

  const handleRetryUnavailable = () => {
    setMockUnavailable(false);
    setIsUnavailable(false);
  };

  const activeSourcesCount = sources.filter((s) => s.status === "active").length;

  return (
    <div className="assistant-view">
      {/* Cột trái: Lịch sử */}
      <AssistantHistory
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        historyItems={history}
        selectedId={selectedHistoryId}
        onSelectHistory={handleSelectHistory}
        onNewChat={handleNewChat}
      />

      {/* Cột giữa: Khung trò chuyện */}
      <main className="assistant-center">
        {/* Header cột giữa */}
        <div className="assistant-center-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className="assistant-btn-drawer-trigger assistant-history-trigger"
              onClick={() => setIsHistoryDrawerOpen(true)}
              aria-label="Mở lịch sử cuộc trò chuyện"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                aria-hidden="true"
              >
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Lịch sử</span>
            </button>
            <div>
              <div className="assistant-center-title">Trợ lý AI</div>
              <div className="assistant-center-subtitle">
                Trả lời từ nguồn quản trị đã chọn cho ứng dụng. Không tự thực hiện thao tác.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label className="assistant-app-select-label">
              <span>Hỏi trong ứng dụng</span>
              <select
                className="assistant-app-select"
                value={currentAppId}
                onChange={(e) => handleAppChangeRequest(e.target.value)}
                aria-label="Hỏi trong ứng dụng"
              >
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </label>

            {currentApp?.hasSources && (
              <button
                type="button"
                className="assistant-btn-drawer-trigger assistant-sources-trigger"
                onClick={() => setIsSourcesDrawerOpen(true)}
                aria-label={`Xem ${activeSourcesCount} nguồn`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  aria-hidden="true"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
                </svg>
                <span>Nguồn ({activeSourcesCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Nội dung vùng tin nhắn */}
        <div
          className="assistant-center-messages"
          role="region"
          aria-label="Vùng tin nhắn trò chuyện"
        >
          <div
            className="assistant-messages-inner"
            aria-live="polite"
            aria-atomic="false"
          >
            {/* TRẠNG THÁI C: Ứng dụng chưa có nguồn */}
            {!currentApp?.hasSources ? (
              <div className="assistant-state-box assistant-no-sources-box">
                <div
                  className="assistant-state-icon yellow"
                  aria-hidden="true"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                    <path d="M14 3v5h5" />
                  </svg>
                </div>
                <h2 className="assistant-state-title">
                  Ứng dụng này chưa có nguồn cho trợ lý
                </h2>
                <p className="assistant-state-desc">
                  Trợ lý chỉ trả lời từ tài liệu được quản trị viên chọn, nên hiện chưa
                  hỏi được trong <strong>{currentApp?.name}</strong>.
                </p>

                <div className="assistant-no-sources-cards">
                  <div className="assistant-card-panel">
                    <div className="assistant-card-panel-title">
                      Nếu bạn là quản trị viên ứng dụng
                    </div>
                    <Link
                      href="/settings"
                      className="assistant-btn-primary"
                    >
                      Chọn nguồn cho trợ lý
                    </Link>
                  </div>

                  <div className="assistant-card-panel">
                    <div className="assistant-card-panel-title">Nếu không</div>
                    <div className="assistant-card-panel-desc">
                      Chuyển sang ứng dụng khác ở ô “Hỏi trong ứng dụng”, hoặc báo quản
                      trị viên.
                    </div>
                  </div>
                </div>
              </div>
            ) : isUnavailable ? (
              /* TRẠNG THÁI B: Trợ lý đang tạm tắt */
              <div className="assistant-state-box">
                <div
                  role="status"
                  className="assistant-unavailable-banner"
                >
                  <div
                    className="assistant-unavailable-icon"
                    aria-hidden="true"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v6M12 16v.5" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      Trợ lý AI đang tạm ngừng
                    </div>
                    <div
                      style={{
                        color: "var(--ws-muted)",
                        marginTop: 4,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      Các ứng dụng, việc cần duyệt và hồ sơ vẫn dùng bình thường. Bạn
                      có thể thử lại sau ít phút.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  <button
                    type="button"
                    className="assistant-btn-primary"
                    onClick={handleRetryUnavailable}
                  >
                    Thử lại
                  </button>
                  <Link
                    href="/tasks"
                    className="assistant-btn-secondary"
                  >
                    Về việc của tôi
                  </Link>
                </div>
                <p
                  style={{
                    margin: "16px 0 0",
                    fontSize: 12,
                    color: "var(--ws-muted)",
                  }}
                >
                  Ứng với trạng thái <code>unavailable</code> từ máy chủ. Ô nhập khóa
                  lại, lịch sử cũ vẫn xem được.
                </p>
              </div>
            ) : messages.length === 0 ? (
              /* TRẠNG THÁI A: Màn bắt đầu */
              <div className="assistant-state-box assistant-start-screen">
                <div
                  className="assistant-state-icon teal"
                  aria-hidden="true"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4z" />
                  </svg>
                </div>
                <h2 className="assistant-state-title">
                  Chào {userName}, bạn cần hỏi gì?
                </h2>
                <p className="assistant-state-desc">
                  Đang hỏi trong <strong>{currentApp?.name}</strong>. Trợ lý dùng{" "}
                  {activeSourcesCount} nguồn quản trị viên đã chọn và luôn ghi rõ
                  nguồn.
                </p>

                <div className="assistant-start-suggestions">
                  <button
                    type="button"
                    className="assistant-start-suggestion-btn"
                    onClick={() => handleSend("Yêu cầu mua trên 50 triệu cần ai duyệt?")}
                  >
                    Yêu cầu mua trên 50 triệu cần ai duyệt?
                  </button>
                  <button
                    type="button"
                    className="assistant-start-suggestion-btn"
                    onClick={() =>
                      handleSend("Khi nào được nhập kho một yêu cầu mua?")
                    }
                  >
                    Khi nào được nhập kho một yêu cầu mua?
                  </button>
                  <button
                    type="button"
                    className="assistant-start-suggestion-btn"
                    onClick={() => handleSend("Tồn kho được tính như thế nào?")}
                  >
                    Tồn kho được tính như thế nào?
                  </button>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "var(--ws-muted)",
                    textAlign: "center",
                  }}
                >
                  Câu gợi ý lấy từ nguồn của ứng dụng, bấm vào là gửi đúng câu đó.
                </p>
              </div>
            ) : (
              /* ĐANG TRÒ CHUYỆN: Danh sách tin nhắn */
              messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <div
                      key={m.id}
                      className="assistant-bubble-user"
                    >
                      {m.question}
                    </div>
                  );
                }

                if (m.status === "no_evidence") {
                  return (
                    <div key={m.id} className="assistant-bubble-row">
                      <div
                        className="assistant-avatar yellow"
                        aria-hidden="true"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v6M12 16v.5" />
                        </svg>
                      </div>
                      <div className="assistant-card-response warning">
                        <div className="assistant-response-title-warning">
                          Chưa tìm thấy trong nguồn đang dùng
                        </div>
                        <div style={{ marginTop: 4 }}>
                          Mình không trả lời khi chưa có căn cứ. Bạn có thể hỏi cụ
                          thể hơn, hoặc nhờ quản trị viên ứng dụng thêm tài liệu
                          liên quan vào nguồn.
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className="assistant-bubble-row">
                    <div
                      className="assistant-avatar teal"
                      aria-hidden="true"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4z" />
                      </svg>
                    </div>
                    <div className="assistant-card-response">
                      {m.answerIntro && <div>{m.answerIntro}</div>}

                      {m.items && m.items.length > 0 && (
                        <ol className="assistant-response-items">
                          {m.items.map((it, idx) => (
                            <li key={idx}>
                              {it.text}{" "}
                              <button
                                type="button"
                                className="assistant-cite-btn"
                                onClick={() => handleCiteClick(it.citeNum)}
                                aria-label={`Xem nguồn số ${it.citeNum}`}
                              >
                                {it.citeNum}
                              </button>
                            </li>
                          ))}
                        </ol>
                      )}

                      {/* Hàng chip nguồn */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="assistant-citations-row">
                          <span className="assistant-citations-label">Nguồn:</span>
                          {m.citations.map((c) => {
                            const isSelected =
                              sources.find((s) => s.id === selectedSourceId)
                                ?.number === c.number;
                            return (
                              <button
                                key={c.sourceId}
                                type="button"
                                className={`assistant-citation-chip ${isSelected ? "selected" : ""}`}
                                onClick={() => handleCiteClick(c.number)}
                              >
                                <strong>{c.number}</strong> {c.title}
                                {c.location ? ` · ${c.location}` : ""}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Hàng nút icon hành động */}
                      <div className="assistant-actions-row">
                        <button
                          type="button"
                          className="assistant-action-btn"
                          onClick={() => handleCopyMessage(m)}
                          aria-label="Sao chép câu trả lời"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              ry="2"
                            />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>
                            {copiedMsgId === m.id ? "Đã sao chép" : "Sao chép"}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`assistant-action-btn ${m.feedback === "helpful" ? "active" : ""}`}
                          onClick={() => handleFeedback(m.id, "helpful")}
                          aria-label="Hữu ích"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                          <span>Hữu ích</span>
                        </button>

                        <button
                          type="button"
                          className={`assistant-action-btn ${m.feedback === "incorrect" ? "active" : ""}`}
                          onClick={() => handleFeedback(m.id, "incorrect")}
                          aria-label="Chưa đúng"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                          </svg>
                          <span>Chưa đúng</span>
                        </button>

                        {m.feedback === "helpful" && (
                          <span className="assistant-feedback-text">
                            Cảm ơn, đã ghi nhận.
                          </span>
                        )}
                        {m.feedback === "incorrect" && (
                          <span className="assistant-feedback-text">
                            Đã ghi nhận. Quản trị viên sẽ xem lại nguồn.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Trạng thái đang tải */}
            {isLoading && (
              <div className="assistant-loading-box">
                <span className="assistant-loading-spinner" aria-hidden="true" />
                <span>
                  Đang tìm trong {activeSourcesCount} nguồn của ứng dụng…
                </span>
                <button
                  type="button"
                  className="assistant-btn-stop"
                  onClick={handleStop}
                >
                  Dừng
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Khung nhập dính đáy */}
        <div className="assistant-center-input-wrap">
          <div className="assistant-input-inner">
            {/* Hàng câu gợi ý pill */}
            {currentApp?.hasSources && !isUnavailable && (
              <div className="assistant-prompt-pills">
                <button
                  type="button"
                  className="assistant-prompt-pill"
                  onClick={() => handleSend("Nhập kho khi nào?")}
                >
                  Nhập kho khi nào?
                </button>
                <button
                  type="button"
                  className="assistant-prompt-pill"
                  onClick={() => handleSend("Ai được sửa yêu cầu đã gửi?")}
                >
                  Ai được sửa yêu cầu đã gửi?
                </button>
                <button
                  type="button"
                  className="assistant-prompt-pill"
                  onClick={() => handleSend("Tồn kho tính thế nào?")}
                >
                  Tồn kho tính thế nào?
                </button>
              </div>
            )}

            {/* Khung nhập chính */}
            {isUnavailable ? (
              <div className="assistant-input-box locked">
                <span style={{ flex: 1, fontSize: 14 }}>
                  Tạm thời chưa gửi được câu hỏi
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "var(--ws-line)",
                  }}
                />
              </div>
            ) : (
              <div className="assistant-input-box">
                <label
                  htmlFor="assistant-query-input"
                  className="sr-only"
                >
                  Câu hỏi cho trợ lý
                </label>
                <textarea
                  id="assistant-query-input"
                  ref={textareaRef}
                  rows={2}
                  placeholder={`Hỏi về quy chế, cách dùng ứng dụng ${currentApp?.name}…`}
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || !currentApp?.hasSources}
                />
                <button
                  type="button"
                  className={`assistant-btn-send ${input.trim() ? "has-text" : ""}`}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading || !currentApp?.hasSources}
                  aria-label="Gửi câu hỏi"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            )}

            <div className="assistant-input-hint">
              Enter để gửi · Shift + Enter để xuống dòng · Trợ lý có thể sai, hãy mở
              nguồn để đối chiếu.
            </div>
          </div>
        </div>
      </main>

      {/* Cột phải: Nguồn đang dùng */}
      {currentApp?.hasSources && (
        <AssistantSources
          isOpen={isSourcesDrawerOpen}
          onClose={() => setIsSourcesDrawerOpen(false)}
          sources={sources}
          selectedSourceId={selectedSourceId}
          onSelectSource={(id) => setSelectedSourceId(id)}
          canManageSources={canManageSources}
        />
      )}

      {/* Hộp thoại xác nhận đổi app */}
      <ConfirmDialog
        isOpen={isSwitchConfirmOpen}
        onClose={() => setIsSwitchConfirmOpen(false)}
        title="Đổi ứng dụng đang hỏi?"
        description="Hội thoại hiện tại và nguồn đối chiếu sẽ được làm mới theo ứng dụng mới."
      >
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button
            type="button"
            className="assistant-btn-secondary"
            onClick={() => setIsSwitchConfirmOpen(false)}
          >
            Giữ lại
          </button>
          <button
            type="button"
            className="assistant-btn-primary"
            onClick={() => {
              if (pendingSwitchAppId) {
                executeAppSwitch(pendingSwitchAppId);
              }
            }}
          >
            Đổi ứng dụng
          </button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
