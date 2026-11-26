"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  className?: string;
  fallbackHref?: string;
  children: React.ReactNode;
}

export default function BackButton({
  className = "link",
  fallbackHref = "/",
  children,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      {children}
    </button>
  );
}
