# GĐ0 — Hồ sơ khởi động, thiết kế nền và phân công (bản đề xuất)

> **Hồ sơ lịch sử theo phạm vi v2.4.** Sau đề xuất ERP/CRM lắp ghép và nhiều app trong tenant, xem [roadmap v2.5](../roadmap-v2.5.md) và [SRS v2.5](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md). Không hồi tố quyết định, phân công hoặc ca thử bên dưới.

> **Trạng thái (05/11/2026):** Đã soạn hồ sơ **đề xuất** GĐ0 để cả đội review; chưa có họp/biên bản, phê duyệt, máy chạy thử hay bằng chứng triển khai. Mốc GĐ0 cũ 31/10–02/11 đã qua, **không** suy ra hoàn tất. Người yêu cầu đồng ý định hướng **không thay thế phê duyệt của An, Dũng, Tú**.  
> **Cập nhật lịch (13/11/2026):** Người dùng cho biết hôm qua (12/11) chưa thể họp và dự kiến họp online **15:30 hôm nay, 13/11/2026**. Chưa có biên bản hay xác nhận quyết định của cả đội trong tài liệu; GĐ0 vẫn **chưa hoàn tất**. Ghi giờ họp thực tế, thành phần tham dự và quyết định sau khi cuộc họp diễn ra; không hồi tố các mốc cũ. Tài liệu chuẩn bị và [checklist GĐ0](GD0-checklist.md) là đầu vào, không phải bằng chứng đã họp.
> **Nguồn:** [SRS DigiX](../../product/requirements/SRS%20DigiX%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), [roadmap](../roadmap.md), [đối chiếu đề/thể lệ](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md), [thiết kế builder](../../engineering/builder/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md), [thiết kế AI](../../engineering/ai/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md).  
> **Phạm vi tài liệu:** Có định hướng và khung đầu ra GĐ0, không phải ERD/API contract triển khai đã duyệt; những việc cần chạy thật, đo hoặc xác minh được đánh dấu rõ.

## 1. Tuyên bố khởi động

**Mục tiêu sản phẩm (nhóm đã cung cấp):** DigiX hỗ trợ chuyển đổi số cho **doanh nghiệp vừa và nhỏ (SME)**. Thay vì chỉ đưa thêm công cụ rời rạc, sản phẩm hướng tới một nền tảng chung để số hóa quy trình, dữ liệu và trách nhiệm vận hành.

**Hai vấn đề nhóm nêu:**

1. **Ảo tưởng công nghệ — ốc đảo dữ liệu:** Mua hoặc triển khai nhiều công cụ nhưng thông tin không liên thông, số liệu không truy về hồ sơ nguồn; quy trình vẫn phải nối thủ công. DigiX cần minh họa luồng nghiệp vụ xuyên suốt và dữ liệu có thể truy vết, không chỉ trình diễn các màn hình riêng lẻ.
2. **Thiếu môi trường chuẩn hóa, phụ thuộc nhà cung cấp:** Mỗi công cụ có cách định danh, trao đổi và vận hành riêng; khó thay thế hoặc mở rộng. DigiX cần minh họa dịch vụ lõi dùng chung, API có phiên bản, khả năng triển khai lại từ mã nguồn và tích hợp qua giao diện rõ ràng. Đây là **định hướng**, chưa phải tuyên bố đã loại bỏ hoàn toàn phụ thuộc nhà cung cấp.

**Nhóm người dùng:** tenant A có nhân viên tạo đề nghị mua, quản lý duyệt và chủ doanh nghiệp theo dõi; tenant B có nhân viên xin nghỉ, quản lý, HR và người có quyền xuất bản ứng dụng. Quản trị nền tảng, kế toán và nhà cung cấp là vai trò liên quan; vai trò nào thực sự xuất hiện trong bản tối thiểu cần cả đội chốt. Nhà phát triển mô-đun là đối tượng tích hợp, không phải người dùng chính của demo.

**Luồng kiểm chứng giá trị (đề xuất):** đăng nhập SSO → tenant A tạo/gửi/duyệt hoặc từ chối đề nghị mua → builder tạo và xuất bản ứng dụng nghỉ phép cho tenant B từ cấu hình có phiên bản → nhân viên B gửi, quản lý/HR xử lý theo nhánh → dashboard, lịch sử và thử truy cập chéo tenant bị chặn. Connector kế toán/kho nếu có **chỉ mô phỏng**, không phải điều kiện để chứng minh lõi. Không viết cứng controller/flow nghỉ phép riêng.

