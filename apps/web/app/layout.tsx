import type { Metadata } from "next";
import { cookies } from "next/headers";
import { parseTheme } from "../lib/theme";
import "./globals.css";
import "./landing.css";

export const metadata: Metadata = {
  title: "Một Nền Tảng, Vạn Tiềm Năng | DigiX",
  description: "DigiX giúp doanh nghiệp nhìn lại và tối ưu cách thức vận hành bằng công nghệ.",
};

export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("digix_theme")?.value;
  const initialTheme = parseTheme(themeCookie);

  return (
    <html lang="vi" data-theme={initialTheme} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
