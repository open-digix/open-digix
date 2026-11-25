# Kế hoạch triển khai chi tiết DigiX v2.5 — phân việc Dũng / Duy Anh / An

**Trạng thái:** kế hoạch làm việc **đề xuất**, chưa xác nhận giờ khả dụng, ước lượng, lịch freeze/go-no-go hoặc khả năng đạt hạn **17:00 06/12/2026**.
**Phân vai theo yêu cầu:** Dũng chịu trách nhiệm Backend/API/data/AI; Duy Anh chịu trách nhiệm Frontend/Builder/runtime Web; An review tích hợp, an toàn, UX, test và có thể nhận **việc độc lập** nếu xác nhận thời gian/kỹ năng. Không xem An là năng lực Backend thứ hai khi chưa nhận việc. Không ai được tự giảm AI, chia sẻ hay các yêu cầu A để khớp lịch.

**Nguồn phạm vi:** [SRS v2.5](../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), [roadmap R0–R5](roadmap-v2.5.md), [quyết định khởi công](../engineering/architecture/quyet-dinh-khoi-cong-code-v2.5.md), [hợp đồng API/UI](../engineering/builder/hop-dong-ky-thuat-v2.5.md), [kiểm kê hiện trạng](kiem-ke-hien-trang-uu-tien-a-v2.5.md), [ca nghiệm thu](ke-hoach-nghiem-thu-v2.5.md).
**Hiện trạng đầu vào:** code v1 có Auth/tenant/Builder draft/workflow/storage; Web `/apps`, `/tasks`, `/records`, trợ lý còn mẫu. Tài liệu/schema/fixture v2.5 **không phải** tính năng đã chạy.

## Cách điều phối

- **Mỗi mã việc là một PR/nhóm PR nhỏ có thể review**; gắn owner, reviewer, phụ thuộc, test và link bằng chứng.
- **API contract trước UI thật:** Dũng cung cấp mẫu request/response, lỗi, quyền theo [hợp đồng](../engineering/builder/hop-dong-ky-thuat-v2.5.md) trước khi Duy Anh nối fetch.
  Duy Anh có thể làm khung UI bằng fixture **gắn nhãn mock**, nhưng không báo hoàn thành cho tới khi API thật chạy.
- Mỗi PR cần unit/integration test liên quan, migration/test rollback nếu có DB, negative auth test cho route mới, ảnh Web nếu đổi UI.
  Mọi Web call đi qua Gateway; server API tự kiểm quyền. Không tái dùng kết quả test v1 để đánh dấu đạt v2.5.
- Khi Dũng bị nghẽn ở API, Duy Anh làm renderer/Builder state/API adapter và test Web theo hợp đồng;
  **không làm màn mock/toast như sản phẩm hoàn thành**.
  Khi Web chưa sẵn sàng, Dũng cung cấp integration test/curl đã che token; API-only không đạt ca UI/E2E.

## R0 — Kiểm chứng lõi, bỏ blocker an toàn

| ID  | Owner → review         | Đầu ra/việc cần làm                                                                                                                                                                 | Phụ thuộc; bằng chứng để qua cửa                                                                                                             |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| B00 | Dũng → An              | Dựng Compose sạch, migrate/verify DB, Keycloak, APISIX, Flowable, object storage; chạy smoke Gateway với token thật và `smoke:m1:core`; ghi image/commit/log.                       | Bắt đầu ngay; `TC-ARC`, `TC-TEN` ở lõi, không lấy `app.e2e-spec` mock thay môi trường thật.                                                  |
| B01 | Dũng → An              | Hoàn thiện audit service cho đăng nhập/quyền/config/publish/quyết định/deny; kiểm record scope và gateway deny log.                                                                 | B00; integration test ghi/đọc `audit_logs` đúng tenant, không lộ secret.                                                                     |
| B02 | Dũng → An              | Tệp lõi: cấu hình dịch vụ quét nội bộ + ClamAV adapter/quarantine `pending`, chỉ cấp URL có hạn sau `clean` và kiểm tenant/record hiện có; chuẩn bị interface để gắn app scope sau. | B00; test pending/rejected/clean với scanner thật và URL chéo tenant. Phần **app scope** nằm ở B03a, không phụ thuộc vòng lại vào R1.        |
| F00 | Duy Anh → An           | Rà luồng đăng nhập/tenant switch/Gateway fetch; chuẩn hóa client lỗi `401/403/404/409/422`, chặn stale cache khi đổi tenant/app.                                                    | Song song B00; test Web không giữ dữ liệu ngữ cảnh cũ.                                                                                       |
| R00 | An (review/chứng kiến) | Ghi biên bản hiện trạng R0 và lỗi phát hiện; xác nhận smoke qua Gateway **đã chạy** hay còn chưa đạt.                                                                               | B00–B02/F00 theo từng phần; không ký “R0 đạt” nếu thiếu audit, tệp, workflow/restart/cách ly tenant. Cách ly **app** hoàn tất sau B03a ở R1. |

