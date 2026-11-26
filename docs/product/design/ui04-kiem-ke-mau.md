# DigiX UI-04 — Bảng kiểm kê màu sắc và ánh xạ Semantic Token

**Mục tiêu:** Kiểm kê toàn bộ biến màu `--ws-c-*` và mã màu trực tiếp theo vị trí, vai trò ngữ nghĩa và ánh xạ sang hệ thống semantic token UI-04 trước khi triển khai chế độ Sáng/Tối.

## 1. Thống kê trước và sau khi chuyển

| Tệp tin | `--ws-c-*` trước (lượt dùng) | `--ws-c-*` sau (lượt dùng) | Mã hex trước | Mã hex sau | Ghi chú |
|---|---|---|---|---|---|
| `apps/web/app/(workspace)/workspace.css` | 451 | 0 | 223 | 241 | Giảm toàn bộ 451 lượt dùng `var(--ws-c-*)` về 0; mã hex chỉ tồn tại trong khối khai báo biến gốc `.ws-root` (209 alias palette tương thích ngược + token ngữ nghĩa) |
| `apps/web/app/globals.css` | 0 | 0 | 4 | 22 | Khối semantic token `:root` toàn cục dùng chung cho toàn bộ ứng dụng |
| `apps/web/app/register/register.css` | 0 | 0 | 35 | 18 | Toàn bộ 16 vị trí dùng hex rải rác đã chuyển sang biến ngữ nghĩa; 18 mã hex còn lại chỉ nằm trong khối khai báo biến cục bộ ban đầu |
| `apps/web/app/landing.css` | 0 | 0 | 52 | 52 | Thẻ lỗi đăng nhập `.landing-auth-error-card` dùng 100% token semantic chung; 0 mã hex và 0 `--ws-c-*` trong selector này |

## 2. Bảng ánh xạ theo vị trí, vai trò ngữ nghĩa và biến mới

