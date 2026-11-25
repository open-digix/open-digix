"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface FormErrors {
  fullName?: string;
  email?: string;
  tenant?: string;
  role?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccountRequestFormProps {
  onBack?: () => void;
}

export default function AccountRequestForm({ onBack }: AccountRequestFormProps = {}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tenant, setTenant] = useState("");
  const [role, setRole] = useState("");
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
            fullName: "Vui lòng nhập họ và tên.",
            email: "Vui lòng nhập email.",
            tenant: "Chọn doanh nghiệp.",
            role: "Chọn vai trò.",
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

    if (!fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    }

    if (!email.trim()) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Email chưa đúng định dạng.";
    }

    if (!tenant) {
      nextErrors.tenant = "Chọn doanh nghiệp.";
    }

    if (!role) {
      nextErrors.role = "Chọn vai trò.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // Focus first error field
      if (nextErrors.fullName) {
        document.getElementById("fullName")?.focus();
      } else if (nextErrors.email) {
        document.getElementById("email")?.focus();
      } else if (nextErrors.tenant) {
        document.getElementById("tenant")?.focus();
      } else if (nextErrors.role) {
        document.getElementById("role")?.focus();
      }
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Giả lập gửi (0.6 giây), không gửi backend vì BE-08 chưa triển khai
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
            Quy trình rõ ràng.
            <br />
            Công việc liền mạch.
          </h2>
          <p>
            Thiết kế quy trình bằng mô tả, kiểm tra trước khi xuất bản, vận
            hành và truy vết trên cùng một nền tảng mở.
          </p>
          <div className="steps" aria-hidden="true">
            <div className="step">
              <b>01</b>
              <span>Thiết kế</span>
            </div>
            <i>→</i>
            <div className="step">
              <b>02</b>
              <span>Kiểm tra</span>
            </div>
            <i>→</i>
            <div className="step">
              <b>03</b>
              <span>Vận hành</span>
            </div>
          </div>
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
                <div className={`field ${errors.fullName ? "has-error" : ""}`}>
                  <label htmlFor="fullName">Họ và tên</label>
                  <div className="input-wrap">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="vd: Nguyễn Văn An"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName)
                          setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? "fullName-err" : undefined}
                    />
                  </div>
                  <p className="field-error" id="fullName-err" aria-live="polite">
                    {errors.fullName}
                  </p>
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

                <div className="grid-2">
                  <div className={`field ${errors.tenant ? "has-error" : ""}`}>
                    <label htmlFor="tenant">Doanh nghiệp</label>
                    <div className="select-wrap">
                      <select
                        id="tenant"
                        name="tenant"
                        value={tenant}
                        onChange={(e) => {
                          setTenant(e.target.value);
                          if (errors.tenant)
                            setErrors((prev) => ({ ...prev, tenant: undefined }));
                        }}
                        aria-invalid={!!errors.tenant}
                        aria-describedby={errors.tenant ? "tenant-err" : undefined}
                      >
                        <option value="">— Chọn —</option>
                        <option value="tenant-alpha">Tenant Alpha</option>
                        <option value="tenant-beta">Tenant Beta</option>
                        <option value="other">Khác / chưa rõ</option>
                      </select>
                    </div>
                    <p className="field-error" id="tenant-err" aria-live="polite">
                      {errors.tenant}
                    </p>
                  </div>

                  <div className={`field ${errors.role ? "has-error" : ""}`}>
                    <label htmlFor="role">Vai trò mong muốn</label>
                    <div className="select-wrap">
                      <select
                        id="role"
                        name="role"
                        value={role}
                        onChange={(e) => {
                          setRole(e.target.value);
                          if (errors.role)
                            setErrors((prev) => ({ ...prev, role: undefined }));
                        }}
                        aria-invalid={!!errors.role}
                        aria-describedby={errors.role ? "role-err" : undefined}
                      >
                        <option value="">— Chọn —</option>
                        <option value="employee">Nhân viên</option>
                        <option value="manager">Quản lý duyệt</option>
                        <option value="designer">Người thiết kế quy trình</option>
                      </select>
                    </div>
                    <p className="field-error" id="role-err" aria-live="polite">
                      {errors.role}
                    </p>
                  </div>
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
                    placeholder="vd: Phòng Kế toán, cần duyệt đề nghị mua sắm"
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
                  Tính năng gửi yêu cầu trực tiếp đang trong quá trình phát triển (BE-08). Thông tin chưa gửi tới hệ thống.
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
                <h1 className="title">Đã ghi nhận (bản thử)</h1>
                <p className="lead">
                  Quản trị viên sẽ xem xét. Khi được duyệt, thư mời sẽ gửi tới{" "}
                  <span className="email-chip">{email}</span>, thường trong 1 ngày làm việc.
                </p>
                <p className="hint-note">
                  (Giao diện xem thử – Thông tin chưa được lưu vào hệ thống do API BE-08 chưa triển khai.)
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