**Lưu ý:** không cần đợi tất cả R0 hoàn tất mới viết catalog/UI shell, nhưng không mở runtime E2E hoặc tuyên bố R0 đạt khi lỗi lõi/cách ly còn tồn tại.

## R1 — Catalog, ACL và hợp đồng cho hai luồng làm việc

| ID   | Owner → review         | Đầu ra/việc cần làm                                                                                                                                        | Phụ thuộc; bằng chứng để qua cửa                                                                                                   |
| ---- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| B03  | Dũng → An              | Migration append-only cho app membership/role, authorizer API + repository scope theo tenant/app/feature/action/record; API cấp/thu hồi role app.          | B00; test âm app cùng tenant và A↔B, role đổi khi JWT còn hạn. Không dùng role tenant làm quyền dữ liệu app.                       |
| B03a | Dũng → An              | Nối `stored_files`/URL tải với app/record scope bằng authorizer B03; từ chối tệp chưa clean hoặc không có quyền app.                                       | B02 + B03; test URL tệp chéo app/tenant và quyền bị thu hồi.                                                                       |
| B04  | Dũng → An + Duy Anh    | Catalog version 1 cho 5 feature, action/permission/dependency/component; `GET /v1/catalog/features`, `/presets`; OpenAPI phần này với ví dụ lỗi/phiên bản. | Hợp đồng đã chốt; test `TC-MOD-03`, `TC-START-01..04` ở mức catalog; frontend có thể dùng response contract trước khi server xong. |
| B05  | Dũng → An              | Validator draft/published v2.5, giữ v1.0 hoạt động; test `features: []` lưu nháp nhưng không publish, component bind/phụ thuộc sai bị chặn.                | B04; test schema/semantic, đọc draft v1 thiếu `startingPoint`.                                                                     |
| F01  | Duy Anh → An           | API adapter/types cho catalog, draft, app list và errors; tách Web fixture khỏi dữ liệu API bằng ranh giới rõ.                                             | Dùng OpenAPI B04; test adapter/lỗi, không ghi `localStorage` làm nguồn chuẩn.                                                      |
| F02  | Duy Anh → An           | Màn chọn ERP/CRM/trống và chọn/bỏ feature, báo phụ thuộc; một Builder, `startingPoint` chỉ metadata.                                                       | F01; test UI `TC-START-01..04`, nháp rỗng và đổi preset sau khi sửa lựa chọn.                                                      |
| R01  | An (review/chứng kiến) | Review catalog–ACL–schema và PR API/Web chéo; cập nhật mapping ca thử R1.                                                                                  | B03–B05, F01–F02; sai quyền/phụ thuộc là blocker trước publish.                                                                    |

**Điểm nối sớm:** sau B04/Duy Anh có contract, Duy Anh không cần đợi B05 xong để làm UI chọn feature; sau B03/Dũng có authorizer, các route nghiệp vụ mới phải dùng nó ngay. B03a phải xong trước khi coi an toàn tệp theo app là đạt.

## R2 — Hai lát cắt nghiệp vụ thật

