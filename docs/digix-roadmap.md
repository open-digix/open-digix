---
author: DigiX Team
date: 31/10/2026
title: DigiX --- Roadmap triển khai dự án hướng tới vòng thi quốc gia (đề xuất cập nhật)
---

# DIGIX --- ROADMAP TRIỂN KHAI DỰ ÁN

## Hướng tới vòng thi quốc gia \| 31/10/2026 -- 10/12/2026

**Trạng thái (05/11/2026):** Bản kế hoạch đề xuất để An, Dũng, Tú review;
chưa có biên bản phê duyệt của cả đội. Mốc đã qua là kế hoạch, không phải
bằng chứng đã hoàn tất. Người yêu cầu đồng ý định hướng trong SRS **không
thay thế** việc cả đội phê duyệt phạm vi, người phụ trách, nguồn lực và lịch.

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
-   Thứ tự: lõi tenant/quyền/workflow → builder tối thiểu → xuất bản/chạy
    ứng dụng → mua sắm A và nghỉ phép B → kiểm thử cách ly → agent nội
    bộ (nếu đủ điều kiện) → phần nâng cao. Nếu phải giảm phạm vi, vẫn
    giữ lõi + một app Tầng 2 chạy thật; cập nhật SRS và trình bày trung
    thực, không tuyên bố đã đạt mục tiêu hai tenant khi chưa kiểm chứng.
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

  M2 --- App mua sắm Tầng 2 E2E         16/11       Tạo/gửi/duyệt/từ chối,
                                                 phiên bản trạng thái, audit;
                                                 UI gọi API qua Gateway.

  M3 --- Builder tối thiểu              23/11       Schema/validator/compiler,
                                                 review và publish có quyền;
                                                 app chạy từ định nghĩa,
                                                 không viết cứng luồng B.

  M4 --- Hai tenant và kiểm thử âm       27/11       Mua sắm A, nghỉ phép B
                                                 (TC-LEAVE-01..07), TC-TEN-01/02;
                                                 chứng cứ UI/API/tệp/workflow.

  M4b --- Hồi quy/tích hợp              30/11       Chạy lại từ môi trường
                                                 sạch; chốt blocker, quyền,
                                                 backup/restore và phạm vi AI.

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

**SSO → tenant A: mua sắm, duyệt/từ chối → builder xuất bản ứng dụng nghỉ
phép cho tenant B → nhân viên B gửi, manager/HR B duyệt theo nhánh →
dashboard/truy vết; thử truy cập chéo tenant và bị từ chối.**

Agent/RAG nội bộ là mục tiêu sau khi hai luồng và quyền ổn định, chỉ
được demo nếu kiểm quyền nguồn khi thu hồi, cô lập app/tenant, tài nguyên
và giấy phép đã được thử thật; không được có quyền phê duyệt/xuất bản.
Nếu chưa đạt, ghi trạng thái I chưa có nguồn, không giả vờ có AI hoạt động.

------------------------------------------------------------------------

# 02. Kế hoạch theo giai đoạn

## GĐ0 · Chốt thiết kế --- 31/10--02/11

**Phụ trách:** Cả đội

**Trạng thái:** Mốc dự kiến đã qua; [GĐ0](GD0.md) vẫn là bản chuẩn bị
họp, chưa có chứng cứ họp/chốt. Cần họp bù và ghi biên bản trước khi
coi phạm vi, phân công hay máy chủ đã được duyệt.

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

## GĐ2 · Yêu cầu mua & phê duyệt --- 10/11--16/11

**Phụ trách:** Dũng (owner nghiệp vụ)

-   Nhân viên tạo/sửa/gửi yêu cầu; kiểm tra trường bắt buộc và tài liệu
    đính kèm.
-   Workflow: approve, reject có lý do, request changes, đa cấp theo hạn
    mức.
-   **Tú:** Form, danh sách, chi tiết, lịch sử và hộp việc cần duyệt.
-   **An:** Kiểm tra SSO và phân quyền.

**Điều kiện hoàn tất:** Chạy end-to-end trên dữ liệu mẫu; trạng thái còn
nguyên sau khi tải lại.

Đây là **ứng dụng Tầng 2 đầu tiên**, không thay thế phần builder và thử
nghỉ phép tenant B ở các mốc sau.

## GĐ3 · Builder và ứng dụng có phiên bản --- 17/11--23/11

