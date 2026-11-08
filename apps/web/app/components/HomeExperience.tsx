"use client";

import { FormEvent, useState } from "react";

type IconName =
  | "arrow"
  | "automation"
  | "briefcase"
  | "chart"
  | "check"
  | "chevron"
  | "close"
  | "crm"
  | "finance"
  | "grid"
  | "hr"
  | "inventory"
  | "menu"
  | "play"
  | "quote"
  | "rocket"
  | "shield"
  | "spark"
  | "support"
  | "web";

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    automation: (
      <>
        <path d="M4 8h16M4 16h16" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: (
      <>
        <path d="M6 6l12 12M18 6 6 18" />
      </>
    ),
    crm: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2" />
        <path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M15 15c3.5-.5 6 1.5 6 5" />
      </>
    ),
    finance: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8.5c-.7-.7-1.6-1-3-1-1.7 0-3 1-3 2.3 0 3.5 6 1.5 6 5 0 1.3-1.3 2.2-3 2.2-1.4 0-2.5-.4-3.2-1.2M12 5v14" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    hr: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21c0-5 3-8 8-8s8 3 8 8" />
      </>
    ),
    inventory: (
      <>
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    play: <path d="m9 7 8 5-8 5V7Z" fill="currentColor" />,
    quote: (
      <path d="M7 10h4v9H3v-6c0-5 2-8 7-9v3c-2 .7-3 1.5-3 3Zm10 0h4v9h-8v-6c0-5 2-8 7-9v3c-2 .7-3 1.5-3 3Z" />
    ),
    rocket: (
      <>
        <path d="M14 4c3-2 6-2 6-2s0 3-2 6l-5 5-5-5 6-4Z" />
        <path d="M8 8H4l-2 5 5 1m6-1 1 5 5-2v-4M8 16l-3 3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5l-8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    spark: (
      <path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Zm7 14 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    ),
    support: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h4m10 0h4M12 3v4m0 10v4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8m-7.2 7.2-2.8 2.8" />
      </>
    ),
    web: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9Z" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const products = [
  { icon: "crm" as const, name: "CRM", desc: "Quản lý khách hàng", color: "#1E3364" },
  { icon: "finance" as const, name: "Tài chính", desc: "Kế toán thông minh", color: "#F06424" },
  { icon: "hr" as const, name: "Nhân sự", desc: "Gắn kết đội ngũ", color: "#36558F" },
  { icon: "inventory" as const, name: "Kho vận", desc: "Vận hành liền mạch", color: "#F26522" },
  { icon: "briefcase" as const, name: "Công việc", desc: "Cộng tác hiệu quả", color: "#4569A3" },
  { icon: "web" as const, name: "Website", desc: "Hiện diện số mạnh mẽ", color: "#D94F18" },
  {
    icon: "automation" as const,
    name: "Tự động hóa",
    desc: "Tăng tốc quy trình",
    color: "#F06424",
  },
  { icon: "chart" as const, name: "Báo cáo", desc: "Dữ liệu thời gian thực", color: "#1C3064" },
];

const stats = [
  ["50+", "quy trình được số hóa"],
  ["35%", "tiết kiệm chi phí vận hành"],
  ["2.5×", "tăng tốc độ xử lý"],
  ["99.9%", "thời gian hoạt động"],
];

type HomeExperienceProps = {
  initialAuth?: "login" | "register";
};