**Ranh giới phạm vi:** Đề §3 yêu cầu lõi headless có SSO, Gateway, dữ liệu cấu trúc/phi cấu trúc, workflow và ít nhất **một** ứng dụng giao diện Tầng 2; builder và hai luồng là mục tiêu DigiX **tự chọn**. Bảy lớp/stack là tham chiếu, không phải bảy sản phẩm bắt buộc; bốn nguyên lý kỹ thuật §4 vẫn cần giải trình và minh chứng. Không thay ERP/kế toán; không nối dịch vụ thương mại thật khi chưa được phép. AI nội bộ là mục tiêu sau khi quyền và hai luồng ổn định, không duyệt hay tự xuất bản; nếu thiếu máy, giấy phép hoặc test thu hồi quyền thì tắt và công bố giới hạn. Cắt phạm vi phải cập nhật SRS/roadmap, không tự nhận đạt mục tiêu hai tenant.

## 2. Đề xuất buổi họp khởi động (60–90 phút)

| Thời lượng | Nội dung | Kết quả phải ghi lại |
| --- | --- | --- |
| 0–10 phút | Xác nhận mục tiêu, SME mục tiêu và hai vấn đề nhóm đã nêu | Một câu mô tả sản phẩm và ví dụ thực tế cho từng vấn đề |
| 10–25 phút | Đi qua luồng demo, vai trò và giới hạn sản phẩm | Luồng chính, nhánh lỗi cần trình diễn, phần không làm |
| 25–45 phút | Đối chiếu đề §3–4, SRS và roadmap; lõi, builder/hai tenant, bốn nguyên lý và hạn nộp | Bảng bắt buộc/tự chọn/để sau và điều kiện cắt phạm vi |
| 45–65 phút | Phân chủ trì từng tài liệu/đầu việc; thống nhất người review chéo | Một owner và người review cho mỗi đầu ra |
| 65–90 phút | Chốt câu hỏi mở, hạn trả lời, cách duyệt và nơi lưu bằng chứng | Biên bản quyết định và danh sách việc có owner/hạn |

**Vai trò trong buổi họp (đề xuất, cần xác nhận):** An điều phối và ghi quyết định; Dũng kiểm tra nghiệp vụ/dữ liệu; Tú kiểm tra luồng thao tác và khả năng demo. Mỗi quyết định liên quan cả đội cần được ba người xác nhận, không suy ra sự đồng ý từ tài liệu này.

## 3. Giả định, ràng buộc và việc cần xác minh

| Loại | Nội dung | Cách xử lý |
| --- | --- | --- |
| Thông tin đã có | SRS chọn Next.js, NestJS; roadmap phân An (platform/security), Dũng (backend/business), Tú (frontend/UX). | Dùng làm cơ sở phân công ban đầu; xác nhận lại ở buổi họp. |
| Giả định cần xác nhận | SME có nhiều bộ phận và ít nhất hai cấp quyền; một doanh nghiệp tương ứng một `tenant_id`. | Dũng xác nhận mô hình dữ liệu và kịch bản mẫu; Tú kiểm tra luồng theo vai trò. |
| Ràng buộc | Dữ liệu doanh nghiệp tách biệt; API kiểm tra quyền, không chỉ ẩn nút trên UI; không dùng dữ liệu cá nhân thật. | An + Dũng chốt cơ chế, đưa ca thử âm vào tiêu chí Done. |
| Ràng buộc | Thành phần phát hành phải đáp ứng yêu cầu giấy phép nguồn mở của cuộc thi; không coi công nghệ tham chiếu là đã được duyệt giấy phép. | An lập bảng kiểm tra đúng phiên bản và nguồn giấy phép trước khi chọn. |
| Ràng buộc tiến độ | GĐ0 cũ 31/10–02/11 chưa có bằng chứng hoàn tất; roadmap đề xuất freeze 03/12, release và email trước **17:00 06/12/2026**, chấm repo 07–09/12, chung kết 10/12 (15 phút tổng). | Họp bù đề xuất trước 09/11; đối chiếu thông báo mới của BTC; không lấy lịch chấm repo làm hạn gửi. |
| Điểm cần chốt | SRS có ưu tiên A cho builder/agent, roadmap đặt cổng khả thi theo máy/quyền; bảy lớp là tham chiếu nhưng bốn nguyên lý §4 vẫn cần bằng chứng. | Cả đội chốt thứ tự/điều kiện AI, kế hoạch chứng cứ §4 và cập nhật SRS nếu giảm phạm vi; không gọi AI là “không bắt buộc” thay cho quyết định phạm vi nội bộ. |

