import type { Metadata } from "next";
import { getMeCached, getTenantContext } from "../../../lib/api/server";
import AssistantView from "../../../components/assistant/AssistantView";

export const metadata: Metadata = {
  title: "Trợ lý · DigiX",
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
