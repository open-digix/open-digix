"use client";

import { useState } from "react";
import { useMockToast } from "../../../components/workspace/MockToast";

export default function AssistantView() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const { showToast, ToastContainer } = useMockToast();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const q = question;
    setQuestion("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      {
        role: "assistant",
        text: `Đây là câu trả lời mẫu cho yêu cầu: "${q}". Trợ lý DigiX sẽ được kết nối chính thức ở phiên bản sau.`,
      },
    ]);
    showToast("Phản hồi mẫu — không gửi tới hệ thống AI.");
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">TRỢ LÝ QUY TRÌNH</div>
          <h1>Trợ lý AI DigiX</h1>
          <p>Hỏi đáp về quy trình, hướng dẫn lập hồ sơ và tra cứu quy định</p>
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="assistant-empty">
          <div className="assistant-symbol" aria-hidden="true">
            ✦
          </div>
          <h2>Bắt đầu trò chuyện với Trợ lý DigiX</h2>
          <p>
            Bạn có thể hỏi về các bước đề nghị mua sắm, chính sách nghỉ phép hoặc
            cách thiết kế quy trình mới.
          </p>

          <div className="prompt-row">
            <button
              type="button"
              className="prompt-chip"
              onClick={() =>
                setQuestion("Hạn mức duyệt của trưởng phòng là bao nhiêu?")
              }
            >
              Hạn mức duyệt mua sắm của Quản lý?
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() =>
                setQuestion("Quy trình xin nghỉ phép trên 3 ngày cần ai duyệt?")
              }
            >
              Nghỉ phép trên 3 ngày cần ai duyệt?
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 640, margin: "0 auto 24px" }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className="chat-message"
              style={{
                background:
                  m.role === "user"
                    ? "var(--ws-soft)"
                    : "var(--ws-surface)",
                borderColor:
                  m.role === "user"
                    ? "var(--ws-line)"
                    : "var(--ws-line)",
              }}
            >
              <strong>{m.role === "user" ? "Bạn:" : "Trợ lý DigiX:"}</strong>
              <p style={{ margin: "4px 0 0" }}>{m.text}</p>
            </div>
          ))}
        </div>
      )}

      <form className="chat-input" onSubmit={handleSend}>
        <input
          id="assistant-prompt"
          name="prompt"
          type="text"
          placeholder="Nhập câu hỏi của bạn tại đây..."
          aria-label="Nhập câu hỏi cho trợ lý"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit">Gửi tin</button>
      </form>

      <ToastContainer />
    </div>
  );
}
