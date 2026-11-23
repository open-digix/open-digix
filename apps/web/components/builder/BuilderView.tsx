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
import Link from "next/link";
import {
  updateDraftAction,
  getDraftAction,
} from "../../lib/builder/actions";
import { formatTransitionToVietnamese } from "../../lib/builder/transitions";
import EditModal, { type EditableItem } from "./EditModal";
import { useMockToast } from "../workspace/MockToast";
import type {
  BuilderApplicationDefinitionV1,
  BuilderDesignMetadata,
  BuilderFieldDefinition,
  BuilderStepDefinition,
} from "../../lib/builder/types";

interface BuilderViewProps {
  appId: string;
  tenantId: string;
  version: number;
  initialDefinition: BuilderApplicationDefinitionV1;
  initialLockVersion: number;
  initialRevisionNo: number;
  initialSourceMappings?: BuilderDesignMetadata["sourceMappings"];
  initialOpenIssues?: BuilderDesignMetadata["openIssues"];
}

export default function BuilderView({
  appId,
  version,
  initialDefinition,
  initialLockVersion,
  initialRevisionNo,
  initialSourceMappings = [],
  initialOpenIssues = [],
}: BuilderViewProps) {
  const { showToast, ToastContainer } = useMockToast();

  const [definition, setDefinition] =
    useState<BuilderApplicationDefinitionV1>(initialDefinition);
  const [lockVersion, setLockVersion] = useState<number>(initialLockVersion);
  const [revisionNo] = useState<number>(initialRevisionNo);
  const [sourceMappings, setSourceMappings] =
    useState<BuilderDesignMetadata["sourceMappings"]>(initialSourceMappings);
  const [openIssues, setOpenIssues] =
    useState<BuilderDesignMetadata["openIssues"]>(initialOpenIssues);

  const [tab, setTab] = useState<
    "fields" | "roles" | "steps" | "transitions" | "overview"
  >("fields");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    kind: "field" | "role" | "step";
    item?: EditableItem;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [conflictJson, setConflictJson] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Find source mappings for selected item
  const selectedMapping = selectedId
    ? sourceMappings.find((m) => m.targetId === selectedId)
    : null;

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setGeneralError(null);
    setConflictJson(null);

    try {
      const res = await updateDraftAction(
        appId,
        version,
        lockVersion,
        definition,
        {
          sourceMappings,
          openIssues,
        },
      );

      if (!res.ok) {
        if (
          res.error?.code === "VERSION_CONFLICT" ||
          res.error?.code === "409"
        ) {
          setConflictJson(JSON.stringify(definition, null, 2));
        } else {
          setGeneralError(res.error?.message || "Không thể lưu bản nháp.");
        }
        return;
      }

      if (res.data) {
        setLockVersion(res.data.lockVersion);
        showToast(`Đã lưu bản nháp thành công · lockVersion ${res.data.lockVersion}.`);
      }
    } catch {
      setGeneralError("Đã xảy ra lỗi kết nối khi lưu bản nháp.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReloadLatest = async () => {
    try {
      const res = await getDraftAction(appId, version);
      if (res.ok && res.data) {
        setDefinition(res.data.definition);
        setLockVersion(res.data.lockVersion);
        if (res.data.sourceMappings) setSourceMappings(res.data.sourceMappings);
        if (res.data.openIssues) setOpenIssues(res.data.openIssues);
        setConflictJson(null);
        showToast("Đã tải lại bản nháp mới nhất từ hệ thống.");
      }
    } catch {
      showToast("Không thể tải lại bản nháp mới nhất.");
    }
  };

  const handleCopyConflictJson = () => {
    if (conflictJson) {
      void navigator.clipboard.writeText(conflictJson);
      showToast("Đã sao chép nội dung JSON đang sửa vào bộ nhớ tạm.");
    }
  };

  // Modals Save Handlers
  const handleSaveItem = (item: EditableItem) => {
    if (!modalState) return;

    if (modalState.kind === "field") {
      const fieldDef = item as BuilderFieldDefinition;
      const exists = definition.fields.some((f) => f.id === fieldDef.id);
      const updatedFields = exists
        ? definition.fields.map((f) => (f.id === fieldDef.id ? fieldDef : f))
        : [...definition.fields, fieldDef];
      setDefinition((prev) => ({ ...prev, fields: updatedFields }));
      setSelectedId(fieldDef.id);
    } else if (modalState.kind === "role") {
      const roleStr = item as string;
      const exists = definition.roles.includes(roleStr);
      const updatedRoles = exists
        ? definition.roles
        : [...definition.roles, roleStr];
      setDefinition((prev) => ({ ...prev, roles: updatedRoles }));
      setSelectedId(roleStr);
    } else if (modalState.kind === "step") {
      const stepDef = item as BuilderStepDefinition;
      const exists = definition.steps.some((s) => s.id === stepDef.id);
      const updatedSteps = exists
        ? definition.steps.map((s) => (s.id === stepDef.id ? stepDef : s))
        : [...definition.steps, stepDef];
      setDefinition((prev) => ({ ...prev, steps: updatedSteps }));
      setSelectedId(stepDef.id);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    setDefinition((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r !== roleId),
    }));
    if (selectedId === roleId) setSelectedId(null);
    showToast(`Đã xóa vai trò ${roleId}.`);
  };

  return (
    <div>
      {/* Conflict banner */}
      {conflictJson && (
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
          <div>
            <b>409 - Xung đột phiên bản (VERSION_CONFLICT)</b>
            <p style={{ margin: "4px 0 0" }}>
              Bản nháp đã được người khác hoặc một tab khác cập nhật trên hệ thống.
              Dữ liệu bạn đang sửa không bị mất. Bạn có thể sao chép bản JSON này
              hoặc tải lại bản mới nhất.
            </p>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                type="button"
                className="button primary"
                onClick={handleCopyConflictJson}
              >
                Sao chép bản đang sửa (JSON)
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={handleReloadLatest}
              >
                Tải bản mới nhất
              </button>
            </div>
          </div>
        </div>
      )}

      {generalError && (
        <div
          className="info-banner"
          style={{
            borderColor: "var(--ws-danger)",
            color: "var(--ws-danger)",
            marginBottom: 16,
          }}
          role="alert"
        >
          <b>Lỗi:</b> {generalError}
        </div>
      )}

      {/* Top action bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="status warning">Bản nháp v{definition.version}</span>
          <span style={{ fontSize: 11, color: "var(--ws-muted)" }}>
            Revision {revisionNo} · lockVersion {lockVersion}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="button secondary"
            disabled={isSaving}
            onClick={handleSaveDraft}
          >
            {isSaving ? "Đang lưu..." : "Lưu bản nháp"}
          </button>
          <Link
            href={`/builder/${appId}?step=validate`}
            className="button primary"
          >
            Kiểm tra quy trình →
          </Link>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === "fields" ? "active" : ""}`}
          onClick={() => setTab("fields")}
        >
          Trường dữ liệu ({definition.fields?.length || 0})
        </button>
        <button
          type="button"
          className={`tab ${tab === "roles" ? "active" : ""}`}
          onClick={() => setTab("roles")}
        >
          Vai trò ({definition.roles?.length || 0})
        </button>
        <button
          type="button"
          className={`tab ${tab === "steps" ? "active" : ""}`}
          onClick={() => setTab("steps")}
        >
          Các bước ({definition.steps?.length || 0})
        </button>
        <button
          type="button"
          className={`tab ${tab === "transitions" ? "active" : ""}`}
          onClick={() => setTab("transitions")}
        >
          Nhánh & nguồn ({definition.transitions?.length || 0})
        </button>
      </div>

      {/* Two columns builder layout */}
      <div className="flow-builder-layout">
        {/* Primary Editor Pane */}
        <section className="panel flow-primary">
          <div className="panel-head">
            <div>
              <h2>
                {tab === "fields"
                  ? "Danh sách trường dữ liệu"
                  : tab === "roles"
                    ? "Danh sách vai trò"
                    : tab === "steps"
                      ? "Các bước thực hiện"
                      : "Sơ đồ nhánh & điều kiện (chỉ đọc)"}
              </h2>
              <p>Mã định danh kỹ thuật (nhãn tiếng Việt chờ BE-05)</p>
            </div>

            {tab === "fields" && (
              <button
                type="button"
                className="button primary"
                style={{ fontSize: 10 }}
                onClick={() => setModalState({ kind: "field" })}
              >
                + Thêm trường
              </button>
            )}
            {tab === "roles" && (
              <button
                type="button"
                className="button primary"
                style={{ fontSize: 10 }}
                onClick={() => setModalState({ kind: "role" })}
              >
                + Thêm vai trò
              </button>
            )}
            {tab === "steps" && (
              <button
                type="button"
                className="button primary"
                style={{ fontSize: 10 }}
                onClick={() => setModalState({ kind: "step" })}
              >
                + Thêm bước
              </button>
            )}
          </div>

          <div className="panel-body">
            {/* FIELDS TAB */}
            {tab === "fields" && (
              <div>
                {definition.fields?.map((f, i) => (
                  <div
                    key={f.id}
                    className={`flow-edit-row ${selectedId === f.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(f.id)}
                  >
                    <span className="flow-row-index">{i + 1}</span>
                    <div className="flow-row-main">
                      <b>
                        {f.id} {f.required && "*"}
                      </b>
                      <small>
                        Kiểu: {f.type}
                        {f.min !== undefined ? ` · min: ${f.min}` : ""}
                        {f.max !== undefined ? ` · max: ${f.max}` : ""}
                        {f.options ? ` · options: [${f.options.join(", ")}]` : ""}
                        {" · (Chưa có nhãn)"}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="text-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState({ kind: "field", item: f });
                      }}
                    >
                      Sửa
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ROLES TAB */}
            {tab === "roles" && (
              <div>
                {definition.roles?.map((r, i) => (
                  <div
                    key={r}
                    className={`flow-edit-row ${selectedId === r ? "selected" : ""}`}
                    onClick={() => setSelectedId(r)}
                  >
                    <span className="flow-row-index">{i + 1}</span>
                    <div className="flow-row-main">
                      <b>{r}</b>
                      <small>Mã vai trò · (Chưa có nhãn tiếng Việt)</small>
                    </div>
                    <button
                      type="button"
                      className="text-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState({ kind: "role", item: r });
                      }}
                    >
                      Sửa
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* STEPS TAB */}
            {tab === "steps" && (
              <div>
                {definition.steps?.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flow-edit-row ${selectedId === s.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <span className="flow-row-index">{i + 1}</span>
                    <div className="flow-row-main">
                      <b>
                        {s.id} ({s.type})
                      </b>
                      <small>
                        {s.role ? `Người phụ trách: ${s.role}` : ""}
                        {s.decisionField ? ` · Quyết định: ${s.decisionField}` : ""}
                        {s.noSelfApproval ? " · Không tự duyệt" : ""}
                        {s.endState ? ` · Kết quả: ${s.endState}` : ""}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="text-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState({ kind: "step", item: s });
                      }}
                    >
                      Sửa
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TRANSITIONS TAB (READ-ONLY SENTENCES) */}
            {tab === "transitions" && (
              <div>
                <p className="flow-tab-intro">
                  Danh sách đường nối và điều kiện rẽ nhánh được dịch tự động sang câu
                  tiếng Việt. Phần này ở chế độ chỉ đọc.
                </p>
                {definition.transitions?.length === 0 ? (
                  <div className="empty">Chưa có đường nối nào được cấu hình.</div>
                ) : (
                  definition.transitions?.map((t, idx) => (
                    <div
                      key={idx}
                      className="flow-summary-item"
                      style={{ padding: 12, marginBottom: 8 }}
                    >
                      <div>
                        <strong>{formatTransitionToVietnamese(t)}</strong>
                        <div
                          style={{
                            color: "var(--ws-muted)",
                            fontSize: 10,
                            marginTop: 4,
                          }}
                        >
                          Cạnh kỹ thuật: <code>{t.from}</code> → <code>{t.to}</code>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Preview & Source Mapping Pane */}
        <aside className="flow-builder-side">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Đoạn nguồn liên quan</h2>
                <p>Đối chiếu văn bản gốc</p>
              </div>
            </div>
            <div className="panel-body">
              {selectedId ? (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                    Đối tượng: <code>{selectedId}</code>
                  </div>
                  {selectedMapping && selectedMapping.segmentIds.length > 0 ? (
                    <div>
                      <small style={{ color: "var(--ws-muted)" }}>
                        Ánh xạ từ {selectedMapping.segmentIds.length} đoạn văn bản nguồn:
                      </small>
                      <div
                        style={{
                          background: "var(--ws-canvas)",
                          padding: 10,
                          borderRadius: 6,
                          marginTop: 6,
                          fontSize: 10,
                        }}
                      >
                        {selectedMapping.segmentIds.join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "var(--ws-muted)", fontSize: 10 }}>
                      Chưa có đoạn nguồn liên quan được liên kết.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: "var(--ws-muted)", fontSize: 10 }}>
                  Chọn một trường, vai trò hoặc bước ở cột trái để xem liên kết nguồn.
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Tóm tắt bản nháp</h2>
                <p>Tổng thể manifest v1</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="detail-pair">
                <span>Số trường:</span>
                <strong>{definition.fields?.length || 0}</strong>
              </div>
              <div className="detail-pair">
                <span>Số vai trò:</span>
                <strong>{definition.roles?.length || 0}</strong>
              </div>
              <div className="detail-pair">
                <span>Số bước:</span>
                <strong>{definition.steps?.length || 0}</strong>
              </div>
              <div className="detail-pair">
                <span>Số nhánh:</span>
                <strong>{definition.transitions?.length || 0}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Edit Modal */}
      {modalState && (
        <EditModal
          kind={modalState.kind}
          initialItem={modalState.item}
          allRoles={definition.roles || []}
          allFields={definition.fields || []}
          allSteps={definition.steps || []}
          onSave={handleSaveItem}
          onClose={() => setModalState(null)}
          onDeleteRole={handleDeleteRole}
        />
      )}

      <ToastContainer />
    </div>
  );
}
