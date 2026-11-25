# Thiết kế mục tiêu — nhiều ứng dụng trong một tenant (v2.5)

**Trạng thái:** đề xuất theo [SRS v2.5](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), FR-BLD-12/FR-WRK-06; **chưa phải migration hay API đã triển khai**. [ERD hiện trạng](database-schema.md) mô tả migration đang có; không sửa migration lịch sử để trình bày phương án này.

## Ranh giới và khóa

- `tenant` sở hữu nhiều `application`; mỗi app có `app_id` duy nhất trong tenant, nhiều `application_version` bất biến sau publish. `schema_version` (định dạng) khác với `version` (phiên bản app).
- Mỗi chức năng đã chọn nằm trong cấu hình **của một app version**, không phải cờ bật toàn tenant. Bản ghi nghiệp vụ cần `tenant_id`, `application_id` và `application_version_id` tương ứng; khóa ngoại tổng hợp bảo đảm không tham chiếu app/version khác tenant.
- Danh mục chức năng có thể dùng chung mã/implementation giữa các app; **dữ liệu nghiệp vụ không tự dùng chung**. Nếu triển khai bảng chuyên biệt ERP/CRM, bản ghi phải có `tenant_id`, `application_id`, nguồn/version phù hợp và chỉ được liên kết bản ghi của chính app theo mặc định. Cần chọn định dạng JSONB hay bảng chuyên biệt theo truy vấn/constraint trước migration.
- `workflow_tasks` kế thừa app/version từ workflow instance và record; metadata tệp, dashboard, tìm kiếm, chỉ mục trợ lý, audit và cache phải có app scope hoặc liên kết được kiểm chứng về record/app. Không suy ra quyền chỉ bằng `tenant_id`.

## Kiểm quyền và chia sẻ

Trình tự API: xác thực OIDC → resolve membership/tenant từ token → resolve app trong tenant → kiểm thành viên có quyền app/feature/action → kiểm đối tượng/trạng thái/version → thực thi. Bỏ `app_id` hoặc giả mạo app khác phải bị từ chối; không tin `tenant_id`/`app_id` do client gửi là bằng chứng quyền. Mọi truy vấn theo cả tenant + app; truy cập trực tiếp URL, file, task, dashboard, tìm kiếm, AI cũng tuân ranh giới app.

Quyền app cần hợp đồng quản lý cấp/thu hồi (ví dụ liên kết membership/role với app và tập quyền); chưa chọn schema bảng cụ thể. Mặc định ERP A không thấy dữ liệu CRM A dù cùng tenant; B không thấy dữ liệu A. **Đã chốt phạm vi demo, chưa triển khai:** người có quyền cấu hình liên kết chia sẻ trong cùng tenant, chỉ rõ app nguồn/đích, loại dữ liệu, quyền đọc/ghi, phạm vi bản ghi; mỗi lần cấp/sửa/thu hồi và truy cập qua liên kết phải audit. API kiểm chính sách còn hiệu lực **và** quyền hiện hành với đối tượng/hành động ở mỗi truy cập; ghi chỉ được thực hiện trên hành động được phép, không được dùng liên kết làm quyền sửa tùy ý. Thu hồi chặn truy cập mới, kể cả qua cache/tìm kiếm; không làm mất lịch sử audit. Chia sẻ không tự động cấp quyền truy vấn hoặc lập chỉ mục cho AI: nguồn AI phải được chọn và kiểm quyền riêng theo tenant/app/người hỏi, kể cả với dữ liệu chia sẻ. Không cho liên kết chéo tenant, join tự do giữa hai app hay quyền tenant-admin mặc định vượt chính sách. Tắt chức năng hoặc đổi phiên bản không xóa dữ liệu hay đổi workflow đang chạy ngầm.

## Quyết định đã ghi và việc triển khai trước migration

1. [Quyết định khởi công code](quyet-dinh-khoi-cong-code-v2.5.md) chốt catalog và nghiệp vụ demo, bảng chuyên biệt ERP/CRM cùng hồ sơ gốc cho workflow, ACL và lifecycle phiên bản; đội triển khai migration append-only và kiểm constraint.
2. [Hợp đồng kỹ thuật](../builder/hop-dong-ky-thuat-v2.5.md) chốt schema/route mục tiêu cấp/sửa/thu hồi liên kết, kiểm quyền bản ghi/hành động ghi, cache và chính sách nguồn AI. [Quyết định khởi công](quyet-dinh-khoi-cong-code-v2.5.md) chọn authorizer API + repository scope/khóa ngoại cho lát cắt; RLS là tăng cường về sau, phải có thử âm chứng minh lớp hiện hành.
3. Viết migration mới append-only và test âm/dương: A ERP ↔ A CRM trước cấp, sau cấp đúng phạm vi, sau thu hồi; A ↔ B luôn bị chặn; bản ghi/tệp/task/dashboard/search/AI, quyền bị thu hồi, app v1/v2. Kiểm API lẫn DB; khóa ngoại tenant hiện tại chỉ chống chéo tenant, **chưa chứng minh cách ly chéo app cùng tenant**.

**Nghiệm thu:** TC-APP-01..03, TC-SHARE-01..03, TC-AI-01..05, TC-MOD-02, TC-TEN-02 và FR-AI-06 phải có log/test report trên môi trường chạy thật; ERD này không phải bằng chứng hoàn thành.
