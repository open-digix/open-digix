# DigiX Lab — thiết kế builder v1 và kế hoạch nghiệm thu

**Trạng thái:** đề xuất kỹ thuật để cả đội duyệt, **chưa triển khai/chưa chạy thử thật** (05/11/2026). Phạm vi sản phẩm theo [SRS DigiX Lab v2.2](SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md). Đây là thiết kế một lát cắt, không phải đặc tả đầy đủ cho mọi quy trình.

## 1. Hợp đồng ứng dụng v1

- JSON Schema Draft 2020-12: [`schema/digix-app-v1.schema.json`](schema/digix-app-v1.schema.json). Mẫu **nghỉ phép được cấu hình**: [`fixtures/leave-app-v1.json`](fixtures/leave-app-v1.json). Ca dữ liệu giả: [`fixtures/leave-cases.json`](fixtures/leave-cases.json).
- Định danh của định nghĩa: `(tenantId, appId, version)`; bản nháp được phép sửa, bản đã xuất bản bất biến. `schemaVersion` dành cho phiên bản **định dạng**, `version` dành cho phiên bản **ứng dụng**. Mọi hồ sơ lưu ba định danh này và mã phiên thực thi workflow.
- `roles` và `fields` cấu hình vai trò, biểu mẫu/dữ liệu; `steps` có `start`, `task`, `gateway`, `end`; `transitions` nối các bước. `task.role` chỉ rõ ai xử lý; `decisionField` là trường chỉ người được giao việc mới được ghi; `endState` là kết quả. `when.all` là các so sánh AND có kiểu, chỉ hỗ trợ `eq`, `lt`, `gte` trong v1, **không nhận biểu thức/script tùy ý từ tenant**.
- Mẫu UI Tầng 2 dựng từ định nghĩa: danh sách, biểu mẫu, chi tiết, hộp việc, dashboard và trạng thái trợ lý. Mô-đun Tầng 3 (nếu có) đăng ký nghiệp vụ/tích hợp qua API; không tự tạo identity, Gateway hay DB riêng. Ứng dụng nghỉ phép có thể chạy chỉ bằng cấu hình và lõi chung, không cần connector riêng.
- JSON Schema kiểm tra **hình dạng dữ liệu**, không thay cho kiểm tra ngữ nghĩa và phân quyền của API. Backend phải kiểm tra ID trường/bước/role là duy nhất; tham chiếu `from/to`, `role`, `decisionField`, `when.field` tồn tại; đúng một `start`, ít nhất một `end`; các bước đều đến được từ start và mỗi nhánh có đường đến end; task có role và decisionField phù hợp; start không có cạnh vào, end không có cạnh ra; gateway có điều kiện loại trừ nhau và bao phủ các giá trị hợp lệ (thiếu nhánh phải bị chặn xuất bản). V1 không hỗ trợ vòng lặp/parallel gateway; phát hiện chu trình và từ chối. `min/max` phải phù hợp kiểu và `min <= max`; enum phải có `options`. Validation của hồ sơ kiểm tra trường bắt buộc, kiểu/giới hạn/enum; chỉ task được giao mới được ghi trường quyết định.

## 2. Từ định nghĩa sang workflow engine

**Lựa chọn đề xuất:** Flowable chạy riêng, nhận BPMN 2.0 **được sinh ở backend từ JSON đã kiểm tra**, không yêu cầu người dùng xuất BPMN hay nhập XML tùy ý. Khi thay workflow engine chỉ thay compiler/adapter, không đổi manifest của ứng dụng.

| JSON v1 | BPMN / hành vi backend |
| --- | --- |
| `start` | `startEvent` |
| `task` | `userTask` với candidate group theo `tenantId + appId + role`; API phân quyền kiểm tra lại người thực hiện, tenant, phạm vi bản ghi và `noSelfApproval` trước khi complete task. |
| `gateway` | `exclusiveGateway`; sinh sequence flow với điều kiện từ AST `when.all` đã kiểm tra, không cho tenant cung cấp trực tiếp JUEL/Java code. Nếu số nhánh khớp không đúng 1: chặn lúc chạy và ghi lỗi/audit, không tự chọn nhánh đầu tiên. |
| `end` | `endEvent` với `endState` chuẩn hóa; lưu hồ sơ nguồn và event/audit đồng bộ với trạng thái quy trình qua API. |
| `transition` | `sequenceFlow` có ID ổn định, sinh từ `from/to` và thứ tự cạnh; cạnh không điều kiện chỉ được dùng tại start/task, không dùng làm đường mặc định che lỗi ở gateway. |

**Quy trình xuất bản:** người có quyền xem diff và chạy thử → backend kiểm tra schema/ngữ nghĩa/quyền → compiler sinh BPMN từ định nghĩa → deploy definition với key được namespace theo tenant/app/version → ghi ánh xạ `deploymentId`/definition ID và checksum trong bản phát hành bất biến → chỉ sau khi deploy thành công mới chuyển bản phát hành sang `published`. Nếu deploy thành công nhưng ghi DB lỗi, ghi trạng thái cần đối soát, không cho chạy định nghĩa chưa công bố; tác vụ đối soát hoặc thử lại theo khóa idempotency. Phiên mới không thay thế phiên đang chạy: khi khởi tạo hồ sơ backend chọn version hiện hành rồi pin definition ID vào hồ sơ; phiên cũ kết thúc theo definition cũ. Không cho UI truyền definition ID tùy ý.