| Biến / Mã màu cũ | Tệp tin & Selector | Vai trò ngữ nghĩa | Biến mới UI-04 |
|---|---|---|---|
| `var(--ws-navy)` | `.ws-root .sidebar` (`workspace.css`) | Nền sidebar chính (nền đặc) | `var(--ws-sidebar-bg)` |
| `var(--ws-c-e2edf2)` | `.ws-root .sidebar` (`workspace.css`) | Màu chữ mặc định sidebar | `var(--ws-sidebar-text)` |
| `var(--ws-c-ffffff12)` | `.ws-root .brand` (`workspace.css`) | Viền dưới brand logo | `var(--ws-sidebar-border)` |
| `var(--ws-c-a7c0cf)` | `.ws-root .workspace-tag` (`workspace.css`) | Nhãn nhóm workspace | `var(--ws-sidebar-text)` |
| `var(--ws-c-42d2c4)` | `.ws-root .workspace-dot` (`workspace.css`) | Điểm trạng thái hoạt động | `var(--ws-accent)` |
| `var(--ws-c-42d2c41a)` | `.ws-root .workspace-dot` (`workspace.css`) | Quầng bóng điểm trạng thái | `var(--ws-sidebar-dot-shadow)` |
| `var(--ws-c-7795a8)` | `.ws-root .nav-group-label` (`workspace.css`) | Tiêu đề nhóm điều hướng | `var(--ws-sidebar-text)` |
| `var(--ws-c-b8cbd7)` | `.ws-root .nav-link` (`workspace.css`) | Chữ link điều hướng sidebar | `var(--ws-sidebar-text)` |
| `var(--ws-c-ffffff12)` | `.ws-root .nav-link:hover` (`workspace.css`) | Nền hover link điều hướng | `var(--ws-sidebar-hover)` |
| `var(--ws-c-234a61)` | `.ws-root .nav-link.active` (`workspace.css`) | Nền link điều hướng đang chọn | `var(--ws-sidebar-active)` |
| `var(--ws-c-37c5b8)` | `.ws-root .nav-link.active` (`workspace.css`) | Vạch nhấn cạnh trái link active | `var(--ws-accent)` |
| `var(--ws-c-ffffff12)` | `.ws-root .side-bottom` (`workspace.css`) | Viền trên chân sidebar | `var(--ws-sidebar-border)` |
| `var(--ws-c-9bb2bf)` | `.ws-root .collapse-btn.pin-btn` (`workspace.css`) | Chữ nút ghim thanh bên | `var(--ws-sidebar-text)` |
| `var(--ws-c-ffffff2b)` | `.ws-root .help-card` (`workspace.css`) | Viền thẻ trợ giúp sidebar | `var(--ws-sidebar-help-border)` |
| `var(--ws-c-ffffff0a)` | `.ws-root .help-card` (`workspace.css`) | Nền thẻ trợ giúp sidebar | `var(--ws-sidebar-help-bg)` |
| `var(--ws-c-70c3bc)` | `.ws-root .help-icon` (`workspace.css`) | Viền icon trợ giúp | `var(--ws-accent)` |
| `var(--ws-c-a8ece3)` | `.ws-root .help-icon` (`workspace.css`) | Màu icon trợ giúp | `var(--ws-accent)` |
| `var(--ws-c-abc4d0)` | `.ws-root .help-card p` (`workspace.css`) | Nội dung thẻ trợ giúp | `var(--ws-sidebar-text)` |
| `var(--ws-c-84e3d7)` | `.ws-root .help-card button` (`workspace.css`) | Nút hành động trợ giúp | `var(--ws-accent)` |
| `var(--ws-c-6f91a5)` | `.ws-root .side-foot span` (`workspace.css`) | Chữ phụ phiên bản sidebar | `var(--ws-sidebar-text)` |
| `var(--ws-surface)` | `.ws-root .topbar` (`workspace.css`) | Bề mặt thanh trên | `var(--ws-bg-surface)` |
| `var(--ws-line)` | `.ws-root .topbar` (`workspace.css`) | Viền dưới thanh trên | `var(--ws-border)` |
| `var(--ws-c-7c8f9a)` | `.ws-root .breadcrumb` (`workspace.css`) | Màu đường dẫn phân cấp | `var(--ws-text-muted)` |
| `var(--ws-c-263d4c)` | `.ws-root .breadcrumb-curr` (`workspace.css`) | Chữ trang hiện tại trên breadcrumb | `var(--ws-text)` |
| `var(--ws-c-a9bbc5)` | `.ws-root .breadcrumb-sep` (`workspace.css`) | Dấu phân cách breadcrumb | `var(--ws-border)` |
| `var(--ws-c-e3ebf0)` | `.ws-root .top-action-btn` (`workspace.css`) | Viền nút tác vụ topbar | `var(--ws-border)` |
| `var(--ws-c-496578)` | `.ws-root .top-action-btn` (`workspace.css`) | Icon nút tác vụ topbar | `var(--ws-text-muted)` |
| `var(--ws-c-edf3f5)` | `.ws-root .top-action-btn:hover` (`workspace.css`) | Nền hover nút tác vụ topbar | `var(--ws-bg-surface-2)` |
| `var(--ws-c-173b54)` | `.ws-root .top-action-btn:hover` (`workspace.css`) | Icon hover nút tác vụ | `var(--ws-text)` |
| `var(--ws-c-476375)` | `.ws-root .user-info small` (`workspace.css`) | Tên tổ chức / vai trò dưới tên | `var(--ws-text-muted)` |
| `var(--ws-c-8aa0b0)` | `.ws-root .top-user-btn svg` (`workspace.css`) | Mũi tên menu người dùng | `var(--ws-text-muted)` |
| `var(--ws-canvas)` | `.ws-root` (`workspace.css`) | Nền vùng nội dung | `var(--ws-bg-canvas)` |
| `var(--ws-ink)` | `.ws-root` (`workspace.css`) | Màu chữ chính nội dung | `var(--ws-text)` |
| `var(--ws-surface)` | `.ws-root .card, .ws-root .panel` (`workspace.css`) | Bề mặt thẻ/panel | `var(--ws-bg-surface)` |
| `var(--ws-line)` | `.ws-root .card, .ws-root .panel` (`workspace.css`) | Viền thẻ/panel | `var(--ws-border)` |
| `var(--ws-soft)` | `.ws-root .soft-badge` (`workspace.css`) | Nền nhấn nhẹ chủ đạo | `var(--ws-bg-soft)` |
| `var(--ws-teal)` | `.ws-root .btn-primary` (`workspace.css`) | Nút chính chủ đạo | `var(--ws-accent)` |
| `var(--ws-danger)` | `.ws-root .badge-danger` (`workspace.css`) | Màu lỗi / nguy hiểm | `var(--ws-danger)` |
| `var(--ws-warning)` | `.ws-root .badge-warning` (`workspace.css`) | Màu cảnh báo / chờ duyệt | `var(--ws-warning)` |
| `var(--ws-c-fff8e7)`, `var(--ws-c-f0dfb8)` | `.demo-pill`, `.check-mark.warn`, `.flow-issue` | Trạng thái / badge cảnh báo soft | `var(--ws-bg-warning-soft)`, `var(--ws-border-warning-soft)` |
| `var(--ws-c-fff3f1)`, `var(--ws-c-fff4f1)` | `.button.danger`, `.status.danger`, `.flow-issue.blocking` | Trạng thái / nút nguy hiểm soft | `var(--ws-bg-danger-soft)`, `var(--ws-border-danger-soft)` |
| `var(--ws-c-eff8f3)`, `var(--ws-c-d4ebdc)` | `.flow-good`, `.flow-validation.valid` | Trạng thái thành công soft | `var(--ws-bg-success-soft)`, `var(--ws-border-success-soft)` |
| `var(--ws-c-eaf2fa)`, `var(--ws-c-eaf0f9)` | `.status.info`, `.app-icon.blue` | Trạng thái thông tin soft | `var(--ws-bg-info-soft)` |
| `var(--ws-c-183c55)` | `.hero-band` | Nền hero banner đậm | `var(--ws-hero-band-bg)` |
| `var(--ws-c-143b4b)` | `.toast` | Nền thông báo toast nổi | `var(--ws-toast-bg)` |
| `var(--ws-c-0b1e30)` | `.tip` | Nền tooltip thanh bên | `var(--ws-tooltip-bg)` |
| `var(--ws-c-0b2434ad)` | `.modal-backdrop` | Nền mờ phủ modal | `var(--ws-modal-backdrop)` |
| `#112b45` | `.register-page` (`register.css`) | Nền sidebar đăng ký / chữ ink | `var(--ws-sidebar-bg)` |
| `#0d9488` | `.register-page` (`register.css`) | Màu focus / nhấn đăng ký | `var(--ws-focus)` |
| `#0b776f` | `.register-page` (`register.css`) | Màu chủ đạo đăng ký | `var(--ws-accent)` |
| `#0a665f` | `.register-page` (`register.css`) | Chủ đạo khi rê chuột | `var(--ws-accent-hover)` |
| `#526878` | `.register-page` (`register.css`) | Chữ phụ đăng ký (ink-2) | `var(--ws-text-muted)` |
| `#d8e1e8` | `.register-page` (`register.css`) | Viền phân cách đăng ký | `var(--ws-border)` |
| `#ffffff` | `.register-page` (`register.css`) | Bề mặt form đăng ký | `var(--ws-bg-surface)` |
| `#f6f8fa` | `.register-page` (`register.css`) | Nền canvas trang đăng ký | `var(--ws-bg-canvas)` |
| `#edf3f5` | `.register-page` (`register.css`) | Nền phụ / soft đăng ký | `var(--ws-bg-soft)` |
| `#b42318` | `.register-page` (`register.css`) | Màu lỗi form đăng ký | `var(--ws-danger)` |
| `#176b4d` | `.register-page` (`register.css`) | Màu thành công đăng ký | `var(--ws-success)` |
| `#fff` | `.landing-auth-dialog` (`landing.css`) | Bề mặt thẻ báo lỗi | `var(--ws-bg-surface)` |
| `#dce8ed` | `.landing-auth-dialog` (`landing.css`) | Viền thẻ báo lỗi | `var(--ws-border)` |
| `var(--landing-navy)` | `.landing-auth-dialog` (`landing.css`) | Màu chữ chính thông báo lỗi | `var(--ws-text)` |
| `#526878` | `.landing-auth-dialog > p` (`landing.css`) | Màu chữ phụ thông báo lỗi | `var(--ws-text-muted)` |
| `var(--landing-teal)` | `.landing-auth-primary` (`landing.css`) | Nút chính Đăng nhập lại | `var(--ws-accent)` |
| `#0b776f` | `.landing-auth-primary:hover` (`landing.css`) | Hover nút chính Đăng nhập lại | `var(--ws-accent-hover)` |
| `#edf3f5` | `.landing-auth-secondary:hover` (`landing.css`) | Nền hover nút phụ Về trang chủ | `var(--ws-bg-surface-2)` |

