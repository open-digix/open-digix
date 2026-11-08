"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void signOut({ callbackUrl: "/login" });
      }}
      className="font-medium text-blue-700 underline hover:text-blue-900"
    >
      Đăng xuất
    </button>
  );
}