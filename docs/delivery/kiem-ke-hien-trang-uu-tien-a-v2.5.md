# Kiểm kê hiện trạng yêu cầu ưu tiên A — DigiX Lab v2.5

**Ngày kiểm:** 25/11/2026 (UTC+7). **Commit code được kiểm:** `6c0d911` (`main`, `origin/main` tại lúc kiểm). **Phạm vi:** 31 yêu cầu chức năng mức A trong [SRS v2.5](../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md) §3.1–3.4; không bao gồm yêu cầu B/C và NFR (không gắn mức A/B/C trong bảng SRS). SRS/roadmap/thiết kế v2.5 đang sửa trong workspace, **chưa nằm trong commit trên**; bảng này đối chiếu code ở commit đó với bản SRS đang đọc. Không suy ra đã hoàn thành từ tài liệu, schema hoặc fixture đề xuất.

## Cách đọc trạng thái và môi trường

- **Đã chạy:** toàn bộ hành vi của mã yêu cầu có bằng chứng E2E trên môi trường tích hợp thật, qua Gateway khi áp dụng; có kết quả, commit và log. **Hiện chưa có yêu cầu A nào đủ bằng chứng này.**
- **Mới có nền tảng:** đã thấy code/config/DB/test cho *một phần* yêu cầu nhưng chưa có hành vi v2.5 hoàn chỉnh hoặc bằng chứng E2E.
- **Chưa có:** không tìm thấy implementation cho hành vi cốt lõi của yêu cầu trong các module/API hiện tại; có UI mẫu, bảng DB hoặc schema thiết kế cũng không tính là implementation.

**Môi trường kiểm:** đọc mã nguồn tại workspace Linux; chạy test API trong `apps/api` bằng `npm test -- --runInBand --silent` (**57 suites, 396 tests đạt**) và Web trong `apps/web` bằng `npm test -- --run` (**15 files, 88 tests đạt**) ngày 25/11/2026. Các test này chạy bằng Jest/Vitest, chủ yếu mock phụ thuộc. `apps/api/test/app.e2e-spec.ts` dùng token verifier, DB, S3, Keycloak giả lập; tên `e2e` **không** đồng nghĩa thử qua APISIX/Keycloak/DB thật. Chưa chạy Compose, `infra/apisix/smoke-test.sh`, `smoke:m1:core`, migration/schema verification trên DB sống, refresh/restart hoặc ca `TC-*` v2.5 trong lần kiểm này. Không có URL môi trường tích hợp, log API/Gateway, test report E2E hay ảnh/video để đính kèm; ghi **chưa kiểm chứng**, không ghi “không chạy được”.

**Dấu vết nền tảng dùng nhiều lần:**

- [Compose](../../compose.yaml) có PostgreSQL, Keycloak, Flowable, SeaweedFS, API, APISIX và Web; [cấu hình Gateway](../../infra/apisix/apisix.yaml) có OIDC/rate limit; [smoke Gateway](../../infra/apisix/smoke-test.sh) có sẵn **nhưng chưa chạy ở lần kiểm này**.
- [AppModule](../../apps/api/src/app.module.ts) đăng ký Auth, Identity, Onboarding, Builder, Storage, Workflow; [migration 0001](../../apps/api/src/database/migrations/0001-initial-schema.ts) tạo bảng app/version/record/task/file/audit, [migration 0002](../../apps/api/src/database/migrations/0002-builder-drafts.ts) thêm draft/revision. Bảng có sẵn không chứng minh API/runtime đã triển khai.
- [Controller tạo app](../../apps/api/src/builder/builder-application.controller.ts), [controller mô tả](../../apps/api/src/builder/builder-source.controller.ts), [controller draft](../../apps/api/src/builder/builder-draft.controller.ts) là toàn bộ nhóm route Builder hiện thấy; [manifest v1](../../apps/api/src/builder/builder.types.ts) có `schemaVersion: '1.0'`, chưa có `features`/`pages` v2.5.
- [RolesGuard](../../apps/api/src/identity/roles.guard.ts) xét role membership trong tenant, chưa có policy theo app/feature/record. [Danh sách Builder Web](../../apps/web/components/builder/BuilderAppList.tsx) lưu trình duyệt; `apps/web/app/(workspace)/apps/page.tsx`, `tasks/page.tsx`, `records/page.tsx`, `assistant/page.tsx` vẫn dùng dữ liệu mẫu/toast.

