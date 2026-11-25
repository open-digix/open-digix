# Hợp đồng ứng dụng lắp ghép v2.5 — đề xuất

**Nguồn:** [SRS v2.5](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), FR-BLD-06/08..12, FR-L3-04, FR-WRK-05/06. **Trạng thái:** thiết kế mục tiêu; không phải API/schema đã triển khai. [Hợp đồng Builder cũ](DigiX%20Lab%20-%20H%E1%BB%A3p%20%C4%91%E1%BB%93ng%20d%E1%BB%AF%20li%E1%BB%87u%20Builder.md), [schema v1](../../reference/schema/digix-app-v1.schema.json) và fixture nghỉ phép là baseline lịch sử.

## Danh mục chức năng

Mỗi chức năng công bố `id`, `version`, tên, miền ERP/CRM, thực thể và thao tác, quyền, phụ thuộc, sự kiện và thành phần UI được phép gắn. API danh mục là nguồn chuẩn; client không được tự khai báo quyền hoặc endpoint. Bật chức năng cần đủ phụ thuộc; tắt chức năng không xóa dữ liệu và phải xét tham chiếu từ UI/quy trình/hồ sơ đang chạy.

| ID minh họa | Dữ liệu/hành động tối thiểu | Phụ thuộc |
| --- | --- | --- |
| `erp.materials` | danh mục vật tư, tạo/xem; `update_note` là hành động ghi có giới hạn dùng trong demo chia sẻ ERP A → CRM A | không |
| `erp.purchase_requests` | yêu cầu mua, gửi/duyệt/từ chối | `erp.materials` |
| `erp.inventory` | chứng từ nhập, nhập/xem tồn | `erp.materials` |
| `crm.customers` | khách hàng/liên hệ, tạo/xem | không |
| `crm.opportunities` | cơ hội gắn khách hàng, chuyển giai đoạn | `crm.customers` |

Các mã này là **hợp đồng mục tiêu đã được người yêu cầu chốt cho demo**, chưa có endpoint/runtime triển khai. `update_note` chỉ sửa trường ghi chú của đúng bản ghi vật tư được cấp, không sửa tồn kho hoặc các trường khác. Quy tắc tính tồn, chống nhập trùng, vòng đời cơ hội và xóa dữ liệu đã được ghi ở [quyết định khởi công code](../architecture/quyet-dinh-khoi-cong-code-v2.5.md); không tự mở rộng nghiệp vụ ngoài lát cắt đó.

## Ba lối vào, một cơ chế

`Bắt đầu với ERP` điền gợi ý `erp.materials`, `erp.purchase_requests`, `erp.inventory`; `Bắt đầu với CRM` điền `crm.customers`, `crm.opportunities`; `Tạo từ trống` bắt đầu với `features: []`. Đây là **preset khởi tạo trong danh mục có phiên bản**, không phải ba schema, endpoint nghiệp vụ, Builder hoặc runtime riêng. Người dùng có thể thêm/bỏ chức năng cả hai nhóm, miễn phụ thuộc hợp lệ; thay preset sau khi sửa lựa chọn cần xác nhận, không ghi đè ngầm.

**Quyết định dữ liệu:** `startingPoint` là metadata tùy chọn `erp`/`crm`/`blank` trong định nghĩa ứng dụng để truy vết nguồn gốc tạo app; ghi một lần khi tạo, không đổi khi người dùng thêm/bỏ chức năng. App v1 và bản cũ không có trường này vẫn đọc được. Preset chỉ điền ban đầu rồi **snapshot `features` người dùng đã xác nhận** mới là nguồn quyết định quyền, menu và runtime; không suy ra chức năng từ `startingPoint`, tên app hay nhóm nghiệp vụ. Bản nháp `features: []` có thể lưu, nhưng schema bản xuất bản yêu cầu ít nhất một chức năng và validator từ chối phụ thuộc/trang không hợp lệ. Cần phiên bản hóa preset trong danh mục/API để thay đổi gợi ý về sau không làm đổi app đã tạo.

## Cấu hình ứng dụng

[Schema v2.5](../../reference/schema/digix-app-v2.5.schema.json) đề xuất `(tenantId, appId, version)` cho bản cấu hình; `features` chọn chức năng/phiên bản; `roles` gắn quyền; `pages` chứa menu/bố cục/component tham chiếu `featureId`, `resource`, `action`; `workflows` liên kết hành động với quy trình. Có thể có nhiều app trong tenant, cùng chọn một chức năng nhưng dữ liệu/quyền không tự chia sẻ. [ERP A](../../examples/erp-a-app-v2.5.json), [CRM A từ trống](../../examples/crm-a-app-v2.5.json), [CRM B](../../examples/crm-b-app-v2.5.json) và [app kết hợp ERP/CRM](../../examples/hybrid-app-v2.5.json) chỉ là fixture thiết kế, không sao chép dữ liệu giữa app.

Builder cần tạo/đổi thứ tự/ẩn trang và thành phần, preview theo vai trò/mobile, lưu nháp, xem diff. Không chấp nhận JavaScript, SQL hoặc URL API tùy ý trong cấu hình. [Hợp đồng kỹ thuật v2.5 đã được người yêu cầu chốt](hop-dong-ky-thuat-v2.5.md) cụ thể hóa thư viện thành phần/bố cục, ACL, route danh mục–draft–preview–publish, chia sẻ và AI; **chưa có OpenAPI/migration/API triển khai**. Đội cần review kỹ thuật, đồng bộ schema draft/fixture và kiểm chứng quyền trước phát hành.

## Kiểm tra ngữ nghĩa trước xuất bản

1. Sau xác thực hình dạng JSON, tra danh mục để kiểm chức năng/phiên bản tồn tại, phụ thuộc đủ, `resource`/`action` thuộc chức năng, role có quyền; component không tham chiếu chức năng tắt. Schema JSON đơn lẻ **không** chứng minh các điều này.
2. Kiểm `tenantId` từ phiên xác thực, `appId` thuộc tenant, ID duy nhất, phiên bản tăng và bản xuất bản bất biến. Kiểm workflow, quyền bản ghi, nguồn dashboard/AI/tệp theo app.
3. Preview dùng dữ liệu giả; publisher xem diff chức năng/UI/quyền/workflow rồi xác nhận qua API có audit. Thất bại giữ nháp, không tạo link runtime.
4. Runtime/API xác thực tenant + app + quyền đối tượng + chức năng bật + phiên bản; mặc định từ chối đọc/sửa bản ghi app khác dù cùng tenant. Chia sẻ chỉ qua chính sách được duyệt, có audit; cache/search/AI/tệp/task cũng theo app.

**Truy vết:** FR-BLD-12/FR-WRK-06 → TC-APP-01..03; FR-BLD-13 → TC-START-01..04; FR-BLD-06/10/FR-L3-04 → TC-MOD-01..03; FR-BLD-09 → TC-UI-01..03; FR-BLD-05/08 → TC-PUB/TC-ARC. Schema và fixture không tự chứng minh test đã đạt.
