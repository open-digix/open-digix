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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveDescriptionsAction,
  normalizeDraftAction,
} from "../../lib/builder/actions";
import { getStoredBuilderApps } from "../../lib/builder/storage";
import { formatApiErrorVi, type FormattedApiError } from "../../lib/api/errors";
import { useMockToast } from "../workspace/MockToast";

interface SourceEditorProps {
  appId: string;
  tenantId: string;
  appName: string;
  version: number;
}

const SECTION_FIELDS = [
  { id: "goal", label: "Mục tiêu quy trình", required: false, rows: 2, readOnly: true },
  { id: "inputs", label: "Dữ liệu đầu vào (inputs)", required: false, rows: 4, readOnly: false },
  { id: "roles", label: "Vai trò tham gia (roles)", required: false, rows: 3, readOnly: false },
  { id: "steps", label: "Các bước xử lý (steps)", required: false, rows: 3, readOnly: false },
  { id: "branches", label: "Rẽ nhánh & điều kiện (branches)", required: false, rows: 4, readOnly: false },
  { id: "outputs", label: "Kết quả đầu ra (outputs)", required: false, rows: 2, readOnly: false },
  { id: "exceptions", label: "Ngoại lệ & lưu ý (exceptions)", required: false, rows: 2, readOnly: false },
] as const;

export const SAMPLE_SOURCE_SECTIONS: Record<string, string> = {
  inputs: `device_name: string, required
estimated_price: integer, required, min: 1, max: 50000000
manager_decision: enum, options: approved, rejected
director_decision: enum, options: approved, rejected`,
  roles: `employee: Nhân viên
manager: Quản lý
director: Giám đốc`,
  steps: `manager_review: manager, decisionField: manager_decision
director_review: director, decisionField: director_decision`,
  branches: `manager_decision = rejected -> declined
manager_decision = approved AND estimated_price < 20000000 -> accepted
manager_decision = approved AND estimated_price >= 20000000 -> director_review
director_decision = approved -> accepted
director_decision = rejected -> declined`,
  outputs: `accepted: approved
declined: rejected`,
  exceptions: "Nếu người yêu cầu không có quản lý trực tiếp thì chuyển lên HR.",
};

