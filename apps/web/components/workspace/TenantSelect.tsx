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
import { selectTenantAction } from "../../lib/tenant/actions";
import type { MeMembership } from "../../lib/tenant/types";

interface TenantSelectProps {
  activeMemberships: MeMembership[];
  currentTenantId: string | null;
}

export default function TenantSelect({
  activeMemberships,
  currentTenantId,
}: TenantSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(currentTenantId ?? "");

  if (activeMemberships.length === 0) {
    return <span className="tenant-select">Chưa có doanh nghiệp</span>;
  }

  if (activeMemberships.length === 1) {
    return (
      <div className="tenant-select" title="Doanh nghiệp hiện tại">
        <span>Doanh nghiệp:</span>
        <strong style={{ color: "var(--ws-ink)" }}>
          {activeMemberships[0].tenant.name}
        </strong>
      </div>
    );
  }

  return (
    <label className="tenant-select">
      <span>Doanh nghiệp</span>
      <select
        id="tenant-select"
        aria-label="Chọn doanh nghiệp"
        disabled={isPending}
        value={selectedId}
        onChange={(e) => {
          const nextId = e.target.value;
          setSelectedId(nextId);
          if (nextId) {
            startTransition(async () => {
              await selectTenantAction(nextId);
            });
          }
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
