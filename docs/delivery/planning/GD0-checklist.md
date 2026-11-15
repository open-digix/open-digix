# Checklist thực hiện GĐ0 — chốt thiết kế DigiX Lab

**Trạng thái:** Chưa bắt đầu nghiệm thu GĐ0. Đây là checklist để thực hiện, không phải biên bản phê duyệt hay bằng chứng đã hoàn thành.  
**Ngày lập:** 11/11/2026. Mốc GĐ0 dự kiến 31/10–02/11 và M1 dự kiến 09/11 đã qua; ghi ngày thực tế, không hồi tố.  
**Người dùng checklist / owner toàn bộ tài liệu GĐ0:** An (theo yêu cầu 14/11/2026). An tự soạn, đối chiếu, cập nhật mọi đầu ra; có thể xin phản hồi kỹ thuật/UX từ Dũng/Tú nhưng không giao họ viết GĐ0. Quyết định tập thể và người triển khai sau GĐ0 vẫn cần cả đội chốt.

## Cách dùng

- Chỉ đánh dấu `[x]` khi có **đầu ra thực tế + liên kết bằng chứng + người review/xác nhận**. Ghi bên cạnh mỗi nhóm: `Ngày thực hiện: … | Bằng chứng: … | Người xác nhận: …`.
- Nếu chưa quyết định được, giữ `[ ]`, ghi **câu hỏi, người chịu trách nhiệm và hạn trả lời** vào biên bản. Không dùng im lặng hoặc tài liệu đề xuất làm bằng chứng đồng ý.
- GĐ0 là cửa **chốt phạm vi, thiết kế, phân công, kế hoạch kiểm thử**. Triển khai và nghiệm thu M1–M4 là công việc tiếp theo; không đánh dấu chúng hoàn tất chỉ vì có sơ đồ hoặc fixture.
- Ưu tiên SRS DigiX Lab **v2.4** và roadmap cập nhật 11/11; SRS DigiX v1.5 dùng để đối chiếu. `docs/delivery/planning/GD0.md` lập 05/11 có một số trạng thái kỹ thuật cũ: kiểm kê lại mã nguồn trước khi sử dụng.

## 1. Chuẩn bị trước cuộc họp bù

**Đầu ra:** Lịch họp, tài liệu gửi trước, bảng hiện trạng ngắn. **Owner tài liệu:** An; hỏi Dũng/Tú để xác minh nếu cần.

