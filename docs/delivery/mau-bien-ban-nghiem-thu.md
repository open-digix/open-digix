# Mẫu biên bản nghiệm thu DigiX Lab — M1–M3

> Biên bản bên dưới ghi nhận phạm vi/môi trường đã thử theo baseline cũ; không thay kết quả, người chứng kiến hay mốc đã ghi. Với phạm vi SRS v2.5, dùng [kế hoạch nghiệm thu ERP/CRM và nhiều ứng dụng](ke-hoach-nghiem-thu-v2.5.md), lập biên bản **mới** cho TC-MOD/TC-UI/TC-APP; không hồi tố đánh dấu ca mới đạt từ ca mua sắm M3.

## 1. Thông tin phiên nghiệm thu

| Nội dung                                             | Ghi nhận                                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Ngày, giờ và múi giờ kiểm thử thực tế                | 24/11/2026                                                                                           |
| Địa điểm/máy/môi trường (Compose, phiên bản dịch vụ) | Máy cá nhân `anarch` (Linux);                                                                        |
| Commit/tag được kiểm thử                             | `99b23a7` (`main`); biên bản là thay đổi chưa commit                                                 |
| Cấu hình và dữ liệu thử (không ghi secret)           | Chạy unit test API tại `apps/api` trên máy này; chưa ghi nhận bộ dữ liệu demo hoặc cấu hình chạy E2E |
| Người chạy thử                                       | An                                                                                                   |
| Người chứng kiến/kiểm tra                            | An                                                                                                   |
| Người ghi biên bản                                   | An                                                                                                   |
| Nơi lưu bằng chứng                                   | Chưa lưu bằng chứng kèm biên bản; bổ sung đường dẫn ảnh/video/log/test report sau khi thu thập       |

## 2. Kết quả kiểm thử

Với mỗi ca, ghi **Đạt / Không đạt / Chưa thử**, kết quả thực tế và liên kết bằng
chứng. Có thể tách thêm dòng hoặc dẫn tới test report chi tiết; không đánh dấu
đạt chỉ vì có mã nguồn, fixture, tài liệu hoặc giao diện dữ liệu mẫu.

| Mốc | Ca thử/điều kiện đạt                                                     | Kết quả mong đợi                                                                                                                | Kết quả thực tế | Bằng chứng | Trạng thái |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------- | ---------- |
| M1  | Đăng nhập SSO; Web gọi `/v1/me` qua Gateway bằng tài khoản có membership | Đúng danh tính và tenant; thiếu/sai token hoặc quyền bị từ chối                                                                 | …               | …          | …          |
| M1  | DB/migration, kho tệp và workflow dựng từ source trên môi trường chung   | Health/smoke test thành công; lưu/đọc tệp và thực hiện workflow thử                                                             | …               | …          | …          |
| M2  | Tạo app, lưu mô tả nguồn, chuẩn hóa, chỉnh nháp và validate qua UI/API   | Có bản nháp gắn nguồn, lưu thay đổi được, báo điểm chưa rõ/lỗi cấu hình                                                         | …               | …          | …          |
| M2  | Kiểm tra quyền và lỗi Builder (TC-BLD-01..03)                            | Người thiếu quyền không sửa được; cấu hình sai bị chặn; không cần AI để chỉnh nháp                                              | …               | …          | …          |
| M3  | Preview/chạy thử, review và publish app A từ bản nháp                    | Nháp không chạy thật; chỉ người có quyền được publish sau khi đạt điều kiện                                                     | …               | …          | …          |
| M3  | App mua sắm A vận hành E2E qua Gateway/API/workflow                      | Tạo/gửi hồ sơ, giao việc, duyệt/từ chối, lưu trạng thái và audit; app chạy từ cấu hình thay vì dữ liệu mẫu/controller viết cứng | …               | …          | …          |
| M3  | Ca âm về quyền và trạng thái (TC-PUB-01, TC-ARC-01..03, TC-AUD-01)       | Truy cập/sửa sai quyền, gửi lặp hoặc xử lý lại task bị chặn theo thiết kế                                                       | …               | …          | …          |

### Cách đính kèm bằng chứng

- **UI:** ảnh hoặc video ngắn cho các bước chính, hiển thị vai trò và trạng thái
  trước/sau thao tác; ảnh màn hình đơn lẻ không chứng minh toàn bộ luồng E2E.
- **Kỹ thuật:** lệnh, thời gian và kết quả build/test/smoke; phản hồi API và bản
  ghi/trạng thái workflow/audit tương ứng. Unit test chỉ chứng minh phạm vi unit
  test, không thay cho smoke hoặc E2E.
- **Truy vết:** gắn tên file/link bằng chứng vào **đúng dòng ca thử**, cùng
  commit/tag và môi trường. Che token, mật khẩu, cookie, khóa và dữ liệu cá nhân;
  không đưa `.env` hoặc log chứa secret vào repo.

## 3. Tồn đọng và quyết định

| Mốc/ca thử | Lỗi hoặc giới hạn còn lại | Mức ảnh hưởng | Người xử lý | Hạn dự kiến | Issue/bằng chứng |
| ---------- | ------------------------- | ------------- | ----------- | ----------- | ---------------- |
| …          | …                         | …             | …           | …           | …                |

| Mốc | Kết luận (Đạt / Đạt có điều kiện / Chưa đạt) | Lý do, điều kiện còn lại và hạn kiểm tra lại |
| --- | -------------------------------------------- | -------------------------------------------- |
| M1  | …                                            | …                                            |
| M2  | …                                            | …                                            |
| M3  | …                                            | …                                            |

**Xác nhận:** Ghi tên, vai trò, ngày giờ và cách xác nhận (ký, phản hồi trên PR/issue
hoặc biên bản họp có liên kết) của từng người tham gia. Không tự điền thay người
khác hoặc coi im lặng là đồng ý.

| Người xác nhận | Vai trò | Kết luận/ý kiến | Thời điểm và liên kết xác nhận |
| -------------- | ------- | --------------- | ------------------------------ |
| …              | …       | …               | …                              |
