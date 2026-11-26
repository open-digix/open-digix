"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface FormErrors {
  lastName?: string;
  firstName?: string;
  email?: string;
  tenantSlug?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccountRequestFormProps {
  onBack?: () => void;
}

export default function AccountRequestForm({ onBack }: AccountRequestFormProps = {}) {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [reason, setReason] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shake, setShake] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const state = params.get("state");
        if (state === "validation") {
          setErrors({
            lastName: "Vui lòng nhập họ và tên đệm.",
            firstName: "Vui lòng nhập tên.",
            email: "Vui lòng nhập email công việc.",
            tenantSlug: "Vui lòng nhập mã doanh nghiệp.",
          });
        } else if (state === "done") {
          setEmail(params.get("email") || "an.nguyen@example.com");
          setIsSubmitted(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!lastName.trim()) {
      nextErrors.lastName = "Vui lòng nhập họ và tên đệm.";
    }

    if (!firstName.trim()) {
      nextErrors.firstName = "Vui lòng nhập tên.";
    }

    if (!email.trim()) {
      nextErrors.email = "Vui lòng nhập email công việc.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Email chưa đúng định dạng.";
    }

    if (!tenantSlug.trim()) {
      nextErrors.tenantSlug = "Vui lòng nhập mã doanh nghiệp.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // Focus first error field
      if (nextErrors.lastName) {
        document.getElementById("lastName")?.focus();
      } else if (nextErrors.firstName) {
        document.getElementById("firstName")?.focus();
      } else if (nextErrors.email) {
        document.getElementById("email")?.focus();
      } else if (nextErrors.tenantSlug) {
        document.getElementById("tenantSlug")?.focus();
      }
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

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

      <main className="main">
        <section
          ref={cardRef}
          className={`card ${shake ? "shake" : ""}`}
          aria-label="Yêu cầu cấp tài khoản"
        >
          {!isSubmitted ? (
            <div className="pane on">
              <p className="eyebrow">Tham gia DigiX</p>
              <h1 className="title">Yêu cầu cấp tài khoản</h1>
              <p className="lead">
                Doanh nghiệp của bạn quản lý tài khoản tập trung. Gửi yêu cầu,
                quản trị viên sẽ duyệt và gửi thư mời qua email.
              </p>

              <div className="note">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 11v6M12 7h.01" />
                </svg>
                <span>
                  Không cần tự đặt mật khẩu lúc này. Bạn sẽ đặt mật khẩu khi mở thư mời.
                </span>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid-2">
                  <div className={`field ${errors.lastName ? "has-error" : ""}`}>
                    <label htmlFor="lastName">Họ và tên đệm</label>
                    <div className="input-wrap">
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="vd: Nguyễn Văn"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (errors.lastName)
                            setErrors((prev) => ({ ...prev, lastName: undefined }));
                        }}
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? "lastName-err" : undefined}
                      />
                    </div>
                    <p className="field-error" id="lastName-err" aria-live="polite">
                      {errors.lastName}
                    </p>
                  </div>

                  <div className={`field ${errors.firstName ? "has-error" : ""}`}>
                    <label htmlFor="firstName">Tên</label>
                    <div className="input-wrap">
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="vd: An"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (errors.firstName)
                            setErrors((prev) => ({ ...prev, firstName: undefined }));
                        }}
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? "firstName-err" : undefined}
                      />
                    </div>
                    <p className="field-error" id="firstName-err" aria-live="polite">
                      {errors.firstName}
                    </p>
                  </div>
                </div>

                <div className={`field ${errors.email ? "has-error" : ""}`}>
                  <label htmlFor="email">Email công việc</label>
                  <div className="input-wrap">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="vd: ten@congty.vn"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                          setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-err" : undefined}
                    />
                  </div>
                  <p className="field-error" id="email-err" aria-live="polite">
                    {errors.email}
                  </p>
                </div>

                <div className={`field ${errors.tenantSlug ? "has-error" : ""}`}>
                  <label htmlFor="tenantSlug">Mã doanh nghiệp</label>
                  <div className="input-wrap">
                    <input
                      id="tenantSlug"
                      name="tenantSlug"
                      type="text"
                      placeholder="vd: cong-ty-abc"
                      autoComplete="organization"
                      value={tenantSlug}
                      onChange={(e) => {
                        setTenantSlug(e.target.value);
                        if (errors.tenantSlug)
                          setErrors((prev) => ({ ...prev, tenantSlug: undefined }));
                      }}
                      aria-invalid={!!errors.tenantSlug}
                      aria-describedby={errors.tenantSlug ? "tenantSlug-err" : undefined}
                    />
                  </div>
                  <p className="field-error" id="tenantSlug-err" aria-live="polite">
                    {errors.tenantSlug}
                  </p>
                </div>

                <div className="field">
                  <label htmlFor="reason">
                    Ghi chú cho quản trị viên{" "}
                    <span style={{ fontWeight: 400, color: "var(--ink-2)" }}>
                      (không bắt buộc)
                    </span>
                  </label>
                  <textarea
                    className="ta"
                    id="reason"
                    name="reason"
                    placeholder="vd: Phòng Kế toán, cần truy cập phân hệ mua sắm"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <button
                  className={`btn ${isSubmitting ? "is-loading" : ""}`}
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span className="spinner" aria-hidden="true" />
                  <span className="label">Gửi yêu cầu</span>
                  <span className="arrow" aria-hidden="true">
                    →
                  </span>
                </button>

                <p className="hint-note">
                  Hệ thống tiếp nhận yêu cầu và gửi thông báo tới quản trị viên doanh nghiệp.
                </p>
              </form>

              <p className="foot">
                {onBack && (
                  <button
                    type="button"
                    className="link"
                    onClick={onBack}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: 16 }}
                  >
                    ← Chọn lại
                  </button>
                )}
                Đã có tài khoản?{" "}
                <Link href="/login" className="link">
                  Đăng nhập
                </Link>
              </p>
            </div>
          ) : (
            <div className="pane on">
              <div className="success">
                <svg
                  className="tick"
                  viewBox="0 0 64 64"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="32" cy="32" r="28" stroke="currentColor" />
                  <path d="M20 33l8 8 16-17" stroke="currentColor" />
                </svg>
                <h1 className="title">Đã ghi nhận yêu cầu</h1>
                <p className="lead">
                  Quản trị viên sẽ xem xét. Khi được duyệt, thư mời sẽ gửi tới{" "}
                  <span className="email-chip">{email}</span>, thường trong 1 ngày làm việc.
                </p>
                <p className="hint-note">
                  (Yêu cầu tham gia của bạn đã được ghi nhận và đang chờ quản trị viên phê duyệt.)
                </p>
                <p className="foot">
                  <Link href="/login" className="btn btn-ghost">
                    Về trang đăng nhập
                  </Link>
                </p>
              </div>
            </div>
          )}

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
