import type { Metadata } from "next";
import AccountRequestForm from "./AccountRequestForm";
import "./register.css";

export const metadata: Metadata = {
  title: "Yêu cầu cấp tài khoản · DigiX",
  description: "Gửi yêu cầu cấp tài khoản doanh nghiệp trên DigiX",
};

export default function RegisterPage() {
  return <AccountRequestForm />;
}
