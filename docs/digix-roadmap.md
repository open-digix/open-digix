---
author: DigiX Team
date: 11/11/2026
title: DigiX Lab --- Roadmap triển khai theo SRS v2.4 (đề xuất chờ duyệt)
---

# DIGIX LAB --- ROADMAP TRIỂN KHAI DỰ ÁN

## Hướng tới vòng thi quốc gia \| 11/11/2026 -- 10/12/2026

**Căn cứ:** [SRS DigiX Lab v2.4](SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md),
đặc biệt FR-CORE, FR-BLD, FR-WRK, FR-L3, FR-AI và mục 5–6. SRS DigiX
v1.5 chỉ là bản kế thừa để đối chiếu, không còn lấy mua sắm làm sản phẩm
định nghĩa toàn bộ nền tảng. Mức A/B/C là cam kết **đề xuất của DigiX**,
không phải danh sách bắt buộc của đề thi.

**Trạng thái (11/11/2026):** Đã đồng bộ nội dung kế hoạch với SRS v2.4;
bản kế hoạch vẫn là đề xuất để An, Dũng, Tú review;
chưa có biên bản phê duyệt của cả đội. Mốc đã qua là kế hoạch, không phải
bằng chứng đã hoàn tất. Người yêu cầu đồng ý định hướng trong SRS **không
thay thế** việc cả đội phê duyệt phạm vi, người phụ trách, nguồn lực và lịch.
M1 (09/11) đã quá hạn đề xuất: cần kiểm chứng và ghi lại ngày đạt thực tế
hoặc điều chỉnh lịch sau khi họp; không hồi tố.

**Mục tiêu đề xuất:** Hoàn tất tính năng trước **03/12/2026**, dành 04–06/12
cho kiểm thử, đóng gói, phát hành và gửi bài **trước 17:00 06/12/2026**.

> Theo [đối chiếu đề chính thức](OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md):
> hạn gửi bài 17:00 06/12, chấm repo/PoF dự kiến 07–09/12 và chung kết
> 10/12/2026 (15 phút tổng trình bày). An theo dõi thông báo BTC; lịch
> nội bộ phải điều chỉnh nếu thông báo mới thay đổi hạn.

## Định hướng điều hành

-   Ưu tiên **luồng nghiệp vụ chạy xuyên suốt**, thay vì nhiều module
    rời rạc.
-   Mỗi lớp kiến trúc có **tính năng tối thiểu + cách kiểm thử + bằng
    chứng**.
-   Ngưỡng đề §3: lõi headless gồm SSO, Gateway, dữ liệu cấu trúc/phi cấu
    trúc, workflow và ít nhất một ứng dụng có UI Tầng 2. Builder, hai
    tenant/hai luồng, Tầng 3 và agent là mục tiêu DigiX tự chọn; bảy lớp
    là kiến trúc tham chiếu, không phải bảy stack bắt buộc. Chứng minh
    bốn nguyên lý §4 bằng bằng chứng cụ thể.
-   Sản phẩm cần kiểm chứng là **khả năng tạo và vận hành ứng dụng khác
    nhau cho hai doanh nghiệp trên cùng lõi**, không phải một app mua sắm
    viết cứng. Thứ tự ưu tiên: lõi tenant/quyền/workflow → builder tối
    thiểu (nhập mô tả, chuẩn hóa, chỉnh tay) → chạy thử/xuất bản ứng dụng
    → mua sắm A và nghỉ phép B → kiểm thử cách ly/phiên bản → agent nội
    bộ → phần nâng cao. Có thể chuẩn bị fixture mua sắm song song với
    builder nhưng không đánh dấu E2E là sản phẩm Lab khi chưa chạy qua
    luồng xuất bản. Nếu phải giảm phạm vi, vẫn
    giữ lõi + một app Tầng 2 chạy thật; cập nhật SRS và trình bày trung
    thực, không tuyên bố đã đạt mục tiêu hai tenant khi chưa kiểm chứng.
-   FR-AI-01..06 được SRS v2.4 xếp **A** cho lát cắt DigiX Lab, dù không
    thuộc ngưỡng tối thiểu của đề. Chỉ bật trợ lý sau khi kiểm thử quyền,
    nguồn, thu hồi và máy/license; nếu chưa đạt, I hiện “chưa có nguồn/AI
    không khả dụng”, H/P/D vẫn chạy, ghi rõ các FR-AI chưa đạt và trình
    cả đội quyết định điều chỉnh SRS/phạm vi. Không tự coi AI là hoàn tất.
-   Sau 03/12 không phát triển tính năng mới; tuần cuối dành cho ổn
    định, kiểm thử, đóng gói và luyện demo.

------------------------------------------------------------------------

# 01. Tổng quan & tiêu chí thành công

