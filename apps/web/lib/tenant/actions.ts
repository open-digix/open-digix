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

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMeCached } from "../api/server";

export async function selectTenantAction(tenantId: string): Promise<void> {
  const me = await getMeCached();
  if (!me) {
    redirect("/login");
  }

  const active = me.memberships.find(
    (m) =>
      m.tenant.id === tenantId &&
      m.status === "active" &&
      m.tenant.status === "active",
  );

  if (!active) {
    const cookieStore = await cookies();
    cookieStore.delete("ws-tenant");
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  cookieStore.set("ws-tenant", tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}
