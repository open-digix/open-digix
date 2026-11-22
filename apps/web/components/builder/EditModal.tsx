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

import { useState } from "react";
import type {
  BuilderFieldDefinition,
  BuilderFieldType,
  BuilderStepDefinition,
  BuilderStepType,
  BuilderEndState,
} from "../../../../apps/api/src/builder/builder.types";

export type EditableItem =
  | BuilderFieldDefinition
  | string
  | BuilderStepDefinition;

interface EditModalProps {
  kind: "field" | "role" | "step";
  initialItem?: EditableItem;
  allRoles: readonly string[];
  allFields: readonly BuilderFieldDefinition[];
  allSteps: readonly BuilderStepDefinition[];
  onSave: (savedItem: EditableItem) => void;
  onClose: () => void;
  onDeleteRole?: (roleId: string) => void;
}

export default function EditModal({
  kind,
  initialItem,
  allRoles,
  allFields,
  allSteps,
  onSave,
  onClose,
  onDeleteRole,
}: EditModalProps) {
  const initialField =
    kind === "field" && initialItem && typeof initialItem === "object"
      ? (initialItem as BuilderFieldDefinition)
      : null;
  const initialRole =
    kind === "role" && typeof initialItem === "string" ? initialItem : "";
  const initialStep =
    kind === "step" && initialItem && typeof initialItem === "object"
      ? (initialItem as BuilderStepDefinition)
      : null;

  // Field state
  const [fieldId, setFieldId] = useState<string>(initialField?.id || "");
  const [fieldType, setFieldType] = useState<BuilderFieldType>(
    initialField?.type || "string",
  );
  const [required, setRequired] = useState<boolean>(
    initialField?.required ?? false,
  );
  const [minVal, setMinVal] = useState<string>(
    initialField?.min !== undefined ? String(initialField.min) : "",
  );
  const [maxVal, setMaxVal] = useState<string>(
    initialField?.max !== undefined ? String(initialField.max) : "",
  );
  const [enumOptions, setEnumOptions] = useState<string>(
    initialField?.options ? initialField.options.join(", ") : "",
  );

  // Role state
  const [roleId, setRoleId] = useState<string>(initialRole);
  const [deleteConfirmSteps, setDeleteConfirmSteps] = useState<string[] | null>(
    null,
  );

  // Step state
  const [stepId, setStepId] = useState<string>(initialStep?.id || "");
  const [stepType, setStepType] = useState<BuilderStepType>(
    initialStep?.type || "task",
  );
  const [stepRole, setStepRole] = useState<string>(initialStep?.role || "");
  const [decisionField, setDecisionField] = useState<string>(
    initialStep?.decisionField || "",
  );
  const [noSelfApproval, setNoSelfApproval] = useState<boolean>(
    initialStep?.noSelfApproval ?? false,
  );
  const [endState, setEndState] = useState<BuilderEndState>(
    initialStep?.endState || "approved",
  );

  const [error, setError] = useState<string | null>(null);

  const isNew = !initialItem;

  // Filter decision eligible fields: enum or boolean
  const decisionFields = allFields.filter(
    (f) => f.type === "enum" || f.type === "boolean",
  );

  const handleFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = fieldId.trim();
    if (!/^[a-z][a-z0-9_-]{1,63}$/.test(id)) {
      setError(
        "Mã trường phải bắt đầu bằng chữ thường, gồm chữ thường, số, '-' hoặc '_'.",
      );
      return;
    }

    let minNum: number | undefined;
    let maxNum: number | undefined;

    if (fieldType === "integer") {
      if (minVal !== "") {
        minNum = Number(minVal);
        if (!Number.isInteger(minNum)) {
          setError("Giá trị nhỏ nhất phải là số nguyên.");
          return;
        }
      }
      if (maxVal !== "") {
        maxNum = Number(maxVal);
        if (!Number.isInteger(maxNum)) {
          setError("Giá trị lớn nhất phải là số nguyên.");
          return;
        }
      }
      if (minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
        setError("Giá trị nhỏ nhất không được lớn hơn giá trị lớn nhất.");
        return;
      }
    }

    let optionsList: string[] | undefined;
    if (fieldType === "enum") {
      const opts = enumOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (opts.length === 0) {
        setError("Trường lựa chọn (enum) cần ít nhất một lựa chọn.");
        return;
      }
      const uniqueOpts = new Set(opts);
      if (uniqueOpts.size !== opts.length) {
        setError("Các lựa chọn enum không được trùng nhau.");
        return;
      }
      optionsList = opts;
    }

    const fieldDef: BuilderFieldDefinition = {
      id,
      type: fieldType,
      required,
      ...(minNum !== undefined ? { min: minNum } : {}),
      ...(maxNum !== undefined ? { max: maxNum } : {}),
      ...(optionsList ? { options: optionsList } : {}),
    };

    onSave(fieldDef);
    onClose();
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = roleId.trim();
    if (!/^[a-z][a-z0-9_-]{1,63}$/.test(id)) {
      setError(
        "Mã vai trò phải bắt đầu bằng chữ thường, gồm chữ thường, số, '-' hoặc '_'.",
      );
      return;
    }
    onSave(id);
    onClose();
  };

  const handleDeleteRoleClick = () => {
    const usedBySteps = allSteps
      .filter((s) => s.role === initialRole)
      .map((s) => s.id);

    if (usedBySteps.length > 0) {
      setDeleteConfirmSteps(usedBySteps);
    } else {
      if (onDeleteRole && initialRole) onDeleteRole(initialRole);
      onClose();
    }
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = stepId.trim();
    if (!/^[a-z][a-z0-9_-]{1,63}$/.test(id)) {
      setError(
        "Mã bước phải bắt đầu bằng chữ thường, gồm chữ thường, số, '-' hoặc '_'.",
      );
      return;
    }

    if (stepType === "task" && !stepRole) {
      setError("Bước xử lý cần chọn người phụ trách (vai trò).");
      return;
    }

    const stepDef: BuilderStepDefinition = {
      id,
      type: stepType,
      ...(stepType === "task" ? { role: stepRole } : {}),
      ...(stepType === "task" && decisionField ? { decisionField } : {}),
      ...(stepType === "task" && decisionField && noSelfApproval
        ? { noSelfApproval: true }
        : {}),
      ...(stepType === "end" ? { endState } : {}),
    };

    onSave(stepDef);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>
              {isNew ? "Thêm mới" : "Chỉnh sửa"}{" "}
              {kind === "field" ? "trường dữ liệu" : kind === "role" ? "vai trò" : "bước xử lý"}
            </h2>
            <p>Schema v1 · Định danh kỹ thuật</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Đóng"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div
              className="info-banner"
              style={{
                borderColor: "var(--ws-danger)",
                color: "var(--ws-danger)",
                marginBottom: 16,
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Delete role warning confirmation */}
          {deleteConfirmSteps && (
            <div
              className="info-banner"
              style={{
                borderColor: "var(--ws-danger)",
                background: "var(--ws-soft)",
                marginBottom: 16,
              }}
              role="alert"
            >
              <div>
                <b>Cảnh báo xóa vai trò</b>
                <p style={{ margin: "4px 0 0" }}>
                  Vai trò này đang được sử dụng ở các bước:{" "}
                  <strong>{deleteConfirmSteps.join(", ")}</strong>. Xóa vai trò sẽ
                  khiến quy trình báo lỗi chưa chọn người phụ trách.
                </p>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="button danger"
                    onClick={() => {
                      if (onDeleteRole && initialRole) onDeleteRole(initialRole);
                      onClose();
                    }}
                  >
                    Vẫn xóa vai trò
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setDeleteConfirmSteps(null)}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FIELD FORM */}
          {kind === "field" && (
            <form onSubmit={handleFieldSubmit}>
              <div className="field">
                <label htmlFor="field-id">Mã trường (ID) *</label>
                <input
                  id="field-id"
                  value={fieldId}
                  disabled={!isNew}
                  onChange={(e) => setFieldId(e.target.value)}
                  required
                />
                <small>Chữ thường, số, dấu - hoặc _ (chưa có nhãn tiếng Việt).</small>
              </div>

              <div className="field">
                <label htmlFor="field-type">Kiểu dữ liệu *</label>
                <select
                  id="field-type"
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as BuilderFieldType)}
                >
                  <option value="string">string (chuỗi văn bản)</option>
                  <option value="integer">integer (số nguyên)</option>
                  <option value="date">date (ngày tháng)</option>
                  <option value="boolean">boolean (có/không)</option>
                  <option value="enum">enum (danh sách lựa chọn)</option>
                </select>
              </div>

              <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="field-required"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  style={{ width: "auto", minHeight: "auto" }}
                />
                <label htmlFor="field-required" style={{ margin: 0 }}>
                  Bắt buộc nhập dữ liệu
                </label>
              </div>

              {fieldType === "integer" && (
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="field-min">Giá trị nhỏ nhất (min)</label>
                    <input
                      type="number"
                      id="field-min"
                      value={minVal}
                      onChange={(e) => setMinVal(e.target.value)}
                      placeholder="Không giới hạn"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="field-max">Giá trị lớn nhất (max)</label>
                    <input
                      type="number"
                      id="field-max"
                      value={maxVal}
                      onChange={(e) => setMaxVal(e.target.value)}
                      placeholder="Không giới hạn"
                    />
                  </div>
                </div>
              )}

              {fieldType === "enum" && (
                <div className="field">
                  <label htmlFor="field-options">Danh sách lựa chọn *</label>
                  <textarea
                    id="field-options"
                    value={enumOptions}
                    onChange={(e) => setEnumOptions(e.target.value)}
                    placeholder="approved, rejected, pending"
                    rows={3}
                  />
                  <small>Các giá trị cách nhau bằng dấu phẩy.</small>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={onClose}>
                  Hủy
                </button>
                <button type="submit" className="button primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {/* ROLE FORM */}
          {kind === "role" && (
            <form onSubmit={handleRoleSubmit}>
              <div className="field">
                <label htmlFor="role-id">Mã vai trò (ID) *</label>
                <input
                  id="role-id"
                  value={roleId}
                  disabled={!isNew}
                  onChange={(e) => setRoleId(e.target.value)}
                  required
                  placeholder="employee, manager, director..."
                />
                <small>Chữ thường, số, dấu - hoặc _ (chưa có nhãn tiếng Việt).</small>
              </div>

              <div className="modal-actions">
                {!isNew && onDeleteRole && (
                  <button
                    type="button"
                    className="button danger"
                    style={{ marginRight: "auto" }}
                    onClick={handleDeleteRoleClick}
                  >
                    Xóa vai trò
                  </button>
                )}
                <button type="button" className="button secondary" onClick={onClose}>
                  Hủy
                </button>
                <button type="submit" className="button primary">
                  {isNew ? "Thêm vai trò" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          )}

          {/* STEP FORM */}
          {kind === "step" && (
            <form onSubmit={handleStepSubmit}>
              <div className="field">
                <label htmlFor="step-id">Mã bước (ID) *</label>
                <input
                  id="step-id"
                  value={stepId}
                  disabled={!isNew}
                  onChange={(e) => setStepId(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="step-type">Kiểu bước</label>
                <select
                  id="step-type"
                  value={stepType}
                  onChange={(e) => setStepType(e.target.value as BuilderStepType)}
                >
                  <option value="start">start (bắt đầu)</option>
                  <option value="task">task (xử lý)</option>
                  <option value="gateway">gateway (rẽ nhánh)</option>
                  <option value="end">end (kết thúc)</option>
                </select>
              </div>

              {stepType === "task" && (
                <>
                  <div className="field">
                    <label htmlFor="step-role">Vai trò phụ trách *</label>
                    <select
                      id="step-role"
                      value={stepRole}
                      onChange={(e) => setStepRole(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn vai trò --</option>
                      {allRoles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="step-decision">Trường quyết định (nếu có)</label>
                    <select
                      id="step-decision"
                      value={decisionField}
                      onChange={(e) => {
                        setDecisionField(e.target.value);
                        if (!e.target.value) setNoSelfApproval(false);
                      }}
                    >
                      <option value="">(Không có trường quyết định)</option>
                      {decisionFields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.id} ({f.type})
                        </option>
                      ))}
                    </select>
                    <small>Chỉ cho phép trường có kiểu enum hoặc boolean.</small>
                  </div>

                  {decisionField && (
                    <div
                      className="field"
                      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                    >
                      <input
                        type="checkbox"
                        id="step-no-self"
                        checked={noSelfApproval}
                        onChange={(e) => setNoSelfApproval(e.target.checked)}
                        style={{ width: "auto", minHeight: "auto" }}
                      />
                      <label htmlFor="step-no-self" style={{ margin: 0 }}>
                        Không tự duyệt (người tạo không được duyệt bước này)
                      </label>
                    </div>
                  )}
                </>
              )}

              {stepType === "end" && (
                <div className="field">
                  <label htmlFor="step-end-state">Trạng thái kết thúc *</label>
                  <select
                    id="step-end-state"
                    value={endState}
                    onChange={(e) => setEndState(e.target.value as BuilderEndState)}
                  >
                    <option value="approved">approved (Chấp thuận)</option>
                    <option value="rejected">rejected (Từ chối)</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={onClose}>
                  Hủy
                </button>
                <button type="submit" className="button primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
