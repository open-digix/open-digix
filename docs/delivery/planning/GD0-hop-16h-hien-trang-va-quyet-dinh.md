# Tài liệu mang vào họp GĐ0 — hiện trạng và điểm cần quyết

**Chuẩn bị ban đầu cho:** cuộc họp dự kiến 16:00 ngày 11/11/2026; dùng lại làm tài liệu tham khảo cho lịch online **15:30 ngày 13/11/2026**. Người dùng cho biết buổi họp 12/11 chưa diễn ra.  
**Lưu ý trước khi dùng:** bảng kiểm kê bên dưới là ảnh chụp **11/11**, chưa cập nhật các commit APISIX Gateway ngày 13/11, `.env` local mới và kết quả kiểm tra mới; cần rà lại cùng đội, không trình bày dòng “Gateway chưa có” như hiện trạng 13/11.  
**Trạng thái:** Bản kiểm kê sơ bộ từ repository/workspace; **chưa được An, Dũng, Tú review hoặc phê duyệt**. Những ô “chưa kiểm chứng” không có nghĩa tính năng chắc chắn lỗi, mà là chưa có bằng chứng chạy thật ở lần kiểm tra này.  
**Căn cứ:** [SRS DigiX Lab v2.4](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), [roadmap 11/11](../roadmap.md), [GĐ0 §5](GD0.md), mã nguồn tại commit `4667fb6` (`main` khi kiểm kê). Tài liệu này không thay biên bản cuộc họp.

## A. Kiểm kê hiện trạng trước họp

“Đã thử thật” ở đây chỉ ghi **loại phép thử và kết quả có quan sát được**. Không suy từ code/README sang việc dịch vụ đang chạy. Kết quả local dưới đây là của lần kiểm tra trong workspace ngày 11/11; cần chạy lại trên môi trường chung và lưu log trước khi nghiệm thu.