export default function HomeExperience({
  initialAuth,
}: HomeExperienceProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(Boolean(initialAuth));
  const [submitted, setSubmitted] = useState(false);
  const [authMode, setAuthMode] = useState<"register" | "login">(initialAuth ?? "register",);
  const [formError, setFormError] = useState("");
  const [activeProduct, setActiveProduct] = useState(0);

  const openAuth = (mode: "register" | "login") => {
    setAuthMode(mode);
    setSubmitted(false);
    setFormError("");
    setModalOpen(true);
  };

  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (authMode === "register" && data.get("password") !== data.get("confirmPassword")) {
      setFormError("Mật khẩu xác nhận chưa khớp. Vui lòng kiểm tra lại.");
      return;
    }
    setFormError("Đây là giao diện thử. Chức năng đăng nhập và đăng ký chưa được kết nối.",);
  };

  return (
    <div className="site">
      <div className="announcement">
        <span>Đồng hành cùng doanh nghiệp Việt trên hành trình số</span>
        <a href="#solutions">
          Khám phá nền tảng <Icon name="arrow" size={15} />
        </a>
      </div>

      <header className="header">
        <a className="logo" href="#" aria-label="DIgiX">
          <svg viewBox="0 0 42 42" aria-hidden="true">
            <path d="M21 2 37.5 11.5v19L21 40 4.5 30.5v-19L21 2Z" fill="url(#logoGradient)" />
            <path
              d="M13 12.5h11.5c5 0 8 2.5 8 7s-3 7-8 7H19V34h-6V12.5Zm6 5v4h5c1.5 0 2.4-.6 2.4-2s-.9-1.9-2.4-1.9h-5Z"
              fill="white"
            />
            <defs>
              <linearGradient id="logoGradient" x1="5" y1="4" x2="38" y2="38">
                <stop stopColor="#1E3364" />
                <stop offset="1" stopColor="#F06424" />
              </linearGradient>
            </defs>
          </svg>
          <span>
            <b>DIgiX</b>
            <small>DIGITAL PLATFORM</small>
          </span>
        </a>
        <nav className={mobileOpen ? "nav open" : "nav"}>
          <a href="#solutions">Giải pháp</a>
          <a href="#platform">Nền tảng</a>
          <a href="#customers">Khách hàng</a>
          <a href="#about">Về chúng tôi</a>
          <a href="#resources">Tài nguyên</a>
        </nav>
        <div className="header-actions">
          <button className="text-button" onClick={() => openAuth("login")}>
            Đăng nhập
          </button>
          <button className="primary-button small" onClick={() => openAuth("register")}>
            Đăng ký
          </button>
          <button
            className="menu-button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Mở menu"
          >
            <Icon name={mobileOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-orb orb-one" />
          <div className="hero-orb orb-two" />
          <div className="hero-copy">
            <div className="pill">
              <Icon name="spark" size={16} /> Hệ sinh thái chuyển đổi số toàn diện
            </div>
            <h1>
              Một nền tảng.
              <br />
              <span>Vạn tiềm năng.</span>
            </h1>
            <p>
              Kết nối con người, quy trình và dữ liệu trên một nền tảng duy nhất — giúp doanh nghiệp
              vận hành thông minh và tăng trưởng bền vững.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => openAuth("register")}>
                Đăng ký ngay <Icon name="arrow" size={18} />
              </button>
              <button
                className="video-button"
                onClick={() =>
                  document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <span>
                  <Icon name="play" size={15} />
                </span>
                Xem cách hoạt động
              </button>
            </div>
            <div className="hero-note">
              <span>
                <Icon name="check" size={13} /> Không cần thẻ tín dụng
              </span>
              <span>
                <Icon name="check" size={13} /> Triển khai nhanh chóng
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Mô phỏng bảng điều khiển doanh nghiệp">
            <div className="dashboard">
              <div className="dash-sidebar">
                <div className="mini-logo">P</div>
                {["grid", "chart", "crm", "briefcase", "inventory"].map((item, index) => (
                  <span className={index === 0 ? "active" : ""} key={item}>
                    <Icon name={item as IconName} size={17} />
                  </span>
                ))}
              </div>
              <div className="dash-main">
                <div className="dash-top">
                  <div>
                    <small>TỔNG QUAN</small>
                    <b>Xin chào, Ryan Dang</b>
                  </div>
                  <span className="dash-avatar">MA</span>
                </div>
                <div className="metric-row">
                  <div>
                    <span>Doanh thu tháng</span>
                    <b>2,48 tỷ</b>
                    <i>+12.5%</i>
                  </div>
                  <div>
                    <span>Khách hàng mới</span>
                    <b>1.284</b>
                    <i>+8.2%</i>
                  </div>
                  <div>
                    <span>Hiệu suất</span>
                    <b>94,6%</b>
                    <i>+4.1%</i>
                  </div>
                </div>
                <div className="chart-card">
                  <div className="card-title">
                    <div>
                      <b>Tăng trưởng doanh thu</b>
                      <span>6 tháng gần nhất</span>
                    </div>
                    <button>2025⌄</button>
                  </div>
                  <svg viewBox="0 0 480 145" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                        <stop stopColor="#1E3364" stopOpacity=".28" />
                        <stop offset="1" stopColor="#1E3364" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path className="grid-lines" d="M0 25H480M0 65H480M0 105H480" />
                    <path
                      className="area"
                      d="M0 115 C40 100 55 110 90 88 S150 105 190 70 S250 80 290 50 S350 68 390 31 S440 38 480 12 L480 145 L0 145Z"
                    />
                    <path
                      className="line"
                      d="M0 115 C40 100 55 110 90 88 S150 105 190 70 S250 80 290 50 S350 68 390 31 S440 38 480 12"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="floating-card task-card">
              <span>
                <Icon name="check" size={16} />
              </span>
              <div>
                <b>Quy trình hoàn tất</b>
                <small>Đề xuất đã được phê duyệt</small>
              </div>
            </div>
            <div className="floating-card ai-card">
              <span>
                <Icon name="spark" size={17} />
              </span>
              <div>
                <b>AI Insight</b>
                <small>Doanh thu dự báo tăng 18%</small>
              </div>
            </div>
          </div>
        </section>

        <section className="trusted">
          <p>Được tin tưởng bởi các doanh nghiệp tiên phong</p>
          <div className="logo-cloud">
            <b>PHENIKAA-X</b>
            <b>Tool System</b>
            <b>Đình An</b>
            <b>Dũng Phạm</b>
            <b>Ryan Dang</b>
          </div>
        </section>

        <section className="solutions" id="solutions">
          <div className="section-heading">
            <span className="section-kicker">MỌI THỨ BẠN CẦN</span>
            <h2>
              Điều hành doanh nghiệp.
              <br />
              <em>Theo cách đơn giản hơn.</em>
            </h2>
            <p>
              Từ bán hàng đến vận hành, mọi ứng dụng đều kết nối tự nhiên trong một hệ sinh thái duy
              nhất.
            </p>
          </div>
          <div className="product-grid">
            {products.map((product, index) => (
              <button
                className={activeProduct === index ? "product-card active" : "product-card"}
                key={product.name}
                onClick={() => setActiveProduct(index)}
                style={{ "--app-color": product.color } as React.CSSProperties}
              >
                <span className="product-icon">
                  <Icon name={product.icon} />
                </span>
                <span>
                  <b>{product.name}</b>
                  <small>{product.desc}</small>
                </span>
                <i>
                  <Icon name="chevron" size={16} />
                </i>
              </button>
            ))}
          </div>
          <button className="all-apps">
            Xem tất cả ứng dụng <Icon name="arrow" size={17} />
          </button>
        </section>

        <section className="platform" id="platform">
          <div className="platform-visual">
            <div className="workflow-window">
              <div className="window-bar">
                <i />
                <i />
                <i />
                <span>Quy trình tự động</span>
              </div>
              <div className="flow">
                <div className="flow-node">
                  <span style={{ background: "#1E3364" }}>
                    <Icon name="crm" size={18} />
                  </span>
                  <div>
                    <small>KHI</small>
                    <b>Có khách hàng mới</b>
                  </div>
                </div>
                <div className="flow-line">
                  <i />
                </div>
                <div className="flow-node">
                  <span style={{ background: "#F06424" }}>
                    <Icon name="automation" size={18} />
                  </span>
                  <div>
                    <small>THỰC HIỆN</small>
                    <b>Phân loại bằng AI</b>
                  </div>
                </div>
                <div className="flow-line">
                  <i />
                </div>
                <div className="flow-node">
                  <span style={{ background: "#36558F" }}>
                    <Icon name="briefcase" size={18} />
                  </span>
                  <div>
                    <small>SAU ĐÓ</small>
                    <b>Giao cho tư vấn viên</b>
                  </div>
                </div>
              </div>
              <div className="automation-badge">
                <Icon name="spark" size={15} /> Tiết kiệm 12 giờ / tuần
              </div>
            </div>
          </div>
          <div className="platform-copy">
            <span className="section-kicker">TỰ ĐỘNG HÓA THÔNG MINH</span>
            <h2>
              Ít thao tác hơn.
              <br />
              <em>Nhiều giá trị hơn.</em>
            </h2>
            <p>
              Giải phóng đội ngũ khỏi công việc lặp lại. Xây dựng quy trình trực quan, kết nối dữ
              liệu và để AI hỗ trợ ra quyết định.
            </p>
            <ul>
              <li>
                <span>
                  <Icon name="check" size={15} />
                </span>
                Thiết lập quy trình không cần lập trình
              </li>
              <li>
                <span>
                  <Icon name="check" size={15} />
                </span>
                Tích hợp liền mạch với hệ thống hiện có
              </li>
              <li>
                <span>
                  <Icon name="check" size={15} />
                </span>
                Báo cáo và cảnh báo theo thời gian thực
              </li>
            </ul>
            <a href="#about">
              Khám phá nền tảng <Icon name="arrow" size={17} />
            </a>
          </div>
        </section>

        <section className="impact">
          <div className="impact-copy">
            <span className="section-kicker light">HIỆU QUẢ ĐƯỢC ĐO LƯỜNG</span>
            <h2>
              Chuyển đổi hôm nay.
              <br />
              <em>Dẫn đầu ngày mai.</em>
            </h2>
            <p>Công nghệ chỉ có ý nghĩa khi tạo ra kết quả thực tế cho doanh nghiệp.</p>
          </div>
          <div className="stats-grid">
            {stats.map(([value, label]) => (
              <div key={label}>
                <b>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="story" id="customers">
          <div className="story-photo">
            <img
              src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=85"
              alt="Đội ngũ doanh nghiệp cùng làm việc trong văn phòng hiện đại"
            />
            <div>
              <span>KHÁCH HÀNG TIÊU BIỂU</span>
              <b>Hệ sinh thái giáo dục</b>
            </div>
          </div>
          <div className="story-quote">
            <Icon name="quote" size={38} />
            <blockquote>
              “DIgiX không chỉ cung cấp công nghệ, mà còn giúp chúng tôi nhìn lại và tối ưu toàn bộ
              cách thức vận hành.”
            </blockquote>
            <div className="person">
              <span>NT</span>
              <div>
                <b>Nguyễn Thu Hà</b>
                <small>Giám đốc Vận hành</small>
              </div>
            </div>
            <div className="story-nav">
              <button>←</button>
              <span>01 / 03</span>
              <button>→</button>
            </div>
          </div>
        </section>

        <section className="security" id="about">
          <div className="section-heading">
            <span className="section-kicker">AN TÂM ĐỂ BỨT PHÁ</span>
            <h2>
              Dữ liệu của bạn.
              <br />
              <em>Được bảo vệ vững chắc.</em>
            </h2>
          </div>
          <div className="security-grid">
            <div>
              <span>
                <Icon name="shield" />
              </span>
              <b>Bảo mật đa lớp</b>
              <p>Mã hóa dữ liệu trong toàn bộ quá trình truyền tải và lưu trữ.</p>
            </div>
            <div>
              <span>
                <Icon name="support" />
              </span>
              <b>Đồng hành 24/7</b>
              <p>Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ doanh nghiệp của bạn.</p>
            </div>
            <div>
              <span>
                <Icon name="rocket" />
              </span>
              <b>Mở rộng linh hoạt</b>
              <p>Kiến trúc sẵn sàng tăng trưởng cùng mọi quy mô doanh nghiệp.</p>
            </div>
          </div>
        </section>

        <section className="cta" id="resources">
          <div className="cta-shape one" />
          <div className="cta-shape two" />
          <span>SẴN SÀNG CHUYỂN ĐỔI?</span>
          <h2>
            Bắt đầu hành trình số
            <br />
            của bạn ngay hôm nay.
          </h2>
          <p>Đăng ký tài khoản trong vài phút. Đội ngũ chuyên gia luôn sẵn sàng đồng hành.</p>
          <button onClick={() => openAuth("register")}>
            Đăng ký ngay <Icon name="arrow" size={18} />
          </button>
        </section>
      </main>

      <footer>
        <div className="footer-main">
          <div className="footer-brand">
            <a className="logo inverse" href="#">
              <svg viewBox="0 0 42 42">
                <path d="M21 2 37.5 11.5v19L21 40 4.5 30.5v-19L21 2Z" fill="white" />
                <path
                  d="M13 12.5h11.5c5 0 8 2.5 8 7s-3 7-8 7H19V34h-6V12.5Zm6 5v4h5c1.5 0 2.4-.6 2.4-2s-.9-1.9-2.4-1.9h-5Z"
                  fill="#1E3364"
                />
              </svg>
              <span>
                <b>DIgiX</b>
                <small>DIGITAL PLATFORM</small>
              </span>
            </a>
            <p>Kiến tạo tương lai số cho doanh nghiệp Việt bằng công nghệ và tri thức.</p>
          </div>
          <div>
            <b>Giải pháp</b>
            <a href="#">Quản trị doanh nghiệp</a>
            <a href="#">Tài chính — Kế toán</a>
            <a href="#">Nhân sự</a>
            <a href="#">Bán hàng &amp; CRM</a>
          </div>
          <div>
            <b>Công ty</b>
            <a href="#">Về chúng tôi</a>
            <a href="#">Khách hàng</a>
            <a href="#">Tuyển dụng</a>
            <a href="#">Liên hệ</a>
          </div>
          <div>
            <b>Tài nguyên</b>
            <a href="#">Blog chuyển đổi số</a>
            <a href="#">Trung tâm hỗ trợ</a>
            <a href="#">Tài liệu sản phẩm</a>
            <a href="#">Sự kiện</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 DIgiX. Bảo lưu mọi quyền.</span>
          <div>
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Tiếng Việt</a>
          </div>
        </div>
      </footer>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <Icon name="close" />
            </button>
            {submitted ? (
              <div className="success-state">
                <span>
                  <Icon name="check" size={30} />
                </span>
                <h3>{authMode === "register" ? "Đăng ký thành công!" : "Đăng nhập thành công!"}</h3>
                <p>
                  {authMode === "register"
                    ? "Tài khoản DIgiX của bạn đã được khởi tạo. Hãy bắt đầu hành trình chuyển đổi số ngay hôm nay."
                    : "Chào mừng bạn quay trở lại DIgiX. Hệ thống đang chuyển bạn đến không gian làm việc."}
                </p>
                <button className="primary-button" onClick={() => setModalOpen(false)}>
                  Hoàn tất
                </button>
              </div>
            ) : (
              <>
                <div className="auth-tabs">
                  <button
                    className={authMode === "register" ? "active" : ""}
                    onClick={() => {
                      setAuthMode("register");
                      setFormError("");
                    }}
                  >
                    Đăng ký
                  </button>
                  <button
                    className={authMode === "login" ? "active" : ""}
                    onClick={() => {
                      setAuthMode("login");
                      setFormError("");
                    }}
                  >
                    Đăng nhập
                  </button>
                </div>
                <span className="section-kicker">
                  {authMode === "register" ? "TẠO TÀI KHOẢN DIGIX" : "CHÀO MỪNG TRỞ LẠI"}
                </span>
                <h3>{authMode === "register" ? "Bắt đầu cùng DIgiX" : "Đăng nhập tài khoản"}</h3>
                <p>
                  {authMode === "register"
                    ? "Tạo tài khoản để khám phá hệ sinh thái chuyển đổi số dành cho doanh nghiệp."
                    : "Nhập thông tin tài khoản để tiếp tục vào không gian làm việc của bạn."}
                </p>
                <form onSubmit={submitAuth}>
                  {authMode === "register" && (
                    <label>
                      Họ và tên
                      <input
                        required
                        name="fullName"
                        autoComplete="name"
                        placeholder="Nguyễn Văn A"
                      />
                    </label>
                  )}
                  <label>
                    Email
                    <input
                      required
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="email@congty.vn"
                    />
                  </label>
                  <label>
                    Mật khẩu
                    <input
                      required
                      name="password"
                      type="password"
                      minLength={8}
                      autoComplete={authMode === "register" ? "new-password" : "current-password"}
                      placeholder="Tối thiểu 8 ký tự"
                    />
                  </label>
                  {authMode === "register" && (
                    <label>
                      Xác nhận mật khẩu
                      <input
                        required
                        name="confirmPassword"
                        type="password"
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu"
                      />
                    </label>
                  )}
                  {authMode === "login" && (
                    <button className="forgot-password" type="button">
                      Quên mật khẩu?
                    </button>
                  )}
                  {formError && <p className="form-error">{formError}</p>}
                  <button className="primary-button" type="submit">
                    {authMode === "register" ? "Đăng ký tài khoản" : "Đăng nhập"}{" "}
                    <Icon name="arrow" size={17} />
                  </button>
                </form>
                <p className="auth-switch">
                  {authMode === "register" ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
                  <button
                    onClick={() => {
                      setAuthMode(authMode === "register" ? "login" : "register");
                      setFormError("");
                    }}
                  >
                    {authMode === "register" ? "Đăng nhập" : "Đăng ký ngay"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