| ID  | Owner → review         | Đầu ra/việc cần làm                                                                                                                              | Phụ thuộc; bằng chứng để qua cửa                                                                                                                                                   |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B06 | Dũng → An              | Migration bảng ERP/CRM chuyên biệt và FK tổng hợp app/version, unique SKU/customerCode/receipt-per-request, version optimistic, idempotency key. | B03–B04; migration test trên DB sạch và dữ liệu v1, không sửa migration 0001/0002.                                                                                                 |
| B07 | Dũng → An              | Vật tư → yêu cầu mua → submit/approve/reject qua Flowable → nhập toàn bộ đúng một lần → stock theo receipt; record/task/history gắn app/version. | B06; integration test với app/version **seed chỉ để kiểm thử** trước khi có publish; E2E `TC-MOD-01`, `TC-L3-01` chỉ đạt sau B10/F04, gồm cạnh tranh/tự duyệt/nhập trùng/restart.  |
| B08 | Dũng → An              | Customers/contacts → opportunity → `advance` từng giai đoạn, lịch sử actor/version; đủ list/detail theo quyền.                                   | B06; integration test với app/version seed trước B10; E2E sau publish, test cross-app FK, giai đoạn sai, idempotency và refresh/restart.                                           |
| F03 | Duy Anh → An           | Component `form/table/detail/metric/action` và renderer `single/two_columns`, role/feature visibility; mobile/bàn phím.                          | F01–F02/B04; unit/UI test cùng fixture schema; **chưa coi là runtime thật**.                                                                                                       |
| F04 | Duy Anh → An           | Màn thao tác ERP và CRM nối API B07/B08 qua adapter, làm loading/empty/forbidden/conflict và lịch sử nguồn.                                      | F03 + B07/B08; **thay** `SAMPLE_RECORDS`, `SAMPLE_TASKS`/toast ở đường demo bằng dữ liệu thật. Có thể làm UI theo API đã kiểm với app seed; E2E Web **sau B10** khi đã có publish. |
| R02 | An (review/chứng kiến) | Chạy 2 luồng nghiệp vụ qua API Gateway với ID bản ghi có nguồn, app/version seed chỉ để kiểm service; kiểm restart và thử âm.                    | B07/B08; chưa đánh dấu `TC-MOD-01` E2E đạt nếu còn app seed. Sau B10/F04, chạy lại bằng app publish từ Builder qua Web.                                                            |

## R3 — Builder, preview, publish, version

| ID  | Owner → review         | Đầu ra/việc cần làm                                                                                                                                 | Phụ thuộc; bằng chứng để qua cửa                                                                       |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| B09 | Dũng → An              | Mở rộng `POST/GET/PATCH /v1/apps`/draft theo `schemaVersion`, list app theo quyền, lock/checksum, validator semantic; không phá v1.                 | B03–B05; test concurrent draft, đọc bản cũ; danh sách không phụ thuộc `localStorage`.                  |
| B10 | Dũng → An              | API preview dữ liệu tổng hợp theo role, **không ghi nghiệp vụ**; publish revalidate + audit + deploy workflow idempotent, lỗi giữ bản cũ/reconcile. | B07–B09; test draft rỗng/lỗi, 2 publisher cạnh tranh, rollback bằng publish version mới, pin workflow. |
| F05 | Duy Anh → An           | Editor trang/menu/component/binding an toàn; lỗi validator đưa tới trang/trường; preview role/mobile theo snapshot checksum.                        | F03 + B09/B10; `TC-UI-01..03`, `TC-PUB-01`; không gửi JS/SQL/URL tùy ý.                                |
| F06 | Duy Anh → An           | Danh sách Builder từ `GET /v1/apps`, diff/quyền publish, trạng thái lỗi/reconcile; runtime app dùng **published config**, không dùng bản nháp.      | B09/B10 + F05; test khác tenant/app/version và reload.                                                 |
| R03 | An (review/chứng kiến) | Thử 3 lối vào cùng Builder, ERP bỏ tồn, CRM thêm vật tư, blank lưu rồi chặn publish, A/B bố cục khác.                                               | B09/B10/F05/F06; `TC-START`, `TC-UI`, `TC-PUB`, `TC-ARC`.                                              |

## R4 — Runtime nhiều app, chia sẻ và AI

| ID  | Owner → review         | Đầu ra/việc cần làm                                                                                                                                             | Phụ thuộc; bằng chứng để qua cửa                                                                                                                                                                           |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B11 | Dũng → An              | Runtime app/version/menu theo role và feature; task/history/dashboard/metric truy nguồn và scope; app A ERP+CRM, B CRM.                                         | B03, B07–B10; URL/API feature tắt bị từ chối, app publish v2 không đổi v1/app khác.                                                                                                                        |
| F07 | Duy Anh → An           | App switcher + menu/render runtime từ B11; xóa cache/phiên trợ lý khi đổi app, chặn deep link, hiển thị version.                                                | B11 + F06; `TC-APP-01..03`, `TC-MOD-02`, `TC-HPDI`.                                                                                                                                                        |
| B12 | Dũng → An              | Migration/API `app_shares` cấp/list/sửa/thu hồi; truy cập vật tư ERP A từ CRM A theo ID, `read` + `update_note`, source service guard; audit và recheck revoke. | B03 + B07 + B11; `TC-SHARE-01..03`, URL/API/tenant khác/list/cache âm.                                                                                                                                     |
| F08 | Duy Anh → An           | UI cấu hình share cho người có quyền và xem/sửa ghi chú vật tư được chia sẻ ở CRM A; hiển thị nguồn, phạm vi, trạng thái/thu hồi.                               | B12 + F07; không cho UI suy quyền chỉ từ cùng tenant, test trước cấp/sau cấp/sau revoke.                                                                                                                   |
| B13 | Dũng → An              | AI source/ACL/grant/revoke, worker FTS+pgvector, inference/embedding adapter nội bộ, hỏi có citation/`no_evidence`/`unavailable`; đề xuất quy trình ở nháp.     | B03 + B10 + B12 (cho nguồn được chia sẻ); kiểm trước prompt/trước trả lời, worker dừng/JWT cũ/revoke khi đang hỏi; `TC-AI-01..05`. Có thể làm adapter/index schema sớm sau B03, không đợi B12 mới bắt đầu. |
| F09 | Duy Anh → An           | UI chọn nguồn/trợ lý trong app, citation link theo quyền, trạng thái chưa có nguồn/AI tắt; AI suggestion chỉ cho bản nháp người dùng xác nhận.                  | B13 + F07; không giữ câu trả lời giữa app, H/P/D tiếp tục khi AI lỗi.                                                                                                                                      |
| R04 | An (review/chứng kiến) | Kiểm thử âm xuyên bản ghi/tệp/task/dashboard/search/AI, chia sẻ và thu hồi; review không log prompt/chunk, không leak metadata.                                 | B11–B13/F07–F09; ghi log đã che token cho `TC-APP`, `TC-SHARE`, `TC-AI`.                                                                                                                                   |