| Hạng mục | Đã có trong code | Đã thử thật / mức bằng chứng | Mới thiết kế | Còn thiếu để đạt yêu cầu | Bằng chứng / nơi đối chiếu |
| --- | --- | --- | --- | --- | --- |
| Compose, PostgreSQL, Keycloak | `compose.yaml` định nghĩa DB, Keycloak, API, Web, healthcheck và seed demo tùy chọn; realm import trong `infra/keycloak/`. | **Chưa smoke test trong workspace này:** không có `.env`; `docker compose ps` dừng tại bước nội suy password bắt buộc, chưa tới bước kiểm dịch vụ. | Gateway, file store, engine chỉ hiện trong thiết kế hệ thống. | Thiết lập secret local, chạy từ clone sạch và xác nhận health/realm/login trên máy chung; ghi log/commit/người thử. | `compose.yaml`, `.env.example`, `infra/keycloak/README.md`, `README.md`. |
| OIDC/SSO và Web | `apps/web/auth.ts` cấu hình Auth.js/Keycloak PKCE; route auth, `/login`, `/dashboard`, `/status` có trong Web; dashboard lấy access token để gọi `/v1/me`. | Web lint chạy: **0 lỗi, 3 cảnh báo**. Chưa thử đăng nhập/callback thực tế; không có `apps/web/.env.local` trong workspace này. | Luồng SSO và UI ứng dụng theo SRS. | Kiểm login/logout, token hết hạn, tài khoản được/không được cấp quyền; cấu hình Auth.js hợp lệ trong môi trường chạy. Dashboard nghiệp vụ chưa lấy số liệu thật. | `apps/web/auth.ts`, `apps/web/app/dashboard/page.tsx`, `apps/web/app/status/page.tsx`, `apps/web/README.md`. |
| API `/health`, `/v1/me`, JWT | NestJS có health truy vấn DB, verifier issuer/audience/JWKS, global JWT guard và `/v1/me` đọc identity/membership từ DB. | Lần chạy `npm test -- --runInBand`: **67/71 test đạt, 4 test OIDC lỗi `Cannot find module 'jose'`** tại môi trường phụ thuộc hiện tại; chưa xác định đây là lỗi code hay cài đặt. Chưa gọi API với token thật ở workspace này. | Contract API nghiệp vụ ở roadmap §04. | Khôi phục dependency/test OIDC, thử API qua Keycloak với token thật và test 401/403; chưa có API hồ sơ/builder. | `apps/api/src/auth/`, `apps/api/src/identity/me.controller.ts`, `apps/api/src/health.service.ts`, `apps/api/README.md`. |
| Tenant / role guard | Có `TenantContextGuard`, `RolesGuard`, decorators và truy vấn membership hiện hành; `/v1/me` nhận tenant chọn qua header nhưng xác minh trong DB. | Có unit test cho guard/repository/service trong repo; một phần unit suite chạy đạt như trên. **Chưa có thử chéo tenant trên hồ sơ/tệp/task/workflow chạy thật** vì các endpoint/dịch vụ đó chưa có. | Chính sách API/file/workflow/AI đa tenant trong SRS và GĐ0. | Chốt guard/RLS (Q4), quyền cấp bản ghi/app, audit từ chối; kiểm trực tiếp API, không chỉ ẩn UI. | `apps/api/src/identity/`, `apps/api/src/app.module.ts`, `docs/engineering/architecture/database-schema.md`. |
| PostgreSQL migration/schema | Migration `0001` và runner có version/checksum; schema nền gồm tenant, membership/role, application/version, business record, workflow reference, file metadata, audit; `verify-schema.ts` định nghĩa kiểm 13 bảng và sáu quan hệ chéo tenant. | Có unit test migration trong repo; README **mô tả** kết quả chạy PostgreSQL 17 trước đó, nhưng lần này **chưa chạy DB/migration/verify trên môi trường hiện tại** do thiếu `.env`. | ERD và quy tắc tenant trong `docs/engineering/architecture/database-schema.md`. | Chạy migration lặp, verify và test DB thật trên máy chung; schema nền chưa chứng minh API nghiệp vụ, workflow hay RLS hoạt động. | `apps/api/src/database/`, `docs/engineering/architecture/database-schema.md`, `README.md` §Chạy từ bản clone sạch. |
| Gateway | Chưa thấy service Gateway trong `compose.yaml`; Web đang gọi API qua `API_INTERNAL_URL` trực tiếp. | Chưa có phép thử định tuyến/rate limit/log chặn. | APISIX/đường đi Gateway trong `docs/delivery/planning/GD0.md` và roadmap. | Chọn/triển khai Gateway, đưa luồng Web/mô-đun qua đó, test route/rate limit và API vẫn tự kiểm quyền. | `compose.yaml` dòng `web`, `apps/web/app/dashboard/page.tsx`, SRS FR-CORE-03. |
| Kho tệp / kiểm dịch | DB có metadata `stored_files`; chưa thấy service lưu object hay endpoint upload/download. | Chưa thử tệp, quyền, URL hết hạn hoặc quét mã độc. | Kho tương thích S3, ACL/URL ngắn hạn và quét tệp trong SRS/GĐ0. | Chốt backend lưu tệp, API cấp quyền, loại/kích thước/quét mã độc và ca thử âm. | `apps/api/src/database/migrations/0001-initial-schema.ts`, SRS FR-CORE-04. |
| Workflow engine | DB có bảng tham chiếu `workflow_instances`, `workflow_tasks`; không có engine trong Compose hay adapter/controller chạy workflow. | Chưa thử task, chuyển trạng thái, khởi động lại hoặc phục hồi. | Compiler/Flowable, publish/idempotency/đối soát trong tài liệu builder. | Chốt engine và license, triển khai tích hợp, kiểm trạng thái bền vững và phiên workflow. | `compose.yaml`, tài liệu thiết kế builder §2, SRS FR-CORE-05. |
| Builder | Có JSON Schema v1, fixture nghỉ phép và tài liệu ánh xạ/validator/publish. Schema **chỉ định nghĩa hình dạng dữ liệu**. | Chưa thấy API/UI builder hoặc ca TC-BLD chạy thật; fixture không phải test hệ thống. | Toàn bộ luồng nhập mô tả → chuẩn hóa → chỉnh tay → validate → preview → publish. | API nháp/nguồn, semantic validator, UI, quyền, compiler, lưu phiên bản; chạy TC-BLD-01..03. | `docs/reference/schema/digix-app-v1.schema.json`, `docs/examples/`, tài liệu thiết kế builder. |
| Ứng dụng đã xuất bản / H-P-D-I | Có trang Web và dashboard khung; nguồn dashboard còn dữ liệu mẫu/ô số liệu trống, không có app runtime hay endpoint hồ sơ/task. | Chưa có test mua sắm A/nghỉ phép B E2E, cách ly hai tenant, version v1/v2 hoặc TC-LEAVE-01..07. | Mẫu UI và các ca nghiệm thu trong SRS/roadmap. | Publish app từ cấu hình, form/hồ sơ/hộp việc/lịch sử/dashboard có nguồn, H/P/D/I trong **mỗi** app. | `apps/web/app/dashboard/page.tsx`, `apps/api/src/`, SRS FR-WRK-01..04, FR-L3-01. |
| AI nội bộ | Chưa thấy adapter/index/truy vấn AI trong API/Web hoặc Compose. | Chưa thử nguồn, cách ly app/tenant, thu hồi quyền, AI tắt hay suy luận nội bộ. | `docs/engineering/ai/DigiX Lab - Thiết kế AI nội bộ và vòng đời dữ liệu.md`. | Chốt máy/model/license và điều kiện go/no-go; nếu chưa bật, ghi FR-AI-01..06 **mức A của SRS chưa đạt**, không lấy trạng thái I không khả dụng thay thế. | SRS FR-AI-01..06, roadmap M4b, tài liệu AI. |