## Các mốc kiểm soát chính

  ------------------------------------------------------------------------
  Mốc                                   Hạn đề xuất Điều kiện đạt / bằng chứng
  ------------------------------------ ----------- -------------------------
  M1 --- Lõi và môi trường chung        09/11       SSO, Gateway, API tenant
                                                 guard, DB/kho tệp và
                                                 workflow dựng từ source;
                                                 smoke test trên máy chung.

  M2 --- Builder tối thiểu              16/11       Nhập mô tả gốc, ánh xạ
                                                 về nguồn, chuẩn hóa/chỉnh
                                                 tay; schema và validator;
                                                 fixture mua sắm ở bản nháp.

  M3 --- Xuất bản và chạy app A          23/11       Preview/test, compiler,
                                                 review/publish có quyền;
                                                 app mua sắm chạy E2E từ
                                                 định nghĩa qua Gateway,
                                                 workflow và audit.

  M4 --- Hai tenant và kiểm thử âm       27/11       Mua sắm A, nghỉ phép B
                                                 (TC-LEAVE-01..07), TC-TEN-01/02;
                                                 v1/v2 giữ hồ sơ cũ; chứng
                                                 cứ UI/API/tệp/workflow.

  M4b --- Hồi quy/tích hợp              30/11       Chạy lại từ môi trường
                                                 sạch; chốt blocker, quyền,
                                                 backup/restore và AI go/no-go
                                                 theo FR-AI/TC-AI.

  M5 --- Feature freeze                 03/12       Không còn blocker bảo mật
                                                 hay nghiệp vụ cốt lõi; RC,
                                                 test report và danh sách
                                                 phần chưa đạt được ghi rõ.

  M6 --- Release và gửi bài             06/12       Release có phiên bản,
                                       trước     README/LICENSE/CHANGELOG,
                                       17:00     build từ source, email
                                                 đúng mẫu và bằng chứng gửi.

  M7 --- Chấm repo / PoF                07–09/12   Cài từ tài liệu được;
                                                 demo, tài khoản mẫu và
                                                 minh chứng sẵn sàng.

  M8 --- Chung kết                      10/12       Tổng trình bày 15 phút
                                                 bao gồm demo, giải pháp,
                                                 giới hạn và định hướng.
  ------------------------------------------------------------------------

## Luồng demo cốt lõi

**SSO → tenant A nhập mô tả, chuẩn hóa/chỉnh tay và xuất bản mẫu mua sắm
v1 → tạo/gửi/duyệt/từ chối → tenant B nhập mô tả nghỉ phép, cấu hình
nhánh, chạy thử và xuất bản v1 từ cùng builder → nhân viên B gửi,
manager/HR B duyệt → xuất bản v2, chứng minh hồ sơ v1 còn theo v1 →
dashboard truy về nguồn; thử truy cập chéo tenant và bị từ chối.**

Trong **từng ứng dụng sau xuất bản** phải thể hiện H (vai trò/việc), P
(bước và trạng thái workflow), D (hồ sơ/chỉ số có nguồn), I (trợ lý theo
ngữ cảnh hoặc trạng thái không khả dụng). Không trình bày builder như thể
đó đã là trải nghiệm vận hành của ứng dụng.

Agent/RAG nội bộ là lát cắt A cần lập kế hoạch sau khi hai luồng và quyền ổn định, chỉ
được demo nếu kiểm quyền nguồn khi thu hồi, cô lập app/tenant, tài nguyên
và giấy phép đã được thử thật; không được có quyền phê duyệt/xuất bản.
Nếu chưa đạt, ghi trạng thái I chưa có nguồn, liệt kê FR-AI chưa đạt và
xin quyết định phạm vi, không giả vờ có AI hoạt động.

------------------------------------------------------------------------

# 02. Kế hoạch theo giai đoạn

## GĐ0 · Chốt thiết kế --- 31/10--02/11

**Phụ trách:** Cả đội

**Trạng thái:** Mốc dự kiến đã qua; [GĐ0](GD0.md) vẫn là bản chuẩn bị
họp, chưa có chứng cứ họp/chốt. Cần họp bù, rà lại các hạn 09/11 và
16/11 rồi ghi biên bản trước khi coi phạm vi, phân công hay máy chủ đã
được duyệt.

-   Chốt kiến trúc, ERD, API contract, luồng người dùng và tiêu chí
    Done.
-   Tạo issue tracker, quy tắc nhánh Git, môi trường dev chung và dữ
    liệu giả lập.
-   Chốt phạm vi tối thiểu cho 7 lớp; kiểm tra giấy phép các thành phần
    dự kiến.

**Đầu ra:** Kiến trúc + ERD + API contract + backlog ưu tiên.

## GĐ1 · Nền tảng & SSO --- 03/11--09/11

**Phụ trách:** An + Dũng + Tú

-   **An:** Docker Compose, Keycloak/OIDC, APISIX, biến môi trường,
    logging cơ bản.
-   **Dũng:** NestJS, PostgreSQL migration, guard/tenant checks,
    endpoint `/me`.
-   **Tú:** Khung Next.js, màn hình đăng nhập, layout, trạng thái
    loading/error.

**Điều kiện hoàn tất:** Đăng nhập được; frontend gọi API qua Gateway; DB
khởi tạo từ đầu được.

## GĐ2 · Builder tối thiểu và bản nháp mẫu --- 10/11--16/11

**Phụ trách đề xuất:** Dũng (schema/compiler), Tú (UX), An (quyền)

-   **Dũng:** API dự án ứng dụng/nháp theo tenant; lưu mô tả quy trình
    gốc và nguồn, ánh xạ sang schema trung gian có phiên bản (bước, vai
    trò, điều kiện, dữ liệu, ngoại lệ), đánh dấu dữ liệu thiếu/mâu thuẫn;
    validator chặn nhánh vô đích, vai trò thiếu, trường bắt buộc sai.
-   **Tú:** Trình nhập mô tả có cấu trúc, hiển thị ánh xạ về nguồn và
    điểm chưa rõ; biên tập thủ công vai trò, biểu mẫu, bước, tuyến xử lý;
    nhãn rõ nháp/chạy thử/đã xuất bản. Không phụ thuộc AI để chỉnh nháp.
-   **An:** Quyền designer/publisher trên API và audit nháp/sửa quyền;
    kiểm tra tenant guard. Chuẩn bị mẫu mua sắm thành nháp riêng của A,
    không ghi cứng ngưỡng duyệt vào lõi hoặc xuất bản tự động.

**Điều kiện hoàn tất:** TC-BLD-01..03: nháp gắn nguồn, chỉnh được khi
AI tắt và báo lỗi cấu hình; mẫu chỉ tạo nháp trong tenant. Có kết quả
kiểm thử/ảnh/API, không coi fixture là ứng dụng đã chạy.