## 3. Danh sách Semantic Token theo vai trò (áp dụng cho chế độ Sáng hiện tại)

| Biến Semantic | Vai trò | Giá trị Sáng hiện tại |
|---|---|---|
| `--ws-bg-canvas` | Nền vùng nội dung | `#f6f8fa` |
| `--ws-bg-surface` | Bề mặt đặc, nền dự phòng | `#ffffff` |
| `--ws-bg-surface-2` | Bề mặt phụ, hàng xen kẽ, hover | `#f1f5f7` |
| `--ws-bg-soft` | Nền nhấn nhẹ màu chủ đạo | `#edf5f4` |
| `--ws-text` | Chữ chính | `#172b3a` |
| `--ws-text-muted` | Chữ phụ, nhãn | `#5a6e7d` |
| `--ws-text-on-accent` | Chữ trên nút chính | `#ffffff` |
| `--ws-border` | Viền mặc định | `#dce5eb` |
| `--ws-border-strong` | Viền ô nhập/checkbox | `#758b99` |
| `--ws-accent` | Màu chủ đạo (nút chính, tab) | `#0b776f` |
| `--ws-accent-hover` | Chủ đạo khi rê chuột | `#075e59` |
| `--ws-focus` | Vòng focus bàn phím | `#0d9488` |
| `--ws-danger` | Lỗi, xóa | `#b42318` |
| `--ws-warning` | Cảnh báo, chờ duyệt | `#8a5a00` |
| `--ws-success` | Thành công, đã duyệt | `#176b4d` |
| `--ws-info` | Thông tin, đã xuất bản | `#245a87` |
| `--ws-sidebar-bg` | Nền thanh bên chính (nền đặc) | `#112b45` |
| `--ws-sidebar-text` | Chữ thanh bên | `#b8cbd7` |
| `--ws-bg-warning-soft` | Nền trạng thái cảnh báo | `#fff8e7` |
| `--ws-border-warning-soft` | Viền trạng thái cảnh báo | `#f0dfb8` |
| `--ws-bg-danger-soft` | Nền trạng thái lỗi/nguy hiểm | `#fff4f1` |
| `--ws-border-danger-soft` | Viền trạng thái lỗi/nguy hiểm | `#f0d5cf` |
| `--ws-bg-success-soft` | Nền trạng thái thành công | `#eff8f3` |
| `--ws-border-success-soft` | Viền trạng thái thành công | `#d4ebdc` |
| `--ws-bg-info-soft` | Nền trạng thái thông tin | `#eaf2fa` |
| `--ws-hero-band-bg` | Nền hero banner | `#183c55` |
| `--ws-toast-bg` | Nền thông báo toast | `#143b4b` |
| `--ws-tooltip-bg` | Nền tooltip | `#0b1e30` |
| `--ws-modal-backdrop` | Nền mờ modal | `rgba(11, 36, 52, 0.68)` |

