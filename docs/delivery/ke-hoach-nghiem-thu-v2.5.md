# Kế hoạch demo và nghiệm thu v2.5 — đề xuất

**Nguồn:** [SRS v2.5 §5](../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md). **Trạng thái:** kịch bản chưa chạy; không dùng fixture/prototype để đánh dấu đạt. [Mẫu biên bản M1–M3 cũ](mau-bien-ban-nghiem-thu.md) vẫn ghi nhận lịch sử kiểm thử, không đổi kết quả thực tế.

## Dữ liệu chuẩn bị

| Ngữ cảnh | App/chức năng | Người dùng thử |
| --- | --- | --- |
| Tenant A | ERP A: vật tư, yêu cầu mua, nhập/xem tồn; không bật CRM trong ERP | designer/publisher, buyer, approver, warehouse |
| Tenant A | CRM A nhỏ: khách hàng, cơ hội; tách ERP A, không chia sẻ mặc định | designer/publisher, sales, người chỉ được dùng ERP |
| Tenant B | CRM B: khách hàng/liên hệ, cơ hội/giai đoạn; không bật kho, mua hàng | designer/publisher, sales, manager |

Tạo dữ liệu tổng hợp riêng từng app (vật tư/đề nghị/nhập kho và khách hàng/cơ hội), lưu ID để kiểm truy vết; không dùng dữ liệu thật. Ghi mã commit, môi trường, phiên bản schema, tài khoản/role thử nghiệm (không ghi secret), ảnh giao diện, request/response API đã che token, audit và log workflow trước/sau restart.

## Ca thử và điều kiện đạt