## 4. Phân công chuẩn bị đầu ra GĐ0

**Cập nhật 14/11/2026 theo yêu cầu của An:** An là **owner duy nhất của việc soạn, rà soát nguồn, cập nhật và tổng hợp toàn bộ tài liệu/biên bản GĐ0**, gồm cả các phần kỹ thuật và Q1–Q9. An có thể hỏi Dũng/Tú để kiểm tra tính đúng, nhưng không giao họ việc viết tài liệu GĐ0. Reviewer chỉ phản hồi/xác nhận; quyền quyết định phạm vi và xác nhận của cả đội **không chuyển sang An**. Phân công lập trình, kiểm thử và phát hành ở các giai đoạn sau trong roadmap **không đổi** bởi cập nhật này.

| Đầu việc / đầu ra | Owner đề xuất | Review chéo | Điều kiện chuyển sang “đã chốt” |
| --- | --- | --- | --- |
| Kiến trúc, ranh giới SSO/Gateway/API, triển khai và quyết định công nghệ | An | Dũng, Tú | Có sơ đồ luồng dữ liệu và quyết định kỹ thuật, cả đội xác nhận. |
| ERD, ràng buộc tenant, trạng thái nghiệp vụ và migration dự kiến | An | Dũng (phản hồi kỹ thuật), Tú (luồng UI) | Có quan hệ/khóa/ràng buộc và đối chiếu luồng mua sắm. |
| API contract, lỗi và phân quyền từng endpoint | An | Dũng (API/dữ liệu), Tú (UI) | Request/response và lỗi mẫu khớp ERD và luồng UI. |
| Luồng người dùng, mockup, tiêu chí nghiệm thu cho màn hình | An | Tú (UX), Dũng (nghiệp vụ) | Có luồng thường/luồng lỗi, đúng vai trò và kịch bản demo. |
| Definition of Done và backlog/issue tracker | An | Dũng, Tú | Mỗi issue triển khai có owner, mức ưu tiên, tiêu chí nghiệm thu và cách kiểm thử. |
| Quy tắc nhánh, PR/review, môi trường dev chung và hướng dẫn dựng máy mới | An | Dũng (DB/migration), Tú (frontend) | Có hướng dẫn chạy được; kết quả thử của **ít nhất hai thành viên khác** được ghi nhận, chưa đánh dấu đạt trước khi thử. |
| Tài liệu seed/fixture và cách reset dữ liệu synthetic | An | Dũng (dữ liệu/seed), Tú (demo) | Có kịch bản thường, rỗng, biên, phân quyền; lệnh chạy lặp lại được. |
| Ma trận ngưỡng đề §3, bốn nguyên lý §4, phần tự chọn và bằng chứng | An tổng hợp | Dũng (API/dữ liệu), Tú (UI/demo) | Không gọi bảy stack tham chiếu là bắt buộc; có test/bằng chứng cần thu, giới hạn chưa làm và rủi ro. |
| Danh mục thành phần/giấy phép | An | Dũng, Tú | Xác minh phiên bản, nguồn giấy phép, nghĩa vụ; các mục chưa rõ có phương án thay thế. |
| Tài liệu schema trung gian, validator/compiler Flowable, quyền publish và fixture nghỉ phép | An | Dũng (backend), Tú (UI) | Bám thiết kế builder; nêu rõ trường hợp chưa test thật và liên kết TC-LEAVE-01..07. |
| Máy dev/demo, số đo tải, báo giá/trần chi và kịch bản AI bật/tắt | An | Dũng (DB/workflow/AI), Tú (UI/demo) | Có kiểm kê/nguồn chi/người duyệt và biên bản; không mặc định máy/GPU đã được cấp. |

**Quy ước lưu trữ:** `docs/` là nơi lưu tài liệu GĐ0; tài liệu này là bản khởi động. Có thể thêm sơ đồ, contract, checklist và biên bản riêng trong `docs/` khi được chuẩn bị. Quy tắc đóng góp có thể đặt tại `CONTRIBUTING.md` ở gốc repo; tài liệu này **không thay thế** tracker hoặc quy trình review đã triển khai.

