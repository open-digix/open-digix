---
author: DigiX Team
date: 31/10/2026
title: DigiX --- Roadmap triển khai dự án hướng tới vòng thi quốc gia
---

# DIGIX --- ROADMAP TRIỂN KHAI DỰ ÁN

## Hướng tới vòng thi quốc gia \| 31/10/2026 -- 10/12/2026

**Mục tiêu:** Hoàn tất tính năng trước **03/12**, dành tuần cuối cho
kiểm thử, đóng gói, PoF và luyện thuyết trình.

> Theo SRS hiện có: PoF / source-code review 07--09/12/2026; phần trình
> bày cuối 10/12/2026. Cần đối chiếu lại thể lệ chính thức khi ban tổ
> chức công bố hoặc cập nhật.

## Định hướng điều hành

-   Ưu tiên **luồng nghiệp vụ chạy xuyên suốt**, thay vì nhiều module
    rời rạc.
-   Mỗi lớp kiến trúc có **tính năng tối thiểu + cách kiểm thử + bằng
    chứng**.
-   Sau 03/12 không phát triển tính năng mới; tuần cuối dành cho ổn
    định, kiểm thử, đóng gói và luyện demo.

------------------------------------------------------------------------

# 01. Tổng quan & tiêu chí thành công

## Các mốc kiểm soát chính

  ------------------------------------------------------------------------
  Mốc                                            Hạn Điều kiện đạt
  --------------------- ---------------------------- ---------------------
  M1 --- Nền tảng chạy                         09/11 SSO hoạt động; API đi
                                                     qua Gateway; DB
                                                     migration chạy được;
                                                     có môi trường dev
                                                     chung.

  M2 --- Luồng nghiệp                          16/11 Nhân viên tạo/gửi yêu
  vụ E2E                                             cầu; quản lý duyệt/từ
                                                     chối; trạng thái và
                                                     lịch sử được lưu.

  M3 --- 7 lớp có minh                         23/11 Mỗi lớp có ít nhất
  chứng                                              một chức năng chạy,
                                                     bài test và bằng
                                                     chứng.

  M4 --- Tích hợp & bảo                        30/11 Procurement,
  mật                                                connector mô phỏng,
                                                     dashboard, supplier
                                                     portal và kiểm thử
                                                     phân quyền hoạt động.

  M5 --- Feature freeze                        03/12 Không còn blocker
                                                     nghiêm trọng; release
                                                     candidate và tài liệu
                                                     sẵn sàng.

  M6 --- PoF / review                      07--09/12 Cài đặt theo tài liệu
                                                     được; demo ổn định;
                                                     có test account và
                                                     bằng chứng kiểm thử.

  M7 --- Trình bày                             10/12 Demo 10--12 phút,
                                                     thuyết trình và trả
                                                     lời câu hỏi.
  ------------------------------------------------------------------------

## Luồng demo cốt lõi

**SSO đăng nhập → Tạo yêu cầu mua → Duyệt/từ chối → Đơn mua + connector
→ Dashboard/truy vết**

AI assistant/RAG là phần tùy chọn; chỉ triển khai sau khi luồng nghiệp
vụ, phân quyền và tenant isolation đã ổn định. AI không được có quyền
phê duyệt.

------------------------------------------------------------------------

# 02. Kế hoạch theo giai đoạn

## GĐ0 · Chốt thiết kế --- 31/10--02/11

**Phụ trách:** Cả đội

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

## GĐ3 · Bảy lớp kiến trúc --- 17/11--23/11

-   **L1 --- Experience:** Giao diện responsive, form validation, thông
    báo trạng thái.
-   **L2 --- Gateway/Security:** Xác thực token, policy, log; API được
    công bố qua Gateway.
-   **L3 --- API/Data:** Domain model, tenant isolation, context
    entity/NGSI-LD nếu thuộc phạm vi.
-   **L4 --- Workflow/Operations:** Workflow bền vững, CI/CD cơ bản,
    backup/restore.
-   **L5 --- Data history:** Lịch sử/lakehouse tối thiểu và ledger quyết
    định có kiểm tra toàn vẹn.
-   **L6 --- Analytics:** Dashboard chỉ số và dữ liệu supplier/warehouse
    mô phỏng.
-   **L7 --- Governance/Observability:** Lineage/catalog tối thiểu,
    monitoring và cảnh báo.

**Điều kiện hoàn tất:** Mỗi lớp có một tính năng chạy + một cách test +
bằng chứng; dùng chung luồng dữ liệu.

## GĐ4 · Tích hợp & hardening --- 24/11--30/11

**Phụ trách:** Cả đội

-   Tạo đơn mua sau phê duyệt; tích hợp connector mô phỏng kế toán/kho.
-   Supplier portal chỉ xem RFQ của chính supplier; URL tài liệu có hạn
    dùng/thu hồi.