Đây là nền tảng cho **ứng dụng Tầng 2 đầu tiên** ở GĐ3, không thay thế
kiểm thử nghỉ phép tenant B ở GĐ4.

## GĐ3 · Chạy thử, xuất bản và vận hành app A --- 17/11--23/11

-   Dũng: compiler sang workflow engine, chạy thử bằng dữ liệu mẫu;
    API review/diff/publish có quyền, phiên bản bất biến, pin phiên bản
    workflow vào hồ sơ; xử lý gửi lặp, trạng thái bền vững, approve/reject
    có lý do, chặn tự duyệt/xử lý lại. Mẫu mua sắm A chạy từ cấu hình,
    không lấy controller mua sắm viết cứng làm bằng chứng tính tổng quát.
-   Tú: UI chạy thử và ứng dụng sinh từ mẫu danh sách, biểu mẫu, chi
    tiết, hộp việc, lịch sử, dashboard. Ứng dụng đã xuất bản hiển thị
    H/P/D/I; khi chưa có nguồn AI, I báo rõ chưa khả dụng.
-   An: triển khai, SSO/Gateway, kiểm tra hợp đồng ba tầng trước publish
    (Tầng 3 tùy chọn, không có Gateway/SSO riêng), audit ai review/xuất
    bản, quyền truy cập tệp và giấy phép engine/dependency.

**Điều kiện hoàn tất:** TC-PUB-01, TC-ARC-01..03 và TC-AUD-01: nháp
không chạy thật, chỉ người có quyền được publish sau chạy thử; app A từ
cấu hình tạo/gửi/duyệt/từ chối E2E qua Gateway/API/workflow và lưu audit.
Chưa coi TC-PUB-02 (v1/v2 đang chạy) đạt cho tới khi thử ở GĐ4. Không
đòi kéo-thả bố cục hay sinh toàn bộ mã nguồn.

## GĐ4 · Hai tenant, tích hợp & hardening --- 24/11--30/11

**Phụ trách:** Cả đội

-   Trước **27/11**: tenant A mua sắm; tenant B nghỉ phép dựng từ JSON v1
    qua luồng nhập/chỉnh/preview/publish của builder, không có controller/flow
    nghỉ phép viết cứng. Chạy
    [TC-LEAVE-01..07](DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md),
    TC-TEN-01/02, cả nhánh dưới/đúng 3 ngày và thử manager A đọc B.
-   Xuất bản v2 sau thay đổi điều kiện của ít nhất một app; hồ sơ v1 đang
    chạy giữ v1, hồ sơ mới theo v2, tenant kia không bị ảnh hưởng;
    kiểm tra lịch sử và khả năng chọn lại bản trước có kiểm soát. Kiểm
    TC-PUB-02, TC-HPDI-01/02 trên **cả hai app**, dashboard truy được
    hồ sơ gốc (TC-DAT-01).
-   Trước **30/11**: kiểm thử quyền trực tiếp tại API, tệp, workflow,
    dashboard, UI và audit; reset seed, cài từ máy sạch; lưu test report.
-   Connector mô phỏng, supplier portal và bảy lớp nâng cao chỉ nhận sau
    khi các cửa kiểm tra lõi/builder/hai tenant đạt; agent (A theo SRS,
    không thuộc ngưỡng tối thiểu của đề) cần đánh giá khả thi song song,
    chỉ tích hợp/demo sau khi quyền và nguồn được kiểm thử.
-   AI nếu bật: chạy TC-AI-REV-01..04, TC-AI-ISO-01, TC-AI-OFF-01 trên
    máy thật với quyền bị thu hồi khi worker tạm dừng; thiếu bằng chứng
    hoặc máy/giấy phép thì tắt AI, giữ luồng H/P/D và báo rõ FR-AI còn
    thiếu so với lát cắt A của SRS. Nếu bật, chỉ nạp nguồn được chọn,
    kiểm quyền hiện hành theo tenant/app/version cả trước khi trả lời;
    AI chỉ gợi ý nháp, không tự xuất bản hay tự duyệt. An/Dũng đánh giá
    model, chất lượng tiếng Việt, license, tài nguyên và retention trước
    khi quyết định; không dùng AI ngoài trong demo.

**Điều kiện hoàn tất:** Hai ứng dụng khác nhau chạy trên cùng lõi, có
bằng chứng cô lập tenant, version v1/v2, H/P/D/I và báo cáo lỗi còn mở;
không còn lỗi nghiêm trọng về nghiệp vụ hoặc phân quyền. AI chỉ ghi đạt
những FR/TC đã được kiểm thật, không lấy trạng thái I tắt thay cho AI A.

## GĐ5 · Feature freeze & release candidate --- 01/12--03/12

**Phụ trách:** An điều phối release

-   Đóng băng tính năng; chỉ sửa blocker và lỗi làm hỏng demo.
-   So SRS v2.4 với bằng chứng FR-CORE/BLD/WRK/L3/AI; ghi riêng tính
    năng A chưa đạt, quyết định thay đổi phạm vi bằng biên bản và cập
    nhật SRS trước khi trình bày, không ngầm hạ AI hay hai tenant xuống C.
-   Hoàn thiện README, hướng dẫn cài đặt, LICENSE, CHANGELOG,
    version/release và bug tracker.
-   Chuẩn bị tài khoản theo vai trò, dữ liệu synthetic, test report,
    ảnh/log minh chứng.

**Điều kiện hoàn tất:** Release candidate chạy được từ môi trường sạch;
không nhận tính năng mới. An lập biên bản go/no-go ngày **03/12**;
Dũng và Tú review bằng chứng, cả ba xác nhận hoặc ghi rõ blocker/điều
chỉnh phạm vi. Chưa có xác nhận thì mốc vẫn ở trạng thái chờ.