## 5. Câu hỏi còn mở — đưa vào biên bản, không tự chốt

| ID | Câu hỏi cần trả lời | Người đề xuất xác minh | Đầu ra bị ảnh hưởng |
| --- | --- | --- | --- |
| Q1 | SME mục tiêu thuộc loại hình nào, quy mô bao nhiêu người/bộ phận, quy trình mua sắm hiện tại ra sao? Có ví dụ ẩn danh để kiểm chứng hai vấn đề đã nêu không? | An (tổng hợp, lấy phản hồi) | Luồng người dùng, dữ liệu mẫu, tiêu chí nghiệm thu |
| Q2 | “Môi trường chuẩn hóa” cụ thể đo bằng gì ở demo: một lần đăng nhập, API có contract, dựng môi trường từ source, hay khả năng thay connector? | An | Kiến trúc, tiêu chí Done |
| Q3 | Bốn nguyên lý §4 sẽ có bằng chứng nào, phần nào còn thiếu? Builder/hai tenant và AI ưu tiên ra sao; bảy lớp tham chiếu nào chỉ mô tả hoặc để sau? | An (tổng hợp, trình đội quyết định) | Phạm vi, backlog, SRS cập nhật |
| Q4 | Chọn ORM/query builder và cách cưỡng chế tenant ở lớp dữ liệu nào? Workflow tích hợp Flowable và quản lý trạng thái thất bại ra sao? | An (soạn phương án, xin phản hồi kỹ thuật) | ERD, kiến trúc, API |
| Q5 | Quy mô nguồn lực/máy dev, runtime, hệ điều hành hỗ trợ và tài khoản thử theo vai trò là gì? Ai là hai người thử setup độc lập? | An (lập kế hoạch, tìm người thử) | Môi trường chung, hướng dẫn cài, seed |
| Q6 | Đã đối chiếu đề/thể lệ trong tài liệu nguồn; BTC có thông báo mới không? License **đúng phiên bản** của các thành phần, model/trọng số và repo phát hành đã được kiểm chứng chưa? | An | Phạm vi, phát hành nguồn mở |
| Q7 | Dùng công cụ nào làm tracker, quyền quản trị repo thuộc ai, hạn phản hồi review và cách xử lý blocker ra sao? | An (đề xuất, xin đội duyệt) | Backlog, quy trình cộng tác |
| Q8 | Máy dev/demo nào có thật, tài nguyên, báo giá, trần ngân sách, nguồn chi, người duyệt chi và phương án không AI là gì? | An (kiểm kê, xin phê duyệt chi) | Môi trường, kế hoạch AI, lịch |
| Q9 | Ai chứng kiến và lưu bằng chứng kiểm thử hai tenant 27/11, ai ký go/no-go freeze 03/12 và người gửi bài trước 17:00 06/12? | An (lập lịch, xin người nhận việc) | Test report, release, nộp bài |

**Cập nhật Q1 (13/11/2026):** Người dùng thông báo **cả đội đồng ý với phương án Q1** trong [bảng mẫu trả lời](GD0-mau-tra-loi-Q1-Q9.md). Đây là xác nhận cấp nhóm do người dùng cung cấp; chưa có giờ họp, biên bản hoặc phản hồi riêng của An, Dũng, Tú để ghi thay. Chi tiết ngành/quy mô SME và ví dụ quy trình ẩn danh vẫn cần bổ sung trước khi đóng Q1 hoàn toàn. Các Q2–Q9 chưa được xác nhận qua cập nhật này.

**Cách ghi quyết định sau họp:** với mỗi câu hỏi, lưu **quyết định**, **lý do**, **người xác nhận**, **ngày**, **tài liệu/issue cần cập nhật**. Nếu chưa thống nhất, giữ trạng thái “mở” và ấn định người/hạn xử lý; không đổi giả định thành sự thật.

## 6. Kiến trúc và hợp đồng nền — bản thảo cần review

