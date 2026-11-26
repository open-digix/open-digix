# DigiX UI-04 — Bảng kiểm kê màu sắc và ánh xạ Semantic Token

**Mục tiêu:** Kiểm kê toàn bộ biến màu `--ws-c-*` và mã màu trực tiếp theo vị trí, vai trò ngữ nghĩa và ánh xạ sang hệ thống semantic token UI-04 trước khi triển khai chế độ Sáng/Tối.

## 1. Thống kê trước khi chuyển

| Tệp tin | Số lượng `--ws-c-*` | Số lượng mã hex trực tiếp |
|---|---|---|
| `apps/web/app/(workspace)/workspace.css` | 451 | 223 |
| `apps/web/app/globals.css` | 0 | 4 |
| `apps/web/app/register/register.css` | 0 | 35 |
| `apps/web/app/landing.css` (khối thẻ lỗi đăng nhập) | 0 | 52 |

## 2. Bảng ánh xạ theo vị trí, vai trò ngữ nghĩa và biến mới

| Biến / Mã màu cũ | Tệp tin & Selector | Vai trò ngữ nghĩa | Biến mới UI-04 |
|---|---|---|---|
| `var(--ws-navy)` | `.ws-root .sidebar` (`workspace.css`) | Nền sidebar chính (nền đặc) | `var(--ws-sidebar-bg)` |
| `var(--ws-c-e2edf2)` | `.ws-root .sidebar` (`workspace.css`) | Màu chữ mặc định sidebar | `var(--ws-sidebar-text)` |
| `var(--ws-c-ffffff12)` | `.ws-root .brand` (`workspace.css`) | Viền dưới brand logo | `rgba(255, 255, 255, 0.07)` |
| `var(--ws-c-a7c0cf)` | `.ws-root .workspace-tag` (`workspace.css`) | Nhãn nhóm workspace | `var(--ws-sidebar-text)` |
| `var(--ws-c-42d2c4)` | `.ws-root .workspace-dot` (`workspace.css`) | Điểm trạng thái hoạt động | `var(--ws-accent)` |
| `var(--ws-c-42d2c41a)` | `.ws-root .workspace-dot` (`workspace.css`) | Quầng bóng điểm trạng thái | `rgba(45, 212, 191, 0.1)` |
| `var(--ws-c-7795a8)` | `.ws-root .nav-group-label` (`workspace.css`) | Tiêu đề nhóm điều hướng | `var(--ws-sidebar-text)` |
| `var(--ws-c-b8cbd7)` | `.ws-root .nav-link` (`workspace.css`) | Chữ link điều hướng sidebar | `var(--ws-sidebar-text)` |
| `var(--ws-c-ffffff12)` | `.ws-root .nav-link:hover` (`workspace.css`) | Nền hover link điều hướng | `rgba(255, 255, 255, 0.07)` |
| `var(--ws-c-234a61)` | `.ws-root .nav-link.active` (`workspace.css`) | Nền link điều hướng đang chọn | `rgba(43, 82, 107, 0.7)` |
| `var(--ws-c-37c5b8)` | `.ws-root .nav-link.active` (`workspace.css`) | Vạch nhấn cạnh trái link active | `var(--ws-accent)` |
| `var(--ws-c-ffffff12)` | `.ws-root .side-bottom` (`workspace.css`) | Viền trên chân sidebar | `rgba(255, 255, 255, 0.07)` |
| `var(--ws-c-9bb2bf)` | `.ws-root .collapse-btn.pin-btn` (`workspace.css`) | Chữ nút ghim thanh bên | `var(--ws-sidebar-text)` |
| `var(--ws-c-ffffff2b)` | `.ws-root .help-card` (`workspace.css`) | Viền thẻ trợ giúp sidebar | `rgba(255, 255, 255, 0.17)` |
| `var(--ws-c-ffffff0a)` | `.ws-root .help-card` (`workspace.css`) | Nền thẻ trợ giúp sidebar | `rgba(255, 255, 255, 0.04)` |
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

## 4. Kế hoạch chuyển đổi theo từng nhóm

1. **Nhóm 1 (Sidebar):** Chuẩn hóa nền đặc `--ws-sidebar-bg`, chữ `--ws-sidebar-text`, active / hover / border theo các giá trị trong suốt hoặc semantic token.
2. **Nhóm 2 (Topbar):** Chuyển bề mặt `--ws-bg-surface`, viền `--ws-border`, breadcrumb `--ws-text` & `--ws-text-muted`.
3. **Nhóm 3 (Nội dung Workspace):** Chuyển canvas, card, panel, button, badge sang các biến `--ws-*` tương ứng.
4. **Nhóm 4 (Đăng ký / Điều khoản):** Chuyển các alias cục bộ trong `register.css` sang đọc các token toàn cục `--ws-*`.
5. **Nhóm 5 (Lỗi đăng nhập):** Chuyển thẻ `.landing-auth-dialog` của lỗi đăng nhập sang sử dụng biến semantic dùng chung.
