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

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { NormalizeResult } from "../../lib/builder/actions";
import {
  formatUnhandledExceptionVi,
  getValidationMessageVi,
} from "../../lib/builder/validation-messages";

interface NormalizeViewProps {
  appId: string;
  tenantId: string;
  appName: string;
  version: number;
}

interface SourceSegment {
  id: string;
  section: string;
  text: string;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function NormalizeView({
  appId,
  tenantId,
}: NormalizeViewProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const rawNormalize = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(`ws_normalize_${tenantId}_${appId}`) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );

  const rawSource = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(`ws_source_${tenantId}_${appId}`) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );

  let normalizeData: NormalizeResult | null = null;
  if (rawNormalize) {
    try {
      normalizeData = JSON.parse(rawNormalize);
    } catch {
      normalizeData = null;
    }
  }

  let sourceSections: Record<string, string> = {};
  let sourceSegments: SourceSegment[] = [];
  let sourceRevisionNo: number | null = null;

  if (rawSource) {
    try {
      const parsed = JSON.parse(rawSource);
      if (parsed.sections) sourceSections = parsed.sections;
      if (Array.isArray(parsed.segments)) sourceSegments = parsed.segments;
      if (typeof parsed.revisionNo === "number") sourceRevisionNo = parsed.revisionNo;
    } catch {
      sourceSections = {};
      sourceSegments = [];
    }
  }

  const definition = normalizeData?.definition;
  const openIssues = normalizeData?.openIssues || [];
  const blockingIssues = openIssues.filter((i) => i.blocking);
  const warningIssues = openIssues.filter((i) => !i.blocking);

  const activeMapping = selectedTargetId
    ? normalizeData?.sourceMappings?.find((m) => m.targetId === selectedTargetId)
    : null;
  const activeSegmentIds = activeMapping?.segmentIds ?? [];

  const handleSelectTarget = (targetId: string) => {
    setSelectedTargetId(targetId);
    const mapping = normalizeData?.sourceMappings?.find(
      (m) => m.targetId === targetId,
    );
    const segIds = mapping?.segmentIds || [];
    if (segIds.length > 0) {
      const el = document.getElementById(`source-seg-${segIds[0]}`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return (
    <div>
      <div className="info-banner" role="status">
        <div>
          <b>Bản nháp do hệ thống chuẩn hóa — chưa có hiệu lực</b>
          <p style={{ margin: "4px 0 0" }}>
            Hãy đối chiếu với mô tả gốc trước khi kiểm tra. Bạn có thể chuyển sang
            bước Chỉnh sửa để bổ sung hoặc tinh chỉnh các trường và vai trò.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <span style={{ fontSize: 11, color: "var(--ws-muted)", overflowWrap: "break-word", wordBreak: "break-word" }}>
            Bản mô tả số {sourceRevisionNo ?? 1} · Lần lưu bản nháp {normalizeData?.revisionNo ?? 1} · Phiên bản khóa {normalizeData?.lockVersion ?? 1}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/builder/${appId}?step=source`} className="button secondary">
            ← Nhập lại mô tả
          </Link>
          <Link href={`/builder/${appId}?step=edit`} className="button primary">
            Sửa thủ công →
          </Link>
        </div>
      </div>

      {/* Issues block if any */}
      {openIssues.length > 0 && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <div>
              <h2>Vấn đề cần lưu ý từ mô tả</h2>
              <p>Các nội dung chưa thể chuẩn hóa hoàn toàn hoặc cần bạn xác nhận</p>
            </div>
            <span className={`status ${blockingIssues.length > 0 ? "danger" : "warning"}`}>
              {blockingIssues.length > 0 ? "Cần bổ sung" : "Cần lưu ý"}
            </span>
          </div>
          <div className="panel-body">
            {blockingIssues.map((issue, idx) => (
              <div key={`b-${idx}`} className="flow-issue blocking">
                <b>[Cần bổ sung] {issue.code}</b>
                <p>
                  {issue.code === "UNHANDLED_EXCEPTION_NOTE"
                    ? formatUnhandledExceptionVi(issue.message)
                    : getValidationMessageVi(issue, definition)}
                </p>
              </div>
            ))}
            {warningIssues.map((issue, idx) => (
              <div key={`w-${idx}`} className="flow-issue">
                <b>[Cần lưu ý] {issue.code}</b>
                <p>
                  {issue.code === "UNHANDLED_EXCEPTION_NOTE"
                    ? formatUnhandledExceptionVi(issue.message)
                    : getValidationMessageVi(issue, definition)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Comparison */}
      <div className="flow-compare">
        {/* Left Column: Source text */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Mô tả nguồn gốc</h2>
              <p>Nội dung nghiệp vụ bạn đã nhập</p>
            </div>
          </div>
          <div className="panel-body">
            {sourceSegments.length > 0 ? (
              sourceSegments.map((seg) => {
                const isHighlighted = activeSegmentIds.includes(seg.id);
                return (
                  <div
                    key={seg.id}
                    id={`source-seg-${seg.id}`}
                    className={`flow-source-block ${isHighlighted ? "highlighted" : ""}`}
                    style={{
                      transition: "all 0.2s ease",
                      border: isHighlighted
                        ? "2px solid var(--ws-teal, #1c7c7d)"
                        : "1px solid var(--ws-border, #d9e2ec)",
                      backgroundColor: isHighlighted
                        ? "var(--ws-soft, #f0fdfa)"
                        : undefined,
                      boxShadow: isHighlighted
                        ? "0 0 0 2px rgba(28, 124, 125, 0.2)"
                        : undefined,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <b>{seg.section.toUpperCase()}</b>
                      <small style={{ color: "var(--ws-muted)", fontSize: 10 }}>
                        {seg.id}
                      </small>
                    </div>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{seg.text}</p>
                  </div>
                );
              })
            ) : Object.entries(sourceSections).length > 0 ? (
              Object.entries(sourceSections).map(([sec, text]) => (
                <div key={sec} className="flow-source-block">
                  <b>{sec.toUpperCase()}</b>
                  <p>{text || "(Không có nội dung)"}</p>
                </div>
              ))
            ) : (
              <div className="flow-source-block">
                <p style={{ color: "var(--ws-muted)" }}>
                  Mô tả gốc chỉ xem được trong phiên đã nhập
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Normalized Draft */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Bản nháp đã chuẩn hóa</h2>
              <p>Mô hình dữ liệu v1 được sinh tự động</p>
            </div>
          </div>
          <div className="panel-body">
            {!definition ? (
              <div className="empty">
                <strong>Chưa có dữ liệu chuẩn hóa</strong>
                <p>Hãy lưu mô tả nguồn ở Bước 02 trước khi đối chiếu.</p>
              </div>
            ) : (
              <>
                <div className="flow-summary-grid">
                  <div>
                    <b>{definition.roles?.length || 0}</b>
                    <span>Vai trò</span>
                  </div>
                  <div>
                    <b>{definition.fields?.length || 0}</b>
                    <span>Trường dữ liệu</span>
                  </div>
                  <div>
                    <b>{definition.steps?.length || 0}</b>
                    <span>Bước xử lý</span>
                  </div>
                </div>

                <div className="flow-mini-title">Vai trò được nhận diện (chọn để xem nguồn)</div>
                {definition.roles?.map((r) => {
                  const isSelected = selectedTargetId === r;
                  return (
                    <div
                      key={r}
                      role="button"
                      tabIndex={0}
                      className={`flow-summary-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectTarget(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleSelectTarget(r);
                      }}
                      style={{
                        cursor: "pointer",
                        border: isSelected
                          ? "1px solid var(--ws-teal, #1c7c7d)"
                          : undefined,
                        backgroundColor: isSelected
                          ? "var(--ws-soft, #f0fdfa)"
                          : undefined,
                      }}
                    >
                      <span>{r}</span>
                      <small>Mã vai trò (chưa có nhãn)</small>
                    </div>
                  );
                })}

                <div className="flow-mini-title">Trường dữ liệu được nhận diện (chọn để xem nguồn)</div>
                {definition.fields?.map((f) => {
                  const isSelected = selectedTargetId === f.id;
                  return (
                    <div
                      key={f.id}
                      role="button"
                      tabIndex={0}
                      className={`flow-summary-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectTarget(f.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleSelectTarget(f.id);
                      }}
                      style={{
                        cursor: "pointer",
                        border: isSelected
                          ? "1px solid var(--ws-teal, #1c7c7d)"
                          : undefined,
                        backgroundColor: isSelected
                          ? "var(--ws-soft, #f0fdfa)"
                          : undefined,
                      }}
                    >
                      <span>
                        {f.id} {f.required && "*"}
                      </span>
                      <small>
                        Kiểu: {f.type} {f.options ? `[${f.options.join(", ")}]` : ""}
                      </small>
                    </div>
                  );
                })}

                <div className="flow-mini-title">Các bước xử lý (chọn để xem nguồn)</div>
                {definition.steps?.map((s) => {
                  const isSelected = selectedTargetId === s.id;
                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      className={`flow-summary-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectTarget(s.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleSelectTarget(s.id);
                      }}
                      style={{
                        cursor: "pointer",
                        border: isSelected
                          ? "1px solid var(--ws-teal, #1c7c7d)"
                          : undefined,
                        backgroundColor: isSelected
                          ? "var(--ws-soft, #f0fdfa)"
                          : undefined,
                      }}
                    >
                      <span>{s.id}</span>
                      <small>
                        Kiểu: {s.type} {s.role ? `· Gán: ${s.role}` : ""}
                      </small>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