**Quy trình chạy:** tạo hồ sơ nháp → kiểm tra dữ liệu và quyền → gửi với idempotency key → khởi động process với `tenantId`, `appId`, `version`, `requestId` → hộp việc truy vấn qua API có guard → hoàn tất user task sau khi backend kiểm tra người được giao, tránh tự duyệt/xử lý trùng → cập nhật hồ sơ hiển thị từ trạng thái workflow và ghi audit. Khi bước liên hệ DB/engine thất bại phải có trạng thái chờ đối soát và cơ chế retry theo idempotency key; không báo gửi thành công khi chưa ghi nhận nhất quán. Việc xác định cơ chế transaction/outbox cụ thể là đầu việc triển khai, không giả định hai hệ thống có transaction chung.

## 3. Quyền xuất bản và phân quyền

| Hành động | Employee | Designer | Publisher (quản trị tenant hoặc người được ủy quyền) | Platform admin |
| --- | --- | --- | --- | --- |
| Xem/sửa bản nháp của ứng dụng được phân công | Không | Có | Có | Không mặc định |
| Chạy thử trên dữ liệu mẫu cùng tenant | Không | Có | Có | Không mặc định |
| Xem diff, xác nhận và xuất bản/đổi version hiện hành | Không | Không | Có | Không mặc định |
| Tạo hồ sơ theo biểu mẫu đã xuất bản | Có nếu được cấp | Theo quyền ứng dụng | Theo quyền ứng dụng | Không mặc định |
| Duyệt/từ chối hồ sơ | Chỉ khi được giao đúng vai trò; không tự duyệt nếu `noSelfApproval` | Như người dùng bình thường | Như người dùng bình thường | Không mặc định |

**Quy tắc:** quyền `app:publish` gắn với `(tenantId, appId)`, do API kiểm tra trên từng lệnh; không suy ra từ việc thấy nút Publish, quyền owner repo hay quyền deploy Flowable. Người thiết kế tạo bản nháp không tự cấp quyền xuất bản. Người phê duyệt nghiệp vụ kiểm tra nội dung; publisher xác nhận kết quả chạy thử, thay đổi quyền/schema/luồng và phát hành; cùng một người có thể kiêm hai vai trò nếu chính sách tenant cho phép, nhưng phải ghi lại cả thao tác review lẫn xuất bản. Mọi lần đổi quyền/xuất bản có audit; API chỉ chấp nhận bản nháp còn đúng version/checksum đã review (chặn stale update). Không cấp quyền ghi quy trình trực tiếp trong engine cho người dùng tenant.

## 4. Fixture và ca kiểm thử phải chạy trên hệ thống thật

Tenant A dùng ứng dụng mua sắm mẫu từ Tầng 3; tenant B dùng **nghỉ phép tạo qua builder từ JSON v1**, không có controller/flow nghỉ phép viết cứng. Dữ liệu Beta dùng danh tính giả `beta_employee`, `beta_manager`, `beta_hr`, `beta_publisher`; `alpha_manager` thuộc tenant khác. Đơn nghỉ có `start_date`, `days`, `leave_type`, `reason`. Manager duyệt → nếu `days < 3` thì kết thúc chấp thuận; nếu `days >= 3` chuyển HR duyệt; manager/HR từ chối → kết thúc từ chối.

| ID | Thao tác và kết quả cần quan sát |
| --- | --- |
| TC-LEAVE-01 | Designer tạo nháp từ fixture bằng builder, kiểm tra schema/đường đi; publisher chạy thử và xuất bản v1. Ghi bằng chứng UI, API và Flowable deployment ID; không thay mã lõi. |
| TC-LEAVE-02 | Nhân viên tạo hồ sơ 2 ngày; manager duyệt → `accepted`, không giao việc cho HR. |
| TC-LEAVE-03 | Nhân viên tạo hồ sơ 4 ngày; manager duyệt → HR được giao; HR duyệt → `accepted`. |
| TC-LEAVE-04 | Manager từ chối → `declined`, lưu lý do và audit, không tạo việc HR. |
| TC-LEAVE-05 | Nhân viên publish, tự duyệt hồ sơ, manager tenant A truy cập hồ sơ Beta và gửi ngày nghỉ bằng 0 đều bị API từ chối; không chỉ ẩn nút trên UI. |
| TC-LEAVE-06 | Thay đổi điều kiện `days >= 3` thành ngưỡng mới, xuất bản v2; hồ sơ v1 còn chạy theo ngưỡng cũ; hồ sơ mới theo v2. |
| TC-LEAVE-07 | Khởi động lại Web/API sau khi manager được giao việc; task, hồ sơ và lịch sử vẫn còn; dashboard truy được hồ sơ nguồn. Tắt AI: H/P/D vẫn chạy và I báo chưa khả dụng. |

**Bằng chứng chấp nhận:** log kiểm thử tự động có ID ca thử, ảnh/recording luồng builder và runtime, định nghĩa JSON và BPMN đã biên dịch (không có secret), audit publish/approve, và truy vấn đối soát version giữa hồ sơ với engine. **Trạng thái hiện tại: chưa chạy ca nào** vì repo chưa có builder, backend hoặc engine. Fixture JSON chỉ là dữ liệu thiết kế, không phải kết quả kiểm thử.

## 5. Việc triển khai kế tiếp

1. Cả đội review schema/Flowable mapping và gán owner cho compiler, guard/publish API, UI builder, seed, test; quyết định thay đổi phải ghi ngày và người xác nhận.
2. Dựng Tầng 1 và builder tối thiểu; cài validator JSON Schema, semantic validator và compiler; bổ sung kiểm thử tự động từ fixture, đặc biệt nhánh biên `days = 3`, missing branch và truy cập chéo tenant.
3. Chạy TC-LEAVE-01..07 trên môi trường sạch, lưu bằng chứng rồi **mới** cập nhật trạng thái hoàn tất trong SRS/roadmap. Nếu không chạy được, ghi blocker và phần chưa làm, không trình bày fixture là sản phẩm đã có.