## GĐ6 · Regression, release & gửi bài --- 04/12--06/12 trước 17:00

**Phụ trách:** Cả đội

-   Cài mới từ source theo README; thử backup/restore; kiểm tra cấu hình
    không chứa secret.
-   Chạy lại bộ test: thiếu tài liệu, duyệt nhiều cấp, tenant isolation,
    quyền partner nếu có, version đang chạy và quyền AI bị thu hồi nếu
    bật; nếu tắt AI, kiểm TC-HPDI-02/TC-AI-OFF-01 và công bố giới hạn.
-   Chốt slide, kịch bản, video dự phòng/screenshot và checklist PoF.
-   An đối chiếu thể lệ và chuẩn bị email theo mẫu; Dũng review bản build,
    migration/test report; Tú review demo/ảnh và tài khoản. Phát hành
    release có phiên bản **trước** khi gửi email tới địa chỉ trong đề;
    lưu dấu thời gian release và bằng chứng gửi trước hạn.

**Điều kiện hoàn tất:** Chỉ sửa lỗi; mọi thay đổi phải qua review và
regression test. Không dời hạn gửi sang đợt chấm repo 07–09/12.

## GĐ7 · PoF & thuyết trình --- 07/12--10/12

**Phụ trách:** Cả đội

-   **07--09/12:** PoF/source-code review; ưu tiên ổn định, tài liệu và
    trả lời câu hỏi.
-   Luyện demo bấm giờ, chuẩn bị môi trường dự phòng; không refactor
    lớn.
-   **10/12:** Tổng thời gian trình bày **15 phút**; 10–12 phút demo
    chỉ là phần nội bộ, phải dành thời gian giải thích giải pháp và kết luận.

**Điều kiện hoàn tất:** Demo ổn định, phân vai nói rõ, mỗi thành viên
hiểu kiến trúc và trade-off.

------------------------------------------------------------------------

# 03. Phân chia công việc công bằng

Nguyên tắc: mỗi hạng mục có một người chịu trách nhiệm chính
(**owner**); phần giao nhau phải có review chéo. Cân bằng theo năng lực
và khối lượng, không chỉ đếm số đầu việc. Bảng dưới là **đề xuất giao
việc**, không phải việc An/Dũng/Tú đã nhận hoặc đã review.

| Đầu ra / hạn đề xuất | Owner đề xuất | Reviewer đề xuất | Bằng chứng giao việc/hoàn tất |
| --- | --- | --- | --- |
| GĐ0: kiến trúc, backlog, phạm vi & biên bản; họp bù sớm nhất có thể | An | Dũng, Tú | Quyết định + lý do + xác nhận/ngày của cả ba; điều chỉnh hạn đã qua, cập nhật SRS nếu cắt phạm vi |
| M1: SSO/Gateway, máy chung, kho tệp, workflow, CI/setup; hạn cũ 09/11 | An | Dũng (API/DB), Tú (UI/setup) | Smoke test và hai người thử setup độc lập; ghi ngày đạt thực tế |
| M2: schema, mô tả nguồn, chuẩn hóa/chỉnh tay, validator và API nháp; 16/11 | Dũng | An (tenant/quyền), Tú (hợp đồng UI) | TC-BLD-01..03, fixture hợp lệ/lỗi, test API trực tiếp |
| M2: UI nhập mô tả, ánh xạ nguồn, trình biên tập; 16/11 | Tú | Dũng (schema), An (quyền) | Demo sửa nháp khi AI tắt, báo trường/nhánh thiếu |
| M3: compiler, chạy thử, publish guard & pin version; app mua sắm A E2E; 23/11 | Dũng | An (isolation/deploy), Tú (runtime UI) | TC-PUB-01, TC-ARC-01..03, audit, test không quyền |
| M3: UI preview và mẫu UI ứng dụng H/P/D/I; 23/11 | Tú | Dũng (contract), An (quyền) | App A chạy từ cấu hình qua Gateway, không chỉ mockup builder |
| M4: hai tenant, app B không code cứng, v1/v2, TC-LEAVE/TEN/HPDI; 27/11 | Dũng | Tú (UI/nhánh), An (API/policy) | Test report có kết quả âm, hồ sơ giữ version và link log/ảnh |
| M4b: kiểm thử tích hợp, máy sạch, AI go/no-go theo FR-AI; 30/11 | An | Dũng (backend/AI), Tú (demo) | Chi phí, license, quyền thu hồi/nguồn; quyết định bật/tắt và FR-AI chưa đạt |
| M5–M6: RC, freeze, release, gửi bài; 03–06/12 | An | Dũng (build/test), Tú (demo/tài liệu) | Biên bản go/no-go, tag/release và bằng chứng email |

**Điểm kiểm soát phê duyệt (chưa chốt):** An mời họp, ghi biên bản và
đường dẫn issue; Dũng, Tú và An mỗi người xác nhận phạm vi SRS v2.4,
owner/reviewer, máy chủ/ngân sách, lịch builder → hai tenant → AI và
freeze. Người tổng hợp **An** không
được tự thay hai chữ xác nhận còn lại. **Ngày chốt thực tế: chưa có**;
điền ngày/giờ và liên kết biên bản sau họp, không hồi tố ngày 02/11 hay
coi ngày biên soạn roadmap là ngày ký duyệt. Hạn họp bù cũ **trước
09/11/2026** đã qua; đề nghị họp ngay, ghi ngày thực tế và lập lịch mới
cho các mốc bị ảnh hưởng. Nếu chưa họp, đánh dấu mốc chờ duyệt và báo
rủi ro lịch.

