# GĐ0 — Mẫu trả lời Q1–Q9 để thảo luận trong cuộc họp

> Câu trả lời/hạn dưới đây là đề xuất lịch sử cho phạm vi v2.4; cần thảo luận lại theo [roadmap v2.5](../roadmap-v2.5.md) trước khi dùng làm quyết định ERP/CRM. Không sửa hồi tố câu trả lời cũ.

**Soạn cho lịch họp online dự kiến 15:30 ngày 13/11/2026.**
Đây là **phương án đề xuất để đọc, sửa và chốt trong họp**, không phải biên bản, quyết định đã có hiệu lực hoặc lời xác nhận của An, Dũng, Tú.
Mọi hạn dưới đây là **hạn đề nghị**, cần đội thống nhất; nếu không thống nhất, ghi owner và hạn mới.
Không điền hộ ngày/giờ xác nhận.

**Phân công tài liệu cập nhật 14/11:**
An là owner duy nhất của việc soạn/tổng hợp Q1–Q9;
Dũng/Tú chỉ góp ý nếu được hỏi.
Phần xác nhận vẫn cần phản hồi thực tế của từng người, không do An ký thay.
Các hạn dưới đây là đề nghị cũ, chưa được tự động duyệt.

**Cách dùng:**
Đọc phần “Quyết định/phương án” của từng câu, sửa trực tiếp theo ý kiến đội.
Sau họp ghi quyết định cuối cùng, lý do, người nhận việc, hạn thực tế, link issue và câu xác nhận riêng của từng người.
Nếu một mục chưa đủ dữ kiện, giữ trạng thái **MỞ**, không đánh dấu “đã chốt”.

## Q1 — SME mục tiêu

**Quyết định/phương án:**
**Đã đồng ý định hướng theo thông báo của người dùng đại diện nhóm (13/11); chi tiết còn mở.**
Thiết kế cho SME có nhiều bộ phận, ít nhất nhân viên–quản lý và người quản trị ứng dụng.
Dùng **mua sắm tenant A** và **nghỉ phép tenant B** làm hai ca kiểm chứng, không tuyên bố đại diện mọi ngành/SME.
Vẫn cần ví dụ quy trình ẩn danh và xác nhận quy mô/vai trò trước khi đóng luồng nghiệp vụ.

**Lý do/bằng chứng:**
[SRS v2.4](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md) §1–2 nêu mục tiêu SME, hai tenant;
[fixture nghỉ phép](../../examples/leave-app-v1.json) là dữ liệu mẫu, **không phải nghiên cứu người dùng**.
Người dùng báo đội đồng ý Q1; chưa có biên bản, SME/ngành cụ thể hoặc ví dụ thực tế đã ẩn danh trong repo.

**Owner/hạn đề nghị:**
An tự tổng hợp/xác minh chi tiết, xin Dũng/Tú phản hồi nếu cần;
**đề nghị 16/11** phản hồi giả định/ví dụ, hoặc chốt hạn khác trong họp.

**Xác nhận:** Người dùng báo cả đội đồng ý Q1 ngày 13/11; chưa có xác nhận cá nhân và giờ cụ thể của An/Dũng/Tú để ghi. Bổ sung link biên bản/phản hồi khi có.

**Liên kết:** [GD0.md §5](GD0.md); issue/biên bản: **chưa gắn**.

## Q2 — Đo “môi trường chuẩn hóa”

**Quyết định/phương án:** **Đề xuất chốt tiêu chí quan sát:**
một tài khoản đăng nhập SSO và chọn đúng tenant;
Web → Gateway → API có contract;
dựng lại từ source;
hai app khác nhau dùng chung lõi mà không sửa code;
dashboard truy về hồ sơ nguồn.
**MỞ** về ngưỡng đo cụ thể và người chứng kiến.
Không dùng số màn hình hay tên công nghệ làm phép đo thành công.

**Lý do/bằng chứng:** [Roadmap](../roadmap.md) mục luồng demo/M1–M4 và [SRS §5.1](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md). Repo hiện có Gateway/SSO/API nền nhưng chưa có hai app vận hành hay test máy chung đủ ngưỡng. Cần ma trận phép thử–ảnh/log–commit.

**Owner/hạn đề nghị:** An tự viết checklist smoke/E2E, xin phản hồi khi cần; **đề nghị 14/11** thống nhất tiêu chí và hạn chạy thực tế.

**Xác nhận:** An/Dũng/Tú chưa xác nhận; ngày/giờ: —.

**Liên kết:** [Roadmap §04](../roadmap.md); issue: **chưa tạo**.

## Q3 — Phạm vi đề/SRS và bốn nguyên lý

**Quyết định/phương án:** **Đề xuất:** ưu tiên ngưỡng đề §3: lõi headless SSO, Gateway, dữ liệu cấu trúc + tệp, workflow và ít nhất một app UI Tầng 2; lập bằng chứng riêng cho bốn nguyên lý §4. Builder, hai tenant/hai luồng và FR-AI-01..06 là **mục tiêu mức A của SRS DigiX**, không phải danh sách tối thiểu do đề bắt buộc. Nếu thiếu nguồn lực cho AI, tắt AI có kiểm soát và ghi các FR-AI chưa đạt; chỉ đổi phạm vi sau khi cả đội duyệt và sửa SRS/roadmap. **MỞ:** phạm vi cuối cùng và bằng chứng/owner từng nguyên lý.