## 4. Kế hoạch chuyển đổi theo từng nhóm

1. **Nhóm 1 (Sidebar):** Chuẩn hóa nền đặc `--ws-sidebar-bg`, chữ `--ws-sidebar-text`, active / hover / border theo các giá trị trong suốt hoặc semantic token.
2. **Nhóm 2 (Topbar):** Chuyển bề mặt `--ws-bg-surface`, viền `--ws-border`, breadcrumb `--ws-text` & `--ws-text-muted`.
3. **Nhóm 3 (Nội dung Workspace):** Chuyển toàn bộ canvas, card, panel, button, badge, bảng dữ liệu, preview, chat, flow sang các biến ngữ nghĩa `--ws-*`. Đã hoàn tất 100% không còn `var(--ws-c-*)` ở vị trí sử dụng.
4. **Nhóm 4 (Đăng ký / Điều khoản):** Chuyển các alias cục bộ trong `register.css` sang đọc các token toàn cục `--ws-*`, gom gradient thương hiệu vào biến khối, triệt tiêu toàn bộ mã hex rải rác.
5. **Nhóm 5 (Lỗi đăng nhập):** Chuyển thẻ `.landing-auth-dialog` của lỗi đăng nhập sang sử dụng biến semantic dùng chung, không còn mã màu hex trong selector.

## 5. Ngoại lệ và mã màu đặc thù

- **Brand Hero Gradients (`register.css`):**
  - Dải màu thương hiệu ở cột bên trái trang đăng ký `linear-gradient(160deg, #112b45 0%, #0e3a4a 60%, #0b5a58 100%)` và phiên bản mobile `linear-gradient(165deg, #0b2236 0%, #112b45 50%, #0f4c55 100%)` là dải màu nền nhận diện đặc thù. Chúng được gom vào biến `--register-hero-gradient` và `--register-hero-mobile-gradient` trong khối khai báo của `.register-page`, không nằm rải rác trong các thuộc tính selector khác.
- **Brand Logos & External SVG:**
  - Giữ nguyên các mã màu trong các tệp SVG thương hiệu gốc (`digix-logo-dark.svg`, v.v.).
