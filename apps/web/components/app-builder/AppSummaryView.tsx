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
import { useRouter } from "next/navigation";
import type {
  AppDraftDefinitionV25,
  AppDraftFeature,
  CatalogFeature,
  FeatureId,
  ValidateDraftIssue,
} from "../../lib/app-config/types";
import {
  getFeatureLabel,
  getFeatureDescription,
} from "../../lib/app-config/feature-labels";
import {
  patchDraftFeaturesAction,
  validateDraftAction,
} from "../../lib/app-config/actions";
import ConfirmDialog from "../common/ConfirmDialog";

function formatIssuePath(path: string, features: AppDraftFeature[]): string {
  if (path === "/features") {
    return "Danh sách chức năng";
  }
  const match = path.match(/^\/features\/(\d+)$/);
  if (match) {
    const idx = parseInt(match[1], 10);
    const featureId = features[idx]?.id;
    if (featureId) {
      return `Chức năng ${getFeatureLabel(featureId)}`;
    }
    return `Chức năng #${idx + 1}`;
  }
  return path;
}

interface AppSummaryViewProps {
  initialDraft: AppDraftDefinitionV25;
  initialLockVersion: number;
  catalogFeatures: CatalogFeature[];
  isMockMode?: boolean;
}

export default function AppSummaryView({
  initialDraft,
  initialLockVersion,
  catalogFeatures,
  isMockMode = true,
}: AppSummaryViewProps) {
  const router = useRouter();

  const [draft, setDraft] = useState<AppDraftDefinitionV25>(initialDraft);
  const [lockVersion, setLockVersion] = useState<number>(initialLockVersion);

  // Edit feature modal
  const [isEditingFeatures, setIsEditingFeatures] = useState<boolean>(false);
  const [editingSelectedFeatures, setEditingSelectedFeatures] = useState<FeatureId[]>(
    initialDraft.features.map((f) => f.id),
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState<boolean>(false);

  // Validation state
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResults, setValidationResults] = useState<{
    tested: boolean;
    valid: boolean;
    issues: ValidateDraftIssue[];
  } | null>(null);

  const selectedIds = draft.features.map((f) => f.id);

  const handleOpenEdit = () => {
    setEditingSelectedFeatures([...selectedIds]);
    setSaveError(null);
    setIsConflict(false);
    setIsEditingFeatures(true);
  };

  const handleToggleEditFeature = (featureId: FeatureId) => {
    setEditingSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId],
    );
  };

  const handleSaveFeatures = async () => {
    setIsSaving(true);
    setSaveError(null);
    setIsConflict(false);

    const res = await patchDraftFeaturesAction(
      draft.appId,
      lockVersion,
      editingSelectedFeatures,
    );

    setIsSaving(false);

    if (!res.ok) {
      const isConflictError =
        res.kind === "conflict" ||
        res.status === 409 ||
        res.code === "VERSION_CONFLICT" ||
        res.code === "CONCURRENCY_CONFLICT";

      if (isConflictError) {
        setIsConflict(true);
      }
      setSaveError(res.error || "Không thể lưu cập nhật chức năng.");
      return;
    }

    // Success
    setLockVersion(res.newLockVersion ?? lockVersion + 1);
    setDraft((prev) => ({
      ...prev,
      features: editingSelectedFeatures.map((id) => ({ id, version: 1 })),
    }));
    setIsEditingFeatures(false);
    // Clear previous validation results since features changed
    setValidationResults(null);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    const res = await validateDraftAction(draft.appId);
    setIsValidating(false);

    if (res.ok) {
      setValidationResults({
        tested: true,
        valid: res.valid,
        issues: res.issues,
      });
    } else {
      setValidationResults({
        tested: true,
        valid: false,
        issues: [{ code: "VALIDATION_FAILED", path: "/", message: res.error || "Lỗi kiểm tra bản nháp." }],
      });
    }
  };

  const startingPointLabel =
    draft.startingPoint === "erp"
      ? "Bắt đầu với ERP"
      : draft.startingPoint === "crm"
        ? "Bắt đầu với CRM"
        : draft.startingPoint === "blank"
          ? "Tạo từ trống"
          : "Không ghi nhận lối vào";

  return (
    <div className="page app-summary-view">
      {/* Banner Mock mode */}
      {isMockMode && (
        <div className="info-banner" role="status" style={{ marginBottom: 20 }}>
          <div>
            <strong>MẪU THỬ</strong> – Dữ liệu được lưu trong bộ nhớ máy chủ và sẽ mất khi khởi động lại máy chủ.
          </div>
        </div>
      )}

      {/* Header */}
      <header className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>QUẢN TRỊ BẢN NHÁP v2.5</span>
            <span className="badge" style={{ fontSize: 11, background: "var(--ws-soft)", color: "var(--ws-teal)" }}>
              Khóa: v{lockVersion}
            </span>
          </div>
          <h1 style={{ margin: "4px 0" }}>{draft.name}</h1>
          <p style={{ color: "var(--ws-muted)", margin: 0 }}>
            Lối vào khởi tạo: <strong>{startingPointLabel}</strong> · Phiên bản: <strong>v{draft.version}</strong>
          </p>
        </div>
        <div className="page-header-actions" style={{ display: "flex", gap: 10 }}>
          <Link href="/builder" className="button secondary">
            ← Danh sách ứng dụng
          </Link>
          <button
            type="button"
            className="button primary"
            onClick={handleValidate}
            disabled={isValidating}
          >
            {isValidating ? "Đang kiểm tra..." : "Kiểm tra bản nháp"}
          </button>
        </div>
      </header>

      {/* Cảnh báo nháp rỗng */}
      {selectedIds.length === 0 && (
        <div className="info-banner" role="alert" style={{ borderColor: "var(--ws-warning)", marginBottom: 24 }}>
          <div>
            ⚠️ <strong>Chưa thể xuất bản:</strong> Cần chọn ít nhất một chức năng nghiệp vụ để có thể xuất bản ứng dụng.
          </div>
        </div>
      )}

      {/* Kết quả kiểm tra (Validation Results) */}
      {validationResults && (
        <div
          className="panel validation-results-panel"
          style={{
            padding: 20,
            marginBottom: 24,
            borderRadius: 8,
            border: validationResults.valid ? "1px solid var(--ws-teal)" : "1px solid var(--ws-danger)",
            background: validationResults.valid ? "var(--ws-soft, #f0fdf4)" : "rgba(220, 38, 38, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{validationResults.valid ? "✅" : "❌"}</span>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              {validationResults.valid
                ? "Chức năng hợp lệ. Cần thiết kế trang giao diện trước khi xuất bản."
                : "Phát hiện vấn đề cần giải quyết"}
            </h3>
          </div>

          {!validationResults.valid && validationResults.issues.length > 0 && (
            <ul style={{ margin: "12px 0 0", paddingLeft: 20, color: "var(--ws-danger)" }}>
              {validationResults.issues.map((issue, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <strong>{formatIssuePath(issue.path, draft.features)}:</strong> {issue.message}{" "}
                  <small style={{ fontSize: 11, opacity: 0.75 }} title={`Mã lỗi: ${issue.code}`}>
                    ({issue.code})
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Danh sách chức năng đã chọn */}
      <section className="panel" style={{ padding: 24, borderRadius: 8, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            Chức năng đã cấu hình ({selectedIds.length})
          </h2>
          <button
            type="button"
            className="button secondary"
            onClick={handleOpenEdit}
          >
            Sửa chức năng
          </button>
        </div>

        {selectedIds.length === 0 ? (
          <p style={{ color: "var(--ws-muted)", fontStyle: "italic", margin: "12px 0" }}>
            Chưa có chức năng nào được chọn. Nhấp vào nút &quot;Sửa chức năng&quot; để thêm chức năng nghiệp vụ.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {selectedIds.map((featId) => {
              const feat = catalogFeatures.find((f) => f.id === featId);
              return (
                <div
                  key={featId}
                  style={{
                    padding: 16,
                    border: "1px solid var(--ws-line)",
                    borderRadius: 6,
                    background: "var(--ws-surface)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      {feat?.label || getFeatureLabel(featId)}
                    </span>
                    <code style={{ fontSize: 12, color: "var(--ws-muted)" }}>{featId}</code>
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--ws-muted)" }}>
                    {feat?.description || getFeatureDescription(featId)}
                  </p>
                  {feat && (
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--ws-muted)" }}>
                      <span>📁 <strong>Tài nguyên:</strong> {feat.resources.join(", ")}</span>
                      <span>⚡ <strong>Hành động:</strong> {feat.actions.join(", ")}</span>
                      {feat.dependencies.length > 0 && (
                        <span>🔗 <strong>Phụ thuộc:</strong> {feat.dependencies.map((d) => getFeatureLabel(d)).join(", ")}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Thông tin kỹ thuật */}
      <section className="panel" style={{ padding: 20, borderRadius: 8, background: "var(--ws-surface)" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--ws-muted)" }}>THÔNG TIN KỸ THUẬT BẢN NHÁP</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, fontSize: 13 }}>
          <div>
            <span style={{ color: "var(--ws-muted)" }}>Mã ứng dụng (ID): </span>
            <code>{draft.appId}</code>
          </div>
          <div>
            <span style={{ color: "var(--ws-muted)" }}>Phiên bản Schema: </span>
            <code>{draft.schemaVersion}</code>
          </div>
          <div>
            <span style={{ color: "var(--ws-muted)" }}>Phiên bản khóa: </span>
            <code>v{lockVersion}</code>
          </div>
        </div>
      </section>

      {/* MODAL SỬA CHỨC NĂNG */}
      <ConfirmDialog
        isOpen={isEditingFeatures}
        onClose={() => setIsEditingFeatures(false)}
        title="Chỉnh sửa chức năng ứng dụng"
        showCloseButton={!isSaving}
        maxWidth={640}
      >
        <div>
          {saveError && (
            <div
              className="info-banner"
              role="alert"
              style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}
            >
              <div style={{ color: "var(--ws-danger)" }}>
                <strong>Lỗi:</strong> {saveError}
              </div>
              {isConflict && (
                <button
                  type="button"
                  className="button secondary"
                  style={{ marginTop: 8 }}
                  onClick={() => router.refresh()}
                >
                  Tải lại trang ngay
                </button>
              )}
            </div>
          )}

          <div style={{ display: "grid", gap: 12, marginBottom: 24, maxHeight: "55vh", overflowY: "auto" }}>
            {catalogFeatures.map((feat) => {
              const isSelected = editingSelectedFeatures.includes(feat.id);
              const isSupported = feat.status === "supported";

              return (
                <label
                  key={feat.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: 12,
                    border: "1px solid var(--ws-line)",
                    borderRadius: 6,
                    background: isSelected ? "var(--ws-soft, #f0fdfa)" : "var(--ws-surface)",
                    cursor: isSupported ? "pointer" : "not-allowed",
                    opacity: isSupported ? 1 : 0.6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isSupported}
                    onChange={() => handleToggleEditFeature(feat.id)}
                    style={{ marginTop: 4, width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {feat.label || getFeatureLabel(feat.id)}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ws-muted)" }}>
                      {feat.description || getFeatureDescription(feat.id)}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => setIsEditingFeatures(false)}
              disabled={isSaving}
              data-autofocus="true"
            >
              Hủy
            </button>
            <button
              type="button"
              className="button primary"
              onClick={handleSaveFeatures}
              disabled={isSaving}
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
