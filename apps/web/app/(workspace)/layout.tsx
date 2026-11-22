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

import "./workspace.css";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTenantContext } from "../../lib/api/server";
import AppShell from "../../components/workspace/AppShell";

async function WorkspaceLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const context = await getTenantContext();
  if (!context) {
    redirect("/login");
  }

  const {
    me,
    activeMemberships,
    currentTenant,
    roles,
    needsTenantSelection,
  } = context;

  return (
    <AppShell
      user={me.user}
      activeMemberships={activeMemberships}
      currentTenantId={currentTenant?.id ?? null}
      roles={roles}
    >
      {needsTenantSelection ? (
        <div className="page">
          <div className="info-banner" role="alert">
            <div>
              <b>Yêu cầu chọn doanh nghiệp</b>
              <p style={{ margin: "4px 0 0" }}>
                Tài khoản của bạn thuộc nhiều doanh nghiệp. Vui lòng chọn một doanh nghiệp ở thanh trên cùng để tiếp tục làm việc.
              </p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AppShell>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="ws-root"
          style={{ minHeight: "100vh", background: "var(--ws-canvas)" }}
        />
      }
    >
      <WorkspaceLayoutContent>{children}</WorkspaceLayoutContent>
    </Suspense>
  );
}