| Mã | Hành động | Kỳ vọng/bằng chứng |
| --- | --- | --- |
| TC-MOD-01 | A chọn 3 chức năng ERP; B chọn 2 nhóm CRM, publish và thao tác liên chức năng. | API ghi dữ liệu thật của demo; mua → duyệt → nhập → tồn và khách hàng → cơ hội → giai đoạn có ID/nguồn truy được. |
| TC-MOD-02 | Gọi menu/URL/API cho chức năng không bật ở từng app, cả bằng token đúng tenant. | UI không hiện; API từ chối, không lộ dữ liệu; log quyền phù hợp. |
| TC-MOD-03 | Bỏ phụ thuộc (`crm.customers` khi còn `crm.opportunities`); tắt chức năng có trang/hồ sơ đang chạy. | Lỗi chỉ rõ phụ thuộc, không publish/xóa dữ liệu âm thầm. |
| TC-START-01 | Từ lối vào ERP bỏ `erp.inventory`, giữ vật tư/yêu cầu mua; lưu nháp, kiểm tra, preview và xuất bản. | Không hiện/tác động tồn kho; các chức năng còn lại dùng được; `startingPoint: erp` chỉ ghi nguồn gốc. |
| TC-START-02 | Từ lối vào CRM thêm `erp.materials` từ danh mục; kiểm tra, preview, lưu nháp/xuất bản. | Runtime có CRM + vật tư theo quyền, không tự bật mua sắm/kho; `startingPoint: crm` không chặn kết hợp. |
| TC-START-03 | Từ trống lưu nháp rỗng rồi thử xuất bản; sau đó chọn `crm.customers` và `crm.opportunities`, kiểm phụ thuộc, preview/xuất bản. | Lưu nháp rỗng thành công, publish rỗng bị chặn; bản hoàn chỉnh chạy đúng `features` đã chọn. |
| TC-START-04 | So sánh ba bản nháp/app xuất bản và thử gọi API chức năng không chọn, kể cả giả mạo `startingPoint`; mở bản nháp cũ không có trường này. | Cùng Builder/validator/runtime và kiểm quyền theo `features`/role; không có nhánh API hoặc quyền đặc biệt theo lối vào; bản cũ vẫn đọc được. |
| TC-UI-01 | A và B tạo trang/bố cục/menu khác nhau từ builder; refresh/restart. | Cấu hình được lưu, runtime đúng app, không thay mã nguồn lõi; ảnh và bản cấu hình đã xuất bản. |
| TC-UI-02 | Gắn component với feature không bật/action không có quyền. | Builder dẫn tới chỗ sửa, API chặn xuất bản. |
| TC-UI-03 | Preview theo hai role, thử mobile/bàn phím. | Chỉ hiện dữ liệu/hành động được phép, focus/nhãn rõ; API kiểm quyền lại. |
| TC-APP-01 | Tạo ERP A và CRM A trong cùng tenant, publish cả hai; đăng nhập role có quyền một hoặc cả hai. | Liệt kê/chọn đúng app theo role; có ID, cấu hình, version riêng. |
| TC-APP-02 | Dùng token/URL/API ERP A đọc CRM A và ngược lại: bản ghi, tệp, task, dashboard, tìm kiếm, trợ lý; thử A ↔ B. | Từ chối mặc định khi chưa cấu hình chia sẻ, không lộ nội dung/metadata; audit. |
| TC-APP-03 | Publish CRM A v2, tạo dữ liệu mới và tải lại/khởi động API. | ERP A và B không đổi; dữ liệu/v1 còn đọc được theo quyền, workflow cũ không bị chuyển phiên bản ngầm. |
| TC-SHARE-01 | Trong tenant A, trước khi cấp liên kết, CRM A thử đọc/ghi bản ghi ERP A bằng UI và API trực tiếp; thử tương tự từ tenant B. | Từ chối theo mặc định; không lộ nội dung/metadata; có audit; không cho tạo liên kết chéo tenant. |
| TC-SHARE-02 | Người có quyền cấp liên kết ERP A → CRM A cho **một loại dữ liệu, một phạm vi bản ghi, quyền đọc/ghi xác định**; thử bản ghi trong/ngoài phạm vi, người dùng đủ/thiếu quyền, hành động ghi được/không được phép và truy cập tệp/task/dashboard/AI. | Chỉ thao tác được trên bản ghi, loại dữ liệu, hành động và quyền được cấp; liên kết không mở tệp/task/dashboard/nguồn AI ngầm; audit cấp và sử dụng, không vượt quyền tenant/app. |
| TC-SHARE-03 | Thu hồi liên kết; thử truy cập mới với cùng token, URL/API, cache và tìm kiếm; kiểm lịch sử. | Mọi truy cập mới dựa trên liên kết bị chặn; không còn nội dung từ cache/search; audit thu hồi và lịch sử vẫn còn. |
| TC-AI-01 | Chọn nguồn AI theo tenant/app, hỏi câu có và không có chứng cứ với hai app/role. | Chỉ dẫn nguồn được phép theo quyền hiện hành hoặc nói không biết; không trộn nguồn tenant/app. |
| TC-AI-02 | Thu hồi quyền người hỏi hoặc xóa/thu hồi nguồn khi worker chỉ mục tạm dừng; hỏi lại và kiểm trích dẫn/log. | Truy vấn mới không truy xuất nguồn bị thu hồi; không lộ qua câu trả lời, trích dẫn, tìm kiếm hoặc log. |
| TC-AI-03 | Yêu cầu AI đề xuất quy trình rồi thử xuất bản/thao tác có tác động mà không có người xác nhận. | Chỉ tạo đề xuất nháp; không tự xuất bản, cấp quyền hoặc thực hiện hành động có tác động. |
| TC-AI-04 | Cấp liên kết chia sẻ dữ liệu ERP A → CRM A rồi hỏi trợ lý CRM A về bản ghi chia sẻ trước và sau khi chọn nguồn AI/kiểm quyền riêng; thử B. | Liên kết dữ liệu không tự đưa nguồn vào chỉ mục/phạm vi AI; chỉ nguồn được chọn và được phép mới xuất hiện; B không thấy nguồn của A. |
| TC-AI-05 | Tắt AI/adapter suy luận rồi thao tác H/P/D ở ERP A và CRM A. | I báo không khả dụng, không bịa kết quả; tạo/xử lý hồ sơ, việc và dashboard vẫn hoạt động. |
| TC-PUB/ARC/HPDI | Thử nháp, quyền publisher, version pin, Gateway/SSO, H/P/D/I trong từng app; tắt AI. | Nháp không chạy thật; quyền và audit đúng; H/P/D vẫn chạy khi I không khả dụng. |

**Mỗi dòng khi chạy phải ghi:** Đạt/Không đạt/Chưa thử; kết quả thực tế; thời điểm/môi trường/commit; đường dẫn ảnh/video/log/API; người chạy và người chứng kiến. Không đánh dấu đạt vì đã có tài liệu, JSON Schema, fixture, mock UI hay unit test đơn lẻ.

## Cổng quyết định

- Đội xác nhận lại phạm vi A, owner và hạn trên [roadmap v2.5](roadmap-v2.5.md) trước khi dùng tài liệu này làm kế hoạch chính thức.
- Nếu demo không đạt ca nghiệp vụ/runtime, chia sẻ liên app theo quyền, AI theo nguồn/quyền hoặc thử âm cách ly, báo **chưa đạt SRS v2.5** và quyết định sửa phạm vi có phê duyệt; không quay về TC-LEAVE để thay bằng chứng.
- Các ca TC-START kiểm hành vi khởi tạo/lắp ghép, **không thay thế** các ca ERP A/CRM B/CRM A E2E hay bằng chứng quyền, phiên bản và tách dữ liệu.
