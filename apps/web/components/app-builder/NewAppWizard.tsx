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
  CatalogFeature,
  CatalogPreset,
  FeatureId,
  StartingPoint,
} from "../../lib/app-config/types";
import { APP_KEY_REGEX } from "../../lib/app-config/types";
import {
  getFeatureLabel,
  getFeatureDescription,
  getDomainLabel,
} from "../../lib/app-config/feature-labels";
import {
  getMissingDependencies,
  getAffectedDependents,
} from "../../lib/app-config/dependencies";
import { createAppWithFeaturesAction } from "../../lib/app-config/actions";
import { useUnsavedChangesGuard } from "../../lib/tenant/useUnsavedChangesGuard";
import ConfirmDialog from "../common/ConfirmDialog";

interface NewAppWizardProps {
  initialFeatures: CatalogFeature[];
  initialPresets: CatalogPreset[];
  tenantName?: string;
  isMockMode?: boolean;
}

type WizardStep = 1 | 2 | 3;

function generateAppKey(name: string): string {
  const normalized = name
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[^a-z]+/, "")
    .slice(0, 60);

  return normalized || "ung_dung_moi";
}

export default function NewAppWizard({
  initialFeatures,
  initialPresets,
  tenantName = "Doanh nghiệp hiện tại",
  isMockMode = true,
}: NewAppWizardProps) {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [startingPoint, setStartingPoint] = useState<StartingPoint>("erp");
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureId[]>([
    "erp.materials",
    "erp.purchase_requests",
    "erp.inventory",
  ]);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Form metadata
  const [appName, setAppName] = useState<string>("");
  const [appKey, setAppKey] = useState<string>("");
  const [appKeyManuallyEdited, setAppKeyManuallyEdited] = useState<boolean>(false);

  // Dialog / Modal state
  const [pendingStartingPoint, setPendingStartingPoint] = useState<StartingPoint | null>(null);
  const [missingDepPrompt, setMissingDepPrompt] = useState<{
    feature: FeatureId;
    missing: FeatureId[];
  } | null>(null);
  const [removalWarning, setRemovalWarning] = useState<{
    feature: FeatureId;
    affected: FeatureId[];
  } | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [appKeyConflict, setAppKeyConflict] = useState<boolean>(false);
  const [patchWarning, setPatchWarning] = useState<string | null>(null);

  // Guard against accidental tenant switch or page navigation when wizard has selections
  const hasUnsavedSelections =
    !isSubmitting &&
    (selectedFeatures.length > 0 || appName.trim().length > 0 || isDirty);
  useUnsavedChangesGuard({
    isDirty: hasUnsavedSelections,
    message:
      "Bạn có thay đổi chưa lưu trong ứng dụng đang tạo. Bạn có chắc muốn rời đi không?",
  });

  // Group features by domain
  const domains = Array.from(
    new Set(initialFeatures.map((f) => f.domain || "erp")),
  );

  const handleSelectStartingPoint = (point: StartingPoint) => {
    if (point === startingPoint && currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (isDirty) {
      setPendingStartingPoint(point);
      return;
    }

    applyStartingPointPreset(point);
    setCurrentStep(2);
  };

  const applyStartingPointPreset = (point: StartingPoint) => {
    setStartingPoint(point);
    const preset = initialPresets.find((p) => p.id === point);
    const suggested = preset ? [...preset.suggestedFeatures] : [];
    setSelectedFeatures(suggested);
    setIsDirty(false);
  };

  const handleKeepCurrentChoices = () => {
    if (pendingStartingPoint) {
      setStartingPoint(pendingStartingPoint);
    }
    setPendingStartingPoint(null);
    setCurrentStep(2);
  };

  const handleResetToPreset = () => {
    if (pendingStartingPoint) {
      applyStartingPointPreset(pendingStartingPoint);
    }
    setPendingStartingPoint(null);
    setCurrentStep(2);
  };

  const handleToggleFeature = (featureId: FeatureId) => {
    const isCurrentlySelected = selectedFeatures.includes(featureId);

    if (isCurrentlySelected) {
      // Removing feature: check if other selected features depend on it
      const affected = getAffectedDependents(
        featureId,
        selectedFeatures,
        initialFeatures,
      );
      if (affected.length > 0) {
        setRemovalWarning({ feature: featureId, affected });
        return;
      }

      setSelectedFeatures((prev) => prev.filter((id) => id !== featureId));
      setIsDirty(true);
    } else {
      // Adding feature: check if it has missing dependencies
      const missing = getMissingDependencies(
        [featureId],
        initialFeatures,
      ).filter((id) => !selectedFeatures.includes(id));

      if (missing.length > 0) {
        setMissingDepPrompt({ feature: featureId, missing });
        return;
      }

      setSelectedFeatures((prev) => [...prev, featureId]);
      setIsDirty(true);
    }
  };

  const confirmRemoval = () => {
    if (!removalWarning) return;
    const { feature } = removalWarning;
    setSelectedFeatures((prev) => prev.filter((id) => id !== feature));
    setIsDirty(true);
    setRemovalWarning(null);
  };

  const confirmAddWithDependencies = () => {
    if (!missingDepPrompt) return;
    const { feature, missing } = missingDepPrompt;
    setSelectedFeatures((prev) => Array.from(new Set([...prev, feature, ...missing])));
    setIsDirty(true);
    setMissingDepPrompt(null);
  };

  const confirmAddWithoutDependencies = () => {
    if (!missingDepPrompt) return;
    const { feature } = missingDepPrompt;
    setSelectedFeatures((prev) => [...prev, feature]);
    setIsDirty(true);
    setMissingDepPrompt(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAppName(val);
    setSubmitError(null);
    if (!appKeyManuallyEdited) {
      setAppKey(generateAppKey(val));
      setAppKeyConflict(false);
    }
  };

  const handleAppKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppKey(e.target.value.toLowerCase().trim());
    setAppKeyManuallyEdited(true);
    setAppKeyConflict(false);
    setSubmitError(null);
  };

  const isValidAppKey = APP_KEY_REGEX.test(appKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setAppKeyConflict(false);
    setPatchWarning(null);

    if (!appName.trim()) {
      setSubmitError("Vui lòng nhập tên ứng dụng.");
      return;
    }

    if (!isValidAppKey) {
      setSubmitError(
        "Mã ứng dụng không hợp lệ (từ 2-64 ký tự, chữ thường không dấu, bắt đầu bằng chữ).",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createAppWithFeaturesAction({
        name: appName.trim(),
        appKey,
        startingPoint,
        selectedFeatures,
      });

      if (!res.ok) {
        setIsSubmitting(false);
        if (res.code === "APP_KEY_CONFLICT") {
          setAppKeyConflict(true);
        } else {
          setSubmitError(res.error || "Không thể tạo ứng dụng.");
        }
        return;
      }

      if (res.patchFailed && res.message) {
        setPatchWarning(res.message);
      }

      // Redirect to builder app page
      router.push(`/builder/${res.appId}`);
    } catch {
      setIsSubmitting(false);
      setSubmitError("Đã xảy ra lỗi không mong muốn khi lưu ứng dụng.");
    }
  };

  return (
    <div className="new-app-wizard">
      {/* Banner chế độ mock */}
      {isMockMode && (
        <div className="info-banner" role="status" style={{ marginBottom: 24 }}>
          <div>
            <strong>MẪU THỬ</strong> – Dữ liệu được lưu trong bộ nhớ máy chủ và sẽ mất khi khởi động lại máy chủ.
          </div>
        </div>
      )}

      {/* Stepper */}
      <nav className="flow-stepper" aria-label="Các bước tạo ứng dụng">
        <div
          className={`flow-stage ${currentStep === 1 ? "active" : currentStep > 1 ? "complete" : ""}`}
          onClick={() => setCurrentStep(1)}
          style={{ cursor: "pointer" }}
        >
          <span className="flow-stage-num">{currentStep > 1 ? "✓" : "01"}</span>
          <b className="flow-stage-label">Lối vào</b>
        </div>
        <div
          className={`flow-stage ${currentStep === 2 ? "active" : currentStep > 2 ? "complete" : ""}`}
          onClick={() => setCurrentStep(2)}
          style={{ cursor: "pointer" }}
        >
          <span className="flow-stage-num">{currentStep > 2 ? "✓" : "02"}</span>
          <b className="flow-stage-label">Chọn chức năng</b>
        </div>
        <div
          className={`flow-stage ${currentStep === 3 ? "active" : ""}`}
          onClick={() => setCurrentStep(3)}
          style={{ cursor: "pointer" }}
        >
          <span className="flow-stage-num">03</span>
          <b className="flow-stage-label">Thông tin app</b>
        </div>
      </nav>

      {/* BƯỚC 1: CHỌN LỐI VÀO */}
      {currentStep === 1 && (
        <section aria-labelledby="step1-heading" className="wizard-step-panel">
          <header className="page-header" style={{ marginBottom: 20 }}>
            <div>
              <div className="eyebrow">BƯỚC 01 / 03</div>
              <h2 id="step1-heading">Chọn lối vào khởi tạo</h2>
              <p>
                Khởi tạo ứng dụng composable mới trong <strong>{tenantName}</strong>
              </p>
            </div>
          </header>

          <div className="panel" style={{ padding: 16, marginBottom: 24, background: "var(--ws-surface)" }}>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ws-muted)" }}>
              💡 <strong>Lưu ý:</strong> Các lối vào dưới đây là <strong>gợi ý ban đầu</strong> giúp bạn thiết lập nhanh danh sách chức năng cần dùng. Lối vào này <em>không cố định hay khóa loại ứng dụng</em>, bạn hoàn toàn có thể tự do thêm hoặc bỏ bớt bất kỳ chức năng nào ở bước tiếp theo.
            </p>
          </div>

          <div
            className="starting-points-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
              marginBottom: 32,
            }}
          >
            {/* Card 1: ERP */}
            <div
              className={`panel card-select ${startingPoint === "erp" ? "selected" : ""}`}
              style={{
                padding: 24,
                cursor: "pointer",
                border: startingPoint === "erp" ? "2px solid var(--ws-teal)" : "1px solid var(--ws-line)",
                boxShadow: startingPoint === "erp" ? "0 0 0 1px var(--ws-teal)" : undefined,
                borderRadius: 8,
              }}
              tabIndex={0}
              role="button"
              aria-pressed={startingPoint === "erp"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectStartingPoint("erp");
                }
              }}
              onClick={() => handleSelectStartingPoint("erp")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>📦</span>
                <h3 style={{ margin: 0, fontSize: 18 }}>Bắt đầu với ERP</h3>
              </div>
              <p style={{ fontSize: 14, color: "var(--ws-muted)", marginBottom: 16 }}>
                Gợi ý sẵn bộ 3 chức năng quản lý nguồn lực cơ bản: Vật tư, Yêu cầu mua hàng và Quản lý kho.
              </p>
              <ul style={{ fontSize: 13, paddingLeft: 18, color: "var(--ws-muted)" }}>
                <li>Quản lý danh mục vật tư</li>
                <li>Đề xuất & duyệt mua hàng</li>
                <li>Phiếu nhập kho & tồn kho</li>
              </ul>
              <div style={{ marginTop: 20 }}>
                <span className="button secondary full-width" style={{ textAlign: "center" }}>
                  {startingPoint === "erp" ? "Đang chọn ✓" : "Chọn ERP"}
                </span>
              </div>
            </div>

            {/* Card 2: CRM */}
            <div
              className={`panel card-select ${startingPoint === "crm" ? "selected" : ""}`}
              style={{
                padding: 24,
                cursor: "pointer",
                border: startingPoint === "crm" ? "2px solid var(--ws-teal)" : "1px solid var(--ws-line)",
                boxShadow: startingPoint === "crm" ? "0 0 0 1px var(--ws-teal)" : undefined,
                borderRadius: 8,
              }}
              tabIndex={0}
              role="button"
              aria-pressed={startingPoint === "crm"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectStartingPoint("crm");
                }
              }}
              onClick={() => handleSelectStartingPoint("crm")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>🤝</span>
                <h3 style={{ margin: 0, fontSize: 18 }}>Bắt đầu với CRM</h3>
              </div>
              <p style={{ fontSize: 14, color: "var(--ws-muted)", marginBottom: 16 }}>
                Gợi ý sẵn bộ 2 chức năng quản lý quan hệ khách hàng và quy trình cơ hội bán hàng.
              </p>
              <ul style={{ fontSize: 13, paddingLeft: 18, color: "var(--ws-muted)" }}>
                <li>Quản lý khách hàng & liên hệ</li>
                <li>Theo dõi cơ hội & giai đoạn bán</li>
              </ul>
              <div style={{ marginTop: 20 }}>
                <span className="button secondary full-width" style={{ textAlign: "center" }}>
                  {startingPoint === "crm" ? "Đang chọn ✓" : "Chọn CRM"}
                </span>
              </div>
            </div>

            {/* Card 3: BLANK */}
            <div
              className={`panel card-select ${startingPoint === "blank" ? "selected" : ""}`}
              style={{
                padding: 24,
                cursor: "pointer",
                border: startingPoint === "blank" ? "2px solid var(--ws-teal)" : "1px solid var(--ws-line)",
                boxShadow: startingPoint === "blank" ? "0 0 0 1px var(--ws-teal)" : undefined,
                borderRadius: 8,
              }}
              tabIndex={0}
              role="button"
              aria-pressed={startingPoint === "blank"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectStartingPoint("blank");
                }
              }}
              onClick={() => handleSelectStartingPoint("blank")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>✨</span>
                <h3 style={{ margin: 0, fontSize: 18 }}>Tạo từ trống</h3>
              </div>
              <p style={{ fontSize: 14, color: "var(--ws-muted)", marginBottom: 16 }}>
                Không chọn sẵn chức năng nào. Bạn tự do chọn chính xác các mô-đun phù hợp với nhu cầu.
              </p>
              <ul style={{ fontSize: 13, paddingLeft: 18, color: "var(--ws-muted)" }}>
                <li>Danh sách chức năng hoàn toàn rỗng</li>
                <li>Tự chọn chức năng và kiểm tra phụ thuộc</li>
              </ul>
              <div style={{ marginTop: 20 }}>
                <span className="button secondary full-width" style={{ textAlign: "center" }}>
                  {startingPoint === "blank" ? "Đang chọn ✓" : "Chọn Từ trống"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
            <Link href="/builder" className="button secondary">
              ← Hủy và về danh sách
            </Link>
            <button
              type="button"
              className="button primary"
              onClick={() => setCurrentStep(2)}
            >
              Tiếp tục: Chọn chức năng →
            </button>
          </div>
        </section>
      )}

      {/* BƯỚC 2: CHỌN CHỨC NĂNG */}
      {currentStep === 2 && (
        <section aria-labelledby="step2-heading" className="wizard-step-panel">
          <header className="page-header" style={{ marginBottom: 20 }}>
            <div>
              <div className="eyebrow">BƯỚC 02 / 03</div>
              <h2 id="step2-heading">Lựa chọn chức năng nghiệp vụ</h2>
              <p>
                Chọn các chức năng mà ứng dụng sẽ cung cấp. Bạn có thể bật hoặc bỏ chọn bất kỳ lúc nào.
              </p>
            </div>
            <div className="page-header-actions">
              <span className="badge" style={{ fontSize: 13, padding: "6px 12px" }}>
                {`Đã chọn: ${selectedFeatures.length} chức năng`}
              </span>
            </div>
          </header>

          {domains.map((dom) => {
            const domainFeatures = initialFeatures.filter((f) => f.domain === dom);
            if (domainFeatures.length === 0) return null;

            return (
              <div key={dom} style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, borderBottom: "1px solid var(--ws-line)", paddingBottom: 8, marginBottom: 16 }}>
                  {getDomainLabel(dom)}
                </h3>

                <div style={{ display: "grid", gap: 16 }}>
                  {domainFeatures.map((feat) => {
                    const isSelected = selectedFeatures.includes(feat.id);
                    const isSupported = feat.status === "supported";

                    return (
                      <div
                        key={feat.id}
                        className={`panel feature-card ${isSelected ? "selected" : ""}`}
                        style={{
                          padding: 16,
                          borderRadius: 8,
                          border: isSelected ? "2px solid var(--ws-teal)" : "1px solid var(--ws-line)",
                          background: isSupported ? "var(--ws-surface)" : "var(--ws-canvas)",
                          opacity: isSupported ? 1 : 0.6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                          <input
                            type="checkbox"
                            id={`feat-check-${feat.id}`}
                            checked={isSelected}
                            disabled={!isSupported}
                            onChange={() => handleToggleFeature(feat.id)}
                            style={{ marginTop: 4, width: 18, height: 18, cursor: isSupported ? "pointer" : "not-allowed" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                              <label
                                htmlFor={`feat-check-${feat.id}`}
                                style={{
                                  fontWeight: 600,
                                  fontSize: 16,
                                  cursor: isSupported ? "pointer" : "not-allowed",
                                }}
                              >
                                {feat.label || getFeatureLabel(feat.id)}
                              </label>
                              <code style={{ fontSize: 12, color: "var(--ws-muted)" }}>{feat.id}</code>
                              {!isSupported && (
                                <span className="badge warning" style={{ fontSize: 11 }}>
                                  {feat.status}
                                </span>
                              )}
                            </div>

                            <p style={{ margin: "4px 0 10px", fontSize: 14, color: "var(--ws-muted)" }}>
                              {feat.description || getFeatureDescription(feat.id)}
                            </p>

                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--ws-muted)" }}>
                              <span>
                                📁 <strong>Tài nguyên:</strong> {feat.resources.join(", ")}
                              </span>
                              <span>
                                ⚡ <strong>Hành động:</strong> {feat.actions.join(", ")}
                              </span>
                              {feat.dependencies.length > 0 && (
                                <span>
                                  🔗 <strong>Phụ thuộc:</strong>{" "}
                                  <span style={{ color: "var(--ws-teal)" }}>
                                    {feat.dependencies.map((d) => getFeatureLabel(d)).join(", ")}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => setCurrentStep(1)}
            >
              ← Quay lại lối vào
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => setCurrentStep(3)}
            >
              Tiếp tục: Thông tin ứng dụng →
            </button>
          </div>
        </section>
      )}

      {/* BƯỚC 3: THÔNG TIN ỨNG DỤNG */}
      {currentStep === 3 && (
        <section aria-labelledby="step3-heading" className="wizard-step-panel">
          <header className="page-header" style={{ marginBottom: 20 }}>
            <div>
              <div className="eyebrow">BƯỚC 03 / 03</div>
              <h2 id="step3-heading">Thông tin ứng dụng</h2>
              <p>Hoàn tất đặt tên và mã định danh để khởi tạo bản nháp v2.5</p>
            </div>
          </header>

          {/* Tóm tắt lựa chọn */}
          <div className="panel" style={{ padding: 18, marginBottom: 24, borderRadius: 8 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Tóm tắt lựa chọn:</h3>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14, marginBottom: 12 }}>
              <div>
                <span style={{ color: "var(--ws-muted)" }}>Lối vào: </span>
                <strong>
                  {startingPoint === "erp"
                    ? "Bắt đầu với ERP"
                    : startingPoint === "crm"
                      ? "Bắt đầu với CRM"
                      : "Tạo từ trống"}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--ws-muted)" }}>Số chức năng đã chọn: </span>
                <strong>{selectedFeatures.length} chức năng</strong>
              </div>
            </div>

            {selectedFeatures.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedFeatures.map((id) => (
                  <span
                    key={id}
                    className="badge"
                    style={{ background: "var(--ws-soft)", color: "var(--ws-ink)", fontSize: 12, padding: "4px 8px" }}
                  >
                    ✓ {getFeatureLabel(id)}
                  </span>
                ))}
              </div>
            ) : (
              <div className="info-banner" role="status" style={{ marginTop: 8 }}>
                <div>
                  <strong>Thông báo:</strong> Bạn đang tạo <em>bản nháp rỗng</em> (chưa chọn chức năng nào). Bản nháp này vẫn lưu được, nhưng sẽ cần bổ sung chức năng trước khi có thể xuất bản.
                </div>
              </div>
            )}
          </div>

          {submitError && (
            <div className="info-banner" role="alert" style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}>
              <div style={{ color: "var(--ws-danger)" }}>
                <strong>Lỗi:</strong> {submitError}
              </div>
            </div>
          )}

          {patchWarning && (
            <div className="info-banner" role="status" style={{ borderColor: "var(--ws-warning)", marginBottom: 16 }}>
              <div>
                <strong>Cảnh báo:</strong> {patchWarning}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Tên ứng dụng */}
            <div>
              <label htmlFor="app-name-input" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Tên ứng dụng <span style={{ color: "var(--ws-danger)" }}>*</span>
              </label>
              <input
                id="app-name-input"
                type="text"
                required
                maxLength={120}
                placeholder="Ví dụ: Quản lý mua sắm nội bộ"
                value={appName}
                onChange={handleNameChange}
                className="input"
                style={{ width: "100%", padding: "10px 12px", fontSize: 15 }}
                disabled={isSubmitting}
              />
              <span style={{ fontSize: 12, color: "var(--ws-muted)", marginTop: 4, display: "block" }}>
                Tối đa 120 ký tự.
              </span>
            </div>

            {/* Mã ứng dụng (appKey) */}
            <div>
              <label htmlFor="app-key-input" style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
                Mã định danh ứng dụng (appKey) <span style={{ color: "var(--ws-danger)" }}>*</span>
              </label>
              <input
                id="app-key-input"
                type="text"
                required
                placeholder="Ví dụ: quan_ly_mua_sam"
                value={appKey}
                onChange={handleAppKeyChange}
                className="input"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 15,
                  borderColor: appKeyConflict || (appKey && !isValidAppKey) ? "var(--ws-danger)" : undefined,
                }}
                disabled={isSubmitting}
              />

              {appKeyConflict ? (
                <span style={{ color: "var(--ws-danger)", fontSize: 13, marginTop: 4, display: "block" }}>
                  ⚠️ Mã ứng dụng &quot;{appKey}&quot; đã tồn tại trong doanh nghiệp. Vui lòng chọn mã khác.
                </span>
              ) : appKey && !isValidAppKey ? (
                <span style={{ color: "var(--ws-danger)", fontSize: 13, marginTop: 4, display: "block" }}>
                  Mã ứng dụng không hợp lệ. Cần từ 2-64 ký tự, chữ thường không dấu, bắt đầu bằng chữ (ví dụ: <code>quan_ly_vat_tu</code>).
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "var(--ws-muted)", marginTop: 4, display: "block" }}>
                  Mã định danh duy nhất trong doanh nghiệp. Tự sinh từ tên và có thể chỉnh sửa tự do.
                </span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setCurrentStep(2)}
                disabled={isSubmitting}
              >
                ← Quay lại chọn chức năng
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={isSubmitting || !appName.trim() || !isValidAppKey}
              >
                {isSubmitting ? "Đang lưu bản nháp..." : "Lưu bản nháp"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* MODAL 1: XÁC NHẬN ĐỔI LỐI VÀO SAU KHI ĐÃ SỬA CHỨC NĂNG */}
      <ConfirmDialog
        isOpen={Boolean(pendingStartingPoint)}
        title="Thay đổi lối vào khởi tạo"
        onClose={() => setPendingStartingPoint(null)}
      >
        <p style={{ fontSize: 14, color: "var(--ws-muted)", marginBottom: 20, lineHeight: 1.5 }}>
          Bạn đã tùy chỉnh danh sách chức năng khác với gợi ý ban đầu. Khi chuyển sang lối vào mới, bạn muốn giữ cấu hình hiện tại hay đặt lại theo gợi ý của lối vào mới?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            className="button primary"
            onClick={handleKeepCurrentChoices}
            data-autofocus="true"
          >
            Giữ lựa chọn hiện tại
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={handleResetToPreset}
          >
            Đặt lại theo gợi ý lối vào mới
          </button>
          <button
            type="button"
            className="button"
            style={{ background: "transparent", border: "none", color: "var(--ws-muted)" }}
            onClick={() => setPendingStartingPoint(null)}
          >
            Hủy thay đổi
          </button>
        </div>
      </ConfirmDialog>

      {/* MODAL 2: GỢI Ý BẬT KÈM PHỤ THUỘC */}
      <ConfirmDialog
        isOpen={Boolean(missingDepPrompt)}
        title="Gợi ý bật kèm chức năng phụ thuộc"
        onClose={() => setMissingDepPrompt(null)}
      >
        {missingDepPrompt && (
          <div>
            <p style={{ fontSize: 14, color: "var(--ws-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              Chức năng <strong>{getFeatureLabel(missingDepPrompt.feature)}</strong> yêu cầu các chức năng phụ thuộc sau để hoạt động hoàn chỉnh:
            </p>
            <ul style={{ fontSize: 14, marginBottom: 20, paddingLeft: 20, color: "var(--ws-teal)" }}>
              {missingDepPrompt.missing.map((dep) => (
                <li key={dep}>
                  <strong>{getFeatureLabel(dep)}</strong> (<code>{dep}</code>)
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="button secondary"
                onClick={confirmAddWithoutDependencies}
              >
                Chỉ bật chức năng này
              </button>
              <button
                type="button"
                className="button primary"
                onClick={confirmAddWithDependencies}
                data-autofocus="true"
              >
                Bật kèm phụ thuộc
              </button>
            </div>
          </div>
        )}
      </ConfirmDialog>

      {/* MODAL 3: CẢNH BÁO BỎ CHỨC NĂNG ĐANG LÀ PHỤ THUỘC */}
      <ConfirmDialog
        isOpen={Boolean(removalWarning)}
        title="⚠️ Cảnh báo phụ thuộc"
        onClose={() => setRemovalWarning(null)}
        style={{ borderColor: "var(--ws-warning)" }}
      >
        {removalWarning && (
          <div>
            <p style={{ fontSize: 14, color: "var(--ws-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              Bỏ chọn <strong>{getFeatureLabel(removalWarning.feature)}</strong> sẽ ảnh hưởng đến các chức năng sau đang phụ thuộc vào nó:
            </p>
            <ul style={{ fontSize: 14, marginBottom: 20, paddingLeft: 20, color: "var(--ws-danger)" }}>
              {removalWarning.affected.map((aff) => (
                <li key={aff}>
                  <strong>{getFeatureLabel(aff)}</strong> (<code>{aff}</code>)
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setRemovalWarning(null)}
                data-autofocus="true"
              >
                Giữ lại
              </button>
              <button
                type="button"
                className="button danger"
                onClick={confirmRemoval}
              >
                Xác nhận bỏ chọn
              </button>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
