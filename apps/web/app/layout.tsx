import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";

export const metadata: Metadata = {
  title: "Một Nền Tảng, Vạn Tiềm Năng | DigiX",
  description: "DigiX giúp doanh nghiệp nhìn lại và tối ưu cách thức vận hành bằng công nghệ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