| Người cần xác nhận | Vai trò xác nhận | Ngày/giờ xác nhận thực tế | Dẫn chứng |
| --- | --- | --- | --- |
| An | Điều phối, hạ tầng/chi phí, lịch release | Chưa xác nhận | Chưa có |
| Dũng | API, dữ liệu, workflow, khả năng kiểm thử | Chưa xác nhận | Chưa có |
| Tú | UI/builder, hai luồng demo và tài khoản thử | Chưa xác nhận | Chưa có |

## An --- Platform & Security

**Phạm vi:** Hạ tầng, SSO, Gateway, vận hành, release.

-   Docker Compose; Keycloak/OIDC; APISIX.
-   Env/config; CI/CD cơ bản; logging/monitoring; backup/restore.
-   Kiểm tra license; release và tài liệu cài đặt.

**Phối hợp:** Review quyền truy cập với Dũng; kiểm thử đăng nhập và lỗi
UI cùng Tú.

## Dũng --- Backend & Business Logic

**Phạm vi:** Dữ liệu, API, schema builder/compiler, workflow và nghiệp vụ mẫu.

-   ERD/migration; NestJS API; validation; tenant guard.
-   Mô tả nguồn, chuẩn hóa/chỉnh tay, kiểm tra ngữ nghĩa, publish và pin
    phiên bản; API chạy app từ cấu hình và audit log.
-   Mẫu mua sắm A và fixture nghỉ phép B, kiểm thử version/tenant;
    connector mô phỏng chỉ sau cổng lõi/builder; API dashboard.

**Phối hợp:** Chốt API contract với Tú; phối hợp An về auth, gateway và
cấu hình môi trường.

## Tú --- Frontend & UX

**Phạm vi:** Giao diện builder, ứng dụng xuất bản, trải nghiệm và demo.

-   Mockup; Next.js layout; login; nhập mô tả nguồn, chỉnh nháp, preview.
-   Danh sách/form/chi tiết/hộp việc từ mẫu UI ứng dụng xuất bản; upload
    tài liệu, màn hình duyệt, H/P/D/I và trạng thái I không khả dụng.
-   Dashboard; admin UI; responsive; loading/error/empty states. Supplier
    UI chỉ khi đã đạt các mốc A và được đội duyệt phạm vi.
-   Hướng dẫn thao tác demo.

**Phối hợp:** Chốt API contract với Dũng; kiểm tra SSO và Gateway với
An.

## Phân bổ thời gian khuyến nghị

      Tỷ lệ Dành cho
  --------- ----------------------------
    **70%** Công việc chính của owner
    **20%** Tích hợp / review chéo
    **10%** Hỗ trợ đồng đội / dự phòng

## Đầu việc liên đới không được bỏ trống

-   **API contract:** Dũng định nghĩa schema/request/response; Tú xác
    nhận UI dùng được; An xác nhận đường đi qua Gateway và cách xác
    thực.
-   **Tenant isolation:** Dũng triển khai kiểm tra backend; An rà soát
    token/policy; Tú kiểm thử UI không lộ dữ liệu tenant khác.
-   **Release:** An điều phối; Dũng chịu trách nhiệm migration/dữ liệu
    mẫu; Tú kiểm tra luồng UI đầu-cuối và ảnh minh chứng.
-   **Builder/AI:** Dũng chịu trách nhiệm ánh xạ nguồn, compiler, quyền publish và
    truy vấn tri thức theo nguồn; An review isolation, máy suy luận và
    license; Tú review luồng dựng **và vận hành** app, trạng thái AI
    tắt/không có nguồn.
-   **Không có "xong trên máy tôi":** mọi tính năng phải chạy trên môi
    trường chung và được ít nhất một thành viên khác review.

------------------------------------------------------------------------

# 03a. Máy chủ, tài nguyên và ngân sách (chờ duyệt)

Không có kiểm kê máy, báo giá hay cam kết cấp tiền trong repo. Các con
số dưới đây là **ngưỡng dự trù để thử tải**, không phải cấu hình đã mua
hoặc số tiền đã được cấp. An lấy thông số máy sẵn có và hai báo giá (nếu
cần thuê) trước buổi chốt; Dũng đo tải DB/Flowable; Tú thử tốc độ UI/demo.

| Hạng mục | Phương án đề xuất / cách kiểm chứng | Owner / reviewer | Chi phí dự trù; quyết định |
| --- | --- | --- | --- |
| Máy dev chung và CI | Ưu tiên máy sẵn có; thử Compose Keycloak, APISIX, NestJS, Next.js, PostgreSQL, Flowable, kho tệp với dữ liệu giả. Mốc tham chiếu 8 vCPU, 16–32 GiB RAM, SSD ≥100 GiB; đo lại trước khi cam kết. | An / Dũng, Tú | **Chưa có báo giá**; ghi chi phí điện/máy hoặc thuê theo tháng, người cấp máy và thời hạn truy cập khi xác minh. |
| Máy demo/PoF và dự phòng | Chạy release từ source trên máy sạch, kiểm Internet/không Internet, backup/restore, tài khoản hai tenant; dự phòng video/ảnh và seed reset. Không lưu secret hay dữ liệu thật trên máy công khai. | An / Dũng, Tú | **Chưa chốt** máy, nơi chạy, chi phí thuê/hosting và phương án dự phòng; thử setup trước 30/11. |
| Suy luận/embedding nội bộ (chỉ nếu bật AI) | Đo VRAM/RAM, tốc độ và quyền thu hồi trên model dự kiến; xác minh license trọng số/extension và vận hành không gọi dịch vụ AI ngoài. Nếu không đủ máy/ngân sách/test thì tắt AI và ghi giới hạn. | An (máy/license), Dũng (thử quyền) / Tú (UI tắt) | **Chưa có model, báo giá hoặc phê duyệt mua/thuê GPU**; không ghi ngân sách giả định là 0. |
| Tên miền/TLS, lưu trữ, dự phòng và phát sinh | Kiểm xem dùng nội bộ, máy trường hay dịch vụ thuê; liệt kê phụ thuộc, bảo mật, dung lượng bản sao, thời hạn thuê tới sau 10/12. | An / Dũng | **Chưa xác định** từng khoản, nguồn chi và người duyệt thanh toán. |