**Lý do/bằng chứng:** [Đối chiếu đề](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md), [SRS §3, §5–6](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), [roadmap §01](../roadmap.md). Bảy lớp là kiến trúc tham chiếu; hiện chưa có minh chứng đầy đủ.

**Owner/hạn đề nghị:** An tự lập ma trận bắt buộc/tự chọn/bằng chứng; xin đội xác nhận quyết định; **đề nghị 14/11** chốt hoặc ghi các bất đồng.

**Xác nhận:** An/Dũng/Tú chưa xác nhận; ngày/giờ: —.

**Liên kết:** [GD0.md §7](GD0.md); issue: **chưa tạo**.

## Q4 — DB/tenant/workflow

**Quyết định/phương án:** **MỞ — không chọn thay đội.** Tạm giữ truy vấn PostgreSQL hiện có và tenant/role guard trong API; mọi query nghiệp vụ phải lấy tenant từ context đã xác minh, không tin header đơn lẻ. An tự soạn ADR, xin Dũng góp ý kỹ thuật về so sánh query/ORM và có/không RLS; chọn engine/adapter sau khi rà license và khả năng dựng máy. Thiết kế publish/submit cần idempotency và xử lý lệch DB–engine; không giả định có transaction chung.

**Lý do/bằng chứng:** [Schema DB](../../engineering/architecture/database-schema.md) và `apps/api/src/identity/` đã có nền; [thiết kế builder §2](../../engineering/builder/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md) đề xuất Flowable, **chưa chạy engine**. Chưa có test truy cập chéo ở hồ sơ/tệp/task.

**Owner/hạn đề nghị:** An tự viết ADR + ca thử âm, xin Dũng/Tú góp ý kỹ thuật/UI; **đề nghị 15/11** chọn phương án hoặc ghi blocker.

**Xác nhận:** An/Dũng/Tú chưa xác nhận; ngày/giờ: —.

**Liên kết:** [GD0.md §6](GD0.md), [thiết kế builder](../../engineering/builder/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md); issue: **chưa tạo**.

## Q5 — Máy chung và setup độc lập

**Quyết định/phương án:** **MỞ.** Kiểm kê máy thật (CPU/RAM/SSD, Docker, mạng, cổng, secret/TLS). Dựng Compose từ clone sạch, chạy migration/schema verify, smoke Gateway và login `/v1/me`; lập kế hoạch seed synthetic A/B. Chỉ gọi hướng dẫn tái lập được sau khi **hai thành viên khác** tự thử và lưu kết quả. Chọn người thử và máy ngay trong họp, không tự gán tên.

**Lý do/bằng chứng:** `compose.yaml`, `README.md`, `infra/apisix/smoke-test.sh` đã có; ở lần kiểm tra 13/11, **Docker daemon trên máy làm việc chưa chạy**, không có smoke test mới tại máy này. `.env` local có nhưng không đưa secret vào biên bản. Kết quả chạy nơi khác cần log/link riêng.

**Owner/hạn đề nghị:** An tự soạn kiểm kê/kế hoạch và điều phối; hai người thử độc lập nhận việc riêng nếu đồng ý; **đề nghị 14/11** chốt máy, người thử và lịch smoke thực tế.

**Xác nhận:** An/Dũng/Tú chưa xác nhận; ngày/giờ: —.

**Liên kết:** [README.md](../../../README.md), [GD0.md §8](GD0.md); issue/log: **chưa gắn**.

## Q6 — Thể lệ và giấy phép

**Quyết định/phương án:** **MỞ.** An đối chiếu thông báo BTC mới và lập bảng **tên–phiên bản–URL license–nghĩa vụ–phương án thay thế** cho Keycloak, APISIX, PostgreSQL, kho tệp, workflow engine, Next.js/NestJS và model/trọng số nếu bật AI. Không xem một tên công nghệ trong thiết kế là đã duyệt license; không chọn model/thuê GPU trước khi kiểm.

**Lý do/bằng chứng:** [Đối chiếu đề/thể lệ](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md) là bản tham chiếu; repo hiện dùng APISIX và chưa triển khai kho tệp/engine/AI. Chưa có bảng xác minh license đúng phiên bản hoặc thông báo BTC mới trong biên bản GĐ0.

**Owner/hạn đề nghị:** An tự lập bảng license và xin phản hồi nếu cần; **đề nghị 16/11** có bảng phiên bản/license và cập nhật thông báo BTC.

**Xác nhận:** An/Dũng/Tú chưa xác nhận; ngày/giờ: —.

**Liên kết:** [GD0.md §8](GD0.md), [roadmap §03a](../roadmap.md); issue: **chưa tạo**.

## Q7 — Tracker và review