**Ghi chú xác minh:** `apps/api/README.md` đoạn mở đầu còn nói chưa có tenant membership/role authorization, trong khi phần sau và code đã có guard. Khi cập nhật tài liệu, ưu tiên code và test mới nhất, rồi sửa mô tả cũ; không suy ngược guard đã có thành kiểm quyền nghiệp vụ hoàn chỉnh.

## B. Thang bằng chứng — không nhầm unit/schema với E2E

| Mức | Có thể kết luận | Không thể kết luận | Cần lưu để nâng mức |
| --- | --- | --- | --- |
| 0. Tài liệu/fixture | Có thiết kế, hợp đồng hoặc dữ liệu mẫu để review. | Chức năng đã chạy hoặc đúng phân quyền. | Phiên bản tài liệu, người review và điểm chưa quyết. |
| 1. Mã nguồn và unit test | Một hàm/guard/runner xử lý các ca được mock/kiểm trong test. | Keycloak, DB, Gateway, Web và engine tích hợp với nhau. | Lệnh, log test, môi trường, commit, số ca đạt/lỗi. |
| 2. Migration/schema verify trên DB thật | Bảng/khóa/ràng buộc được tạo và ca FK chéo tenant bị DB từ chối trong DB thử nghiệm. | API không rò rỉ tenant, user không tự duyệt, tệp/workflow an toàn. | Lệnh migrate/verify, phiên PostgreSQL, log, checksum, kiểm rollback. |
| 3. Smoke test môi trường | Các service khởi động, Web → API → DB và SSO/token → `/v1/me` chạy trên máy cụ thể. | M1 đạt đủ nếu còn thiếu Gateway, kho tệp, workflow; M2 đạt vì có JSON Schema. | Commit, máy, `.env` **không chứa secret trong log**, lệnh, response, screenshot và người chứng kiến. |
| 4. E2E và thử âm theo SRS | Luồng app được xuất bản qua Gateway/API/workflow, trạng thái bền vững, cách ly qua API/file/task/dashboard; v1/v2 và hai tenant đúng ca thử. | Toàn bộ FR/TC đã đạt nếu chỉ thử một luồng hoặc bỏ AI mức A. | Test report theo ID TC, cả kết quả đạt/lỗi, log/ảnh/audit/version, reviewer độc lập. |

**Kết luận tại thời điểm chuẩn bị:** có bằng chứng mã nguồn/unit ở một số lớp và tài liệu schema; **không có bằng chứng smoke test xuyên hệ thống trong workspace này**. M1 yêu cầu SSO **qua Gateway**, DB/kho tệp và workflow từ source; M2 yêu cầu nhập/chỉnh/validate bản nháp thật. Chưa đánh dấu M1/M2 đạt. Muốn xác nhận sau họp: thiết lập `.env` local, chạy Compose từ clone sạch, test đăng nhập/`/v1/me` qua Gateway sau khi có Gateway, migration/schema verify và các ca quyền âm; ghi ngày, commit, log và reviewer.

## C. Câu hỏi cần quyết trong họp (Q1–Q9)

**Cách ghi mỗi quyết định:** `Quyết định / lý do / người xác nhận / ngày-giờ thực tế / link tài liệu-issue / nếu mở: owner + hạn`. Owner **soạn tài liệu GĐ0** bên dưới đã chuyển về An từ 14/11; phân công chạy test/triển khai vẫn cần đội chốt riêng. Ưu tiên xử lý Q3/Q4/Q5/Q6/Q7/Q8/Q9 ngay để tháo blocker; Q1/Q2 cần xác nhận hoặc hẹn hạn lấy dữ kiện.

