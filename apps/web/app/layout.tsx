import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";

export const metadata: Metadata = {
  title: "Một Nền Tảng, Vạn Tiềm Năng · DigiX",
  description: "DigiX giúp doanh nghiệp nhìn lại và tối ưu cách thức vận hành bằng công nghệ.",
};

export const instant = false;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="light" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