**Quyết định/phương án:** **Đề xuất:** dùng GitHub Issues cho backlog và PR cho review; mỗi issue có ID, ưu tiên, owner **một người**, reviewer khác người, hạn, phụ thuộc, test âm và link bằng chứng. Không merge khi build/test lỗi; thay đổi auth/tenant/schema phải được review chéo. **MỞ:** ai có quyền quản trị repo, hạn phản hồi review, quy tắc nhánh và cách báo blocker; chỉ áp dụng sau khi cả đội đồng ý.

**Lý do/bằng chứng:** [GD0.md §8](GD0.md) chưa chọn tracker; trong repo mới thấy workflow tự gán issue, **không phải bằng chứng quy trình đã chốt**. Cần kiểm quyền repo và công cụ đang dùng thực tế.

**Owner/hạn đề nghị:** An tự soạn quy tắc, cả đội duyệt quyết định; **đề nghị 14/11** chốt tracker/quyền và tạo các issue M1–M2 đầu tiên.

**Xác nhận:** An/Dũng/Tú chưa xác nhận; ngày/giờ: —.

**Liên kết:** [GD0.md §8](GD0.md), [roadmap §03](../roadmap.md); tracker: **chưa xác nhận**.

## Q8 — Máy, chi phí và phương án không AI

**Quyết định/phương án:** **MỞ.** Ưu tiên máy sẵn có; nếu cần thuê, ghi báo giá, trần chi, nguồn chi và người duyệt trước khi chi tiền. Chưa có tài nguyên/model/license/test quyền thì **không bật AI demo**; H/P/D vẫn phải chạy, I báo chưa khả dụng và báo cáo FR-AI A chưa đạt. Không coi dự trù 8 vCPU/16–32 GiB là máy đã mua/cấp.

**Lý do/bằng chứng:** [Roadmap §03a](../roadmap.md) ghi chưa kiểm kê máy/ngân sách; [thiết kế AI](../../engineering/ai/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md) mới ở mức thiết kế. Chưa có kết quả đo tải hoặc quyết định chi trong repo.

**Owner/hạn đề nghị:** An tự tổng hợp kiểm kê/chi phí/điều kiện AI cho hồ sơ GĐ0; việc đo engine/AI và thử UI triển khai sẽ phân công riêng; **đề nghị 16/11** trình phương án và điều kiện go/no-go.

**Xác nhận:** An/Dũng/Tú chưa xác nhận; ngày/giờ: —.

**Liên kết:** [Roadmap §03a](../roadmap.md); issue/báo giá: **chưa có**.

## Q9 — Mốc, người chứng kiến, release

**Quyết định/phương án:** **MỞ, ưu tiên quyết ngay.** GĐ0 và M1 (09/11) đã trễ, M2 đề xuất 16/11 cận hạn; không ghi hồi tố đã đạt. Rà lại đường găng lõi → builder → publish/app A → app B/test tenant; ấn định ngày đạt thực tế và người chứng kiến TC-TEN/TC-LEAVE. Giữ hạn gửi bài **trước 17:00 06/12/2026** trừ khi BTC cập nhật chính thức. Chốt ai ký go/no-go 03/12 và ai chịu trách nhiệm gửi bài; nếu mốc không khả thi, sửa roadmap bằng quyết định có xác nhận.

**Lý do/bằng chứng:** [Roadmap](../roadmap.md) nêu M1 09/11, M2 16/11, M3 23/11, M4 27/11, freeze 03/12; hiện chưa có biên bản đạt mốc. Gateway đã có code nhưng thiếu kho tệp/engine và smoke mới trên máy này; builder/app chưa chạy.

**Owner/hạn đề nghị:** An tự soạn lịch mới và biên bản; đội xác nhận khả năng, người chứng kiến test/release được phân công riêng; **đề nghị chốt ở lần họp tiếp theo**, nếu chưa được thì ghi owner/hạn cụ thể.

**Xác nhận:** An/Dũng/Tú chưa xác nhận; ngày/giờ: —.

**Liên kết:** [Roadmap mốc M1–M6](../roadmap.md), [GD0.md §9](GD0.md); issue/biên bản: **chưa có**.

## Sau khi thảo luận các câu hỏi

1. Với mỗi Q, thay “đề xuất” bằng **quyết định thực tế**, hoặc giữ **MỞ** với owner và hạn được người đó đồng ý; sửa các giả định nào không đúng.
2. Ghi người tham dự, giờ bắt đầu/kết thúc thực tế, người ghi biên bản; xin xác nhận **riêng** của An, Dũng, Tú (ý kiến, ngày-giờ, link). Không tự điền phần xác nhận.
3. Tạo issue thật, gắn link vào từng câu hỏi; cập nhật [GD0.md](GD0.md), [roadmap](../roadmap.md) và SRS nếu phạm vi được cả đội quyết định thay đổi.
4. Chỉ đánh dấu GĐ0 hoàn tất khi đạt cổng kết thúc ở [GD0.md §9](GD0.md); việc đọc bản mẫu này không đồng nghĩa cuộc họp hay quyết định đã diễn ra.
