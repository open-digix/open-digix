import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import EnforceLightMode from "@/components/common/EnforceLightMode";
import "../register/register.css";

export const metadata: Metadata = {
  title: "Điều khoản · DigiX",
  description: "Bản nháp quy định sử dụng và chính sách bảo vệ dữ liệu trên nền tảng DigiX theo kiến trúc v2.5.",
};

export default function DieuKhoanPage() {
  return (
    <div className="register-page" data-theme="light">
      <EnforceLightMode />
      <aside className="side">
        <div className="brandrow">
          <Image
            src="/brand/digix-logo-dark.svg"
            alt="DigiX Lab"
            width={94}
            height={40}
            priority
          />
        </div>
        <div className="pitch">
          <h2>
            Ứng dụng linh hoạt.
            <br />
            Dữ liệu độc lập.
          </h2>
          <p>
            Doanh nghiệp ghép các ứng dụng ERP/CRM từ tính năng có sẵn, mỗi ứng
            dụng có dữ liệu và quyền riêng.
          </p>
        </div>
        <div className="side-foot">
          <small>DigiX Lab · Phần mềm nguồn mở</small>
          <Link href="/" className="side-back-link">
            ← Về trang giới thiệu DigiX
          </Link>
        </div>
      </aside>

      <main
        className="main"
        style={{
          alignItems: "start",
          overflowY: "auto",
          background: "var(--ws-bg-canvas)",
          color: "var(--ws-text)",
        }}
      >
        <section
          className="card"
          style={{
            width: "min(680px, 100%)",
            paddingBottom: "32px",
            background: "var(--ws-bg-surface)",
            color: "var(--ws-text)",
            border: "1px solid var(--ws-border)",
            borderRadius: "14px",
          }}
          aria-label="Điều khoản và quyền riêng tư"
        >
          <div className="pane on">
            <p
              className="eyebrow"
              style={{
                color: "var(--ws-warning)",
                background: "var(--ws-bg-warning-soft)",
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "6px",
              }}
            >
              Bản nháp – chờ duyệt
            </p>
            <h1 className="title" style={{ marginTop: "12px", color: "var(--ws-text)" }}>
              Điều khoản &amp; Quyền riêng tư
            </h1>
            <p className="lead" style={{ color: "var(--ws-text-muted)" }}>
              Thông tin minh bạch về quyền và trách nhiệm khi sử dụng nền tảng DigiX.
            </p>

            <article id="dieu-khoan" style={{ marginTop: "24px" }}>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: "600",
                  color: "var(--ws-text)",
                  marginBottom: "10px",
                }}
              >
                1. Điều khoản sử dụng
              </h2>
              <div
                style={{
                  fontSize: "13.5px",
                  lineHeight: "1.65",
                  color: "var(--ws-text-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <p>
                  • <b>Ứng dụng nghiệp vụ v2.5:</b> Nền tảng DigiX hỗ trợ doanh nghiệp ghép nối các ứng dụng nghiệp vụ (ERP, CRM) từ các khối tính năng sẵn có. Mỗi ứng dụng vận hành theo luồng quy trình độc lập và phục vụ mục tiêu chuyên biệt.
                </p>
                <p>
                  • <b>Dữ liệu tách theo ứng dụng:</b> Mọi dữ liệu, hồ sơ và tài liệu phát sinh trong từng ứng dụng được phân vùng độc lập, bảo đảm an toàn dữ liệu và ngăn ngừa xung đột giữa các nghiệp vụ khác nhau.
                </p>
                <p>
                  • <b>Quản lý tài khoản &amp; phân quyền:</b> Quản trị viên doanh nghiệp chịu trách nhiệm phân quyền, gán vai trò vận hành và quản lý tài khoản của các thành viên trực thuộc doanh nghiệp mình.
                </p>
                <p>
                  • <b>Liên kết chia sẻ:</b> Các liên kết chia sẻ dữ liệu hoặc giao diện xem trước chỉ có hiệu lực theo đúng phạm vi phân quyền và tuân thủ các quy tắc bảo mật của hệ thống.
                </p>
              </div>
            </article>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--ws-border)",
                margin: "22px 0",
              }}
            />

            <article id="quyen-rieng-tu">
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: "600",
                  color: "var(--ws-text)",
                  marginBottom: "10px",
                }}
              >
                2. Chính sách quyền riêng tư
              </h2>
              <div
                style={{
                  fontSize: "13.5px",
                  lineHeight: "1.65",
                  color: "var(--ws-text-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <p>
                  • <b>Dữ liệu tài khoản:</b> Thông tin cá nhân (họ tên, email công việc và mã đăng nhập) chỉ được sử dụng cho mục đích xác thực và điều phối hoạt động trong không gian làm việc doanh nghiệp.
                </p>
                <p>
                  • <b>Quản lý mật khẩu:</b> Mật khẩu do hệ thống xác thực Keycloak quản lý độc lập và mã hóa bảo mật. Nền tảng DigiX hoàn toàn không lưu trữ mật khẩu của người dùng.
                </p>
                <p>
                  • <b>Trợ lý AI &amp; nguồn tri thức:</b> Trợ lý AI chỉ đọc và truy xuất từ các nguồn dữ liệu được doanh nghiệp chỉ định và cho phép, không tự ý thu thập hay chia sẻ thông tin ngoài phạm vi cấu hình.
                </p>
              </div>
            </article>

            <p className="foot" style={{ marginTop: "32px", textAlign: "left" }}>
              <Link href="/" className="side-back-link" style={{ fontSize: "13.5px" }}>
                ← Về trang giới thiệu DigiX
              </Link>
            </p>
          </div>

          <p className="foot mobile-back">
            <Link href="/" className="link">
              ← Về trang giới thiệu DigiX
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
