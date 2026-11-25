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

import React, { useEffect, useRef, useId } from "react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number | string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  style?: React.CSSProperties;
  showCloseButton?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 480,
  initialFocusRef,
  ariaLabelledBy,
  ariaDescribedBy,
  style,
  showCloseButton = false,
}: ConfirmDialogProps) {
  const generatedId = useId();
  const titleId = ariaLabelledBy || `confirm-dialog-title-${generatedId}`;
  const descId = ariaDescribedBy || (description ? `confirm-dialog-desc-${generatedId}` : undefined);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Lưu lại phần tử đang được focus trước khi mở modal để trả lại focus khi đóng
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Chuyển focus vào bên trong modal (ưu tiên data-autofocus hoặc initialFocusRef)
    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (dialogRef.current) {
        const autoFocusEl = dialogRef.current.querySelector<HTMLElement>(
          '[data-autofocus="true"], [autofocus]'
        );
        if (autoFocusEl) {
          autoFocusEl.focus();
          return;
        }
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 20);

    // Xử lý phím Esc và bẫy focus vòng (Focus trap)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      // Trả lại focus khi đóng modal
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(11, 30, 48, 0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="panel"
        style={{
          maxWidth,
          width: "100%",
          padding: 24,
          borderRadius: 12,
          backgroundColor: "var(--ws-surface)",
          color: "var(--ws-ink)",
          border: "1px solid var(--ws-line)",
          boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
          outline: "none",
          ...style,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <h3 id={titleId} style={{ margin: 0, fontSize: 18, color: "var(--ws-ink)", fontWeight: 600 }}>
            {title}
          </h3>
          {showCloseButton && (
            <button
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                color: "var(--ws-muted)",
                padding: "2px 6px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
        {description && (
          <div id={descId} style={{ fontSize: 14, color: "var(--ws-muted)", marginBottom: 16, lineHeight: 1.5 }}>
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