-   Dũng: schema trung gian, validator ngữ nghĩa, compiler sang Flowable,
    API publish/guard; review nội dung và quyền trước khi phát hành.
-   Tú: UI builder tối thiểu và UI ứng dụng sinh từ mẫu; preview/test,
    danh sách, biểu mẫu, chi tiết, hộp việc, dashboard.
-   An: deployment, định danh tenant/app/version, SSO/Gateway, audit và
    kiểm tra giấy phép engine/dependency.

**Điều kiện hoàn tất:** Publish bản định nghĩa bất biến có phiên bản,
chạy thử và từ chối bản lỗi/không có quyền; có test và bằng chứng. Không
đòi kéo-thả bố cục hay sinh toàn bộ mã nguồn.

## GĐ4 · Hai tenant, tích hợp & hardening --- 24/11--30/11

**Phụ trách:** Cả đội

-   Trước **27/11**: tenant A mua sắm; tenant B nghỉ phép dựng từ JSON v1
    qua builder, không có controller/flow nghỉ phép viết cứng. Chạy
    [TC-LEAVE-01..07](DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md),
    TC-TEN-01/02, cả nhánh dưới/đúng 3 ngày và thử manager A đọc B.
-   Trước **30/11**: kiểm thử quyền trực tiếp tại API, tệp, workflow,
    dashboard, UI và audit; reset seed, cài từ máy sạch; lưu test report.
-   Connector mô phỏng, supplier portal, bảy lớp nâng cao và agent chỉ
    nhận sau khi các cửa kiểm tra lõi/builder/hai tenant đạt; không coi
    đó là điều kiện tối thiểu của đề.
-   AI nếu bật: chạy TC-AI-REV-01..04, TC-AI-ISO-01, TC-AI-OFF-01 trên
    máy thật với quyền bị thu hồi khi worker tạm dừng; thiếu bằng chứng
    hoặc máy/giấy phép thì tắt AI, giữ luồng H/P/D.

**Điều kiện hoàn tất:** Hai ứng dụng khác nhau chạy trên cùng lõi, có
bằng chứng cô lập tenant và báo cáo lỗi còn mở; không còn lỗi nghiêm
trọng về nghiệp vụ hoặc phân quyền.

## GĐ5 · Feature freeze & release candidate --- 01/12--03/12

**Phụ trách:** An điều phối release

-   Đóng băng tính năng; chỉ sửa blocker và lỗi làm hỏng demo.
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
    quyền partner, token bị thu hồi.
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
| GĐ0: kiến trúc, backlog, phạm vi & biên bản; họp bù trước M1 | An | Dũng, Tú | Quyết định + lý do + chữ xác nhận/ngày của cả ba; cập nhật SRS nếu cắt phạm vi |
| M1: SSO/Gateway, máy chung, kho tệp, workflow, CI/setup; 09/11 | An | Dũng (API/DB), Tú (UI/setup) | Smoke test và hai người thử setup độc lập |
| M1–M2: schema DB, tenant guard, workflow/API mua sắm; 16/11 | Dũng | An (quyền), Tú (hợp đồng UI) | Test API trực tiếp, migration và E2E |
| M2: UI mua sắm và hộp việc; 16/11 | Tú | Dũng (nghiệp vụ), An (SSO) | Demo UI qua Gateway và nhánh lỗi |
| M3: schema, compiler, publish guard & pin version; 23/11 | Dũng | An (isolation/deploy), Tú (khả năng dựng UI) | Fixture hợp lệ/lỗi, audit, test không quyền |
| M3: UI builder, preview và mẫu UI ứng dụng; 23/11 | Tú | Dũng (contract), An (quyền) | Sinh app từ cấu hình, không code cứng nghỉ phép |
| M4: seed hai tenant, test TC-LEAVE/TEN; 27/11 | Dũng | Tú (UI/nhánh), An (API/policy) | Test report có kết quả âm và link log/ảnh |
| M4b: kiểm thử tích hợp, máy sạch, AI go/no-go; 30/11 | An | Dũng (backend/AI), Tú (demo) | Chi phí, license, kiểm quyền thu hồi; quyết định bật/tắt AI |
| M5–M6: RC, freeze, release, gửi bài; 03–06/12 | An | Dũng (build/test), Tú (demo/tài liệu) | Biên bản go/no-go, tag/release và bằng chứng email |