**Ranh giới và dòng dữ liệu:** trình duyệt Next.js (builder + ứng dụng đã xuất bản) → OIDC/Keycloak cấp danh tính → HTTPS/APISIX Gateway → NestJS API (xác thực, quyền tenant/app/bản ghi) → PostgreSQL (bản ghi, cấu hình phiên bản, audit), kho tệp tương thích S3 (tệp có quyền qua API), Flowable (quy trình). Frontend, kể cả server-side Next.js, **không** nối DB/kho tệp hoặc engine trực tiếp; Gateway không thay kiểm quyền tại API. Dữ liệu doanh nghiệp và file chỉ dùng synthetic trong demo. Các thành phần được nêu là **lựa chọn dự kiến**, không phải dịch vụ đã dựng hay giấy phép đã được duyệt.

| Đầu ra thiết kế GĐ0 cần hoàn thiện | Nội dung tối thiểu và phép kiểm | Owner / reviewer đề xuất | Trạng thái |
| --- | --- | --- | --- |
| Sơ đồ triển khai + luồng tin cậy | Actor/token → Gateway → API → DB/tệp/engine; secrets, điểm kiểm tra tenant, sự kiện/audit; sơ đồ mạng và trust boundary | An / Dũng, Tú | Chưa có sơ đồ/đo thử |
| ERD + migration bản đầu | `tenants`, `users`/identity mapping, memberships/roles, `(tenant_id, app_id, version)` của ứng dụng, hồ sơ có tenant + pinned definition, task/audit, metadata tệp; khóa ngoại cùng tenant, khóa duy nhất, trạng thái, chính sách xóa | An / Dũng (phản hồi DB), Tú (UI) | Đối chiếu [ERD/schema đã có](../../engineering/architecture/database-schema.md) với code; chưa coi toàn bộ nghiệp vụ đã triển khai |
| API contract v1 | `/v1/me`, danh sách/tạo/gửi/đọc hồ sơ theo tenant, builder draft/validate/test/publish, task/inbox, upload/download có quyền, dashboard; request/response mẫu, 400/401/403/404/409, phân trang, idempotency và quyền theo vai trò | An / Dũng (API), Tú (UI) | Chưa có OpenAPI hay endpoint nghiệp vụ chạy thật |
| Quy trình publish và chạy | JSON Schema v1 + kiểm tra ngữ nghĩa → compiler BPMN → deploy → chỉ công bố sau deploy thành công; pin version/definition vào hồ sơ; lỗi giữa DB/engine cần đối soát + idempotency; không cho UI tự chọn definition ID | An / Dũng (workflow), Tú (UI) | [Bản thiết kế](../../engineering/builder/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md), chưa chạy thật |
| Bảo mật và dữ liệu | API rút `tenant_id` từ danh tính đã xác thực, không tin client; guard/RLS cần chọn sau Q4; ACL ở metadata tệp + URL ngắn hạn; audit thay quyền/publish/duyệt/truy cập bị từ chối; kiểm dịch tệp cần kế hoạch test | An / Dũng (API), Tú (UI) | Nguyên tắc đề xuất, chưa chứng minh |

**Tiêu chí đóng thiết kế:** mỗi sơ đồ/bảng/schema có phiên bản, tác giả, reviewer, trường hợp âm và liên kết SRS/issue; một mô tả trong tài liệu không được đánh dấu “đã vận hành”. Quyết định ORM, RLS/lớp guard và outbox/đối soát vẫn thuộc Q4, không ngầm chọn công nghệ chưa review.

## 7. Phạm vi, bằng chứng và backlog khởi tạo