**Bảng chốt chi phí tại họp:** máy sẵn có ___; dịch vụ thuê ___ VND/tháng
× ___ tháng; GPU (nếu có) ___; tên miền/lưu trữ/dự phòng ___; tổng trần
___ VND; nguồn chi ___; người duyệt chi ___; ngày chốt ___; liên kết báo
giá/biên bản ___. Để trống cho đến khi có bằng chứng; không cấp quyền
triển khai trả phí chỉ vì roadmap đề xuất. Nếu trần không được duyệt,
ưu tiên lõi + một app, dùng máy sẵn có, không thêm agent/hạng mục nâng cao.

------------------------------------------------------------------------

# 04. API, kiểm thử & tiêu chuẩn hoàn tất

> Các endpoint dưới đây là đề xuất để thống nhất giao diện
> frontend/backend; cần đối chiếu với API contract thực tế, không xem là
> danh sách bắt buộc nguyên văn từ SRS.

## API đề xuất

| Method | Endpoint minh họa | Mục đích | Owner đề xuất |
| --- | --- | --- | --- |
| `GET` | `/v1/me` | Người dùng/role/tenant sau SSO | Dũng + An |
| `POST` | `/v1/apps` | Tạo dự án ứng dụng dạng nháp trong tenant | Dũng |
| `POST` | `/v1/apps/:appId/descriptions` | Lưu mô tả gốc và nguồn tham chiếu | Dũng |
| `GET/PATCH` | `/v1/apps/:appId/drafts/:version` | Xem ánh xạ nguồn, chỉnh nháp chuẩn hóa/biểu mẫu/quyền | Dũng |
| `POST` | `/v1/apps/:appId/drafts/:version/validate` | Chặn bản nháp sai schema/ngữ nghĩa/hợp đồng | Dũng |
| `POST` | `/v1/apps/:appId/drafts/:version/preview` | Chạy thử với dữ liệu mẫu, không tạo hồ sơ thật | Dũng |
| `POST` | `/v1/apps/:appId/drafts/:version/publish` | Kiểm quyền, review và phát hành phiên bản bất biến | Dũng + An |
| `GET/POST` | `/v1/apps/:appId/records` | Danh sách/tạo hồ sơ từ app đã xuất bản, theo quyền/tenant | Dũng |
| `GET/PATCH` | `/v1/apps/:appId/records/:id` | Xem/sửa nháp hợp lệ và lịch sử/version | Dũng |
| `POST` | `/v1/apps/:appId/records/:id/submit` | Gửi idempotent, pin workflow definition | Dũng |
| `POST` | `/v1/apps/:appId/tasks/:taskId/decisions` | Duyệt/từ chối/trả sửa theo người được giao | Dũng |
| `GET` | `/v1/apps/:appId/dashboard/summary` | Chỉ số theo quyền, truy về hồ sơ nguồn | Dũng + Tú |

Đường dẫn/verb chỉ để thống nhất API contract, không phải SRS quy định
nguyên văn. API mua sắm chuyên biệt hoặc connector Tầng 3 nếu có vẫn
phải dùng Gateway, quyền và workflow chung; không dùng endpoint mua sắm
viết cứng thay cho app nghỉ phép cấu hình được.

## Bộ test tối thiểu trước feature freeze

**Cửa kiểm thử hai tenant đề xuất 27/11:** Dũng chạy seed A/B, Tú chứng
kiến hai luồng UI, An chạy thử âm API/tệp/quyền; lưu kết quả từng case,
commit/phiên bản app, môi trường, log/ảnh, lỗi còn mở vào test report.
TC-LEAVE-01..07 phải chạy trên app nghỉ phép xuất bản từ builder; riêng
nhánh `days = 3`, hành vi publish không quyền, tự duyệt, và manager A đọc
hồ sơ B phải có bằng chứng. TC-TEN-01/02 kiểm tra không đọc/sửa chéo qua
UI **và** API; kiểm thêm workflow, tệp, dashboard và agent nếu bật. Không
đạt thì mở blocker trước M5, không ghi “hai tenant đã đạt”.

**Truy vết SRS v2.4 → mốc/test cần có:**

| Yêu cầu | Mốc đề xuất | Bằng chứng tối thiểu |
| --- | --- | --- |
| FR-CORE-01..06 | M1–M4 | SSO/Gateway, guard API/tệp/workflow, audit, TC-TEN-01/02 và TC-REL-01 |
| FR-BLD-01..04, FR-BLD-06 | M2 | TC-BLD-01..03: nguồn gốc → nháp chuẩn hóa → chỉnh tay, mẫu mua sắm chỉ tạo nháp |
| FR-BLD-05/08, FR-WRK-01..03 | M3–M4 | TC-PUB-01/02, TC-ARC-01..03: preview/publish có quyền, runtime, pin v1/v2 |
| FR-WRK-04, FR-L3-01 | M4 | TC-HPDI-01/02, TC-LEAVE-01..07: H/P/D/I ở app A và B, không code cứng B |
| FR-AI-01..06 | M4b–M5 (có điều kiện tài nguyên) | TC-AI-01..03, TC-AI-REV-01..04, TC-AI-ISO-01, TC-HPDI-03, TC-AI-OFF-01; chưa đạt phải nêu rõ, không tự hạ ưu tiên |
| NFR-SEC/REL/MNT/OSS | M4b–M6 | Test quyền âm, khôi phục, build máy sạch, LICENSE/SPDX, release và bằng chứng gửi |

