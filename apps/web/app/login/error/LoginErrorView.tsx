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
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export const AUTH_RETRY_SESSION_KEY = "digix_auth_retry_flag";

export type AuthErrorKind =
  | "state_pkce"
  | "configuration"
  | "access_denied"
  | "verification"
  | "default";

export interface ErrorContentInfo {
  kind: AuthErrorKind;
  title: string;
  message: string;
  allowRetry: boolean;
  showHome: boolean;
  isRetrying?: boolean;
}

/**
 * Classifies error codes into handled groups.
 * Specifically handles state/PKCE callback errors (CallbackRouteError, InvalidCheck, OAuthCallbackError, OAuthSignin)
 * and distinguishes them from system configuration or access denied issues.
 */
export function classifyAuthError(error: string | null): AuthErrorKind {
  if (!error) return "default";
  const err = error.toLowerCase();
  if (
    err.includes("callback") ||
    err.includes("state") ||
    err.includes("pkce") ||
    err.includes("check") ||
    err === "oauthsignin"
  ) {
    return "state_pkce";
  }
  if (err.includes("configuration")) {
    return "configuration";
  }
  if (err.includes("accessdenied")) {
    return "access_denied";
  }
  if (err.includes("verification")) {
    return "verification";
  }
  return "default";
}

/**
 * Formulates user-facing Vietnamese content for errors without exposing technical details.
 */
export function getErrorContentInfo(
  error: string | null,
  isRetried: boolean
): ErrorContentInfo {
  const kind = classifyAuthError(error);

  if (kind === "state_pkce") {
    if (isRetried) {
      return {
        kind,
        title: "Phiên đăng nhập bị gián đoạn",
        message: "Phiên đăng nhập bị gián đoạn. Vui lòng đăng nhập lại.",
        allowRetry: true,
        showHome: true,
      };
    }
    return {
      kind,
      title: "Đang kết nối lại...",
      message:
        "Hệ thống đang tự động kết nối lại phiên đăng nhập. Vui lòng đợi trong giây lát...",
      allowRetry: false,
      showHome: false,
      isRetrying: true,
    };
  }

  if (kind === "configuration") {
    return {
      kind,
      title: "Sự cố cấu hình hệ thống",
      message:
        "Hệ thống đăng nhập đang gặp sự cố cấu hình. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
      allowRetry: false,
      showHome: true,
    };
  }

  if (kind === "access_denied") {
    return {
      kind,
      title: "Truy cập bị từ chối",
      message: "Bạn không có quyền truy cập vào không gian làm việc này.",
      allowRetry: false,
      showHome: true,
    };
  }

  if (kind === "verification") {
    return {
      kind,
      title: "Liên kết xác thực không hợp lệ",
      message:
        "Liên kết đăng nhập đã hết hạn hoặc không còn hiệu lực. Vui lòng thử lại.",
      allowRetry: true,
      showHome: true,
    };
  }

  return {
    kind,
    title: "Đã xảy ra lỗi đăng nhập",
    message:
      "Không thể hoàn tất quá trình xác thực. Vui lòng thử lại hoặc quay về trang chủ.",
    allowRetry: true,
    showHome: true,
  };
}

export default function LoginErrorView() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const retryParam = searchParams.get("retry");

  // Determine if retry has already happened via query param or sessionStorage
  const [alreadyRetried] = useState<boolean>(() => {
    if (retryParam === "1") return true;
    if (typeof window !== "undefined") {
      try {
        return window.sessionStorage?.getItem(AUTH_RETRY_SESSION_KEY) === "1";
      } catch {
        return false;
      }
    }
    return false;
  });

  // Auto-retry once on state/PKCE error if not already retried
  useEffect(() => {
    const kind = classifyAuthError(errorCode);
    if (kind === "state_pkce" && !alreadyRetried) {
      try {
        window.sessionStorage?.setItem(AUTH_RETRY_SESSION_KEY, "1");
      } catch {
        // ignore
      }
      void signIn("keycloak", { callbackUrl: "/dashboard" });
    }
  }, [errorCode, alreadyRetried]);

  const content = getErrorContentInfo(errorCode, alreadyRetried);

  const handleManualRetry = () => {
    try {
      window.sessionStorage?.removeItem(AUTH_RETRY_SESSION_KEY);
    } catch {
      // ignore
    }
    void signIn("keycloak", { callbackUrl: "/dashboard" });
  };

  const handleGoHome = () => {
    try {
      window.sessionStorage?.removeItem(AUTH_RETRY_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="landing-page" style={{ minHeight: "100vh" }}>
      <main>
        <section
          className="landing-hero"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
          aria-labelledby="auth-error-heading"
        >
          <div className="landing-background" aria-hidden="true" />

          <header
            className="landing-header"
            style={{ marginBottom: "2rem", justifyContent: "center" }}
          >
            <Link
              className="landing-logo"
              href="/"
              aria-label="Trang chủ DigiX"
              onClick={handleGoHome}
            >
              <Image
                src="/digix-logo.svg"
                alt=""
                width={52}
                height={52}
                priority
              />
            </Link>
          </header>

          <section
            className="landing-auth-dialog landing-auth-error-card"
            role="alert"
            aria-live="polite"
          >
            <p className="landing-auth-label">XÁC THỰC TÀI KHOẢN</p>
            <h2 id="auth-error-heading">{content.title}</h2>
            <p>{content.message}</p>

            {content.isRetrying ? (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "var(--landing-teal)",
                }}
              >
                <span className="landing-auth-spinner" aria-hidden="true" />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  Đang chuyển hướng đến cổng đăng nhập...
                </span>
              </div>
            ) : (
              <div style={{ marginTop: "24px" }}>
                {content.allowRetry && (
                  <button
                    type="button"
                    className="landing-auth-primary"
                    onClick={handleManualRetry}
                  >
                    Đăng nhập lại <span aria-hidden="true">→</span>
                  </button>
                )}

                {content.showHome && (
                  content.allowRetry ? (
                    <Link
                      href="/"
                      className="landing-auth-secondary"
                      onClick={handleGoHome}
                    >
                      ← Về trang chủ
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="landing-auth-primary"
                      onClick={handleGoHome}
                    >
                      Về trang chủ <span aria-hidden="true">→</span>
                    </Link>
                  )
                )}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
