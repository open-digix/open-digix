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
import Link from "next/link";
import { validateDraftAction } from "../../lib/builder/actions";
import { getValidationMessageVi } from "../../lib/builder/validation-messages";
import type {
  BuilderValidationResult,
  BuilderApplicationDefinitionV1,
} from "../../lib/builder/types";

interface ValidateViewProps {
  appId: string;
  version: number;
  definition?: BuilderApplicationDefinitionV1;
}

export default function ValidateView({
  appId,
  version,
  definition,
}: ValidateViewProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [result, setResult] = useState<BuilderValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void validateDraftAction(appId, version)
      .then((res) => {
        if (!active) return;
        if (res.ok && res.data) {
          setResult(res.data);
        } else {
          setError(res.error?.message || "Không thể kiểm tra quy trình.");
        }
        setIsValidating(false);
      })
      .catch(() => {
        if (!active) return;
        setError("Đã xảy ra lỗi kết nối khi kiểm tra quy trình.");
        setIsValidating(false);
      });

    return () => {
      active = false;
    };
  }, [appId, version]);

  const handleRevalidate = () => {
    setIsValidating(true);
    setError(null);
    void validateDraftAction(appId, version)
      .then((res) => {
        if (res.ok && res.data) {
          setResult(res.data);
        } else {
          setError(res.error?.message || "Không thể kiểm tra quy trình.");
        }
        setIsValidating(false);
      })
      .catch(() => {
        setError("Đã xảy ra lỗi kết nối khi kiểm tra quy trình.");
        setIsValidating(false);
      });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 11, color: "var(--ws-muted)" }}>
          Kiểm tra tính hợp lệ của quy trình
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/builder/${appId}?step=edit`} className="button secondary">
            ← Quay lại chỉnh sửa
          </Link>
          <button
            type="button"
            className="button primary"
            disabled={isValidating}
            onClick={handleRevalidate}
          >
            {isValidating ? "Đang kiểm tra..." : "Kiểm tra lại"}
          </button>
        </div>
      </div>

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
          <b>Lỗi kiểm tra:</b> {error}
        </div>
      )}

      {isValidating && !result && (
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <strong>Đang phân tích cấu trúc bản nháp v{version}...</strong>
          <p style={{ marginTop: 6, color: "var(--ws-muted)", fontSize: 11 }}>
            Kiểm tra tính liên thông, chu trình và tính đầy đủ của các nhánh.
          </p>
        </div>
      )}

      {result && (
        <>
          {result.valid ? (
            <div className="panel" style={{ padding: 32 }}>
              <div
                className="flow-validation valid"
                style={{ marginBottom: 20 }}
              >
                <div>
                  <strong>✓ Bản nháp hợp lệ</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 11 }}>
                    Tất cả các ràng buộc mô hình v1 đã được kiểm tra thành công.
                  </p>
                </div>
                <span>Checksum: {result.snapshotChecksum.slice(0, 8)}</span>
              </div>

              <div
                className="info-banner"
                style={{
                  background: "var(--ws-canvas)",
                  borderColor: "var(--ws-line)",
                }}
              >
                <div>
                  <b>Chạy thử và Xuất bản: chờ API (M3)</b>
                  <p style={{ margin: "4px 0 0" }}>
                    Quy trình đã sẵn sàng để tích hợp vào các bước chạy thử hồ sơ thật
                    và xuất bản sang không gian làm việc của nhân viên khi backend hoàn tất M3.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h3>Check-list đạt chuẩn:</h3>
                <ul className="check-list">
                  <li>
                    <span className="check-mark">✓</span>
                    <div>
                      <strong>Cấu trúc ứng dụng hợp lệ</strong>
                      <small>Đúng schema quy trình v1.</small>
                    </div>
                  </li>
                  <li>
                    <span className="check-mark">✓</span>
                    <div>
                      <strong>Đầy đủ vai trò và biểu mẫu</strong>
                      <small>Không có trường hoặc vai trò mồ côi.</small>
                    </div>
                  </li>
                  <li>
                    <span className="check-mark">✓</span>
                    <div>
                      <strong>Luồng điều hướng hoàn chỉnh</strong>
                      <small>Điểm bắt đầu kết nối tới điểm kết thúc, không có vòng lặp.</small>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="panel" style={{ padding: 32 }}>
              <div
                className="flow-validation invalid"
                style={{ marginBottom: 20 }}
              >
                <div>
                  <strong>✕ Bản nháp chưa hợp lệ ({result.issues.length} vấn đề)</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 11 }}>
                    Vui lòng xem chi tiết danh sách lỗi bên dưới và quay lại bước Chỉnh sửa để khắc phục.
                  </p>
                </div>
                <span>Checksum: {result.snapshotChecksum?.slice(0, 8)}</span>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mức độ</th>
                      <th>Mã kiểm tra</th>
                      <th>Nội dung chi tiết</th>
                      <th>Đối tượng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.issues.map((issue, idx) => (
                      <tr key={idx}>
                        <td>
                          <span
                            className={`status ${issue.severity === "error" ? "danger" : "warning"}`}
                          >
                            {issue.severity === "error" ? "Lỗi chặn" : "Cảnh báo"}
                          </span>
                        </td>
                        <td>
                          <code>{issue.code}</code>
                        </td>
                        <td>
                          <strong>{getValidationMessageVi(issue, definition)}</strong>
                          {issue.path && (
                            <details style={{ marginTop: 4, fontSize: 10, color: "var(--ws-muted)" }}>
                              <summary style={{ cursor: "pointer" }}>Chi tiết kỹ thuật</summary>
                              <code style={{ fontSize: 9 }}>Đường dẫn: {issue.path}</code>
                              {issue.message && issue.message !== issue.code && (
                                <div style={{ marginTop: 2 }}>{issue.message}</div>
                              )}
                            </details>
                          )}
                        </td>
                        <td>
                          {issue.stepId ? (
                            <code>{issue.stepId}</code>
                          ) : issue.path ? (
                            <code>{issue.path}</code>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <Link
                            href={`/builder/${appId}?step=edit`}
                            className="text-link"
                          >
                            Xem & sửa →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
