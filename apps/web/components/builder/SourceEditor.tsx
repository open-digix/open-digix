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
import { useMockToast } from "../workspace/MockToast";

interface SourceEditorProps {
  appId: string;
  tenantId: string;
  appName: string;
  version: number;
}

const SECTION_FIELDS = [
  { id: "goal", label: "Mục tiêu quy trình", required: true, rows: 2 },
  { id: "inputs", label: "Dữ liệu đầu vào (inputs)", required: false, rows: 4 },
  { id: "roles", label: "Vai trò tham gia (roles)", required: false, rows: 3 },
  { id: "steps", label: "Các bước xử lý (steps)", required: false, rows: 3 },
  { id: "branches", label: "Rẽ nhánh & điều kiện (branches)", required: false, rows: 4 },
  { id: "outputs", label: "Kết quả đầu ra (outputs)", required: false, rows: 2 },
  { id: "exceptions", label: "Ngoại lệ & lưu ý (exceptions)", required: false, rows: 2 },
] as const;

export const SAMPLE_SOURCE_SECTIONS: Record<string, string> = {
  goal: "Yêu cầu cấp phát laptop làm việc",
  inputs: `device_name: string, required
estimated_price: integer, required, min: 1, max: 50000000
manager_decision: enum, options: approved, rejected`,
  roles: `employee: Nhân viên
manager: Quản lý`,
  steps: `manager_review: manager, decisionField: manager_decision`,
  branches: `manager_decision = rejected -> declined
manager_decision = approved AND estimated_price < 20000000 -> accepted
manager_decision = approved AND estimated_price >= 20000000 -> director_review`,
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

  const [sections, setSections] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {
        goal: "",
        inputs: "",
        roles: "",
        steps: "",
        branches: "",
        outputs: "",
        exceptions: "",
      };
    }
    try {
      const raw = sessionStorage.getItem(`ws_source_${tenantId}_${appId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sections) return parsed.sections;
      }
    } catch {
      // Ignore
    }
    return {
      goal: "",
      inputs: "",
      roles: "",
      steps: "",
      branches: "",
      outputs: "",
      exceptions: "",
    };
  });

  const [revisionNo, setRevisionNo] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = sessionStorage.getItem(`ws_source_${tenantId}_${appId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.revisionNo === "number") return parsed.revisionNo;
      }
    } catch {
      // Ignore
    }
    return 0;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setSections(SAMPLE_SOURCE_SECTIONS);
    setIsDirty(true);
    setErrorMessage(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const res = await saveDescriptionsAction(appId, sections);
      if (!res.ok || !res.data) {
        setErrorMessage(res.error?.message || "Không thể lưu mô tả nguồn.");
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

      showToast(`Đã lưu mô tả nguồn (Revision ${revNo}).`);
      return { sourceRevisionId: revId, revisionNo: revNo };
    } catch {
      setErrorMessage("Đã xảy ra lỗi kết nối khi lưu mô tả nguồn.");
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
        setErrorMessage(
          res.error?.message || "Không thể chuẩn hóa bản nháp quy trình.",
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
      setErrorMessage("Đã xảy ra lỗi kết nối khi chuẩn hóa.");
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
        <span>REVISION {String(revisionNo).padStart(2, "0")}</span>
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

      {errorMessage && (
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
          <b>Lỗi:</b> {errorMessage}
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
              style={{ fontSize: 10 }}
              onClick={fillSample}
            >
              ✦ Điền ví dụ (MẪU THỬ)
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
                  </label>
                  <textarea
                    id={`source-${sec.id}`}
                    name={sec.id}
                    rows={sec.rows}
                    required={sec.required}
                    value={sections[sec.id] || ""}
                    onChange={(e) => handleChange(sec.id, e.target.value)}
                  />
                </div>
              ))}

              <div className="flow-form-foot">
                <span>
                  POST <code>/v1/apps/:appId/descriptions</code>
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
              Bản nháp do hệ thống chuẩn hóa không sử dụng AI ảo tưởng, mà tuân thủ các quy tắc logic xác định từ văn bản.
            </div>
          </div>
        </aside>
      </div>

      <ToastContainer />
    </div>
  );
}
