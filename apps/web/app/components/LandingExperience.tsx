"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { label: "Trang chủ", href: "#home" },
  { label: "Sản phẩm", href: "#product" },
  { label: "Dự án tiêu biểu", href: "#case-studies" },
  { label: "Liên hệ", href: "#contact" },
];

const products = [
  ["CRM", "Quản lý khách hàng"],
  ["Tài chính", "Kế toán thông minh"],
  ["Nhân sự", "Gắn kết đội ngũ"],
  ["Tự động hóa", "Tăng tốc quy trình"],
];

type AuthMode = "login" | "register";

export default function LandingExperience({ initialAuth }: { initialAuth?: AuthMode }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(initialAuth ?? null);
  const authTriggerRef = useRef<HTMLButtonElement>(null);
  const authCloseRef = useRef<HTMLButtonElement>(null);

  const openAuth = (mode: AuthMode) => {
    setMenuOpen(false);
    setAuthMode(mode);
  };

  const closeAuth = () => {
    setAuthMode(null);
    if (initialAuth) router.replace("/");
    else authTriggerRef.current?.focus();
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const closeOnResize = () => {
      if (window.innerWidth > 720) setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnResize);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnResize);
    };
  }, []);

  useEffect(() => {
    if (!authMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    authCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAuthMode(null);
        if (initialAuth) router.replace("/");
        else authTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [authMode, initialAuth, router]);

  return (
    <div className="landing-page">
      <main>
        <section className="landing-hero" id="home" aria-labelledby="landing-headline">
          <div className="landing-background" aria-hidden="true">
            <video autoPlay muted loop playsInline>
              <source
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
                type="video/mp4"
              />
            </video>
          </div>

          <header className="landing-header">
            <a className="landing-logo" href="#home" aria-label="Về trang chủ DigiX">
              <Image src="/digix-logo.svg" alt="" width={52} height={52} priority />
            </a>
            <nav className="landing-desktop-nav" aria-label="Điều hướng chính">
              {navigation.map((item, index) => (
                <a key={item.href} className={index === 0 ? "active" : ""} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
            <button className="landing-sign-in" type="button" ref={authTriggerRef} onClick={() => openAuth("login")}>
              Đăng nhập
            </button>
            <button
              className={`landing-menu-toggle${menuOpen ? " is-open" : ""}`}
              type="button"
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span /><span /><span />
            </button>
          </header>

          {menuOpen && (
            <>
              <button
                className="landing-overlay"
                type="button"
                aria-label="Đóng menu"
                onClick={() => setMenuOpen(false)}
              />
              <nav className="landing-mobile-menu" id="landing-mobile-menu" aria-label="Điều hướng trên điện thoại">
                {navigation.map((item, index) => (
                  <a
                    key={item.href}
                    className={index === 0 ? "active" : ""}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <button className="landing-mobile-signin" type="button" onClick={() => openAuth("login")}>
                  Đăng nhập ↗
                </button>
              </nav>
            </>
          )}

          <div className="landing-hero-copy">
            <div className="landing-eyebrow landing-reveal" style={{ animationDelay: ".1s" }}>
              <span /> TRÍ TUỆ LUÔN CHUYỂN ĐỘNG
            </div>
            <h1 className="landing-headline" id="landing-headline">
              <span>Một Nền Tảng</span>
              <span>Vạn Tiềm Năng</span>
            </h1>
            <p className="landing-subhead landing-reveal" style={{ animationDelay: ".28s" }}>
              “DigiX không chỉ cung cấp công nghệ, mà còn giúp nhìn lại và tối ưu toàn bộ cách thức vận hành”.
            </p>
            <button className="landing-cta landing-reveal" type="button" style={{ animationDelay: ".4s" }} onClick={() => openAuth("register")}>
              Bắt đầu
            </button>
          </div>
        </section>
      </main>

      {authMode && (
        <div className="landing-auth-backdrop">
          <button className="landing-auth-dismiss" type="button" aria-label="Đóng hộp thoại" onClick={closeAuth} />
          <section className="landing-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="landing-auth-heading">
            <button className="landing-auth-close" type="button" ref={authCloseRef} aria-label="Đóng" onClick={closeAuth}>×</button>
            <div className="landing-auth-tabs" role="group" aria-label="Tài khoản DigiX">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Đăng nhập</button>
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Đăng ký</button>
            </div>
            <p className="landing-auth-label">{authMode === "login" ? "CHÀO MỪNG TRỞ LẠI" : "BẮT ĐẦU CÙNG DIGIX"}</p>
            <h2 id="landing-auth-heading">{authMode === "login" ? "Đăng nhập tài khoản" : "Đăng ký tài khoản"}</h2>
            {authMode === "login" ? (
              <>
                <p>Bạn sẽ được chuyển đến trang đăng nhập an toàn của DigiX.</p>
                <button className="landing-auth-primary" type="button" onClick={() => void signIn("keycloak", { callbackUrl: "/dashboard" })}>
                  Tiếp tục đăng nhập <span aria-hidden="true">→</span>
                </button>
              </>
            ) : (
              <>
                <p>Tính năng tự đăng ký chưa được bật. Vui lòng liên hệ quản trị viên để được cấp tài khoản và quyền truy cập doanh nghiệp.</p>
                <button className="landing-auth-primary" type="button" onClick={() => setAuthMode("login")}>
                  Đã có tài khoản? Đăng nhập <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
