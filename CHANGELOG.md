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

## [Chưa phát hành] - 23/11/2026

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
