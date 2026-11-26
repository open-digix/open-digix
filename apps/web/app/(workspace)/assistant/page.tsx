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

import { Metadata } from "next";
import { getMeCached, getTenantContext } from "../../../lib/api/server";
import AssistantView from "../../../components/assistant/AssistantView";

export const metadata: Metadata = {
  title: "Trợ lý AI · DigiX",
};

export default async function AssistantPage() {
  let userName = "Dung";
  let canManageSources = true;

  try {
    const meResult = await getMeCached();
    if (meResult.ok && meResult.me?.user) {
      userName = meResult.me.user.displayName || "bạn";
    }

    const tenantContext = await getTenantContext();
    if (tenantContext?.currentMembership) {
      const roles = tenantContext.currentMembership.roles || [];
      // Admin or owner or role with ai.sources.manage
      canManageSources =
        roles.includes("admin") ||
        roles.includes("owner") ||
        roles.includes("ai.sources.manage");
    }
  } catch {
    // Fallback to mock defaults
  }

  return (
    <AssistantView
      userName={userName}
      canManageSources={canManageSources}
    />
  );
}