## Đối chiếu từng yêu cầu A

**Bằng chứng** dưới đây là vị trí code/config/test cho nhận định, **không phải** bằng chứng nghiệm thu đạt. Với dòng “Chưa có”, vị trí chỉ ra module/route lân cận hoặc UI mẫu; kết luận dựa trên kiểm kê các controller/module API hiện có, không khẳng định không tồn tại mã ở nơi khác ngoài repo này.

| Mã | Yêu cầu rút gọn | Trạng thái | Bằng chứng hiện có và thiếu để đạt |
| --- | --- | --- | --- |
| FR-CORE-01 | Hai tenant, SSO, đúng membership | Mới có nền tảng | `apps/api/src/onboarding/`, `auth/`, `identity/`, `infra/keycloak/` có đăng ký, token và tenant context; chưa có ca đăng nhập thật A/B và thử người ngoài tenant qua Gateway. |
| FR-CORE-02 | Token, tenant, role, quyền bản ghi/trạng thái ở mọi API | Mới có nền tảng | `identity/tenant-context.guard.ts`, `identity/roles.guard.ts`; RolesGuard chỉ kiểm role tenant; chưa có quyền bản ghi/app và thử âm trực tiếp API nghiệp vụ v2.5. |
| FR-CORE-03 | Gateway cho Web/mô-đun, rate limit, ghi chặn | Mới có nền tảng | `infra/apisix/apisix.yaml`, `compose.yaml`, `infra/apisix/smoke-test.sh`; chưa chạy smoke qua Gateway lần này, chưa chứng minh ghi audit sự kiện chặn. |
| FR-CORE-04 | Bản ghi/tệp an toàn, quét độc, URL có hạn | Mới có nền tảng | `database/migrations/0001-initial-schema.ts`, `storage/stored-file.controller.ts`, `storage/stored-file.service.ts` có upload/kiểu/kích thước và trạng thái scan `pending`; chưa có luồng quét sạch, cấp URL đọc có hạn sau kiểm quyền bản ghi/app. |
| FR-CORE-05 | Workflow bền vững qua restart | Mới có nền tảng | `workflow/` có client/deploy/start/task; `src/dev/m1-core-smoke.ts` là script kiểm lõi nếu chạy; chưa có hồ sơ API gắn workflow, log restart/khôi phục trạng thái v2.5. |
| FR-CORE-06 | Audit đăng nhập/quyền/publish/quyết định/từ chối | Mới có nền tảng | Migration có bảng `audit_logs`; tìm trong `apps/api/src` không thấy service/ghi sự kiện nghiệp vụ vào bảng này; chưa có audit end-to-end. |
| FR-BLD-01 | Tạo app nháp, mục tiêu, vai trò/bộ phận | Mới có nền tảng | `builder/builder-application.controller.ts`, `builder/builder-application.repository.ts`, `web/components/builder/CreateAppForm.tsx` tạo nháp v1 với tên/mục tiêu/bộ phận; chưa hoàn chỉnh cấu hình vai trò v2.5, chưa smoke API thật. |
| FR-BLD-02 | Nhập mô tả quy trình cấu trúc và nguồn | Mới có nền tảng | `builder/builder-source.controller.ts`, `builder/builder-source.service.ts` nhận mô tả/source; test module có, chưa có E2E từ Web qua Gateway và đủ mọi đầu vào/ngoại lệ. |
| FR-BLD-03 | Chuẩn hóa nháp, ánh xạ nguồn, chỉnh thủ công | Mới có nền tảng | `builder/builder-draft.controller.ts` có `normalize`, `patch`, `get`; `builder/builder-source.normalizer.ts` xử lý v1, chưa có lát cắt app v2.5 được chạy/kiểm qua Gateway. |
| FR-BLD-04 | Sửa quy trình và kiểm ngữ nghĩa | Mới có nền tảng | `builder/builder-draft.controller.ts` có patch/validate; `builder/builder-semantic.validator.ts` và validator bước/nhánh kiểm v1; chưa có editor và validator đầy đủ quyền/feature/UI v2.5. |
| FR-BLD-05 | Chạy thử, publish bản bất biến, rollback/pin | Chưa có | `builder/builder-draft.controller.ts` chỉ có get/normalize/patch/validate; bảng `application_versions` có trạng thái publish nhưng chưa có route preview/publish/rollback và thử giữ phiên workflow. |
| FR-BLD-06 | Danh mục ERP/CRM chọn/bỏ, phụ thuộc | Chưa có | `builder/builder.types.ts` chỉ mô tả quy trình v1; chưa có route danh mục chức năng/preset và validator phụ thuộc ERP/CRM. Fixture/schema `docs/` chỉ là thiết kế. |
| FR-BLD-08 | Kiểm hợp đồng app/H-P-D-I trước publish | Mới có nền tảng | Có validate draft v1 ở `builder/builder-draft.controller.ts`; chưa kiểm feature/page/action/quyền/I/Tầng 3 và chưa có bước publish để chặn cấu hình sai. |
| FR-BLD-09 | Builder menu/trang/bố cục/component, preview role | Chưa có | Web Builder hiện dành cho quy trình v1; chưa thấy page-layout API, component registry/binding hoặc preview runtime theo vai trò. |
| FR-BLD-10 | Phụ thuộc và an toàn ánh xạ cấu hình | Mới có nền tảng | `builder/builder-semantic.validator.ts` kiểm ngữ nghĩa workflow v1; chưa kiểm feature dependency, component → action/quyền hay tắt feature có hồ sơ chạy. |
| FR-BLD-12 | Nhiều app/tenant, liệt kê, xuất bản độc lập | Mới có nền tảng | Migration có `applications`/`application_versions`, API tạo draft; `BuilderAppList.tsx` dùng `localStorage` vì thiếu API liệt kê; chưa có publish/v2 và thử hai app cùng tenant. |
| FR-BLD-13 | ERP/CRM/trống cùng Builder, `features` quyết định | Chưa có | `web/components/builder/CreateAppForm.tsx` tạo draft v1, không có ba lối vào và feature snapshot; không có `startingPoint`/preset trong API runtime. |
| FR-WRK-01 | Biểu mẫu app publish tạo/lưu/gửi hồ sơ idempotent | Chưa có | Migration có `business_records`, nhưng không có controller hồ sơ nghiệp vụ; `/records` đọc `SAMPLE_RECORDS`. |
| FR-WRK-02 | Task đúng người, duyệt, chống tự duyệt/lặp | Mới có nền tảng | `workflow/workflow-task.service.ts` có client xử lý task engine; chưa có API hồ sơ/task app và quyền bản ghi; `/tasks` duyệt bằng toast mẫu. |
| FR-WRK-03 | Lịch sử, trạng thái, dashboard có nguồn | Chưa có | Có bảng workflow/record; Web records/tasks/reports/dashboard còn mẫu, chưa có API lịch sử và truy vết KPI về bản ghi. |
| FR-WRK-04 | H/P/D/I trong mỗi app, AI tắt không dừng H/P/D | Chưa có | Workspace có màn mẫu; không có runtime app publish và AI adapter thật để thử trạng thái không khả dụng. |
| FR-WRK-05 | Menu/API theo feature và quyền | Chưa có | `/apps` đọc `SAMPLE_APPS`; API chưa có published config/feature guard; role tenant không thay được kiểm feature/app. |
| FR-WRK-06 | Nhiều app, chia sẻ được cấp quyền, thu hồi/audit | Mới có nền tảng | DB có khóa tenant/app/version trên `business_records`; chưa có ACL app, API cấp/sử dụng/thu hồi liên kết, phạm vi bản ghi đọc/ghi hoặc audit; chưa test trước cấp → sau cấp → sau thu hồi. |
| FR-L3-01 | ERP và CRM tối giản chạy dữ liệu thật | Chưa có | Chỉ có DB bản ghi chung và workflow client; không có controller nghiệp vụ vật tư/mua/nhập-tồn/khách hàng/cơ hội. |
| FR-L3-04 | Hợp đồng feature có version/data/action/quyền/UI | Chưa có | `docs/engineering/builder/hop-dong-ung-dung-v2.5.md` là đề xuất; chưa có catalog/runtime API hay feature implementation theo hợp đồng. |
| FR-AI-01 | Chọn nguồn, index FTS/vector theo tenant/app/role | Chưa có | Không có AI module/indexer/pgvector migration trong `apps/api/src`; tệp mới ở trạng thái pending, màn trợ lý Web là mẫu. |
| FR-AI-02 | Trả lời RAG có dẫn nguồn theo quyền hiện hành | Chưa có | `apps/web/app/(workspace)/assistant/page.tsx` trả toast mẫu; không có truy vấn AI API, kiểm quyền nguồn hoặc citation thật. |
| FR-AI-03 | AI đề xuất nháp, không tự tác động | Chưa có | `builder/builder-source.normalizer.ts` chuẩn hóa cấu trúc theo code v1, **không phải AI**; chưa có adapter AI đề xuất/kiểm hành động cấm. |
| FR-AI-04 | Thu hồi quyền/nguồn chặn truy vấn mới, dọn index | Chưa có | Chưa có indexer, đường thu hồi và recheck quyền lúc hỏi/trả lời; chưa test worker dừng. |
| FR-AI-05 | Suy luận/embedding nội bộ, giấy phép, không lưu prompt | Chưa có | Compose chưa có dịch vụ/adapter suy luận nội bộ; chưa có kiểm chứng model/license/retention. |
| FR-AI-06 | AI theo app/version, không trộn nguồn kể cả chia sẻ | Chưa có | Chưa có AI API hay ACL app/chính sách chia sẻ; Web assistant hiện không truy vấn nguồn thật. |