| Ưu tiên / hạn theo roadmap (đề xuất) | Lát cắt và bằng chứng cần có | Owner / reviewer đề xuất | Phụ thuộc / trạng thái |
| --- | --- | --- | --- |
| P0 · 09/11 | Lõi SSO + Gateway + NestJS + PostgreSQL/kho tệp + workflow; từ máy sạch đăng nhập, gọi API, migration, lưu tệp đúng quyền | An / Dũng, Tú | Cần máy chung, sơ đồ; chưa triển khai |
| P0 · 16/11 | App UI Tầng 2 mua sắm A chạy E2E, dữ liệu và audit tồn tại sau restart | Dũng (đầu ra chung) / Tú (UI), An (quyền) | Phụ thuộc lõi; chia issue UI riêng cho Tú; chưa chạy |
| P1 · 23/11 | Builder tối thiểu có schema/validator/compiler, quyền review/publish, UI sinh từ mẫu; bản lỗi và bản không quyền bị chặn | Dũng (đầu ra chung) / Tú (UI), An (deploy/quyền) | Thiết kế có sẵn; chia issue UI riêng cho Tú; chưa nghiệm thu |
| P1 · 27/11 | Mua sắm A, nghỉ phép B dựng qua builder; TC-LEAVE-01..07, TC-TEN-01/02, thử đọc/sửa chéo UI và API, file, task, dashboard | Dũng (seed/test) / An (quyền), Tú (UI) | Cần builder + seed; chưa có test report |
| P0 · 30/11–03/12 | Regression máy sạch, backup/restore, kiểm tra bí mật/license; RC, biên bản go/no-go freeze với blocker và phạm vi thực tế | An / Dũng, Tú | Chưa có bằng chứng |
| P0 · trước 17:00 06/12 | LICENSE OSI-approved, README build từ source, changelog/tracker, release có phiên bản **trước email nộp**, bằng chứng gửi | An / Dũng (build), Tú (demo) | Cần xác minh license/đề; chưa nộp |
| P2 · chỉ sau cổng lõi/quyền | Agent nội bộ theo ngữ cảnh, connector/portal, bảy lớp nâng cao; thử giấy phép/tài nguyên, thu hồi quyền AI với worker dừng rồi mới bật | Dũng (đầu ra AI) / An (máy/license), Tú (UI) | Chưa cam kết làm; nếu thiếu điều kiện phải ghi rõ giới hạn |

**Bốn nguyên lý Đề §4:** (1) vòng đời/tốc độ dữ liệu: ghi nhận xử lý nền không chặn giao dịch, cần đo; (2) IT/OT: chưa có OT thật, dữ liệu mô phỏng phải gắn nhãn và nêu khoảng trống; (3) nguồn gốc/chất lượng: dashboard truy về hồ sơ, validation và bằng chứng lỗi dữ liệu; (4) Zero-Trust/GitOps/kiểm dịch: test truy cập trái quyền, cấu hình/pipeline có phiên bản, thử tệp không an toàn nếu triển khai quét. An tổng hợp bảng chứng cứ, Dũng/Tú review; **không** đánh dấu nguyên lý nào đã đạt khi chỉ có mô tả. Đối chiếu chi tiết từng lớp ở [tài liệu đề](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md).

## 8. Cộng tác, môi trường và tài nguyên cần xác minh

- **Tracker chưa chọn:** An tạo backlog khi cả đội thống nhất công cụ/quyền quản trị. Mỗi issue: ID, mức P0/P1/P2, owner + reviewer khác người, phụ thuộc, hạn, tiêu chí nghiệm thu, test âm, liên kết PR/bằng chứng và trạng thái `đề xuất → nhận việc → review → đã nghiệm thu`. Hạn phản hồi review và người xử lý blocker chốt ở Q7; không lập issue giả rồi đánh dấu xong.
- **Tích hợp:** nhánh theo issue, PR có cách test; auth/tenant/schema cần reviewer khác. Dũng + Tú thống nhất OpenAPI/fixture trước UI; An review đường đi Gateway và secret. Không merge khi build/test lỗi; thay đổi sát freeze cần regression. DoD: chạy trên môi trường chung, test quyền/validation/trạng thái, PR review, tài liệu và bằng chứng; hai người khác thử hướng dẫn setup độc lập trước khi gọi là tái lập được.
- **Máy và ngân sách:** theo [roadmap §03a](../roadmap.md), dự trù tham chiếu máy dev 8 vCPU, 16–32 GiB RAM, SSD ≥100 GiB **chưa kiểm kê**, không phải yêu cầu đã duyệt. An ghi cấu hình máy có sẵn, nơi chạy, cách cấp TLS/secret, chi phí máy/hosting/tên miền/backup và hai báo giá nếu phải thuê; Dũng đo DB/engine, Tú thử UI. Model AI/GPU chỉ chọn sau đo tải, license và thử thu hồi quyền; chưa có trần chi, nguồn chi hay người duyệt thì **không** mua/thuê.
- **Seed và test account trong hồ sơ GĐ0:** An tự viết kế hoạch dữ liệu synthetic tenant A/B, vai trò, nhánh `days = 3`, cách reset, kiểm secret và phép thử chéo tenant; mời Dũng/Tú phản hồi nếu cần. Owner viết seed/chạy test ở giai đoạn triển khai vẫn do đội chốt riêng; kế hoạch GĐ0 không chứng minh seed đã chạy. Không đưa mật khẩu/tokens vào repo.
- **Giấy phép:** An lập SBOM/danh mục tên, phiên bản, URL giấy phép và nghĩa vụ của Keycloak, APISIX, Flowable, kho tệp S3, PostgreSQL, Next.js, NestJS, pgvector (nếu dùng), model/trọng số (nếu bật); Dũng/Tú review khả năng thay thế. Chỉ phát hành khi kiểm tương thích giấy phép, LICENSE OSI-approved, repo và release đúng hạn; chưa có bảng kiểm tra hoàn tất.