-   Hoàn thiện dashboard, audit trail, tenant isolation, quyền view-only
    và kiểm thử token connector bị thu hồi.
-   Kiểm tra license, dữ liệu giả lập, lỗi API, log và khả năng phục
    hồi.

**Điều kiện hoàn tất:** Kịch bản demo hoàn chỉnh; không còn lỗi nghiêm
trọng về nghiệp vụ hoặc phân quyền.

## GĐ5 · Feature freeze & release candidate --- 01/12--03/12

**Phụ trách:** An điều phối release

-   Đóng băng tính năng; chỉ sửa blocker và lỗi làm hỏng demo.
-   Hoàn thiện README, hướng dẫn cài đặt, LICENSE, CHANGELOG,
    version/release và bug tracker.
-   Chuẩn bị tài khoản theo vai trò, dữ liệu synthetic, test report,
    ảnh/log minh chứng.

**Điều kiện hoàn tất:** Release candidate chạy được từ môi trường sạch;
không nhận tính năng mới.

## GĐ6 · Regression & đóng gói --- 04/12--06/12

**Phụ trách:** Cả đội

-   Cài mới từ source theo README; thử backup/restore; kiểm tra cấu hình
    không chứa secret.
-   Chạy lại bộ test: thiếu tài liệu, duyệt nhiều cấp, tenant isolation,
    quyền partner, token bị thu hồi.
-   Chốt slide, kịch bản, video dự phòng/screenshot và checklist PoF.

**Điều kiện hoàn tất:** Chỉ sửa lỗi; mọi thay đổi phải qua review và
regression test.

## GĐ7 · PoF & thuyết trình --- 07/12--10/12

**Phụ trách:** Cả đội

-   **07--09/12:** PoF/source-code review; ưu tiên ổn định, tài liệu và
    trả lời câu hỏi.
-   Luyện demo bấm giờ, chuẩn bị môi trường dự phòng; không refactor
    lớn.
-   **10/12:** Trình bày theo kịch bản 10--12 phút.

**Điều kiện hoàn tất:** Demo ổn định, phân vai nói rõ, mỗi thành viên
hiểu kiến trúc và trade-off.

------------------------------------------------------------------------

# 03. Phân chia công việc công bằng

Nguyên tắc: mỗi hạng mục có một người chịu trách nhiệm chính
(**owner**); phần giao nhau phải có review chéo. Cân bằng theo năng lực
và khối lượng, không chỉ đếm số đầu việc.

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
-   **Không có "xong trên máy tôi":** mọi tính năng phải chạy trên môi
    trường chung và được ít nhất một thành viên khác review.

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

## Kịch bản demo 10--12 phút

  ------------------------------------------------------------------------
  Thời lượng         Nội dung          Người dẫn         Bằng chứng cần
                                                         thấy
  ------------------ ----------------- ----------------- -----------------
  **0:00--2:00**     Giới thiệu vấn    An                SSO; phân quyền
                     đề, đăng nhập SSO                   cơ bản; kiến trúc
                     và vai trò                          tổng quan

  **2:00--4:00**     Tạo yêu cầu; thử  Tú                Validation;
                     gửi khi thiếu tài                   upload; UI dễ
                     liệu; tải báo giá                   dùng

  **4:00--7:30**     Gửi yêu cầu; quản Dũng              Workflow bền
                     lý duyệt/từ chối;                   vững; audit; tích
                     tạo đơn mua và                      hợp nghiệp vụ
                     connector mô                        
                     phỏng                               

  **7:30--9:00**     Dashboard, lịch   Tú + Dũng         Số liệu từ dữ
                     sử và truy vết về                   liệu demo;
                     bản ghi nguồn                       lineage/audit

  **9:00--10:30**    Supplier portal   An + Tú           Supplier chỉ thấy
                     và giới hạn truy                    RFQ của mình
                     cập; điểm bảo mật                   

  **10:30--12:00**   Kết luận giá trị, Cả đội            Thông điệp nhất
                     kiến trúc, giới                     quán; sẵn sàng
                     hạn hiện tại và                     Q&A
                     hướng mở rộng                       
  ------------------------------------------------------------------------

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

  **Bảy lớp quá     Mỗi lớp làm dở    Định nghĩa một    Cả đội
  rộng**            nhưng không có    tính năng tối     
                    bằng chứng        thiểu, một test,  
                                      một bằng chứng    
                                      cho từng lớp.     

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
-   Lập danh sách dependency và license cần kiểm tra.

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

> **NGUYÊN TẮC CHỐT:** Bảo vệ mốc **03/12**. Nếu tiến độ trễ, cắt tính
> năng phụ (đặc biệt AI/đồ họa nâng cao), không cắt kiểm thử phân quyền,
> luồng nghiệp vụ chính, tài liệu cài đặt hoặc thời gian luyện demo.