**Tổng hợp:** 15 **mới có nền tảng**, 16 **chưa có**, 0 **đã chạy/được chứng minh đủ mức A**. Con số phản ánh *mức hoàn thành toàn bộ từng yêu cầu*, không phủ nhận những phần v1 đã viết hoặc unit test đã đạt.

## Bằng chứng cần bổ sung để đổi trạng thái

1. **R0/lõi:** dựng môi trường Compose sạch; lưu phiên bản image, thời điểm, commit, log migrate/`db:verify`; chạy `infra/apisix/smoke-test.sh` và smoke có token thật; thử tenant A/B, tệp, audit, workflow trước/sau restart. Lưu report và request/response đã che token.
2. **R1–R3/Builder và nghiệp vụ:** test API catalog/preset, ERP/CRM, draft → validate → preview → publish → runtime, hai app cùng tenant; lưu DB ID và phiên bản cấu hình. Không thay API thật bằng fixture hoặc UI toast.
3. **R4/ACL, chia sẻ, AI:** chạy các ca [nghiệm thu v2.5](ke-hoach-nghiem-thu-v2.5.md) `TC-APP`, `TC-SHARE`, `TC-AI` với tài khoản đủ/thiếu quyền, trước/sau thu hồi, app A/B và tenant A/B; ghi audit, nguồn dẫn và thử âm đường trực tiếp.
4. **R5:** regression từ môi trường sạch, restart/backup-restore, báo cáo Đạt/Không đạt/Chưa thử cho từng mã. Chỉ nâng một dòng lên **Đã chạy** khi đủ mọi điều kiện của *chính mã đó*; không suy ra từ việc test tổng thể xanh.

**Lưu ý kế hoạch:** Việc kiểm kê này thực hiện mục “đối chiếu hiện trạng” của [Bước 0 roadmap](roadmap-v2.5.md); **chưa** chốt ước lượng, giảm phạm vi, owner, ngày freeze hoặc go/no-go.