## 9. Biên bản và cổng kết thúc GĐ0 (điền sau họp thật)

- **Lịch dự kiến:** Họp online 15:30 ngày 13/11/2026 (theo người dùng; link, múi giờ và người tham dự chưa ghi tại đây). **Ngày/giờ họp thực tế, địa điểm hoặc liên kết:** Chưa ghi.
- **Tham dự/vắng mặt:** Chưa ghi.
- **Người điều phối, người ghi biên bản:** Chưa xác nhận.
- **Mục tiêu và nhóm người dùng được xác nhận/chỉnh sửa:** Chưa xác nhận.
- **Các quyết định (kèm lý do và người đồng ý):** Chưa ghi.
- **Câu hỏi chưa giải quyết (ID Q1–Q9, owner, hạn):** An tổng hợp/xác minh và ghi các phương án còn mở; hạn thực tế chưa được chốt.
- **Đầu việc tiếp theo (đầu ra, owner, reviewer, hạn, liên kết issue):** An nhận toàn bộ phần viết tài liệu GĐ0; owner triển khai và hạn/issue giai đoạn sau vẫn cần đội chốt.
- **Thời điểm kiểm tra lại và nơi lưu bằng chứng:** Chưa chốt.

| Quyết định phải ghi trong biên bản | Phương án đang đề xuất | Người xác nhận bắt buộc | Ngày chốt thực tế / bằng chứng |
| --- | --- | --- | --- |
| Mục tiêu SME, phạm vi lõi/tự chọn, hai luồng và tiêu chí cắt giảm | §1, §7; có danh sách phần không làm và cập nhật SRS nếu cắt | An, Dũng, Tú | Chưa có / chưa có |
| Kiến trúc, ERD/API, tenant guard, workflow và license | §6, §8; lựa chọn kỹ thuật còn mở ở Q4/Q6 | An, Dũng, Tú | Chưa có / chưa có |
| Owner/reviewer, tracker, máy chủ, trần ngân sách và người duyệt chi | §4, §8; không có cam kết mua sắm | An, Dũng, Tú | Chưa có / chưa có |
| Mốc hai tenant 27/11, freeze 03/12, gửi bài trước 17:00 06/12 | Roadmap §01–04; phải đối chiếu khả năng thực hiện | An, Dũng, Tú | Chưa có / chưa có |

**Cách chốt:** An gửi biên bản/đường dẫn cho Dũng và Tú; mỗi người ghi rõ “đồng ý” hoặc nội dung cần sửa, kèm ngày giờ và liên kết có thể truy lại. Chỉ chuyển từng quyết định sang **đã chốt** sau khi có đủ ba xác nhận; người tổng hợp không ký thay. Nếu có bất đồng, ghi phương án, người xử lý, hạn trả lời, không bỏ trống rồi mặc nhiên chấp thuận. Ngày biên soạn 05/11 hoặc đồng ý định hướng từ người yêu cầu **không** phải ngày chốt của đội.

**Cổng kết thúc GĐ0:** (1) mục tiêu/SME và ví dụ cho hai vấn đề được cả đội xác nhận; (2) phạm vi §3/§4 và mức tự chọn được chốt, thay đổi phản ánh vào SRS/roadmap; (3) An hoàn thiện mọi đầu ra tài liệu §4, lấy phản hồi chuyên môn cần thiết; Q1–Q9 được trả lời hoặc còn mở với An theo dõi/hạn, còn các issue **triển khai** có owner/reviewer/hạn riêng do đội thống nhất; (4) sơ đồ/ERD/contract/DoD có bản để review, máy/chi phí được kiểm kê hoặc ghi rủi ro; (5) biên bản ghi đủ người xác nhận, ngày chốt và bằng chứng. **Hiện tại: chưa đạt cổng kết thúc**; việc An nhận tài liệu không thay thế bằng chứng thực nghiệm hay phê duyệt của cả đội.