FR-BLD-07 và FR-L3-02/03 là B/C: chỉ xếp sau lát cắt A; một mẫu mua sắm
FR-BLD-06 không đồng nghĩa phải có supplier portal hay connector chạy thật.

**Cửa freeze đề xuất 03/12:** An tổng hợp RC/test report và tài nguyên,
Dũng xác nhận test builder/nghiệp vụ/tenant/AI không có blocker bị che
giấu, Tú xác nhận cả builder **và hai ứng dụng đã xuất bản** trên máy
chung. Cả ba ký go/no-go có ngày/giờ + link bằng chứng;
no-go thì chỉ sửa blocker và chạy lại regression, công bố phạm vi thực tế
trước hạn nộp, không lặng lẽ bỏ kiểm thử bảo mật.

  -----------------------------------------------------------------------
  Nhóm                                Điều kiện kiểm thử
  ----------------------------------- -----------------------------------
  **Nghiệp vụ**                       Thiếu tài liệu bắt buộc; submit hợp
                                      lệ; approve/reject có lý do; yêu
                                      cầu nhiều cấp; trạng thái/lịch sử
                                      tồn tại sau refresh/restart; hồ sơ
                                      cũ giữ version khi publish v2.

  **Builder/runtime**                  Nháp ánh xạ về nguồn; chỉnh không
                                      cần AI; chặn lỗi/không quyền trước
                                      publish; preview không chạy thật;
                                      app A/B dùng chung lõi qua Gateway.

  **Phân quyền**                      Nhân viên không duyệt; quản lý chỉ
                                      duyệt trong phạm vi/hạn mức;
                                      accounting chỉ xem; supplier chỉ
                                      thấy RFQ của mình.

  **Cách ly tenant**                  Không đọc/sửa dữ liệu tenant khác
                                      qua UI hoặc API trực tiếp; AI (nếu
                                      có) không truy xuất chéo app/tenant.

  **Tài liệu & connector**            URL hết hạn/thu hồi không dùng lại
                                      được; token connector bị thu hồi;
                                      lỗi connector có log và trạng thái
                                      rõ ràng.

  **Vận hành**                        Cài đặt từ source theo README;
                                      migration chạy sạch; backup/restore
                                      thử nghiệm; không commit secret.
  -----------------------------------------------------------------------

**AI có điều kiện:** khi bật, thử quyền hiện hành sau thu hồi kể cả worker
đang dừng, JWT cũ, trả lời đang xử lý, job cũ/restore; không lộ nguồn
tenant/app/version khác hoặc citation khi không đủ chứng cứ. Khi tắt,
TC-AI-OFF-01/TC-HPDI-02 chứng minh H/P/D vẫn chạy, nhưng FR-AI A còn thiếu
phải ghi vào báo cáo và xin quyết định phạm vi.

## Definition of Done (DoD)

-   Đúng phạm vi SRS v2.4 đã được cả đội chốt; có tiêu chí nghiệm thu rõ
    ràng và bằng chứng ứng dụng chạy thật, không chỉ fixture/thiết kế.
-   Chạy trên môi trường chung; config được hướng dẫn và không chứa
    secret.
-   Có validation, xử lý lỗi, phân quyền và kiểm thử tương ứng.
-   Được review chéo, merge qua pull request, tài liệu được cập nhật.
-   Có bằng chứng kiểm thử (log, ảnh, test report hoặc video ngắn) lưu
    trong thư mục thống nhất.

------------------------------------------------------------------------

# 05. Kịch bản demo & nhịp làm việc

## Kịch bản demo đề xuất (15 phút tổng, cần chạy bấm giờ)

| Thời lượng dự kiến | Nội dung / bằng chứng | Người dẫn đề xuất |
| --- | --- | --- |
| 0:00–2:00 | Vấn đề SME, kiến trúc ba tầng và ngưỡng đề; đăng nhập SSO | An |
| 2:00–5:00 | A: mô tả nguồn → nháp chuẩn hóa/chỉnh tay → preview/publish mẫu mua sắm v1; tạo/gửi/duyệt, audit | Tú (builder/UI), Dũng (workflow) |
| 5:00–9:00 | B: mô tả nghỉ phép, tự cấu hình nhánh manager/HR, chạy thử/xuất bản v1; gửi/duyệt trên app, không sửa lõi | Tú (builder/runtime), Dũng (nghiệp vụ) |
| 9:00–11:00 | Publish v2; hồ sơ v1 còn theo v1; H/P/D/I ở hai app, dashboard truy nguồn; API/tệp chặn truy cập chéo tenant | Dũng (version/test), An (quyền) |
| 11:00–15:00 | Bằng chứng PoF, agent theo app/tenant nếu đạt test hoặc trạng thái I tắt và FR-AI chưa đạt; giới hạn, kết luận | An + cả đội |

Đây là phân bổ **đề xuất**, cần cả đội thử bấm giờ trước 30/11. Nếu
không đủ 15 phút, dùng video/ảnh và test report để chứng minh version,
AI và quyền; không cắt các phép thử an toàn chỉ để kịp trình diễn.
Supplier portal/connector đứng sau hai luồng và chỉ demo khi đã đạt.

## Nhịp làm việc đề xuất

  -----------------------------------------------------------------------
  Hằng ngày               Hằng tuần               Quản lý công việc
  ----------------------- ----------------------- -----------------------
  Check-in 10--15 phút; 2 Chốt mục tiêu tuần;     Một owner cho mỗi
  giờ làm việc tập trung; demo bản đang chạy;     issue; PR, không commit
  1,5--2 giờ tích         review blocker và phụ   thẳng `main`; ghi rõ
  hợp/review; 45--60 phút thuộc; điều chỉnh phạm  cách test; ưu tiên
  test và cập nhật issue. vi nếu trễ.             blocker/security trước
                                                  polish.

  -----------------------------------------------------------------------