**Đường găng cần theo dõi:** B03 → B06 → B07/B08 → B10 → B11 → B12/B13 → E2E; B13 có phần index/adapter chạy song song từ B03. Dũng là owner duy nhất cho nhiều nút đường găng: nếu An nhận code, ưu tiên tách **AI index worker/adapter** hoặc **test tích hợp/bảo mật** thành PR/module độc lập, rồi Dũng review; không giao An PR chạm cùng transaction/ACL với B12 khi đang làm.

## R5 — Regression, phát hành và quyết định

| ID  | Owner → review            | Đầu ra/việc cần làm                                                                                                                                                                         | Phụ thuộc; bằng chứng để qua cửa                                                              |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| B14 | Dũng → An                 | Tự động hóa smoke API qua Gateway + DB sạch; backup/restore, restart, reconcile deploy/index; kiểm ClamAV, model/embedding license và cấu hình không gửi dữ liệu ra ngoài.                  | B00–B13; log phiên bản image/model/license, không có secret.                                  |
| F10 | Duy Anh → An              | Web regression, responsive/bàn phím, lỗi quyền/AI off, build/typecheck; đường demo không còn toast/mock.                                                                                    | F00–F09; ảnh/video 3 app, 3 lối vào, share, AI; links dẫn nguồn đúng.                         |
| R05 | An (điều phối nghiệm thu) | Chạy ma trận `TC-*` từ môi trường sạch cùng Dũng/Duy Anh; mỗi ca Đạt/Không đạt/Chưa thử + commit, env, log/API/ảnh, người thực hiện/chứng kiến; lập danh sách blocker và biên bản go/no-go. | B14/F10; **không tự ký đạt** cho ca chưa có chứng cứ hoặc chưa kiểm AI/license/thu hồi/quyền. |

## Cách cập nhật plan và nhận việc

1. Chuyển mỗi ID thành issue với trạng thái `chưa nhận → đang làm → chờ API/review → đã merge → đã chạy E2E`;
   gắn link PR, ca thử, môi trường và commit. Dũng/Duy Anh xác nhận việc mình nhận;
   An review theo cổng, không nhận hết các test thay người viết.
2. Khi có thời gian thực tế, điền cho từng ID **lạc quan/khả năng cao/xấu nhất**,
   giờ khả dụng của từng người và thời gian review; tính đường găng/khả năng đạt hạn.
   Lúc đó mới chốt ngày freeze/go-no-go.
   Sắp việc theo phụ thuộc **không có nghĩa** tất cả R2 phải xong mới bắt đầu F03 hoặc AI adapter.
3. Cửa R0–R5 chỉ “đạt” bằng chứng theo [kế hoạch nghiệm thu](ke-hoach-nghiem-thu-v2.5.md);
   PR merge hoặc unit test xanh chưa đủ.
   Nếu đường găng vượt thời gian còn lại, báo người yêu cầu để chọn thêm nguồn lực/đổi cam kết hoặc giảm phạm vi **bằng quyết định sửa SRS**,
   không tự bỏ chia sẻ hay AI.

**Chưa điền:** hạn từng việc, giờ khả dụng của Dũng/Duy Anh/An, ước lượng, ngày freeze và go/no-go.
Việc này cố ý để mở, **không** ngầm cam kết đạt toàn bộ mức A trước hạn nộp.
