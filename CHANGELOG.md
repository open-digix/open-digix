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

## [Chưa phát hành] - 26/11/2026

### Giữ phiên đăng nhập, chuẩn hóa lỗi API và đổi doanh nghiệp an toàn (WEB-F00, #45, gộp AUTH-01 #30)
- **Tự làm mới phiên đăng nhập (Token Refresh):**
  - Callback `jwt` lưu giữ `refresh_token`, `id_token`, `expires_at`, `refresh_expires_at`. Tự động làm mới khi access token còn dưới 30 giây thời hạn.
  - Bộ chống trùng: sử dụng bảng băm SHA-256 của refresh token, gom các yêu cầu làm mới đồng thời về cùng một Promise duy nhất, giảm thiểu số lần gọi tới Keycloak.
  - Proxy Node.js (`apps/web/proxy.ts`): kiểm tra và làm mới token trước khi render Server Components, tiêm cookie mới vào header request hiện tại để Server Components đọc được ngay token mới. Matcher bỏ qua các route công khai và tệp tĩnh.
  - Bảo mật phiên: `/api/auth/session` chỉ trả về `user` và `expires`, không để lộ bất kỳ token nào ra phía trình duyệt.
- **Đăng nhập lại 1 lần bấm (`ReloginButton`):**
  - Khi phiên hết hạn, màn hình thông báo cung cấp nút "Đăng nhập lại" chuyển hướng thẳng tới Keycloak (`signIn("keycloak")`), không qua hộp thoại trung gian.
- **Chuẩn hóa lỗi API (v2.5 §3):**
  - Bổ sung trường `kind` cho `ApiError`: `unauthenticated` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `unprocessable` (422), `rate_limited` (429), `unavailable` (5xx/mạng).
  - Thành phần giao diện `ApiErrorState`: hiển thị thông điệp tiếng Việt trung thực; lỗi 404 không để lộ tên/mã bản ghi; lỗi 409 cung cấp nút "Tải lại"; lỗi 422 hiển thị danh sách trường vi phạm.
- **Đổi doanh nghiệp an toàn:**
  - Hook `useUnsavedChangesGuard`: cảnh báo xác nhận khi người dùng chuyển doanh nghiệp trong khi trang có dữ liệu chưa lưu; hủy thao tác nếu người dùng chọn ở lại.
  - Tiện ích `tenant-switch`: tự động hủy các request mạng đang chạy dở (`AbortController`), xóa sạch bộ lọc, bảng và dữ liệu tạm client của doanh nghiệp cũ, làm mới router an toàn.
  - Topbar luôn hiển thị chính xác tên doanh nghiệp hiện tại.

## 24/11/2026

### Đăng ký doanh nghiệp mới (UI-03, chuẩn bị cho backend #35)
- **Màn hình chọn hình thức (`/register`):** Hiển thị 2 lựa chọn trực quan "Tạo doanh nghiệp mới" (dành cho người đại diện công ty) và "Tham gia doanh nghiệp có sẵn" (gửi yêu cầu cấp tài khoản, kế thừa R3 với nút quay lại "← Chọn lại").
- **Quy trình 2 bước tạo doanh nghiệp (`/register?type=tenant`):**
  - **Bước 1 (Thông tin doanh nghiệp):** Nhập tên doanh nghiệp, tự động chuyển đổi sang mã định danh slug chuẩn hóa tiếng Việt không dấu (`toTenantSlug`), hỗ trợ chỉnh sửa mã với xem trước đường dẫn `digix.app/t/<slug>`.
  - **Bước 2 (Tài khoản quản trị):** Nhập họ tên, email công việc, tên đăng nhập, mật khẩu kèm thanh đo độ mạnh mật khẩu và 4 quy tắc kiểm tra động (yêu cầu đạt tối thiểu 3/4), xác nhận mật khẩu và cam kết điều khoản.
  - **Trải nghiệm người dùng:** Rung thẻ khi có lỗi xác thực, tự động focus vào trường lỗi đầu tiên; khi mã doanh nghiệp đã tồn tại từ phản hồi API, tự động quay về bước 1 và focus vào ô mã doanh nghiệp; màn hình thành công hiển thị thông tin doanh nghiệp và tài khoản quản trị kèm gắn nhãn "bản thử" khi chạy chế độ mock.
- **Tầng kết nối API (`lib/registration/`):** Xây dựng server action `registerTenantAction` hỗ trợ 2 chế độ `mock` (mặc định) và `api` (chuẩn bị kết nối endpoint `POST /v1/public/tenant-registrations` của #35); bản đồ lỗi tiếng Việt đầy đủ.
- **Kiểm thử tự động:** Bổ sung 8 bài unit test cho `toTenantSlug` & `isValidTenantSlug` và 8 bài kiểm thử tích hợp giao diện cho toàn bộ luồng đăng ký.

### Tinh chỉnh giao diện theo bản xem thử demo-ui-2 (S2 · I2 · R3 · Q2)
- **S2 – Sidebar thu hẹp:** Mặc định thu gọn còn cột 76px trên máy tính. Rê chuột hoặc Tab bàn phím thì bung ra nổi đè lên nội dung (không đẩy/nhảy nội dung); nút Ghim thanh bên để giữ mở cố định 242px, trạng thái ghim được nhớ trong `localStorage`. Tooltip nổi khi thu gọn. Điện thoại (< 900px) giữ nguyên menu trượt drawer.
- **I2 – Icon web & Keycloak:** Áp dụng icon DigiX chính thức (ô vuông navy `#112B45`, chữ X trắng, nhánh teal `#2DD4BF`) thay thế icon mặc định Next.js trên web (`/icon.svg`, `/favicon.ico`, `/apple-icon.png`, `/manifest.json`) và trang đăng nhập Keycloak (`infra/keycloak/themes/digix/login/resources/img/icon.svg`).
- **R3 – Yêu cầu cấp tài khoản (`/register`):** Thay hộp thoại tự đăng ký chưa bật bằng trang/form Yêu cầu cấp tài khoản hoàn chỉnh với bố cục chia đôi (B) trên máy tính và thẻ kính (F) trên điện thoại; kiểm tra hợp lệ tiếng Việt; màn hình xác nhận "Đã gửi yêu cầu" ghi chú rõ API lưu yêu cầu thuộc phạm vi BE-08.
- **Q2 – Quên mật khẩu 3 bước:** Bổ sung thanh tiến trình 3 bước (Tài khoản → Kiểm tra email → Mật khẩu mới) trong theme Keycloak (`login-reset-password.ftl`, `info.ftl`, `login-update-password.ftl`); màn Kiểm tra email có thời hạn 5 phút, lưu ý Spam và nút gửi lại đếm ngược khóa 60 giây; màn Đặt mật khẩu mới tích hợp thanh đo độ mạnh mật khẩu và danh sách 4 quy tắc kiểm tra động; màn Đã đổi mật khẩu.

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

## [v0.0.2] - 14/11/2026

### Bổ sung
- Tích hợp API Gateway với xác thực OIDC tại lớp biên.
- Bổ sung SeaweedFS làm kho lưu trữ đối tượng, hỗ trợ tải tệp lên theo tenant.
- Tích hợp Flowable để triển khai định nghĩa BPMN và xử lý quy trình, tác vụ theo tenant.

## [v0.0.1] - 11/11/2026

### Bổ sung
- Khởi tạo nền tảng Open Core với API, cơ sở dữ liệu hỗ trợ tenant và Keycloak để xác thực OIDC, phân quyền.
- Xây dựng giao diện trang chủ, đăng nhập và các trang web nền tảng.