- [x] Đặt lịch họp online lúc **16:00 ngày 11/11/2026** (theo thông tin người dùng cung cấp; chưa xác nhận múi giờ, thời lượng, link và người tham dự).
- [x] Cập nhật lịch dự kiến: buổi họp 12/11 chưa diễn ra theo người dùng; **họp online 15:30 ngày 13/11/2026**. Chỉ đánh dấu đã họp khi có thời gian thực tế và biên bản; chưa suy ra An/Dũng/Tú đã xác nhận lịch mới.
- [x] Xác nhận lại link, múi giờ, thời lượng và người tham dự cho lịch 13/11; gửi lại lời mời nếu cần.
- [x] Xác nhận An, Dũng, Tú đã nhận lời; chốt thời lượng 60–90 phút, múi giờ, link họp và người ghi biên bản. Gửi chương trình họp và hạn phản hồi tài liệu trước họp.
- [x] Gửi trước cho cả đội: [SRS v2.4](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), [roadmap](../roadmap.md), [đối chiếu đề](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md), [GĐ0](GD0.md), [ERD/schema](../../engineering/architecture/database-schema.md), thiết kế builder và AI.
- [x] Soạn bảng kiểm kê `hạng mục | đã có trong code | đã thử thật | mới thiết kế | còn thiếu | bằng chứng` tại [tài liệu trước họp §A](GD0-hop-16h-hien-trang-va-quyet-dinh.md#a-kiểm-kê-hiện-trạng-trước-họp). Cần Dũng/Tú/An review và bổ sung bằng chứng máy chung trước khi gọi là đã xác nhận.
- [x] Phân biệt unit/schema, smoke test và E2E tại [tài liệu trước họp §B](GD0-hop-16h-hien-trang-va-quyet-dinh.md#b-thang-bằng-chứng--không-nhầm-unitschema-với-e2e); chưa đánh dấu M1/M2 đạt.
- [x] Liệt kê điểm cần quyết Q1–Q9 và mẫu ghi biên bản tại [tài liệu trước họp §C](GD0-hop-16h-hien-trang-va-quyet-dinh.md#c-câu-hỏi-cần-quyết-trong-họp-q1q9); **chưa có quyết định hay xác nhận của đội**.
- [ ] Gửi tài liệu trước họp cho cả đội, lấy review hiện trạng và ghi lại các điểm sai/thiếu bằng chứng. Chỉ sau khi review mới dùng bảng làm cơ sở chốt quyết định.

**Ngày thực hiện:** … **Bằng chứng:** … **Người xác nhận:** …

## 2. Họp chốt mục tiêu, phạm vi và lịch

**Đầu ra:** Các quyết định có lý do và xác nhận riêng của từng người; bảng bắt buộc/tự chọn/để sau. **Owner ghi chép:** An; cả ba cùng quyết định.

- [ ] Xác nhận SME mục tiêu, giả định quy mô/bộ phận và một ví dụ ẩn danh cho mỗi vấn đề: ốc đảo dữ liệu và phụ thuộc nhà cung cấp (Q1–Q2). Nếu thiếu dữ kiện, giao người/hạn xác minh.
- [ ] Thống nhất câu mô tả sản phẩm: DigiX Lab tạo và vận hành ứng dụng/quy trình khác nhau trên một lõi; mua sắm là **mẫu kiểm chứng**, không phải toàn bộ sản phẩm.
- [ ] Chốt luồng demo mục tiêu: tenant A dựng/chạy mua sắm; tenant B dựng/chạy nghỉ phép từ cùng builder, không viết cứng; đổi v1/v2, truy vết nguồn, từ chối truy cập chéo tenant.
- [ ] Tách **ngưỡng đề thi §3** (SSO, Gateway, dữ liệu cấu trúc/phi cấu trúc, workflow, ít nhất một app UI Tầng 2) khỏi **mục tiêu DigiX/SRS** (builder, hai tenant/hai luồng, H-P-D-I và FR-AI mức A). Bảy lớp là kiến trúc tham chiếu; lập danh sách bằng chứng cho bốn nguyên lý §4 (Q3).
- [ ] Chốt mức A/B/C theo SRS v2.4 và thứ tự lõi → builder → publish/app A → app B/cách ly → AI. Nếu giảm phạm vi, ghi rõ FR/test nào chưa đạt, lý do, người duyệt và việc phải sửa SRS/roadmap; không tự hạ ưu tiên AI hoặc hai tenant.
- [ ] Rà M1 hạn cũ 09/11, M2 16/11 và các phụ thuộc; ghi ngày đạt **thực tế** hoặc lịch điều chỉnh, rủi ro và owner. Xác nhận lại mốc freeze 03/12, gửi bài trước **17:00 06/12/2026** sau khi kiểm tra thông báo BTC mới (Q9).
- [ ] Ghi riêng mọi bất đồng: phương án A/B, người quyết, hạn, tác động lên backlog; không đánh dấu quyết định đã chốt.

**Ngày thực hiện:** … **Biên bản/quyết định:** … **Xác nhận An/Dũng/Tú:** … / … / …

## 3. Chốt luồng người dùng và tiêu chí nghiệm thu

**Đầu ra:** Sơ đồ/bảng luồng UI có vai trò, dữ liệu, trạng thái, lỗi và mã test. **Owner soạn:** An; xin phản hồi từ Tú (UX) và Dũng (nghiệp vụ).

- [ ] Vẽ luồng người thiết kế: tạo app nháp → nhập mô tả gốc/nguồn → xem ánh xạ/điểm thiếu → chỉnh bước, role, form, nhánh → validate → preview → xin publish.
- [ ] Vẽ luồng người vận hành **cho từng app đã xuất bản**: tạo/lưu nháp/gửi hồ sơ → giao việc → duyệt/từ chối → lịch sử/dashboard truy về hồ sơ nguồn; nêu H/P/D/I trong app, không chỉ trên màn hình builder.
- [ ] Vẽ luồng lỗi: thiếu vai trò/nhánh/điều kiện; publish không quyền; submit lặp; tự duyệt; xử lý task đã xong; token hết hạn; người tenant A đọc B; engine/AI không khả dụng.
- [ ] Gắn từng luồng với ca thử dự kiến: TC-BLD-01..03, TC-PUB-01/02, TC-ARC-01..03, TC-TEN-01/02, TC-HPDI-01/02 và TC-LEAVE-01..07. Chỉ định ảnh/log/API response nào cần thu khi triển khai.
- [ ] An gửi bản luồng cho Tú/Dũng góp ý khi cần; tự sửa theo phản hồi, ghi phiên bản và quyết định còn mở. Không ghi đã review nếu chưa có phản hồi.

**Ngày thực hiện:** … **Tài liệu/ảnh:** … **Review:** …

## 4. Chốt kiến trúc và quyết định kỹ thuật nền

**Đầu ra:** Sơ đồ triển khai + trust boundary + bảng quyết định kỹ thuật có phiên bản. **Owner soạn:** An; xin phản hồi từ Dũng/Tú.

- [ ] Vẽ đường đi browser/Next.js → Keycloak/OIDC → Gateway → NestJS → PostgreSQL, kho tệp, workflow; tách thành phần **đã chạy** và **đề xuất/chưa chạy**.
- [ ] Đánh dấu nơi kiểm JWT, resolve identity/membership/role/tenant hiện hành, kiểm quyền bản ghi/file/task, lưu audit và giữ secret. Web/Tầng 3 không nối DB, kho tệp hoặc engine trực tiếp; Gateway không thay kiểm quyền API.
- [ ] Mô tả lỗi và trạng thái bền vững: lỗi giữa DB và workflow, retry/idempotency/đối soát, restart API/Web, publish chỉ thành công sau deploy engine; hồ sơ giữ definition version.
- [ ] Chốt hoặc giao owner/hạn quyết định cho Q4: ORM/query builder, tenant guard và có/không RLS, engine/Flowable, giao thức và cơ chế đối soát. Ghi lý do, phương án loại trừ và tác động vận hành/license; không ngầm duyệt công nghệ chỉ vì nó xuất hiện trên sơ đồ.
- [ ] Review sơ đồ với Dũng/Tú, cập nhật các ranh giới tin cậy và ca thử âm trực tiếp tại API/file/workflow.

**Ngày thực hiện:** … **Sơ đồ/ADR:** … **Review:** …

## 5. Rà ERD, hợp đồng builder và API v1

**Đầu ra:** ERD/schema được rà soát, danh sách migration còn thiếu, API contract v1 có ví dụ. **Owner soạn:** An; xin phản hồi từ Dũng (DB/API), Tú (UI).

- [ ] Rà [schema hiện có](../../engineering/architecture/database-schema.md) với migration thật: tenants, identity/membership/roles, app/version, record, workflow reference, file metadata, audit; ghi bảng, khóa ngoại cùng tenant, trạng thái, chính sách xóa **đã có/chưa có**.
- [ ] Rà [JSON Schema v1](../../reference/schema/digix-app-v1.schema.json), [thiết kế builder](../../engineering/builder/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md) và fixture: lưu mô tả gốc/nguồn; nháp chuẩn hóa có phiên bản; validate ngữ nghĩa; preview không tạo hồ sơ thật; review/publish có quyền; pin version cho hồ sơ.
- [ ] Viết contract cho `/v1/me`, app/draft/validate/preview/publish, records/submit, tasks/decision, file và dashboard. Với mỗi endpoint ghi actor/role, tenant context, request/response mẫu, lỗi 400/401/403/404/409, phân trang và idempotency nếu liên quan. Các endpoint ở roadmap §04 chỉ là gợi ý đường dẫn, không phải API đã có.
- [ ] Thiết kế thử âm tương ứng: tenant khác, role thiếu, bản ghi không thuộc quyền, publish chưa validate, gửi/xử lý lặp. Không tin `tenant_id` hoặc role client gửi; query dùng context được API xác minh.
- [ ] An tự rà auth/Gateway và hỏi Tú xem contract có dùng được cho UI, Dũng xem dữ liệu/API có đúng không; ghi vấn đề chưa chốt thành issue có người và hạn.

**Ngày thực hiện:** … **ERD/contract:** … **Review:** …

## 6. Tạo backlog, DoD và ma trận truy vết

**Đầu ra:** Tracker có issue thật và bảng SRS/đề → mốc → test → bằng chứng. **Owner tài liệu:** An; Dũng/Tú phản hồi nếu cần. Owner **issue triển khai** chốt riêng.

- [ ] Chọn tracker, người có quyền quản trị, quy tắc nhánh/PR, thời hạn review và cách xử lý blocker (Q7). Không ghi là đã thống nhất trước khi cả đội xác nhận.
- [ ] Lập ma trận `FR/NFR/đề §3–4 | lát cắt | M1–M6 | test | bằng chứng | owner | reviewer | trạng thái`. Phân biệt đã có code, đã test, mới có thiết kế và chưa làm.
- [ ] Chia issue theo phụ thuộc: M1 lõi/SSO/Gateway/DB/file/workflow; M2 builder nháp và UI; M3 preview/publish/app A; M4 app B/hai tenant/version; M4b AI go/no-go và regression; M5–M6 release. Mỗi issue có ưu tiên, owner **một người**, reviewer khác người, hạn, điều kiện nghiệm thu, thử âm và link bằng chứng.
- [ ] Chốt Definition of Done: build/test chạy, test quyền và trạng thái âm, code review, tài liệu cập nhật, chạy trên môi trường chung; chỉ tuyên bố setup tái lập khi có kết quả của hai thành viên khác thử độc lập.
- [ ] Chốt ai chứng kiến TC-TEN-01/02, TC-LEAVE-01..07; ai tổng hợp test report, ký go/no-go freeze và gửi bài đúng hạn (Q9).

**Ngày thực hiện:** … **Tracker/ma trận/DoD:** … **Review:** …

## 7. Môi trường, fixture, license, nguồn lực

**Đầu ra:** Kiểm kê máy/chi phí, hướng dẫn setup được thử, kế hoạch seed, bảng license. **Owner soạn và tổng hợp:** An; hỏi Dũng/Tú về seed/luồng UI khi cần. Người chạy thử độc lập không thể được An ký thay.

- [ ] Kiểm kê máy **đang có**: CPU/RAM/SSD, hệ điều hành, Docker/Node, cổng, mạng, nơi chạy, secret/TLS, khả năng chạy cùng các dịch vụ. Con số tham chiếu trong roadmap không phải máy đã được cấp (Q5/Q8).
- [ ] Dùng clone sạch theo README để thử cài, migration và smoke test; lưu commit, máy, lệnh, kết quả và lỗi. Sắp lịch cho **hai thành viên khác** thử độc lập; nếu chưa thử, giữ trạng thái “chưa xác minh tái lập”. Không đưa `.env`, password hoặc token vào repo.
- [ ] Thiết kế seed/reset dữ liệu synthetic cho tenant A/B và vai trò khác nhau; liệt kê case thường, rỗng, biên `days = 3`, không quyền và chéo tenant. Ghi lệnh tạo/reset dự kiến; fixture có sẵn chưa chứng minh seed chạy được.
- [ ] Lập bảng tên/phiên bản/URL giấy phép/nghĩa vụ/phương án thay thế cho Keycloak, Gateway, PostgreSQL, kho tệp, engine, NestJS/Next.js và model/trọng số nếu dùng AI (Q6). Chưa kiểm đúng phiên bản thì để “chưa xác minh”.
- [ ] Kiểm kê chi phí máy/hosting/TLS/backup/GPU, báo giá nếu thuê, tổng trần, nguồn chi và người duyệt. **Không mua/thuê** khi chưa có quyết định; ghi phương án không AI và FR-AI A còn thiếu nếu tắt.

**Ngày thực hiện:** … **Bằng chứng/kiểm kê:** … **Review:** …

## 8. Hoàn tất biên bản, xin xác nhận và cập nhật tài liệu

**Đầu ra:** Biên bản có thể truy lại + SRS/roadmap/backlog nhất quán. **Owner soạn/cập nhật:** An; An, Dũng, Tú tự xác nhận phần quyết định của mình.

- [ ] Ghi biên bản với ngày/giờ/nơi họp thực tế, người dự/vắng, người ghi, từng quyết định, lý do, phương án khác, link tài liệu/issue và nội dung phản đối nếu có.
- [ ] Đi qua Q1–Q9: mỗi câu có **câu trả lời và bằng chứng** hoặc **trạng thái mở + owner + hạn**. Cập nhật bảng phân công owner/reviewer/ngày nhận việc.
- [ ] Gửi biên bản cho An, Dũng, Tú; xin từng người phản hồi rõ “đồng ý” hoặc yêu cầu sửa **kèm ngày/giờ và liên kết**. Không ký hộ, không tính im lặng là phê duyệt.
- [ ] Sửa `docs/delivery/planning/GD0.md` để phản ánh trạng thái thực tế (đặc biệt bảng kỹ thuật từ 05/11), cập nhật roadmap nếu dời mốc, cập nhật SRS v2.4 nếu **được duyệt** thay đổi phạm vi; liên kết các tài liệu với biên bản và issue.
- [ ] Ghi ngày kiểm tra lại và ai theo dõi các câu hỏi mở; công bố trạng thái GĐ0: `đã chốt`, `chốt một phần` hoặc `chưa chốt` kèm các blocker cụ thể.

**Ngày thực hiện:** … **Biên bản/link xác nhận:** … **Trạng thái:** …

## Cửa kết thúc GĐ0 — kiểm tra lần cuối

- [ ] Mục tiêu SME, ngưỡng đề §3, bằng chứng dự kiến cho §4, phần DigiX tự chọn và tiêu chí cắt giảm được **cả ba** xác nhận.
- [ ] Có sơ đồ kiến trúc/trust boundary, ERD, API contract, luồng UI và DoD bản có phiên bản, reviewer và câu hỏi chưa quyết được giao người/hạn.
- [ ] An sở hữu các việc còn mở về **tài liệu** Q1–Q9; tracker/backlog **triển khai** có owner, reviewer, hạn và test/bằng chứng được đội chốt riêng.
- [ ] Máy/chi phí/license/seed được kiểm kê hoặc ghi rủi ro minh bạch; không nhận đã chạy smoke test, AI hay hai tenant khi thiếu bằng chứng.
- [ ] Biên bản có xác nhận **riêng của An, Dũng, Tú** và ngày thực tế; SRS/roadmap được đồng bộ với các quyết định đã duyệt.

**Nếu còn ô nào chưa đạt:** không tuyên bố GĐ0 hoàn tất. Ghi blocker, người xử lý và hạn trong tracker/biên bản rồi kiểm lại.

**Nguồn:** [GĐ0](GD0.md) §4–9 · [Roadmap](../roadmap.md) GĐ0, §03–04 · [SRS DigiX Lab v2.4](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md) §3, §5–6.
