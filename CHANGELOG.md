<!--
  Copyright 2026 DigiX Lab

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

# Nhật ký thay đổi (Changelog)

Mọi thay đổi đáng chú ý của dự án sẽ được ghi nhận tại đây.

## [Chưa phát hành] - 24/11/2026

### Giao diện đăng nhập Keycloak (KC-01)
- Áp dụng giao diện đăng nhập nhận diện thương hiệu DigiX cho Keycloak realm `digix` (`infra/keycloak/themes/digix/login`):
  - Kế thừa `parent=base` để loại bỏ hoàn toàn PatternFly 5 CSS và tránh xung đột class; kiểm soát 100% markup FreeMarker.
  - Bố cục đáp ứng: Máy tính (≥ 900px) chia đôi theo mẫu B (panel navy bên trái, form trắng bên phải); Điện thoại (< 900px) thẻ kính mờ căn giữa theo mẫu F (backdrop-filter blur 16px, bo góc 22px, safe-area-inset).
  - Tự host 100% font chữ Be Vietnam Pro từ npm `@fontsource/be-vietnam-pro@5.3.0` (4 độ đậm 400/500/600/700 × 3 subset vietnamese/latin/latin-ext kèm `OFL.txt`), không gọi Google Fonts/gstatic.
  - Xây dựng lại toàn bộ các màn FreeMarker: `template.ftl`, `login.ftl`, `login-reset-password.ftl`, `login-update-password.ftl`, `info.ftl`, `error.ftl`, `login-page-expired.ftl`, `logout-confirm.ftl`.
  - Giữ nguyên 100% form action, CSRF token theo session URL của Keycloak, tên trường `username`, `password`, `rememberMe`, hidden `credentialId` và `session_code`.
  - Trạng thái client UX (`digix-login.js`): Khóa nút và hiện spinner sau khi submit (không disable input); cảnh báo Caps Lock; rung thẻ card khi có lỗi; nút toggle hiện/ẩn mật khẩu; tự động focus ô mật khẩu khi có lỗi.
  - Hỗ trợ tiếng Việt 100% cho mọi thông báo hệ thống Keycloak trong `messages_vi.properties`, cấu hình realm chỉ bật locale `vi`, không hiển thị bộ chọn ngôn ngữ.
  - Sửa theo review PR #28: hiển thị lỗi gộp username/password khi usernameHidden bật; bổ sung nút Hủy và tùy chọn đăng xuất các thiết bị khác khi cập nhật mật khẩu; ẩn link quay lại khi logoutConfirm.skipLink bật.

## 23/11/2026

### Thay đổi lớn (INT-01)
- Chuyển giao diện từ prototype `DagTool/fronfe@5a8f0b2` vào `apps/web` (Next.js App Router).
- CSS: Chuyển `styles.css` thành `app/(workspace)/workspace.css`, bọc 100% selector dưới tiền tố `.ws-root` để cô lập hoàn toàn giao diện khu làm việc, tránh ảnh hưởng tới trang chủ `/`, `/login`, `/register`. Gom toàn bộ hơn 300 mã màu hex và rgb thành các biến CSS token `--ws-*`.
- Bảo mật phiên & Tenant: Access token được xử lý hoàn toàn ở server (`server-only`), không bao giờ chuyển xuống client. Kiểm tra membership active từ `/v1/me`, lưu trữ tenant lựa chọn vào cookie httpOnly `ws-tenant`. Tự động chọn khi có 1 membership; bắt buộc chọn khi có nhiều hơn 1 membership.
- Màn hình Tổng quan (`/dashboard`): Tích hợp dữ liệu người dùng thật từ `/v1/me`, hiển thị tên thật, doanh nghiệp thật và chip vai trò tiếng Việt (`Nhân viên`, `Quản lý`, `Thiết kế`, `Xuất bản`, `Quản trị doanh nghiệp`). Khu vực 4 ô KPI và bảng danh sách gắn nhãn rõ ràng "DỮ LIỆU MẪU".
- Các màn hình dữ liệu mẫu: Chuyển đổi các màn hình `/apps`, `/tasks`, `/tasks/[id]`, `/records`, `/records/[id]`, `/reports`, `/assistant`, `/settings` sang React với mock data `catalogs` gắn cờ MẪU THỬ; topbar hiển thị pill `DỮ LIỆU MẪU`; thao tác ghi chỉ cập nhật tạm thời trong phiên kèm thông báo toast mẫu.
- Kết nối 5 API Builder M2 thật qua Gateway:
  - Bước 01 (`/builder/new`): `POST /v1/apps` với tính năng tự sinh mã ứng dụng `appKey` và kiểm tra regex `^[a-z][a-z0-9_-]{1,63}$`.
  - Bước 02 (`/builder/[appId]?step=source`): `POST /v1/apps/:appId/descriptions` lưu 7 phần mô tả nguồn, quản lý `revisionNo` và cảnh báo rời trang khi chưa lưu.
  - Bước 03 (`/builder/[appId]?step=normalize`): `POST /v1/apps/:appId/drafts/:version/normalize` đối chiếu 2 cột (mô tả gốc vs bản nháp) và danh sách `openIssues`.
  - Bước 04 (`/builder/[appId]?step=edit`): `GET` & `PATCH /v1/apps/:appId/drafts/:version` kèm `lockVersion`, modal chỉnh sửa có ràng buộc Poka-yoke, xử lý xung đột 409 `VERSION_CONFLICT` với nút sao chép JSON, chuyển đổi `transitions` sang câu tiếng Việt chỉ đọc.
  - Bước 05 (`/builder/[appId]?step=validate`): `POST /v1/apps/:appId/drafts/:version/validate` hiển thị kết quả kiểm tra với bảng lỗi tiếng Việt đầy đủ theo mã kiểm tra của hợp đồng, nút "Xem" chuyển thẳng tab lỗi.
- Loại bỏ tính năng mô phỏng: Xóa bỏ hoàn toàn `parseFlowSource`, `validateFlow`, nút "Chạy thử đường đi" mô phỏng 15.000.000đ, nút Thông báo và thẻ Hỗ trợ chưa có API.
