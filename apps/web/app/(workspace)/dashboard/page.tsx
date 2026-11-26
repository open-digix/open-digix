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

import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getTenantContext } from "../../../lib/api/server";
import DashboardOverview from "../../../components/workspace/DashboardOverview";

export const metadata: Metadata = {
  title: "Tổng quan · DigiX",
};

export default async function DashboardPage() {
  await connection();
  const context = await getTenantContext();

  if (!context) {
    redirect("/login");
  }

  if (context.needsTenantSelection || !context.currentTenant) {
    return (
      <div className="page">
        <div className="info-banner" role="alert">
          <div>
            <b>Vui lòng chọn doanh nghiệp</b>
            <p style={{ margin: "4px 0 0" }}>
              Hãy chọn một doanh nghiệp ở thanh trên cùng để xem tổng quan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardOverview
      user={context.me.user}
      tenant={context.currentTenant}
      roles={context.roles}
    />
  );
}
