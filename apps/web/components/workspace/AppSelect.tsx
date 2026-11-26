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
import { usePathname, useRouter } from "next/navigation";
import { listAppsAction } from "../../lib/app-config/actions";
import type { AppSummary } from "../../lib/app-config/types";
import { confirmDiscardChanges } from "../../lib/tenant/useUnsavedChangesGuard";

interface AppSelectProps {
  currentTenantId?: string | null;
}

export default function AppSelect({ currentTenantId }: AppSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    listAppsAction()
      .then((data) => {
        if (!isMounted) return;
        // Chỉ lấy các app đã phát hành
        setApps(data.filter((a) => a.status === "published"));
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách app:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentTenantId]);

  // Nhận diện app hiện tại qua URL: /app/[appId]...
  const match = pathname.match(/^\/app\/([^/]+)/);
  const currentAppId = match ? match[1] : null;

  if (loading && apps.length === 0) {
    return null;
  }

  if (apps.length === 0) {
    return null;
  }

  const currentApp = apps.find(
    (a) => a.appId === currentAppId || a.appKey === currentAppId
  );

  return (
    <label
      className="app-select"
      title={`Ứng dụng: ${currentApp ? `${currentApp.name} v${currentApp.version}` : "Chọn ứng dụng"}`}
      data-testid="app-select"
    >
      <span className="tenant-label">Ứng dụng</span>
      <select
        id="app-select-dropdown"
        className="app-select-dropdown"
        aria-label="Chọn ứng dụng"
        value={currentApp?.appId ?? ""}
        onChange={(e) => {
          const nextId = e.target.value;
          if (!nextId || nextId === currentAppId) return;

          const canProceed = confirmDiscardChanges(
            "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển ứng dụng?"
          );
          if (!canProceed) {
            e.target.value = currentApp?.appId ?? "";
            return;
          }

          router.push(`/app/${nextId}`);
        }}
      >
        {!currentApp && <option value="">Chọn ứng dụng...</option>}
        {apps.map((a) => (
          <option key={a.appId} value={a.appId}>
            {a.name} v{a.version}
          </option>
        ))}
      </select>
    </label>
  );
}
