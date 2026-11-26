# Báo cáo tiến độ DigiX Lab — 26/11/2026

**Đối chiếu với:** [Kế hoạch triển khai chi tiết v2.5](ke-hoach-trien-khai-chi-tiet-v2.5.md). Báo cáo phản ánh mã nguồn và môi trường local tại thời điểm kiểm tra; phân biệt **đã có code/test** với **đã nghiệm thu E2E**. Báo cáo [15/11](bao-cao-tien-do.md) được giữ làm lịch sử.

## Tiến độ theo mã việc

| Mã việc | Hiện trạng | Còn thiếu để hoàn tất theo kế hoạch |
| --- | --- | --- |
| B00 | Stack Compose gồm Web, API, Gateway, Keycloak, DB, Flowable, object storage và antivirus đang healthy; kiểm schema DB và smoke Gateway cơ bản đạt. | Smoke với token thật, hai tenant, `smoke:m1:core`, restart và bằng chứng phiên bản/log. Chưa đóng R00. |
| B01 | Audit service, filter ghi từ chối và test đã được viết trong workspace. | **Chưa commit/merge**; review, kiểm DB thật, tích hợp các thao tác quyền/publish/quyết định khi có API; kiểm log chặn tại Gateway/IdP riêng. |
| B02 | Code ClamAV, quarantine và URL tải có hạn đã merge. | Chạy các ca scanner thật, `pending/rejected/clean`, URL chéo tenant và lưu bằng chứng. |
| B03 | Có migration ACL, authorizer/guard theo app và API cấp/thu hồi vai trò. | Kiểm đủ feature/action/record, hai app cùng tenant, chéo tenant và thu hồi quyền khi JWT còn hạn. |
| B03a | Chưa có quyền tệp theo app/bản ghi; `FileAccess` hiện còn giới hạn theo tenant/người yêu cầu. | Nối authorizer B03 và thử quyền tệp chéo app, thu hồi quyền. |
| B04 | Có API catalog cho 5 feature và preset ERP/CRM/trống. | Bàn giao OpenAPI/mẫu lỗi và kiểm các ca catalog theo kế hoạch. |
| B05 | Chưa có validator draft/published v2.5; hiện có validator Builder v1. | Làm interface validator, kiểm draft rỗng, phụ thuộc, binding/quyền sai và giữ tương thích v1. |
| F00–F03 | Có client xử lý lỗi, wizard chọn điểm xuất phát/chức năng và renderer với fixture. | Kiểm đổi tenant/app, nối hợp đồng API thật; F03 chưa phải runtime nghiệp vụ. |
| B06a–B08, F04 | Chưa có module/API nghiệp vụ ERP, CRM và màn thao tác dùng dữ liệu thật. | Làm nền `FeatureModule`, migration, hai luồng nghiệp vụ; thay `SAMPLE_*`/toast bằng API. |
| B09–B13, F05–F09 | Có Builder draft v1; Web v2.5 mặc định dùng mock. Chưa có publish v2.5, runtime đã publish, chia sẻ liên app hoặc AI backend. | Thực hiện theo các phụ thuộc R3–R4; không coi schema, fixture hay màn mẫu là tính năng chạy thật. |
| B14, F10, R00–R05 | Chưa có báo cáo nghiệm thu E2E v2.5 đủ ca và bằng chứng. | Regression, backup/restore và bảng Đạt/Không đạt/Chưa thử theo từng ca; quyết định go/no-go. |

**Kiểm tra tại local:** API đạt 458 test, bỏ qua 2; Web đạt 249 test. Smoke Gateway cơ bản và xác minh schema DB đạt. Các kết quả này **không** thay thế đăng nhập bằng token thật, thử nghiệp vụ qua Gateway/Web và nghiệm thu R0–R5.

## Việc tiếp theo

1. **Dũng:** hoàn tất bằng chứng B00; rà phần còn thiếu B03, bàn giao hợp đồng B04; ưu tiên B06a → B06b → B07 trên đường găng.
2. **An:** review/merge B01, kiểm chứng B02; làm B03a và **ưu tiên B05** để không chặn B09/B10; sau B06a triển khai B06c → B08.
3. **Duy Anh:** đối chiếu F00–F02 với API thật; giữ fixture gắn nhãn mock, làm F04 khi B07/B08 có contract/API.
4. **Sau các điểm nối trên:** B09/B10 + F05/F06 (draft v2.5, preview, publish), B11–B13 + F07–F09 (runtime, chia sẻ, AI), rồi kiểm thử R2–R5.

**Điểm chặn cần bàn giao sớm:** B05 → B09/B10; B06a → B06b/B06c/B07/B08. B00 còn thiếu bằng chứng để đóng R0. Kế hoạch hiện chưa xác nhận giờ khả dụng, ước lượng, lịch freeze/go-no-go; chưa có cơ sở cam kết toàn bộ phạm vi trước **17:00 06/12/2026**. Không tự giảm yêu cầu chia sẻ hoặc AI.