## Quy tắc Git / tích hợp

-   Tạo nhánh theo issue; mô tả PR gồm mục tiêu, ảnh/API thay đổi và
    bước test.
-   Không merge khi build/test lỗi; thay đổi auth, tenant hoặc schema
    cần ít nhất một reviewer khác.
-   Mỗi ngày đồng bộ API contract và trạng thái blocker; tránh để
    frontend/backend tích hợp lần đầu vào cuối tháng 11.
-   Không thêm thư viện/dịch vụ mới sát ngày freeze nếu chưa kiểm tra
    license và khả năng triển khai.

------------------------------------------------------------------------

# 06. Rủi ro, phương án giảm thiểu & việc cần làm ngay

## Rủi ro chính

  -----------------------------------------------------------------------
  Rủi ro            Dấu hiệu cảnh báo Giảm thiểu        Owner
  ----------------- ----------------- ----------------- -----------------
  **Workflow không  Đến 23/11 vẫn     Ưu tiên builder   Dũng
  chạy E2E**        demo bằng dữ      → preview/publish 
                    liệu/mock rời rạc → app A duyệt;    
                                      tích hợp hằng     
                                      ngày từ sớm.      

  **Phạm vi quá     Builder/hai       Giữ lõi + một     An
  rộng**            tenant chưa       app Tầng 2; chỉ   
                    chạy mà làm       thêm lớp nâng cao 
                    stack nâng cao    sau cổng test; ghi
                                      lại FR A chưa đạt 
                                      và xin quyết định.

  **Thiếu bằng      Chỉ có JSON       Thử luồng nhập   Dũng + Tú
  chứng Lab**       hoặc app mua      mô tả → publish
                    sắm viết cứng     → chạy A/B và
                                      version v1/v2.

  **API lệch giữa   Mock response     Chốt contract     Dũng + Tú
  FE/BE**           khác schema       trước; dùng dữ    
                    backend           liệu mẫu và       
                                      review cùng nhau  
                                      mỗi tuần.         

  **Lỗ hổng phân    Chỉ kiểm tra UI,  Test cả UI lẫn    An + Dũng
  quyền/tenant**    API trực tiếp vẫn API; kiểm tra     
                    truy cập được     negative cases và 
                                      log audit.        

  **Vướng           Không rõ điều     Rà soát sớm       An
  license/thành     kiện sử dụng hoặc MinIO/n8n/Vault   
  phần**            triển khai        và mọi            
                                      dependency; chọn  
                                      phương án tương   
                                      thích.            

  **Tài liệu/PoF    README không cài  Tạo checklist từ  An + cả đội
  đến muộn**        được từ máy sạch  đầu; chạy cài mới 
                                      ngày 04/12; lưu   
                                      test evidence     
                                      liên tục.         
  -----------------------------------------------------------------------

## Checklist hành động ngay --- từ 11/11 (chờ cả đội chốt lại lịch)

### An

-   Kiểm tra trạng thái repo public/README, M1 và biên bản họp; ghi ngày
    kiểm chứng thực tế, lập lịch bù nếu chưa đạt.
-   Xác minh Docker Compose, Keycloak + APISIX trên môi trường chung.
-   Lập danh sách dependency/license; kiểm kê máy dev/demo, báo giá và
    trình trần chi phí cho cả đội chốt; rà tài nguyên AI nội bộ.

### Dũng

-   Chốt ERD/migration và API contract cho nháp/preview/publish/runtime.
-   Kiểm chứng NestJS + PostgreSQL, workflow engine và mô hình phân quyền.
-   Lập backlog FR-BLD-01..06/08, FR-WRK-01..04; ưu tiên thử ánh xạ
    nguồn và chỉnh nháp thủ công trước khi làm E2E mua sắm.

### Tú

-   Vẽ mockup luồng đăng nhập → mô tả nguồn → nháp/chỉnh sửa → preview →
    publish → chạy ứng dụng → truy vết; làm rõ trạng thái I chưa có nguồn.
-   Kiểm chứng Next.js shell và thống nhất request/response với Dũng.

### Cả đội

-   Họp duyệt lại roadmap/SRS, owner/reviewer, hạn M1/M2 đã qua hoặc
    sắp tới, hai tenant, ngân sách, AI go/no-go và mốc freeze; ghi ngày
    thực tế, không đánh dấu hoàn tất khi chưa có bằng chứng.
-   Tạo backlog và Definition of Done có liên kết FR → TC → bằng chứng.
-   Xác nhận kịch bản demo, dữ liệu giả lập, test account hai tenant và
    lịch chạy thử trước freeze.

> **NGUYÊN TẮC ĐỀ XUẤT:** Bảo vệ freeze **03/12** và hạn gửi **17:00
> 06/12**. Nếu trễ, giảm phần B/C (supplier/đồ họa) trước; nếu AI A
> không khả thi, phải ghi FR-AI chưa đạt và được cả đội duyệt điều chỉnh
> SRS/phạm vi. Không cắt
> kiểm thử phân quyền, luồng lõi, tài liệu cài đặt hay thời gian luyện
> demo. Cắt hai tenant/builder hoặc không đạt FR-AI A phải cập nhật SRS,
> bằng chứng và tuyên bố phạm vi trung thực; quyết định cần cả đội xác
> nhận với ngày chốt. Không coi ngưỡng tối thiểu của đề là đã đạt toàn bộ
> lát cắt DigiX Lab v2.4.