**Điểm kiểm soát phê duyệt (chưa chốt):** An mời họp, ghi biên bản và
đường dẫn issue; Dũng, Tú và An mỗi người xác nhận phạm vi, owner/reviewer,
máy chủ/ngân sách, mốc hai tenant và freeze. Người tổng hợp **An** không
được tự thay hai chữ xác nhận còn lại. **Ngày chốt thực tế: chưa có**;
điền ngày/giờ và liên kết biên bản sau họp, không hồi tố ngày 02/11 hay
coi ngày biên soạn 05/11 là ngày ký duyệt. Hạn đề nghị họp bù: **trước
09/11/2026**; nếu chưa họp, đánh dấu mốc chờ duyệt và báo rủi ro lịch.

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

**Phạm vi:** Dữ liệu, API, workflow và nghiệp vụ.

-   ERD/migration; NestJS API; validation; tenant guard.
-   Yêu cầu mua; workflow duyệt; audit log.
-   Đơn mua; connector mô phỏng; API dashboard; kiểm thử backend.

**Phối hợp:** Chốt API contract với Tú; phối hợp An về auth, gateway và
cấu hình môi trường.

## Tú --- Frontend & UX

**Phạm vi:** Giao diện, trải nghiệm và demo.

-   Mockup; Next.js layout; login.
-   Danh sách/form/chi tiết yêu cầu; upload tài liệu; màn hình duyệt.
-   Dashboard; admin/supplier UI; responsive; loading/error/empty
    states.
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
-   **Builder/AI:** Dũng chịu trách nhiệm compiler, quyền publish và
    truy vấn tri thức theo nguồn; An review isolation, máy suy luận và
    license; Tú review luồng dựng app và trạng thái AI tắt/không có nguồn.
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

  ---------------------------------------------------------------------------------------------------
  Method            Endpoint                                      Mục đích          Owner
  ----------------- --------------------------------------------- ----------------- -----------------
  `GET`             `/v1/me`                                      Thông tin người   Dũng + An
                                                                  dùng/role sau SSO 

  `GET`             `/v1/purchase-requests`                       Danh sách theo    Dũng
                                                                  quyền và tenant   

  `POST`            `/v1/purchase-requests`                       Tạo yêu cầu mua   Dũng

  `GET/PATCH`       `/v1/purchase-requests/:id`                   Xem/cập nhật yêu  Dũng
                                                                  cầu khi còn hợp   
                                                                  lệ                

  `POST`            `/v1/purchase-requests/:id/submit`            Gửi vào workflow  Dũng

  `POST`            `/v1/purchase-requests/:id/approve`           Phê duyệt đúng    Dũng
                                                                  vai trò/hạn mức   

  `POST`            `/v1/purchase-requests/:id/reject`            Từ chối kèm lý do Dũng

  `POST`            `/v1/purchase-requests/:id/request-changes`   Yêu cầu chỉnh sửa Dũng

  `GET`             `/v1/dashboard/summary`                       Tổng hợp số liệu  Dũng + Tú
                                                                  cho dashboard     
  ---------------------------------------------------------------------------------------------------

## Bộ test tối thiểu trước feature freeze

**Cửa kiểm thử hai tenant đề xuất 27/11:** Dũng chạy seed A/B, Tú chứng
kiến hai luồng UI, An chạy thử âm API/tệp/quyền; lưu kết quả từng case,
commit/phiên bản app, môi trường, log/ảnh, lỗi còn mở vào test report.
TC-LEAVE-01..07 phải chạy trên app nghỉ phép xuất bản từ builder; riêng
nhánh `days = 3`, hành vi publish không quyền, tự duyệt, và manager A đọc
hồ sơ B phải có bằng chứng. TC-TEN-01/02 kiểm tra không đọc/sửa chéo qua
UI **và** API; kiểm thêm workflow, tệp, dashboard và agent nếu bật. Không
đạt thì mở blocker trước M5, không ghi “hai tenant đã đạt”.

