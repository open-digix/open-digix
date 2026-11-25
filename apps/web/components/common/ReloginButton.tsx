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

import { signIn } from "next-auth/react";

interface ReloginButtonProps {
  callbackUrl?: string;
  className?: string;
  label?: string;
}

/**
 * Sanitizes callback URL to ensure it is a safe internal relative path.
 * Disallows protocol-relative URLs (e.g. //evil.example) and absolute external schemes.
 */
export function sanitizeCallbackUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("\\")
  ) {
    return trimmed;
  }
  return "";
}

export default function ReloginButton({
  callbackUrl,
  className = "button primary",
  label = "Đăng nhập lại",
}: ReloginButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        let target = sanitizeCallbackUrl(callbackUrl);
        if (!target && typeof window !== "undefined") {
          const current = window.location.pathname + window.location.search;
          target = sanitizeCallbackUrl(current);
        }
        if (!target) {
          target = "/dashboard";
        }
        void signIn("keycloak", { callbackUrl: target });
      }}
    >
      {label}
    </button>
  );
}
