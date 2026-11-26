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
      className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
      data-testid={`action-${component.id}`}
    >
      <div className="flex flex-col gap-3">
        <div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {actionLabel}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hành động nghiệp vụ trên tài nguyên <strong className="font-mono text-zinc-700 dark:text-zinc-300">{resource}</strong>.
            Cần xác nhận trước khi hệ thống ghi nhận.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="p-3 rounded-lg text-sm bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
          >
            {message}
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition-colors shadow-xs"
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
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setIsDialogOpen(false)}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            data-autofocus="true"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? "Đang xử lý..." : "Xác nhận thực hiện"}
          </button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