**Cửa freeze đề xuất 03/12:** An tổng hợp RC/test report và tài nguyên,
Dũng xác nhận test nghiệp vụ/tenant không có blocker, Tú xác nhận builder
và demo trên máy chung. Cả ba ký go/no-go có ngày/giờ + link bằng chứng;
no-go thì chỉ sửa blocker và chạy lại regression, công bố phạm vi thực tế
trước hạn nộp, không lặng lẽ bỏ kiểm thử bảo mật.

  -----------------------------------------------------------------------
  Nhóm                                Điều kiện kiểm thử
  ----------------------------------- -----------------------------------
  **Nghiệp vụ**                       Thiếu tài liệu bắt buộc; submit hợp
                                      lệ; approve/reject có lý do; yêu
                                      cầu nhiều cấp; trạng thái/lịch sử
                                      tồn tại sau refresh/restart.

  **Phân quyền**                      Nhân viên không duyệt; quản lý chỉ
                                      duyệt trong phạm vi/hạn mức;
                                      accounting chỉ xem; supplier chỉ
                                      thấy RFQ của mình.

  **Cách ly tenant**                  Không đọc/sửa dữ liệu tenant khác
                                      qua UI hoặc API trực tiếp; AI (nếu
                                      có) không truy xuất chéo tenant.

  **Tài liệu & connector**            URL hết hạn/thu hồi không dùng lại
                                      được; token connector bị thu hồi;
                                      lỗi connector có log và trạng thái
                                      rõ ràng.

  **Vận hành**                        Cài đặt từ source theo README;
                                      migration chạy sạch; backup/restore
                                      thử nghiệm; không commit secret.
  -----------------------------------------------------------------------

## Definition of Done (DoD)

-   Đúng phạm vi SRS đã chốt; có tiêu chí nghiệm thu rõ ràng.
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
| 2:00–5:00 | Tenant A: tạo/gửi mua sắm, duyệt/từ chối, audit/truy vết | Tú (UI), Dũng (workflow) |
| 5:00–9:00 | Builder, review/publish có quyền; tenant B: nghỉ phép từ cấu hình, nhánh manager/HR | Tú (builder), Dũng (nghiệp vụ) |
| 9:00–11:00 | API/tệp chặn manager A đọc hồ sơ B; dashboard theo tenant; test report | An (quyền), Dũng (test) |
| 11:00–15:00 | Bằng chứng PoF, giới hạn (AI/connector nếu chưa đạt), hướng mở rộng và kết luận | An + cả đội |

Đây là phân bổ **đề xuất**, cần cả đội thử bấm giờ trước 30/11; cắt
supplier portal/connector khỏi demo nếu ảnh hưởng thời gian hai luồng.

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
  **Workflow không  Đến 16/11 vẫn     Ưu tiên yêu cầu   Dũng
  chạy E2E**        demo bằng dữ      mua + duyệt trước 
                    liệu/mock rời rạc dashboard/AI;     
                                      tích hợp hằng     
                                      ngày từ sớm.      

  **Phạm vi quá     Builder/hai       Giữ lõi + một     An
  rộng**            tenant chưa       app Tầng 2; chỉ   
                    chạy mà làm       thêm lớp nâng cao 
                    stack nâng cao    sau cổng test.    

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

## Checklist hành động ngay --- 31/10 đến 02/11

### An

-   Kiểm tra repo public/README hiện tại.
-   Dựng Docker Compose.
-   Xác minh Keycloak + APISIX.
-   Lập danh sách dependency/license; kiểm kê máy dev/demo, báo giá và
    trình trần chi phí cho cả đội chốt.

### Dũng

-   Chốt ERD/migration.
-   Phác API contract.
-   Dựng NestJS + PostgreSQL.
-   Xác nhận lựa chọn workflow và mô hình phân quyền.

### Tú

-   Vẽ mockup luồng đăng nhập → tạo yêu cầu → duyệt → dashboard.
-   Dựng Next.js shell.
-   Thống nhất request/response với Dũng.

### Cả đội

-   Tạo backlog và Definition of Done.
-   Xác nhận kịch bản demo.
-   Thống nhất dữ liệu giả lập, test account và lịch demo cuối tuần.

> **NGUYÊN TẮC ĐỀ XUẤT:** Bảo vệ freeze **03/12** và hạn gửi **17:00
> 06/12**. Nếu trễ, giảm phần nâng cao (AI/supplier/đồ họa), không cắt
> kiểm thử phân quyền, luồng lõi, tài liệu cài đặt hay thời gian luyện
> demo. Cắt hai tenant/builder phải cập nhật SRS, bằng chứng và tuyên bố
> phạm vi trung thực; quyết định cần cả đội xác nhận với ngày chốt.
