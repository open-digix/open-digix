import type { Metadata } from "next";
import { Suspense } from "react";
import EnforceLightMode from "@/components/common/EnforceLightMode";
import RegisterFlow from "./RegisterFlow";
import "./register.css";

export const metadata: Metadata = {
  title: "Đăng ký · DigiX",
  description: "Tạo doanh nghiệp mới hoặc tham gia không gian làm việc số DigiX",
};

export default function RegisterPage() {
  return (
    <div data-theme="light">
      <EnforceLightMode />
      <Suspense
        fallback={
          <div
            className="register-page"
            data-theme="light"
            style={{ minHeight: "100vh", background: "var(--canvas)" }}
          />
        }
      >
        <RegisterFlow />
      </Suspense>
    </div>
  );
}
