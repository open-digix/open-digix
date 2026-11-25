# Thiết kế mục tiêu — nhiều ứng dụng trong một tenant (v2.5)

**Trạng thái:** đề xuất theo [SRS v2.5](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), FR-BLD-12/FR-WRK-06; **chưa phải migration hay API đã triển khai**. [ERD hiện trạng](database-schema.md) mô tả migration đang có; không sửa migration lịch sử để trình bày phương án này.

## Ranh giới và khóa

- `tenant` sở hữu nhiều `application`; mỗi app có `app_id` duy nhất trong tenant, nhiều `application_version` bất biến sau publish. `schema_version` (định dạng) khác với `version` (phiên bản app).
- Mỗi chức năng đã chọn nằm trong cấu hình **của một app version**, không phải cờ bật toàn tenant. Bản ghi nghiệp vụ cần `tenant_id`, `application_id` và `application_version_id` tương ứng; khóa ngoại tổng hợp bảo đảm không tham chiếu app/version khác tenant.
- Danh mục chức năng có thể dùng chung mã/implementation giữa các app; **dữ liệu nghiệp vụ không tự dùng chung**. Nếu triển khai bảng chuyên biệt ERP/CRM, bản ghi phải có `tenant_id`, `application_id`, nguồn/version phù hợp và chỉ được liên kết bản ghi của chính app theo mặc định. Cần chọn định dạng JSONB hay bảng chuyên biệt theo truy vấn/constraint trước migration.
- `workflow_tasks` kế thừa app/version từ workflow instance và record; metadata tệp, dashboard, tìm kiếm, chỉ mục trợ lý, audit và cache phải có app scope hoặc liên kết được kiểm chứng về record/app. Không suy ra quyền chỉ bằng `tenant_id`.

## Kiểm quyền và chia sẻ

Trình tự API: xác thực OIDC → resolve membership/tenant từ token → resolve app trong tenant → kiểm thành viên có quyền app/feature/action → kiểm đối tượng/trạng thái/version → thực thi. Bỏ `app_id` hoặc giả mạo app khác phải bị từ chối; không tin `tenant_id`/`app_id` do client gửi là bằng chứng quyền. Mọi truy vấn theo cả tenant + app; truy cập trực tiếp URL, file, task, dashboard, tìm kiếm, AI cũng tuân ranh giới app.

Quyền app cần hợp đồng quản lý cấp/thu hồi (ví dụ liên kết membership/role với app và tập quyền); chưa chọn schema bảng cụ thể. Mặc định ERP A không thấy dữ liệu CRM A dù cùng tenant; B không thấy dữ liệu A. Nếu doanh nghiệp muốn chia sẻ, cần chính sách liên kết nguồn/đích, loại dữ liệu/hành động, người phê duyệt, audit và thu hồi; **không** dùng join tự do giữa hai app hoặc quyền tenant-admin mặc định để vượt chính sách. Tắt chức năng hoặc đổi phiên bản không xóa dữ liệu hay đổi workflow đang chạy ngầm.

## Việc kỹ thuật cần quyết định trước migration

1. Chốt danh mục chức năng, mô hình quyền app và feature, vòng đời dữ liệu từng thực thể ERP/CRM; chọn bảng chung hay bảng chuyên biệt.
2. Xác định khóa/foreign key/RLS (nếu dùng), cơ chế migration dữ liệu khi tắt chức năng/đổi phiên bản, chính sách lưu và chia sẻ theo app.
3. Viết migration mới append-only và test âm: A ERP ↔ A CRM, A ↔ B, bản ghi/tệp/task/dashboard/search/AI, quyền bị thu hồi, app v1/v2. Kiểm API lẫn DB; khóa ngoại tenant hiện tại chỉ chống chéo tenant, **chưa chứng minh cách ly chéo app cùng tenant**.

**Nghiệm thu:** TC-APP-01..03, TC-MOD-02, TC-TEN-02 và FR-AI-06 phải có log/test report trên môi trường chạy thật; ERD này không phải bằng chứng hoàn thành.
