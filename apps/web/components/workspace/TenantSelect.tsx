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

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectTenantAction } from "../../lib/tenant/actions";
import type { MeMembership } from "../../lib/tenant/types";
import {
  confirmDiscardChanges,
  resetUnsavedChanges,
} from "../../lib/tenant/useUnsavedChangesGuard";
import { clearClientTenantData } from "../../lib/tenant/tenant-switch";

interface TenantSelectProps {
  activeMemberships: MeMembership[];
  currentTenantId: string | null;
}

export default function TenantSelect({
  activeMemberships,
  currentTenantId,
}: TenantSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = selectedId ?? currentTenantId ?? "";

  if (activeMemberships.length === 0) {
    return <span className="tenant-select">Chưa có doanh nghiệp</span>;
  }

  if (activeMemberships.length === 1) {
    const tenantName = activeMemberships[0].tenant.name;
    return (
      <div className="tenant-select" title={`Doanh nghiệp: ${tenantName}`}>
        <span className="tenant-label">Doanh nghiệp:</span>
        <strong className="tenant-name" style={{ color: "var(--ws-ink)" }}>
          {tenantName}
        </strong>
      </div>
    );
  }

  const currentMembership =
    activeMemberships.find((m) => m.tenant.id === activeId) ??
    activeMemberships[0];

  return (
    <label
      className="tenant-select"
      title={`Doanh nghiệp: ${currentMembership?.tenant.name ?? "Chọn doanh nghiệp"}`}
    >
      <span className="tenant-label">Doanh nghiệp</span>
      <select
        id="tenant-select"
        className="tenant-select-dropdown"
        aria-label="Chọn doanh nghiệp"
        disabled={isPending}
        value={activeId}
        onChange={(e) => {
          const nextId = e.target.value;
          if (!nextId || nextId === activeId) return;

          // Check unsaved changes before switching
          const canProceed = confirmDiscardChanges(
            "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển doanh nghiệp?",
          );
          if (!canProceed) {
            e.target.value = activeId;
            return;
          }

          setSelectedId(nextId);

          // Clear client filters, toasts, and abort ongoing requests
          clearClientTenantData();
          resetUnsavedChanges();

          startTransition(async () => {
            await selectTenantAction(nextId);
            router.refresh();
          });
        }}
      >
        <option value="" disabled>
          -- Chọn doanh nghiệp --
        </option>
        {activeMemberships.map((m) => (
          <option key={m.tenant.id} value={m.tenant.id}>
            {m.tenant.name}
          </option>
        ))}
      </select>
    </label>
  );
}
