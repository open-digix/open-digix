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

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { NormalizeResult } from "../../lib/builder/actions";

interface NormalizeViewProps {
  appId: string;
  tenantId: string;
  appName: string;
  version: number;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function NormalizeView({
  appId,
  tenantId,
}: NormalizeViewProps) {
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
  if (rawSource) {
    try {
      const parsed = JSON.parse(rawSource);
      if (parsed.sections) sourceSections = parsed.sections;
    } catch {
      sourceSections = {};
    }
  }

  const definition = normalizeData?.definition;
  const openIssues = normalizeData?.openIssues || [];
  const blockingIssues = openIssues.filter((i) => i.blocking);
  const warningIssues = openIssues.filter((i) => !i.blocking);

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, color: "var(--ws-muted)" }}>
            Bản mô tả số {normalizeData?.revisionNo ?? 1} · Phiên bản khóa {normalizeData?.lockVersion ?? 1}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
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
                <p>{issue.message}</p>
              </div>
            ))}
            {warningIssues.map((issue, idx) => (
              <div key={`w-${idx}`} className="flow-issue">
                <b>[Cần lưu ý] {issue.code}</b>
                <p>{issue.message}</p>
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
            {Object.entries(sourceSections).length === 0 ? (
              <div className="flow-source-block">
                <p style={{ color: "var(--ws-muted)" }}>
                  (Không tìm thấy mô tả nguồn trong phiên này)
                </p>
              </div>
            ) : (
              Object.entries(sourceSections).map(([sec, text]) => (
                <div key={sec} className="flow-source-block">
                  <b>{sec.toUpperCase()}</b>
                  <p>{text || "(Không có nội dung)"}</p>
                </div>
              ))
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

                <div className="flow-mini-title">Vai trò được nhận diện</div>
                {definition.roles?.map((r) => (
                  <div key={r} className="flow-summary-item">
                    <span>{r}</span>
                    <small>Mã vai trò (chưa có nhãn)</small>
                  </div>
                ))}

                <div className="flow-mini-title">Trường dữ liệu được nhận diện</div>
                {definition.fields?.map((f) => (
                  <div key={f.id} className="flow-summary-item">
                    <span>
                      {f.id} {f.required && "*"}
                    </span>
                    <small>
                      Kiểu: {f.type} {f.options ? `[${f.options.join(", ")}]` : ""}
                    </small>
                  </div>
                ))}

                <div className="flow-mini-title">Các bước xử lý</div>
                {definition.steps?.map((s) => (
                  <div key={s.id} className="flow-summary-item">
                    <span>{s.id}</span>
                    <small>
                      Kiểu: {s.type} {s.role ? `· Gán: ${s.role}` : ""}
                    </small>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
