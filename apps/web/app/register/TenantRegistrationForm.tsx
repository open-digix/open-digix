"use client";

import { useState, useRef, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { toTenantSlug, isValidTenantSlug } from "../../lib/registration/slug";
import { registerTenantAction } from "../../lib/registration/actions";
import type { TenantRegistrationSuccess } from "../../lib/registration/types";

interface TenantRegistrationFormProps {
  onBackToChoice: () => void;
}

interface FormErrors {
  tenantName?: string;
  tenantSlug?: string;
  lastName?: string;
  firstName?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  admin?: string;
  terms?: string;
}

const USERNAME_REGEX = /^[a-z][a-z0-9._-]{2,63}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function scorePassword(v: string) {
  const r = {
    len: v.length >= 8 && v.length <= 128,
    up: /[A-ZÀ-Ỹ]/.test(v),
    num: /\d/.test(v),
    sym: /[^\w\sÀ-ỹ]/.test(v),
  };
  const extraCount = [r.up, r.num, r.sym].filter(Boolean).length;
  const count = (r.len ? 1 : 0) + extraCount;
  return { r, count, extraCount, valid: r.len && extraCount >= 2 };
}

const METER_LABELS = ["—", "Yếu", "Trung bình", "Khá", "Mạnh"];

export default function TenantRegistrationForm({ onBackToChoice }: TenantRegistrationFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 fields
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Step 2 fields
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [successData, setSuccessData] = useState<TenantRegistrationSuccess | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const generalAlertId = useId();

  const pwScore = scorePassword(password);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Thay đổi tên doanh nghiệp -> tự sinh mã slug nếu chưa sửa tay
  const handleTenantNameChange = (val: string) => {
    setTenantName(val);
    if (errors.tenantName) {
      setErrors((prev) => ({ ...prev, tenantName: undefined }));
    }
    if (!slugManuallyEdited) {
      setTenantSlug(toTenantSlug(val));
      if (errors.tenantSlug) {
        setErrors((prev) => ({ ...prev, tenantSlug: undefined }));
      }
    }
  };

  const handleTenantSlugChange = (val: string) => {
    setSlugManuallyEdited(true);
    setTenantSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    if (errors.tenantSlug) {
      setErrors((prev) => ({ ...prev, tenantSlug: undefined }));
    }
  };

  // Xác thực bước 1
  const validateStep1 = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!tenantName.trim()) {
      nextErrors.tenantName = "Vui lòng nhập tên doanh nghiệp.";
    } else if (tenantName.trim().length < 2) {
      nextErrors.tenantName = "Tên doanh nghiệp phải có ít nhất 2 ký tự.";
    } else if (tenantName.trim().length > 160) {
      nextErrors.tenantName = "Tên doanh nghiệp không được vượt quá 160 ký tự.";
    }

    if (!tenantSlug.trim()) {
      nextErrors.tenantSlug = "Vui lòng nhập mã doanh nghiệp.";
    } else if (!isValidTenantSlug(tenantSlug.trim())) {
      nextErrors.tenantSlug =
        "Mã doanh nghiệp dài 3–40 ký tự, bắt đầu bằng chữ cái, chỉ gồm chữ thường (a-z), số và dấu '-', không kết thúc bằng '-'.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      triggerShake();
      if (nextErrors.tenantName) {
        document.getElementById("tenantName")?.focus();
      } else if (nextErrors.tenantSlug) {
        document.getElementById("tenantSlug")?.focus();
      }
      return false;
    }

    return true;
  };

  // Chuyển sang bước 2
  const handleGoToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setErrors({});
    setGeneralError(null);
    setStep(2);
  };

  // Xác thực bước 2
  const validateStep2 = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!lastName.trim()) {
      nextErrors.lastName = "Vui lòng nhập họ và tên đệm.";
    } else if (lastName.trim().length > 80) {
      nextErrors.lastName = "Họ và tên đệm không được vượt quá 80 ký tự.";
    }

    if (!firstName.trim()) {
      nextErrors.firstName = "Vui lòng nhập tên.";
    } else if (firstName.trim().length > 80) {
      nextErrors.firstName = "Tên không được vượt quá 80 ký tự.";
    }

    if (!email.trim()) {
      nextErrors.email = "Vui lòng nhập email công việc.";
    } else if (email.trim().length > 320) {
      nextErrors.email = "Email không được vượt quá 320 ký tự.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Email công việc chưa đúng định dạng.";
    }

    if (!username.trim()) {
      nextErrors.username = "Vui lòng nhập tên đăng nhập.";
    } else if (!USERNAME_REGEX.test(username.trim())) {
      nextErrors.username =
        "Tên đăng nhập dài 3–64 ký tự, bắt đầu bằng chữ cái, chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.";
    }

    if (!password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 8) {
      nextErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    } else if (password.length > 128) {
      nextErrors.password = "Mật khẩu không được vượt quá 128 ký tự.";
    } else if (pwScore.extraCount < 2) {
      nextErrors.password =
        "Mật khẩu phải thỏa mãn ít nhất 2 trong 3 yêu cầu: chữ hoa, chữ số, ký tự đặc biệt.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (!termsAccepted) {
      nextErrors.terms = "Vui lòng đồng ý với điều khoản sử dụng để tiếp tục.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      triggerShake();
      if (nextErrors.lastName) document.getElementById("lastName")?.focus();
      else if (nextErrors.firstName) document.getElementById("firstName")?.focus();
      else if (nextErrors.email) document.getElementById("email")?.focus();
      else if (nextErrors.username) document.getElementById("username")?.focus();
      else if (nextErrors.password) document.getElementById("password")?.focus();
      else if (nextErrors.confirmPassword) document.getElementById("confirmPassword")?.focus();
      else if (nextErrors.terms) document.getElementById("termsAccepted")?.focus();
      return false;
    }

    return true;
  };

  // Gửi đăng ký
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const res = await registerTenantAction({
        tenantName: tenantName.trim(),
        tenantSlug: tenantSlug.trim(),
        admin: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
        },
      });

      if (res.ok) {
        setSuccessData(res);
        setStep(3);
      } else {
        triggerShake();
        if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
          setErrors(res.fieldErrors);
          if (res.fieldErrors.tenantSlug) {
            setStep(1);
            setTimeout(() => document.getElementById("tenantSlug")?.focus(), 100);
          } else if (res.fieldErrors.tenantName) {
            setStep(1);
            setTimeout(() => document.getElementById("tenantName")?.focus(), 100);
          } else if (res.fieldErrors.admin) {
            document.getElementById("lastName")?.focus();
          } else if (res.fieldErrors.lastName) {
            document.getElementById("lastName")?.focus();
          } else if (res.fieldErrors.firstName) {
            document.getElementById("firstName")?.focus();
          } else if (res.fieldErrors.email) {
            document.getElementById("email")?.focus();
          } else if (res.fieldErrors.username) {
            document.getElementById("username")?.focus();
          } else if (res.fieldErrors.password) {
            document.getElementById("password")?.focus();
          }
        } else if (res.field === "tenantSlug") {
          // Slug lỗi: tự quay về bước 1 và chỉ vào ô mã
          setStep(1);
          setErrors({ tenantSlug: res.message });
          setTimeout(() => document.getElementById("tenantSlug")?.focus(), 100);
        } else if (res.field === "tenantName") {
          setStep(1);
          setErrors({ tenantName: res.message });
          setTimeout(() => document.getElementById("tenantName")?.focus(), 100);
        } else if (res.field === "admin") {
          setErrors({ admin: res.message });
          document.getElementById("lastName")?.focus();
        } else if (res.field === "email") {
          setErrors({ email: res.message });
          document.getElementById("email")?.focus();
        } else if (res.field === "username") {
          setErrors({ username: res.message });
          document.getElementById("username")?.focus();
        } else if (res.field === "firstName") {
          setErrors({ firstName: res.message });
          document.getElementById("firstName")?.focus();
        } else if (res.field === "lastName") {
          setErrors({ lastName: res.message });
          document.getElementById("lastName")?.focus();
        } else if (res.field === "password") {
          setErrors({ password: res.message });
          document.getElementById("password")?.focus();
        } else {
          setGeneralError(res.message);
        }
      }
    } catch {
      triggerShake();
      setGeneralError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
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
          aria-label="Tạo doanh nghiệp mới"
        >
          {step < 3 && (
            <div className="stepper" aria-label="Tiến trình đăng ký doanh nghiệp">
              <div
                className={`st ${step === 1 ? "on" : "done"}`}
                aria-current={step === 1 ? "step" : undefined}
              >
                <b>{step > 1 ? "✓" : "1"}</b>
                Doanh nghiệp
              </div>
              <div className={`bar ${step > 1 ? "done" : ""}`} />
              <div
                className={`st ${step === 2 ? "on" : ""}`}
                aria-current={step === 2 ? "step" : undefined}
              >
                <b>2</b>
                Tài khoản quản trị
              </div>
            </div>
          )}

          {generalError && (
            <div className="alert alert-error" role="alert" id={generalAlertId}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          {/* BƯỚC 1: THÔNG TIN DOANH NGHIỆP */}
          {step === 1 && (
            <div className="pane on">
              <p className="eyebrow">Bước 1 / 2</p>
              <h1 className="title">Tạo doanh nghiệp mới</h1>
              <p className="lead">
                Khởi tạo không gian làm việc số cho doanh nghiệp của bạn.
              </p>

              <form onSubmit={handleGoToStep2} noValidate>
                <div className={`field ${errors.tenantName ? "has-error" : ""}`}>
                  <label htmlFor="tenantName">Tên doanh nghiệp</label>
                  <div className="input-wrap">
                    <input
                      id="tenantName"
                      name="tenantName"
                      type="text"
                      placeholder="vd: Công ty Cổ phần Đông Á"
                      autoComplete="organization"
                      autoFocus
                      value={tenantName}
                      onChange={(e) => handleTenantNameChange(e.target.value)}
                      aria-invalid={!!errors.tenantName}
                      aria-describedby={errors.tenantName ? "tenantName-err" : undefined}
                    />
                  </div>
                  {errors.tenantName && (
                    <p className="field-error" id="tenantName-err" aria-live="polite">
                      {errors.tenantName}
                    </p>
                  )}
                </div>

                <div className={`field ${errors.tenantSlug ? "has-error" : ""}`}>
                  <label htmlFor="tenantSlug">Mã doanh nghiệp</label>
                  <div className="input-wrap">
                    <input
                      id="tenantSlug"
                      name="tenantSlug"
                      type="text"
                      placeholder="vd: cong-ty-dong-a"
                      autoComplete="off"
                      value={tenantSlug}
                      onChange={(e) => handleTenantSlugChange(e.target.value)}
                      aria-invalid={!!errors.tenantSlug}
                      aria-describedby="tenantSlug-hint tenantSlug-err"
                    />
                  </div>
                  <p className="slug-hint" id="tenantSlug-hint">
                    Dùng trong đường dẫn, chỉ chữ thường, số, dấu gạch ngang. Đường dẫn xem trước:{" "}
                    <span className="slug-preview">
                      digix.app/t/{tenantSlug || "ma-doanh-nghiep"}
                    </span>
                  </p>
                  {errors.tenantSlug && (
                    <p className="field-error" id="tenantSlug-err" aria-live="polite">
                      {errors.tenantSlug}
                    </p>
                  )}
                </div>

                <button className="btn" type="submit">
                  <span className="label">Tiếp tục</span>
                  <span className="arrow" aria-hidden="true">→</span>
                </button>
              </form>

              <p className="foot">
                <button
                  type="button"
                  className="link"
                  onClick={onBackToChoice}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  ← Chọn lại hình thức đăng ký
                </button>
              </p>
            </div>
          )}

          {/* BƯỚC 2: TÀI KHOẢN QUẢN TRỊ */}
          {step === 2 && (
            <div className="pane on">
              <p className="eyebrow">Bước 2 / 2</p>
              <h1 className="title">Tài khoản quản trị</h1>
              <p className="lead">
                Bạn sẽ là quản trị viên của <b>{tenantName}</b>.
              </p>

              {errors.admin && (
                <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
                  <span>{errors.admin}</span>
                </div>
              )}

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
                          if (errors.lastName) setErrors((p) => ({ ...p, lastName: undefined }));
                        }}
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? "lastName-err" : undefined}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="field-error" id="lastName-err" aria-live="polite">
                        {errors.lastName}
                      </p>
                    )}
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
                          if (errors.firstName) setErrors((p) => ({ ...p, firstName: undefined }));
                        }}
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? "firstName-err" : undefined}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="field-error" id="firstName-err" aria-live="polite">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`field ${errors.email ? "has-error" : ""}`}>
                  <label htmlFor="email">Email công việc</label>
                  <div className="input-wrap">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="vd: an.nguyen@donga.vn"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                      }}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-err" : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p className="field-error" id="email-err" aria-live="polite">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className={`field ${errors.username ? "has-error" : ""}`}>
                  <label htmlFor="username">Tên đăng nhập</label>
                  <div className="input-wrap">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="vd: an.nguyen"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase());
                        if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
                      }}
                      aria-invalid={!!errors.username}
                      aria-describedby={errors.username ? "username-err" : undefined}
                    />
                  </div>
                  {errors.username && (
                    <p className="field-error" id="username-err" aria-live="polite">
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className={`field ${errors.password ? "has-error" : ""}`}>
                  <label htmlFor="password">Mật khẩu</label>
                  <div className="input-wrap">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                      }}
                      aria-invalid={!!errors.password}
                      aria-describedby="password-err"
                    />
                    <button
                      type="button"
                      className={`toggle-pass ${showPassword ? "is-on" : ""}`}
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <svg className="eye-on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg className="eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
                    </button>
                  </div>

                  <div className="meter" id="meter" data-level={password ? pwScore.count : 0} aria-hidden="true">
                    <i /><i /><i /><i />
                  </div>
                  <div className="meter-label">
                    <span>Độ mạnh mật khẩu</span>
                    <span>{password ? METER_LABELS[pwScore.count] : "—"}</span>
                  </div>
                  <ul className="rules" id="rules">
                    <li className={pwScore.r.len ? "ok" : ""}>Ít nhất 8 ký tự</li>
                    <li className={pwScore.r.up ? "ok" : ""}>Có chữ hoa</li>
                    <li className={pwScore.r.num ? "ok" : ""}>Có chữ số</li>
                    <li className={pwScore.r.sym ? "ok" : ""}>Có ký tự đặc biệt</li>
                  </ul>

                  {errors.password && (
                    <p className="field-error" id="password-err" aria-live="polite">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className={`field ${errors.confirmPassword ? "has-error" : ""}`}>
                  <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                  <div className="input-wrap">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword)
                          setErrors((p) => ({ ...p, confirmPassword: undefined }));
                      }}
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? "confirmPassword-err" : undefined}
                    />
                    <button
                      type="button"
                      className={`toggle-pass ${showConfirmPassword ? "is-on" : ""}`}
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <svg className="eye-on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg className="eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="field-error" id="confirmPassword-err" aria-live="polite">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className={`field ${errors.terms ? "has-error" : ""}`}>
                  <label className="check" htmlFor="termsAccepted">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      name="termsAccepted"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
                      }}
                      aria-invalid={!!errors.terms}
                      aria-describedby={errors.terms ? "terms-err" : undefined}
                    />
                    <span>
                      Tôi đồng ý với{" "}
                      <Link
                        href="/dieu-khoan#dieu-khoan"
                        target="_blank"
                        rel="noopener"
                        className="link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Điều khoản sử dụng
                      </Link>{" "}
                      và{" "}
                      <Link
                        href="/dieu-khoan#quyen-rieng-tu"
                        target="_blank"
                        rel="noopener"
                        className="link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Chính sách quyền riêng tư
                      </Link>
                    </span>
                  </label>
                  {errors.terms && (
                    <p
                      className="field-error terms-field-error"
                      id="terms-err"
                      aria-live="polite"
                      style={{ paddingLeft: 28, margin: "6px 0 0" }}
                    >
                      {errors.terms}
                    </p>
                  )}
                </div>

                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setErrors({});
                      setGeneralError(null);
                      setStep(1);
                    }}
                    disabled={isSubmitting}
                  >
                    ← Quay lại
                  </button>
                  <button
                    className={`btn ${isSubmitting ? "is-loading" : ""}`}
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <span className="spinner" aria-hidden="true" />
                    <span className="label">Tạo doanh nghiệp</span>
                    <span className="arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* BƯỚC 3: MÀN HÌNH THÀNH CÔNG */}
          {step === 3 && successData && (
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
                <h1 className="title">
                  {successData.mock ? "Thông tin hợp lệ (bản thử)" : "Đã tạo doanh nghiệp"}
                </h1>
                {successData.mock ? (
                  <p className="lead">
                    Thông tin doanh nghiệp <b>{successData.tenantName}</b>{" "}
                    <span style={{ whiteSpace: "nowrap" }}>(<code className="slug-preview">{successData.tenantSlug}</code>)</span> và
                    tài khoản quản trị <b>{successData.username}</b> đã hợp lệ. Doanh nghiệp{" "}
                    <b>chưa được tạo thật</b> vì hệ thống đang chờ API (#35).
                  </p>
                ) : (
                  <p className="lead">
                    Doanh nghiệp <b>{successData.tenantName}</b>{" "}
                    <span style={{ whiteSpace: "nowrap" }}>(<code className="slug-preview">{successData.tenantSlug}</code>)</span> đã
                    được khởi tạo thành công. Bạn có thể đăng nhập bằng tài khoản quản trị{" "}
                    <b>{successData.username}</b>.
                  </p>
                )}

                <p className="foot" style={{ marginTop: 24 }}>
                  {successData.mock ? (
                    <Link href="/" className="btn btn-ghost">
                      Về trang giới thiệu
                    </Link>
                  ) : (
                    <Link href="/login" className="btn">
                      Đăng nhập
                    </Link>
                  )}
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
