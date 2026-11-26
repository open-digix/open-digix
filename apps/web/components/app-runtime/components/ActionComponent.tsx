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

import React, { useState } from "react";
import type { NormalizedComponent, DataSource } from "@/lib/app-runtime/types";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export interface ActionComponentProps {
  component: NormalizedComponent;
  dataSource: DataSource;
  onActionCompleted?: () => void;
}

export default function ActionComponent({
  component,
  dataSource,
  onActionCompleted,
}: ActionComponentProps) {
  const { resource, action = "execute", label } = component;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const actionLabel = label || `Thực hiện: ${action} (${resource})`;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await dataSource.runAction(resource, action);
      if (res.success) {
        setMessage(res.message || `Đã thực hiện "${action}" thành công.`);
        setIsDialogOpen(false);
        onActionCompleted?.();
      } else {
        setMessage(res.message || "Không thể thực hiện hành động.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định khi thực hiện hành động.";
      setMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="panel"
      style={{ padding: 20 }}
      data-testid={`action-${component.id}`}
    >
      <div className="flex flex-col gap-3">
        <div>
          <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>
            {actionLabel}
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ws-muted)" }}>
            Hành động nghiệp vụ trên tài nguyên <strong style={{ color: "var(--ws-ink)" }}>{resource}</strong>.
            Cần xác nhận trước khi hệ thống ghi nhận.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="info-banner"
            style={{ margin: "8px 0" }}
          >
            {message}
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="button primary"
          >
            {action === "approve" ? "Phê duyệt ngay" : action === "advance" ? "Chuyển giai đoạn" : actionLabel}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Xác nhận hành động"
        description={`Bạn có chắc chắn muốn thực hiện hành động "${action}" trên dữ liệu "${resource}" không? Thao tác này sẽ ghi nhận trạng thái mới vào hệ thống.`}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setIsDialogOpen(false)}
            disabled={isProcessing}
            className="button secondary"
          >
            Hủy
          </button>
          <button
            type="button"
            data-autofocus="true"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="button primary"
          >
            {isProcessing ? "Đang xử lý..." : "Xác nhận thực hiện"}
          </button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