export default function SourceEditor({
  appId,
  tenantId,
  version,
}: SourceEditorProps) {
  const router = useRouter();
  const { showToast, ToastContainer } = useMockToast();

  const storageKey = `ws_source_${tenantId}_${appId}`;

  const [sections, setSections] = useState<Record<string, string>>({
    goal: "",
    inputs: "",
    roles: "",
    steps: "",
    branches: "",
    outputs: "",
    exceptions: "",
  });

  const [revisionNo, setRevisionNo] = useState<number>(0);

  useEffect(() => {
    let initialGoal = "";
    try {
      const apps = getStoredBuilderApps(tenantId);
      const found = apps.find((a) => a.appId === appId);
      if (found?.goal) initialGoal = found.goal;
    } catch {
      // Ignore
    }

    try {
      const raw = sessionStorage.getItem(`ws_source_${tenantId}_${appId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sections) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSections({
            ...parsed.sections,
            goal: initialGoal || parsed.sections.goal || "",
          });
        }
        if (typeof parsed.revisionNo === "number") {
          setRevisionNo(parsed.revisionNo);
        }
      } else if (initialGoal) {
        setSections((prev) => ({ ...prev, goal: initialGoal }));
      }
    } catch {
      // Ignore
    }
  }, [tenantId, appId]);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [errorInfo, setErrorInfo] = useState<FormattedApiError | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (fieldId: string, val: string) => {
    setSections((prev) => ({ ...prev, [fieldId]: val }));
    setIsDirty(true);
  };

  const fillSample = () => {
    setSections((prev) => ({
      ...prev,
      ...SAMPLE_SOURCE_SECTIONS,
    }));
    setIsDirty(true);
    setErrorInfo(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorInfo(null);

    const hasContent = [
      sections.inputs,
      sections.roles,
      sections.steps,
      sections.branches,
      sections.outputs,
      sections.exceptions,
    ].some((v) => Boolean(v && v.trim().length > 0));

    if (!hasContent) {
      setErrorInfo(
        formatApiErrorVi({
          code: "INVALID_SOURCE_INPUT",
          message: "Cần nhập ít nhất một mục mô tả.",
          issues: [{ path: "/", message: "Cần nhập ít nhất một mục mô tả." }],
        }),
      );
      return null;
    }

    setIsSaving(true);

    try {
      const res = await saveDescriptionsAction(appId, sections);
      if (!res.ok || !res.data) {
        setErrorInfo(
          formatApiErrorVi(
            res.error ?? {
              code: "INTERNAL_ERROR",
              message: "Không thể lưu mô tả nguồn.",
            },
          ),
        );
        return null;
      }

      const revNo = res.data.revisionNo;
      const revId = res.data.sourceRevisionId;
      setRevisionNo(revNo);
      setIsDirty(false);

      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            sections,
            revisionNo: revNo,
            sourceRevisionId: revId,
            segments: res.data.segments,
          }),
        );
      } catch {
        // Ignore
      }

      showToast(`Đã lưu mô tả nguồn (Bản mô tả số ${revNo}).`);
      return { sourceRevisionId: revId, revisionNo: revNo };
    } catch {
      setErrorInfo(
        formatApiErrorVi({
          code: "INTERNAL_ERROR",
          message: "Đã xảy ra lỗi kết nối khi lưu mô tả nguồn.",
        }),
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNormalize = async () => {
    const saveResult = await handleSave();
    if (!saveResult) return;

    setIsNormalizing(true);
    try {
      const res = await normalizeDraftAction(
        appId,
        version,
        saveResult.sourceRevisionId,
      );

      if (!res.ok || !res.data) {
        setErrorInfo(
          formatApiErrorVi(
            res.error ?? {
              code: "INTERNAL_ERROR",
              message: "Không thể chuẩn hóa bản nháp quy trình.",
            },
          ),
        );
        return;
      }

      try {
        sessionStorage.setItem(
          `ws_normalize_${tenantId}_${appId}`,
          JSON.stringify(res.data),
        );
      } catch {
        // Ignore
      }

      router.push(`/builder/${appId}?step=normalize`);
    } catch {
      setErrorInfo(
        formatApiErrorVi({
          code: "INTERNAL_ERROR",
          message: "Đã xảy ra lỗi kết nối khi chuẩn hóa.",
        }),
      );
    } finally {
      setIsNormalizing(false);
    }
  };

  const isSessionEmpty =
    !revisionNo && Object.values(sections).every((v) => !v.trim());

  return (
    <div>
      <div className="flow-intro">
        <div>
          <b>Mô tả quy trình theo cấu trúc nghiệp vụ</b>
          <p>
            Ghi những gì đã biết, giữ phần chưa rõ để kiểm tra. Hệ thống sẽ tự động
            chuẩn hóa thành manifest v1.
          </p>
        </div>
        <span>
          {revisionNo > 0 ? `Bản mô tả số ${revisionNo}` : "Chưa lưu bản mô tả"}
        </span>
      </div>

      {isSessionEmpty && (
        <div
          className="info-banner"
          style={{
            background: "var(--ws-soft)",
            borderColor: "var(--ws-line)",
            marginBottom: 16,
          }}
          role="note"
        >
          <div>
            <b>Mô tả gốc chỉ xem được trong phiên đã nhập</b>
            <p style={{ margin: "4px 0 0" }}>
              Backend chưa có API đọc lại nội dung văn bản gốc đã lưu. Bạn có thể nhập
              mới hoặc điền ví dụ mẫu bên dưới để tạo revision tiếp theo.
            </p>
          </div>
        </div>
      )}

      {errorInfo && (
        <div
          className="info-banner"
          style={{
            background: "var(--ws-soft)",
            borderColor: "var(--ws-danger)",
            color: "var(--ws-danger)",
            marginBottom: 16,
          }}
          role="alert"
        >
          <b>Lỗi: {errorInfo.title}</b>
          {errorInfo.issues.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
              {errorInfo.issues.map((iss, i) => (
                <li key={i}>
                  <strong>{iss.fieldLabel}:</strong> {iss.message}
                </li>
              ))}
            </ul>
          )}
          {errorInfo.rawMessage && (
            <details style={{ marginTop: 8, fontSize: 11, opacity: 0.85 }}>
              <summary style={{ cursor: "pointer" }}>Chi tiết kỹ thuật</summary>
              <pre style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
                {errorInfo.rawMessage}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="flow-grid">
        <section className="panel flow-primary">
          <div className="panel-head">
            <div>
              <h2>Nội dung mô tả nguồn</h2>
              <p>Mỗi lần lưu sẽ tạo một source revision mới trên hệ thống</p>
            </div>
            <button
              type="button"
              className="button secondary"
              style={{ fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4 }}
              onClick={fillSample}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
              </svg>
              <span>Điền ví dụ (MẪU THỬ)</span>
            </button>
          </div>

          <div className="panel-body">
            <form onSubmit={handleSave}>
              {SECTION_FIELDS.map((sec, idx) => (
                <div key={sec.id} className="field">
                  <label htmlFor={`source-${sec.id}`}>
                    <span className="flow-field-no">
                      {String(idx + 1).padStart(2, "0")}
                    </span>{" "}
                    {sec.label}
                    {sec.required ? " *" : ""}
                    {sec.readOnly ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--ws-muted)",
                          fontWeight: "normal",
                          marginLeft: 6,
                        }}
                      >
                        (Chỉ đọc từ lúc tạo ứng dụng)
                      </span>
                    ) : null}
                  </label>
                  <textarea
                    id={`source-${sec.id}`}
                    name={sec.id}
                    rows={sec.rows}
                    required={sec.required}
                    readOnly={sec.readOnly}
                    style={
                      sec.readOnly
                        ? {
                            background: "var(--ws-soft, #f8fafc)",
                            cursor: "not-allowed",
                          }
                        : undefined
                    }
                    value={sections[sec.id] || ""}
                    onChange={
                      sec.readOnly
                        ? undefined
                        : (e) => handleChange(sec.id, e.target.value)
                    }
                  />
                </div>
              ))}

              <div className="flow-form-foot">
                <span style={{ fontSize: 12, color: "var(--ws-muted)" }}>
                  Lưu mô tả để chuẩn hóa sang quy trình
                </span>
                <div>
                  <button
                    className="button secondary"
                    type="submit"
                    disabled={isSaving || isNormalizing}
                  >
                    {isSaving ? "Đang lưu..." : "Lưu mô tả"}
                  </button>
                  <button
                    className="button primary"
                    type="button"
                    disabled={isSaving || isNormalizing}
                    onClick={handleSaveAndNormalize}
                  >
                    {isNormalizing ? "Đang chuẩn hóa..." : "Lưu & chuẩn hóa →"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <aside className="panel flow-side">
          <div className="panel-head">
            <div>
              <h2>Hướng dẫn nhập nguồn</h2>
              <p>Cú pháp để chuẩn hóa chính xác</p>
            </div>
          </div>
          <div className="panel-body">
            <ol className="flow-side-list">
              <li>
                <b>Đầu vào</b>
                <span>Mỗi dòng: mã trường, kiểu (string/integer/enum), bắt buộc.</span>
              </li>
              <li>
                <b>Vai trò & bước</b>
                <span>Khai báo mã vai trò và gán người phụ trách cho task.</span>
              </li>
              <li>
                <b>Nhánh & ngoại lệ</b>
                <span>
                  Ghi điều kiện rõ ràng với AND, dấu so sánh =, &lt;, &gt;= và mũi tên -&gt;.
                </span>
              </li>
            </ol>
            <div className="flow-tip">
              Bản nháp được chuẩn hóa theo quy tắc cố định, không dùng AI. Hãy đối chiếu với mô tả gốc trước khi dùng.
            </div>
          </div>
        </aside>
      </div>

      <ToastContainer />
    </div>
  );
}
