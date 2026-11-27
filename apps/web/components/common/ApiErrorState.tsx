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

import React from "react";
import ReloginButton from "./ReloginButton";
import type { ApiErrorKind, ApiIssue } from "../../lib/api/errors";
import { getFieldLabel } from "../../lib/api/errors";

export interface ApiErrorStateProps {
  error?: {
    status?: number;
    code?: string;
    message?: string;
    kind?: ApiErrorKind;
    issues?: readonly ApiIssue[];
  } | null;
  kind?: ApiErrorKind;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function resolveErrorKind(
  error?: { status?: number; kind?: ApiErrorKind } | null,
  explicitKind?: ApiErrorKind,
): ApiErrorKind {
  if (explicitKind) return explicitKind;
  if (error?.kind) return error.kind;
  if (error?.status) {
    if (error.status === 401) return "unauthenticated";
    if (error.status === 403) return "forbidden";
    if (error.status === 404) return "not_found";
    if (error.status === 409) return "conflict";
    if (error.status === 422) return "unprocessable";
    if (error.status === 429) return "rate_limited";
  }
  return "unavailable";
}

export default function ApiErrorState({
  error,
  kind: explicitKind,
  title: customTitle,
  message: customMessage,
  onRetry,
  className = "",
}: ApiErrorStateProps) {
  const kind = resolveErrorKind(error, explicitKind);
  const issues = error?.issues;

  // 404: Không tìm thấy hoặc bạn không có quyền xem. Không lộ tên/mã bản ghi.
  if (kind === "not_found") {
    return (
      <div
        className={`api-error-state card ${className}`}
        style={{
          padding: 24,
          textAlign: "center",
          maxWidth: 480,
          margin: "24px auto",
        }}
        role="alert"
      >
        <div
          className="info-banner"
          style={{ borderColor: "var(--ws-warning)", marginBottom: 16 }}
        >
          <b>{customTitle ?? "Không tìm thấy nội dung"}</b>
        </div>
        <p
          style={{
            color: "var(--ws-muted)",
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {customMessage ?? "Không tìm thấy hoặc bạn không có quyền xem"}
        </p>
        {onRetry && (
          <button type="button" className="button secondary" onClick={onRetry}>
            Thử lại
          </button>
        )}
      </div>
    );
  }

  // 409: Xung đột dữ liệu -> có nút "Tải lại"
  if (kind === "conflict") {
    return (
      <div
        className={`api-error-state card ${className}`}
        style={{
          padding: 24,
          textAlign: "center",
          maxWidth: 480,
          margin: "24px auto",
        }}
        role="alert"
      >
        <div
          className="info-banner"
          style={{ borderColor: "var(--ws-warning)", marginBottom: 16 }}
        >
          <b>{customTitle ?? "Xung đột dữ liệu"}</b>
        </div>
        <p
          style={{
            color: "var(--ws-muted)",
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {customMessage ??
            error?.message ??
            "Dữ liệu đã được cập nhật bởi phiên làm việc khác. Vui lòng tải lại trang."}
        </p>
        <button
          type="button"
          className="button primary"
          onClick={() => {
            if (onRetry) onRetry();
            else if (typeof window !== "undefined") window.location.reload();
          }}
        >
          Tải lại
        </button>
      </div>
    );
  }

  // 401: Yêu cầu đăng nhập -> có nút "Đăng nhập lại"
  if (kind === "unauthenticated") {
    return (
      <div
        className={`api-error-state card ${className}`}
        style={{
          padding: 24,
          textAlign: "center",
          maxWidth: 480,
          margin: "24px auto",
        }}
        role="alert"
      >
        <div
          className="info-banner"
          style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}
        >
          <b>{customTitle ?? "Phiên đăng nhập đã hết hạn"}</b>
        </div>
        <p
          style={{
            color: "var(--ws-muted)",
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {customMessage ??
            "Phiên làm việc của bạn không còn hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."}
        </p>
        <ReloginButton />
      </div>
    );
  }

  // 403: Không có quyền truy cập
  if (kind === "forbidden") {
    return (
      <div
        className={`api-error-state card ${className}`}
        style={{
          padding: 24,
          textAlign: "center",
          maxWidth: 480,
          margin: "24px auto",
        }}
        role="alert"
      >
        <div
          className="info-banner"
          style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}
        >
          <b>{customTitle ?? "Không có quyền truy cập"}</b>
        </div>
        <p
          style={{
            color: "var(--ws-muted)",
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {customMessage ??
            (error?.message && error.message !== "FORBIDDEN"
              ? error.message
              : "Bạn không có quyền thực hiện thao tác này.")}
        </p>
      </div>
    );
  }

  // 422: Dữ liệu không hợp lệ (có issues[{code,path,message}])
  if (kind === "unprocessable") {
    return (
      <div
        className={`api-error-state card ${className}`}
        style={{
          padding: 24,
          textAlign: "left",
          maxWidth: 520,
          margin: "24px auto",
        }}
        role="alert"
      >
        <div
          className="info-banner"
          style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}
        >
          <b>{customTitle ?? "Dữ liệu không hợp lệ"}</b>
        </div>
        <p
          style={{
            color: "var(--ws-muted)",
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: issues?.length ? 12 : 16,
          }}
        >
          {customMessage ??
            (error?.message && error.message !== "Dữ liệu không hợp lệ"
              ? error.message
              : "Vui lòng kiểm tra lại các trường dữ liệu dưới đây.")}
        </p>
        {issues && issues.length > 0 && (
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              fontSize: 13,
              color: "var(--ws-danger)",
              lineHeight: 1.6,
            }}
          >
            {issues.map((iss, idx) => (
              <li key={idx}>
                <strong>{getFieldLabel(iss.path)}:</strong> {iss.message}
              </li>
            ))}
          </ul>
        )}
        {onRetry && (
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <button
              type="button"
              className="button secondary"
              onClick={onRetry}
            >
              Thử lại
            </button>
          </div>
        )}
      </div>
    );
  }

  // 429: Rate limit
  if (kind === "rate_limited") {
    return (
      <div
        className={`api-error-state card ${className}`}
        style={{
          padding: 24,
          textAlign: "center",
          maxWidth: 480,
          margin: "24px auto",
        }}
        role="alert"
      >
        <div
          className="info-banner"
          style={{ borderColor: "var(--ws-warning)", marginBottom: 16 }}
        >
          <b>{customTitle ?? "Hệ thống đang bận"}</b>
        </div>
        <p
          style={{
            color: "var(--ws-muted)",
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {customMessage ?? "Hệ thống đang bận. Vui lòng thử lại sau giây lát."}
        </p>
        {onRetry && (
          <button type="button" className="button secondary" onClick={onRetry}>
            Thử lại
          </button>
        )}
      </div>
    );
  }

  // unavailable (5xx hoặc mạng)
  return (
    <div
      className={`api-error-state card ${className}`}
      style={{
        padding: 24,
        textAlign: "center",
        maxWidth: 480,
        margin: "24px auto",
      }}
      role="alert"
    >
      <div
        className="info-banner"
        style={{ borderColor: "var(--ws-danger)", marginBottom: 16 }}
      >
        <b>{customTitle ?? "Dịch vụ tạm thời không khả dụng"}</b>
      </div>
      <p
        style={{
          color: "var(--ws-muted)",
          fontSize: 13,
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        {customMessage ??
          error?.message ??
          "Không thể kết nối đến máy chủ hoặc dịch vụ đang bảo trì. Vui lòng thử lại sau."}
      </p>
      {onRetry && (
        <button type="button" className="button secondary" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