| ID | Hỏi cụ thể trong cuộc họp | Cần chốt hoặc giao việc | Owner đề xuất / bằng chứng cần có |
| --- | --- | --- | --- |
| Q1 | SME mục tiêu thuộc ngành/quy mô/bộ phận nào? Có ví dụ ẩn danh về mua sắm, nghỉ phép và hai vấn đề của SME không? | Giả định người dùng, quy trình mẫu, người đi xác minh nếu chưa có ví dụ. | An soạn và xác minh ví dụ synthetic; xin Dũng/Tú góp ý khi cần. |
| Q2 | Demo chứng minh “môi trường chuẩn hóa” bằng phép đo nào: một SSO, API contract, dựng từ source, hay thay connector? | Tiêu chí quan sát được và test tương ứng; không dùng khẩu hiệu thay bằng chứng. | An + cả đội; tiêu chí Done/test ID. |
| Q3 | Ngưỡng đề §3, bốn nguyên lý §4 và phần tự chọn DigiX/SRS v2.4 được giữ đến đâu? Builder, hai tenant và **FR-AI mức A** xử lý thế nào nếu thiếu nguồn lực? | Bảng bắt buộc theo đề vs cam kết nội bộ vs để sau; điều kiện cắt phạm vi và quy trình sửa SRS, không tự tuyên bố đã đạt. | Cả đội; ma trận SRS/đề/test và quyết định có ba xác nhận. |
| Q4 | Chọn query builder/ORM, tenant guard và có cần RLS không? Engine (Flowable hay khác), compiler, giao dịch DB–engine lỗi thì đối soát/idempotency thế nào? | Owner làm ADR, thời hạn review và ca thử âm/API; chốt khi đủ chứng cứ, không mặc định công nghệ từ tài liệu. | An soạn ADR/sơ đồ/contract/test kế hoạch; xin Dũng góp ý kỹ thuật. |
| Q5 | Máy chung nào, cấu hình/cổng/secret/TLS và runtime nào? Ai là **hai người khác** thử setup độc lập? Tài khoản demo A/B cấp bằng cách nào? | Chỉ định máy/người thử/hạn, tiêu chí smoke test và seed không chứa secret; không gọi đã tái lập trước khi thử. | An tổng hợp kiểm kê/seed plan; người thử setup độc lập được mời riêng. |
| Q6 | Có thông báo BTC mới không? Thành phần dự kiến (Gateway, engine, kho tệp, model) có giấy phép **đúng phiên bản** và tương thích phát hành nguồn mở không? | Người xác minh từng thành phần, nguồn giấy phép/phiên bản, phương án thay thế và hạn; kiểm lại hạn nộp. | An; bảng license/SBOM, URL nguồn, ghi chú thể lệ. |
| Q7 | Dùng issue tracker nào, ai quản trị repo, quy tắc nhánh/PR/review, hạn phản hồi và cách báo blocker? | Chốt công cụ/quyền/quy trình; tạo issue có owner, reviewer, test và hạn thực tế. | An + cả đội; tracker và DoD. |
| Q8 | Máy dev/demo/GPU có thật không, chi phí/báo giá/trần ngân sách/nguồn chi/người duyệt là ai? Nếu không đủ tài nguyên cho AI thì làm gì? | Kiểm kê và phương án không AI; **không chi tiền khi chưa duyệt**, không coi AI A đạt nếu tắt. | An soạn biên bản chi phí/kế hoạch go-no-go; người đo/thử xác nhận riêng. |
| Q9 | Ai chứng kiến test hai tenant/`TC-LEAVE`, ai ký go/no-go 03/12, ai gửi bài trước 17:00 06/12? GĐ0/M1 đã trễ: lịch 16/11/23/11/27/11 còn khả thi không? | Ghi ngày họp và ngày đạt **thực tế**, sửa lịch theo phụ thuộc, người quyết/test report/release; không hồi tố M1 09/11. | An + cả đội; roadmap mới, owner/hạn, biên bản xác nhận. |

### Mẫu ghi nhanh trong lúc họp

| ID | Quyết định hoặc phương án còn mở | Lý do/bằng chứng | Owner, hạn nếu mở | Xác nhận An/Dũng/Tú, ngày-giờ | Link issue/tài liệu |
| --- | --- | --- | --- | --- | --- |
| Q1 | … | … | … | … | … |
| Q2 | … | … | … | … | … |
| Q3 | … | … | … | … | … |
| Q4 | … | … | … | … | … |
| Q5 | … | … | … | … | … |
| Q6 | … | … | … | … | … |
| Q7 | … | … | … | … | … |
| Q8 | … | … | … | … | … |
| Q9 | … | … | … | … | … |

**Sau họp:** gửi biên bản để từng người xác nhận rõ. Tài liệu chuẩn bị này không chứng minh họ đã review, không thay việc chạy test trên máy chung và không tự thay đổi trạng thái M1/M2.
