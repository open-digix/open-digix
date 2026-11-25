"use client";

import Link from "next/link";
import Image from "next/image";

interface ChoiceViewProps {
  onSelectTenant: () => void;
  onSelectJoin: () => void;
}

export default function ChoiceView({ onSelectTenant, onSelectJoin }: ChoiceViewProps) {
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
        <section className="card" aria-label="Bắt đầu cùng DigiX">
          <div className="pane on">
            <p className="eyebrow">Chào mừng bạn</p>
            <h1 className="title">Bắt đầu cùng DigiX</h1>
            <p className="lead">
              Chọn phương thức bắt đầu phù hợp với vai trò của bạn:
            </p>

            <div className="choice-cards" role="group" aria-label="Chọn hình thức đăng ký">
              <button
                type="button"
                className="choice-card"
                onClick={onSelectTenant}
                aria-label="Tạo doanh nghiệp mới"
              >
                <div className="choice-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
                  </svg>
                </div>
                <div className="choice-body">
                  <div className="choice-title">
                    <span>Tạo doanh nghiệp mới</span>
                    <span className="choice-arrow" aria-hidden="true">→</span>
                  </div>
                  <p className="choice-desc">
                    Dành cho người đại diện công ty. Bạn sẽ là quản trị viên.
                  </p>
                </div>
              </button>

              <button
                type="button"
                className="choice-card"
                onClick={onSelectJoin}
                aria-label="Tham gia doanh nghiệp có sẵn"
              >
                <div className="choice-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="choice-body">
                  <div className="choice-title">
                    <span>Tham gia doanh nghiệp có sẵn</span>
                    <span className="choice-arrow" aria-hidden="true">→</span>
                  </div>
                  <p className="choice-desc">
                    Gửi yêu cầu để quản trị viên cấp tài khoản.
                  </p>
                </div>
              </button>
            </div>

            <p className="foot">
              Đã có tài khoản?{" "}
              <Link href="/login" className="link">
                Đăng nhập
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
