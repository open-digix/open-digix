import Link from "next/link";
import Image from "next/image";
import "../register/register.css";

export const metadata = {
  title: "Điều khoản sử dụng & Chính sách quyền riêng tư | DigiX",
  description: "Bản nháp quy định sử dụng và chính sách bảo vệ dữ liệu trên nền tảng DigiX.",
};

export default function DieuKhoanPage() {
  return (
    <div className="register-page">
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
            Minh bạch &amp;
            <br />
            Bảo mật thông tin.
          </h2>
          <p>
            DigiX tôn trọng quyền riêng tư của bạn và chỉ lưu trữ các thông tin thiết yếu phục vụ vận hành quy trình doanh nghiệp.
          </p>
        </div>
        <div className="side-foot">
          <small>DigiX Lab · Phần mềm nguồn mở</small>
          <Link href="/" className="side-back-link">
            ← Về trang giới thiệu DigiX
          </Link>
        </div>
      </aside>

      <main className="main" style={{ alignItems: "start", overflowY: "auto" }}>
        <section className="card" style={{ width: "min(680px, 100%)", paddingBottom: "32px" }} aria-label="Điều khoản và quyền riêng tư">
          <div className="pane on">
            <p className="eyebrow" style={{ color: "var(--ws-warning)", background: "var(--ws-c-fff8e7, #fef3c7)", display: "inline-block", padding: "4px 10px", borderRadius: "6px" }}>
              Bản nháp – chờ duyệt
            </p>
            <h1 className="title" style={{ marginTop: "12px" }}>
              Điều khoản &amp; Quyền riêng tư
            </h1>
            <p className="lead">
              Thông tin minh bạch về quyền và trách nhiệm khi sử dụng nền tảng DigiX.
            </p>

            <article id="dieu-khoan" style={{ marginTop: "24px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "600", color: "var(--ink)", marginBottom: "10px" }}>
                1. Điều khoản sử dụng
              </h2>
              <div style={{ fontSize: "13.5px", lineHeight: "1.65", color: "var(--ink-2)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <p>
                  • <b>Mục đích sử dụng:</b> Nền tảng DigiX hỗ trợ thiết kế, kiểm tra, vận hành và truy vết các quy trình nghiệp vụ số cho doanh nghiệp.
                </p>
                <p>
                  • <b>Quản lý tài khoản:</b> Quản trị viên doanh nghiệp chịu trách nhiệm về tài khoản của các thành viên trực thuộc doanh nghiệp mình.
                </p>
                <p>
                  • <b>Xóa tài khoản:</b> Người dùng có thể liên hệ quản trị viên hệ thống để yêu cầu xóa tài khoản khi không còn nhu cầu sử dụng.
                </p>
              </div>
            </article>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "22px 0" }} />

            <article id="quyen-rieng-tu">
              <h2 style={{ fontSize: "17px", fontWeight: "600", color: "var(--ink)", marginBottom: "10px" }}>
                2. Chính sách quyền riêng tư
              </h2>
              <div style={{ fontSize: "13.5px", lineHeight: "1.65", color: "var(--ink-2)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <p>
                  • <b>Dữ liệu tài khoản:</b> Các thông tin cá nhân bao gồm họ tên, email công việc và tên đăng nhập chỉ được sử dụng cho mục đích đăng nhập và quản lý không gian làm việc của doanh nghiệp.
                </p>
                <p>
                  • <b>Quản lý mật khẩu:</b> Mật khẩu do hệ thống xác thực Keycloak quản lý độc lập và mã hóa bảo mật. Nền tảng DigiX hoàn toàn không lưu trữ mật khẩu của người dùng.
                </p>
              </div>
            </article>

            <p className="foot" style={{ marginTop: "32px", textAlign: "left" }}>
              <Link href="/register" className="link">
                ← Quay lại trang đăng ký
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
