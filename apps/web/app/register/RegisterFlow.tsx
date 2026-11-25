"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ChoiceView from "./ChoiceView";
import TenantRegistrationForm from "./TenantRegistrationForm";
import AccountRequestForm from "./AccountRequestForm";

export default function RegisterFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type");

  if (type === "tenant") {
    return <TenantRegistrationForm onBackToChoice={() => router.push("/register")} />;
  }

  if (type === "join") {
    return <AccountRequestForm onBack={() => router.push("/register")} />;
  }

  return (
    <ChoiceView
      onSelectTenant={() => router.push("/register?type=tenant")}
      onSelectJoin={() => router.push("/register?type=join")}
    />
  );
}
