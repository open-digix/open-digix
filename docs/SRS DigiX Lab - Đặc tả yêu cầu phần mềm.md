# Đặc tả yêu cầu phần mềm (SRS) — DigiX Lab

**Phiên bản:** v2.4 (bản nháp; bổ sung thiết kế RAG nội bộ và vòng đời dữ liệu)  
**Ngày:** 05/11/2026  
**Nguồn kế thừa:** [SRS DigiX v1.5](SRS%20DigiX%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md)  
**Tổ chức:** DigiX · **Kho mã nguồn:** [githubcuaan/digi](https://github.com/githubcuaan/digi)

> Định hướng và phạm vi đề xuất ở mục 6 đã được người yêu cầu xác nhận; **chưa phải bằng chứng toàn đội phê duyệt, triển khai hoàn tất hoặc đề thi bắt buộc từng chức năng**. Bản v1.5 được giữ nguyên để đối chiếu. Các kế hoạch lấy mua sắm làm sản phẩm chính (ví dụ [roadmap hiện tại](digix-roadmap.md)) cần được cập nhật sau khi nhóm chốt phân công và tiến độ.

**Nguồn thi đã đối chiếu:** [Đề thi VFOSSA](https://vfossa.vn/tin-tuc/de-thi-phan-mem-nguon-mo-olp-2026-798.html) (§2–6), [Thể lệ 2026](https://vfossa.vn/tin-tuc/the-le-olp-phan-mem-nguon-mo-nam-2026-760.html) và [bảng đối chiếu từng lớp/tiêu chí](OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md). Mức A/B/C do DigiX tự đặt, không phải mức bắt buộc của BTC.

## 1. Giới thiệu

### 1.1. Mục đích và tầm nhìn

**DigiX Lab** là nền tảng mã nguồn mở giúp các doanh nghiệp tự thiết kế, triển khai và cải tiến **hệ thống vận hành số của riêng mình** trên một lõi dùng chung. Sản phẩm không được thiết kế riêng cho một doanh nghiệp hoặc một ngành. Người có thẩm quyền mô tả quy trình, dữ liệu, vai trò và nhu cầu tích hợp; DigiX Lab hỗ trợ chuyển mô tả đó thành cấu hình có thể kiểm tra, chạy và thay đổi. Nhân viên dùng ứng dụng được tạo ra để làm việc hằng ngày; doanh nghiệp giữ quyền quyết định đối với quy trình và dữ liệu của mình.

**Tuyên bố giá trị có thể kiểm chứng:** cùng một bản triển khai nền tảng phải phục vụ được ít nhất hai doanh nghiệp với cấu hình nghiệp vụ khác nhau, không sửa mã nguồn lõi và không để dữ liệu của doanh nghiệp này xuất hiện ở doanh nghiệp kia.

**Phân biệt với bản v1.5:** đề nghị mua hàng/phê duyệt chi phí là **một mẫu ứng dụng và một kịch bản kiểm chứng**, không còn là chức năng định nghĩa toàn bộ sản phẩm. Khả năng tạo và vận hành quy trình khác mới là đối tượng nghiệm thu chính.

### 1.2. Phạm vi và giới hạn

Trong phạm vi bản tối thiểu, nền tảng cho phép:

- khởi tạo không gian doanh nghiệp;
- quản lý người dùng và quyền;
- thu thập mô tả quy trình;
- đề xuất rồi xác nhận một quy trình có cấu trúc;
- cấu hình biểu mẫu, dữ liệu và tuyến xử lý;
- xuất bản phiên bản ứng dụng nội bộ;
- vận hành ứng dụng đã xuất bản theo kiến trúc open-core ba tầng và không gian làm việc H-P-D-I;
- chạy công việc, theo dõi tiến độ và xem lịch sử;
- trợ lý truy xuất tri thức được phép trong phạm vi doanh nghiệp.

Ngoài phạm vi bản tối thiểu:

- tự động hiểu chính xác mọi quy trình phi cấu trúc;
- tự động xuất bản hoặc thay đổi quy trình mà không có người xác nhận;
- agent tự học hoặc tự huấn luyện trên dữ liệu doanh nghiệp;
- agent tự phê duyệt, chuyển tiền, cấp quyền hay gửi dữ liệu ra ngoài;
- ERP/kế toán đầy đủ;
- chợ ứng dụng thương mại;
- tích hợp dịch vụ thật khi chưa được cấp quyền;
- Digital Twin từ dữ liệu chưa được xác thực. Các khả năng này chỉ được bổ sung bằng yêu cầu và cơ chế kiểm soát riêng.

### 1.3. Thuật ngữ

| Thuật ngữ           | Định nghĩa trong tài liệu này                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tenant              | Không gian của một doanh nghiệp, định danh bằng `tenant_id`; cấu hình, dữ liệu, chỉ mục tìm kiếm và quyền đều được cách ly.                                                                                                    |
| Bản mô tả gốc       | Tài liệu, biểu mẫu hoặc nội dung người dùng nhập để mô tả công việc thực tế; chưa được coi là quy trình chạy được.                                                                                                             |
| Quy trình chuẩn hóa | Mô hình có cấu trúc gồm điểm bắt đầu/kết thúc, bước, vai trò, điều kiện, dữ liệu đầu vào/đầu ra, ngoại lệ và lịch sử phiên bản; **chuẩn hóa cấu trúc**, không áp đặt một quy trình nghiệp vụ chung cho mọi doanh nghiệp.       |
| Bản nháp đề xuất    | Quy trình do hệ thống hoặc AI gợi ý từ bản mô tả gốc, chưa có hiệu lực cho đến khi được người có quyền kiểm tra và xuất bản.                                                                                                   |
| Cấu hình ứng dụng   | Bộ biểu mẫu, mô hình dữ liệu, vai trò, quy trình, màn hình và tích hợp đã được doanh nghiệp chọn để chạy trên nền tảng.                                                                                                        |
| Ứng dụng xuất bản   | Phiên bản cấu hình nghiệp vụ đã được duyệt, chạy bằng dịch vụ dùng chung Tầng 1, trải nghiệm thiết kế/vận hành H-P-D-I ở Tầng 2 và năng lực miền nghiệp vụ/đầu nối Tầng 3 khi cần; không phải bản sao độc lập của cả nền tảng. |
| Agent thích nghi    | Trợ lý sử dụng cấu hình và nguồn dữ liệu được phép của tenant để trả lời/đề xuất theo ngữ cảnh; không hàm ý tự huấn luyện mô hình hoặc sở hữu quyền quyết định nghiệp vụ.                                                      |
| H-P-D-I             | Con người số, Quy trình số, Dữ liệu số, Trí tuệ số: năng lực ở Tầng 2 khi thiết kế **và** khi dùng ứng dụng đã xuất bản. Trí tuệ là hỗ trợ theo quyền, không thay quyết định con người.                                        |
| A/B/C               | A: bắt buộc cho lát cắt sản phẩm tối thiểu; B: nâng chất lượng; C: mở rộng. Không đồng nghĩa với mức bắt buộc của đề thi nếu chưa đối chiếu đề chính thức.                                                                     |

## 2. Mô tả tổng thể

### 2.1. Kiến trúc DX-OS Lab ba tầng

| Tầng                                            | Vai trò                                                                            | Năng lực tối thiểu                                                                                                                    | Ranh giới                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **1 — Lõi dịch vụ headless**                    | Cung cấp dịch vụ dùng chung cho mọi doanh nghiệp/ứng dụng                          | Định danh/SSO, API Gateway, phân quyền và cách ly tenant, lưu dữ liệu/tệp, workflow bền vững, audit, API có phiên bản                 | Không chứa giao diện nghiệp vụ cho người dùng cuối; Gateway không thay thế kiểm tra quyền tại API. |
| **2 — Không gian thiết kế và làm việc H-P-D-I** | Nơi doanh nghiệp thiết kế ứng dụng **và** người dùng vận hành ứng dụng đã xuất bản | Builder; giao diện ứng dụng theo cấu hình; vai trò/việc được giao (H), luồng xử lý (P), hồ sơ/dashboard (D), trợ lý theo ngữ cảnh (I) | Chỉ truy cập dữ liệu qua Gateway và API có kiểm tra quyền.                                         |
| **3 — Hệ sinh thái ứng dụng/đầu nối**           | Đóng gói năng lực theo miền nghiệp vụ                                              | Ít nhất một mẫu ứng dụng có thể cài/cấu hình (mua sắm) và một đầu nối mô phỏng; hợp đồng API cho mô-đun khác                          | Không xây lại SSO/Gateway; mô-đun không truy cập trực tiếp dữ liệu của tenant khác.                |

**Hợp đồng kiến trúc của ứng dụng xuất bản:** một ứng dụng được thiết kế trong Lab phải dùng **cùng** kiến trúc open-core ba tầng trong lúc chạy, không chỉ trong lúc tạo ứng dụng.

- Tầng 1 cung cấp định danh, Gateway, dữ liệu, workflow và audit dùng chung;
- Tầng 2 cung cấp giao diện vận hành H-P-D-I gắn với ứng dụng và quyền của người dùng;
- Tầng 3 chứa mẫu/mô-đun nghiệp vụ hoặc đầu nối tùy chọn cho ứng dụng đó. Ứng dụng không phải tự dựng một bộ Tầng 1 riêng; **không bắt buộc có dịch vụ hay đầu nối riêng ở Tầng 3** nếu chỉ cần cấu hình chung. Dù là ứng dụng cấu hình hay mô-đun mở rộng, mọi truy cập dữ liệu và thay đổi trạng thái vẫn phải đi qua Gateway, API kiểm tra quyền và workflow của Tầng 1. Việc tắt trợ lý không được làm dừng quy trình của ứng dụng.

**H-P-D-I sau xuất bản:** H là vai trò, người được giao và trách nhiệm; P là quy trình được phiên bản hóa và thực thi; D là hồ sơ, chứng từ, chỉ số truy được nguồn; I là trợ lý/cảnh báo dựa trên tri thức được phép của **ứng dụng và tenant hiện hành**. Bốn năng lực này xuất hiện trong trải nghiệm vận hành của từng ứng dụng được xuất bản, không chỉ trên màn hình builder; AI không được tự thay đổi cấu hình hoặc thay người duyệt.

**Bảy lớp chức năng tham chiếu** từ SRS v1.5 đi xuyên ba tầng:

- (1) trải nghiệm đa kênh;
- (2) biên mạng và an toàn;
- (3) tác nghiệp, dữ liệu và trạng thái;
- (4) workflow và vận hành;
- (5) sự kiện/lưu trữ lịch sử;
- (6) phân tích và trí tuệ;
- (7) quản trị/tìm kiếm/giám sát.

**Đề §4 gọi bảng bảy lớp là giải pháp tham chiếu “để minh họa làm ví dụ” và cho phép đội tự chọn công nghệ:** không bắt buộc cài từng công nghệ hoặc mỗi lớp một stack riêng. Tuy nhiên, bốn nguyên lý kỹ thuật của §4 (vòng đời dữ liệu, IT/OT, phả hệ/chất lượng, Zero-Trust/GitOps/kiểm dịch biên) cần được giải trình và kiểm chứng; xem [bảng đối chiếu](OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md). Không coi tên công nghệ hay bản thiết kế là bằng chứng đã chạy.

**Ngưỡng bắt buộc theo Đề §3:** Tầng 1 headless gồm **Identity/SSO, API Gateway, dữ liệu cấu trúc và phi cấu trúc, Workflow**; ít nhất **một ứng dụng minh họa có giao diện Tầng 2** trong không gian H-P-D-I. Builder, hai tenant/hai luồng, mô-đun Tầng 3 và agent là mục tiêu DigiX **tự chọn cao hơn ngưỡng đề**, không thay thế bốn năng lực lõi. Tầng 3 nằm trong kiến trúc DX-OS §2 nhưng không được §3 nêu là điều kiện tối thiểu.

**Công nghệ dự kiến kế thừa:** Next.js/TypeScript cho cổng Web; NestJS/TypeScript cho API; Keycloak/OIDC, APISIX, PostgreSQL, lưu tệp tương thích S3 và workflow engine riêng (Flowable là lựa chọn tham chiếu). Quyết định sản phẩm ở tài liệu này không phụ thuộc vào một nhà cung cấp AI hay một mô hình ngôn ngữ cụ thể. Mọi thành phần phát hành phải được xác minh giấy phép đúng phiên bản.

### 2.2. Đối tượng sử dụng

| Vai trò                          | Công việc chính                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Quản trị nền tảng                | Cấp tenant, vận hành dịch vụ; mặc định không đọc nội dung doanh nghiệp.                                           |
| Chủ doanh nghiệp/quản trị tenant | Mời người dùng, cấp vai trò, phê duyệt/xuất bản cấu hình, bật mô-đun, quản trị nguồn tri thức.                    |
| Người thiết kế quy trình         | Cung cấp mô tả, sửa bản nháp chuẩn hóa, định nghĩa biểu mẫu, quyền và điều kiện; chỉ xuất bản nếu được cấp quyền. |
| Nhân viên                        | Tạo hồ sơ và thực hiện công việc được giao bằng ứng dụng đã xuất bản.                                             |
| Người phê duyệt/quản lý          | Xử lý bước được giao, xem lịch sử và báo cáo trong phạm vi quyền.                                                 |
| Nhà phát triển mô-đun/đối tác    | Dùng API và dữ liệu mẫu theo phạm vi được cấp; không có quyền mặc định với dữ liệu thật.                          |

Một người có thể giữ nhiều vai trò; mọi thao tác vẫn phải được API kiểm tra theo tenant, đối tượng, trạng thái và hành động.

### 2.3. Luồng giá trị đầu-cuối

1. Quản trị tạo tenant và mời người dùng; chọn bộ vai trò ban đầu.
2. Người thiết kế nhập mô tả quy trình hiện tại qua biểu mẫu có cấu trúc (có thể đính kèm tài liệu làm nguồn tham chiếu).
3. Hệ thống ánh xạ mô tả sang bản nháp chuẩn hóa: bước, vai trò, dữ liệu, điều kiện, ngoại lệ; đánh dấu thông tin thiếu hoặc mâu thuẫn và liên kết về nguồn.
4. Người có quyền xem, sửa, kiểm tra và **xác nhận** bản nháp; cấu hình biểu mẫu, tuyến giao việc, hạn mức và quyền xem.
5. Chạy thử trên dữ liệu mẫu, kiểm tra ánh xạ Tầng 1/2/3 và H-P-D-I lúc vận hành, xử lý lỗi; xuất bản phiên bản ứng dụng. Phiên bản đang chạy không bị sửa ngầm.
6. Nhân viên làm việc trên giao diện ứng dụng ở Tầng 2; dịch vụ Tầng 1 xác thực, lưu dữ liệu, thực thi workflow và audit; mô-đun Tầng 3 bổ sung nghiệp vụ/tích hợp nếu có.
7. Trợ lý trong ứng dụng đã xuất bản trả lời từ tài liệu/cấu hình/hồ sơ được phép của ứng dụng và tenant, dẫn nguồn; góp ý cải tiến quy trình nhưng không tự áp dụng.
8. Doanh nghiệp tạo phiên bản mới để thích nghi khi nhu cầu thay đổi; các hồ sơ cũ tiếp tục gắn với phiên bản đã khởi chạy.

### 2.4. Giả định và điểm cần xác nhận

- Bản tối thiểu hỗ trợ **cấu hình** bằng trình hướng dẫn và trình biên tập; không cam kết sinh toàn bộ mã ứng dụng hay giao diện tùy ý từ một câu lệnh.
- AI là bộ phận hỗ trợ chuẩn hóa và tra cứu; nếu thiếu nguồn tin cậy hoặc dịch vụ AI không khả dụng, người dùng vẫn có thể nhập/chỉnh quy trình thủ công và vận hành ứng dụng đã xuất bản.
- Bản trình diễn dùng schema trung gian có phiên bản, ánh xạ sang workflow engine; xuất BPMN và trình dựng màn hình tùy ý không thuộc phạm vi tối thiểu (xem mục 6). Chi tiết định dạng và công cụ thực thi cần được đội chốt khi thiết kế kỹ thuật.
- Đã đối chiếu đề/thể lệ VFOSSA tính đến 05/11/2026; cần theo dõi thông báo mới. Hạn gửi bài **17:00 ngày 06/12/2026**, release phải có trước khi gửi; phần trình bày chung kết **15 phút** (Thể lệ ghi ngày 10/12/2026).

## 3. Yêu cầu chức năng

Mỗi yêu cầu dưới đây mô tả **hành vi phải kiểm chứng**, không khẳng định đã xây xong. Ưu tiên A tạo thành lát cắt xuyên ba tầng; ưu tiên B/C không được làm hỏng khả năng chạy thủ công của A.

### 3.1. Tenant, lõi và an toàn

| Mã         | Ưu tiên | Yêu cầu và điều kiện nghiệm thu                                                                                                                                                                    |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-CORE-01 | A       | Quản trị tạo ít nhất hai tenant độc lập; người dùng đăng nhập SSO, chuyển vào đúng tenant; người dùng không thuộc tenant bị từ chối.                                                               |
| FR-CORE-02 | A       | Mọi API nghiệp vụ xác thực token và kiểm tra `tenant_id`, vai trò, quyền trên bản ghi, trạng thái; thử đọc/sửa hồ sơ của tenant khác phải bị từ chối kể cả khi gọi API trực tiếp.                  |
| FR-CORE-03 | A       | Mọi API từ Web/mô-đun đi qua Gateway; Gateway định tuyến, giới hạn tần suất, ghi sự kiện bị chặn; dịch vụ nghiệp vụ không dựa riêng vào Gateway để phân quyền.                                     |
| FR-CORE-04 | A       | Lưu bản ghi cấu trúc và tệp có tham chiếu tenant; chỉ cấp quyền truy cập tệp sau kiểm tra quyền/loại/kích thước/quét mã độc; URL tệp có hạn.                                                       |
| FR-CORE-05 | A       | Workflow engine là nguồn trạng thái thực thi của phiên quy trình; dừng cổng Web/khởi động lại API không làm mất bước hoặc quyết định đã ghi.                                                       |
| FR-CORE-06 | A       | Ghi audit cho đăng nhập, thay đổi quyền/cấu hình, xuất bản, quyết định workflow và truy cập bị từ chối: ai, tenant, đối tượng, phiên bản, thời điểm, kết quả; không cho người dùng thường sửa/xóa. |

### 3.2. Thiết kế hệ thống của doanh nghiệp

| Mã        | Ưu tiên | Yêu cầu và điều kiện nghiệm thu                                                                                                                                                                                                                                                              |
| --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-BLD-01 | A       | Người có quyền tạo một dự án ứng dụng trong tenant, đặt tên, mô tả mục tiêu, vai trò và bộ phận; dự án ở trạng thái nháp, không tự xuất bản.                                                                                                                                                 |
| FR-BLD-02 | A       | Nhập quy trình bằng biểu mẫu cấu trúc: đầu vào, bước, người chịu trách nhiệm, điều kiện rẽ nhánh, đầu ra và ngoại lệ; lưu bản mô tả gốc và nguồn tham chiếu. Nhập thiếu dữ liệu phải báo trường cần bổ sung.                                                                                 |
| FR-BLD-03 | A       | Chuyển bản mô tả thành **bản nháp quy trình chuẩn hóa** có điểm bắt đầu/kết thúc, bước, vai trò, biểu mẫu, điều kiện và nhánh ngoại lệ; hiển thị ánh xạ từng bước về nội dung gốc, đánh dấu chỗ chưa rõ. Có đường nhập/chỉnh thủ công khi không dùng AI.                                     |
| FR-BLD-04 | A       | Trình biên tập cho phép người có quyền sửa bước, vai trò, biểu mẫu, trường dữ liệu, quy tắc kiểm tra và tuyến duyệt theo tenant; kiểm tra trước khi xuất bản: không có bước mất người phụ trách, nhánh không có đích, vai trò không tồn tại hoặc thiếu điều kiện bắt buộc.                   |
| FR-BLD-05 | A       | Chạy thử quy trình trên dữ liệu mẫu và xem đường đi/kết quả; chỉ vai trò được cấp mới xuất bản phiên bản bất biến. Thay đổi sau đó tạo phiên bản mới, có lịch sử và cách quay về phiên bản trước; hồ sơ đang chạy giữ phiên bản ban đầu trừ khi có thao tác chuyển phiên bản được kiểm soát. |
| FR-BLD-06 | A       | Tạo ứng dụng mới từ ít nhất một mẫu nghiệp vụ mua sắm; chọn mẫu chỉ tạo bản nháp của tenant, không ghi đè dữ liệu hoặc ép mọi doanh nghiệp dùng cùng một quy trình. Các mẫu nghiệp vụ khác là phần mở rộng. |
| FR-BLD-07 | B       | Cho phép thay đổi cấu hình đã xuất bản bằng quy trình đề xuất → xem khác biệt → duyệt → phát hành; thông báo tác động đến người dùng, dữ liệu và các tích hợp liên quan.                                                                                                                     |

**FR-BLD-08 (A) — Kiểm tra hợp đồng trước khi xuất bản:** bản nháp phải khai báo ứng dụng/tenant/phiên bản, mô hình quyền và vai trò (H), quy trình có phiên bản (P), schema và nguồn dữ liệu (D), nguồn tri thức/quyền truy xuất và điểm hiển thị trợ lý (I), cùng mô-đun/đầu nối Tầng 3 nếu dùng. Trình chạy thử chứng minh giao diện Tầng 2 gọi dịch vụ Tầng 1 qua Gateway; mô-đun Tầng 3 không được nối thẳng CSDL hoặc tạo Gateway/SSO riêng. Thiếu ánh xạ hay kiểm tra quyền thì chặn xuất bản; cấu hình chưa có tài liệu AI vẫn có thể xuất bản nhưng phải hiển thị trạng thái I chưa có nguồn, không bịa câu trả lời.

**Giới hạn builder (A):** người thiết kế cấu hình vai trò, biểu mẫu/trường/kiểm tra dữ liệu, bước quy trình, điều kiện và tuyến giao việc. Giao diện ứng dụng được dựng từ mẫu danh sách, biểu mẫu, chi tiết, hộp việc và dashboard; không yêu cầu kéo-thả bố cục tùy ý hay sinh toàn bộ mã nguồn ứng dụng. Schema trung gian có định danh/phiên bản, vai trò, điểm bắt đầu/kết thúc, bước, nhánh, dữ liệu và ngoại lệ; có kiểm tra tính hợp lệ trước khi ánh xạ sang workflow engine. Người thiết kế chịu trách nhiệm rà soát nội dung nghiệp vụ; quản trị tenant/chủ doanh nghiệp hoặc người được ủy quyền xác nhận trước khi xuất bản. AI chỉ đề xuất bản nháp, không xác nhận tính đúng đắn nghiệp vụ.

**Tiêu chí “chuẩn hóa”:** chuẩn hóa _hình thức mô tả và khả năng thực thi_, không tuyên bố tự động biến mọi thực tiễn của doanh nghiệp thành “quy trình tốt nhất”. Hệ thống phải chỉ ra thông tin chưa biết, không tự bịa người duyệt, ngưỡng tiền hay quy định pháp lý.

### 3.3. Không gian làm việc và ứng dụng Tầng 3

| Mã        | Ưu tiên | Yêu cầu và điều kiện nghiệm thu                                                                                                                                                                                                                                                                          |
| --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-WRK-01 | A       | Sau xuất bản, người dùng được phép tạo hồ sơ bằng biểu mẫu của ứng dụng; kiểm tra dữ liệu trước khi gửi, lưu nháp, gửi không tạo hồ sơ trùng khi thử lại cùng yêu cầu.                                                                                                                                   |
| FR-WRK-02 | A       | Hộp việc hiển thị đúng việc được giao; người có quyền xem hồ sơ và xử lý theo nhánh quy trình; API chặn tự duyệt khi cấu hình cấm và chặn xử lý lại công việc đã hoàn tất.                                                                                                                               |
| FR-WRK-03 | A       | Màn hình lịch sử thể hiện trạng thái, người xử lý, lý do, thời điểm và phiên bản quy trình; dashboard chỉ dùng dữ liệu có quyền xem, mỗi chỉ số truy về hồ sơ nguồn.                                                                                                                                     |
| FR-WRK-04 | A       | Trong **mỗi ứng dụng đã xuất bản**, người dùng thấy vai trò/việc của mình (H), bước và trạng thái quy trình (P), hồ sơ và nguồn số liệu được phép (D), điểm truy cập trợ lý/cảnh báo theo ngữ cảnh ứng dụng (I); nếu chưa có nguồn AI hoặc AI tạm ngừng, I báo rõ không khả dụng và H/P/D vẫn hoạt động. |
| FR-L3-01  | A       | Cài một **mẫu ứng dụng mua sắm** trên tenant A, cấu hình biểu mẫu và ngưỡng duyệt; tenant B dựng một **quy trình khác** (ví dụ nghỉ phép) từ cùng bộ công cụ mà không sửa mã lõi. Hai luồng đều có ít nhất một bước giao việc và một nhánh quyết định chạy được.                                         |
| FR-L3-02  | B       | Đầu nối kế toán/kho mô phỏng nhận sự kiện khi mua sắm được duyệt, có thử lại và chống gửi trùng; hiển thị rõ là mô phỏng. Mô-đun có thể tắt mà không làm mất dữ liệu lõi.                                                                                                                                |
| FR-L3-03  | C       | Công bố danh mục API và giao diện cắm-rút mô-đun có phiên bản, giấy phép, quyền xin cấp và cách gỡ/khôi phục.                                                                                                                                                                                            |

### 3.4. Agent thích nghi theo doanh nghiệp

| Mã       | Ưu tiên | Yêu cầu và điều kiện nghiệm thu                                                                                                                                                                                                                                                     |
| -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-AI-01 | A       | Quản trị tenant chỉ định tài liệu chính sách và cấu hình ứng dụng đã xuất bản nào được lập chỉ mục; tệp lưu trong kho tệp, metadata/quyền và chỉ mục FTS/vector (`pgvector`) trong PostgreSQL, phân tách/lọc theo tenant, app, phiên bản và quyền hiện hành; quá trình nạp ghi nguồn, thời điểm, phiên bản, trạng thái. Không mặc định nạp toàn bộ dữ liệu doanh nghiệp. |
| FR-AI-02 | A       | Trợ lý truy xuất theo `tenant_id` **và quyền của người hỏi tại thời điểm truy vấn**, trả lời/đề xuất có dẫn nguồn tới tài liệu hoặc phiên bản cấu hình; nếu không đủ bằng chứng phải nói không biết hoặc yêu cầu bổ sung.                                                           |
| FR-AI-03 | A       | Trợ lý có thể đề xuất ánh xạ bản mô tả sang quy trình chuẩn hóa và cảnh báo bước thiếu/mâu thuẫn; đề xuất ở trạng thái nháp, người dùng sửa và xác nhận trước khi xuất bản. Không tự phê duyệt hồ sơ, thay đổi quyền, gọi tích hợp có tác động hoặc tự cập nhật cấu hình đang chạy. |
| FR-AI-04 | A       | Sau khi giao dịch thu hồi quyền/xóa nguồn được commit và API xác nhận, truy vấn mới không được dùng nguồn đó dù chunk còn trong chỉ mục; kiểm tra lại trước khi trả đáp án đang xử lý; dọn chỉ mục bất đồng bộ mục tiêu ≤ 24 giờ. Kiểm thử không rò rỉ qua trích dẫn, log hoặc kết quả tìm kiếm khi index worker đang dừng. |
| FR-AI-05 | A       | Bản demo chỉ dùng suy luận và embedding **nội bộ** qua adapter (dự kiến `llama.cpp`), không bật AI bên ngoài; chỉ chọn trọng số model khi đã xác minh giấy phép, chất lượng tiếng Việt và tài nguyên máy. Không lưu nội dung prompt/đáp án mặc định hoặc dùng dữ liệu doanh nghiệp để tự huấn luyện. |
| FR-AI-06 | A       | Trong ứng dụng đã xuất bản, truy vấn trợ lý mang `app_id` và phiên bản ứng dụng/quy trình hiện hành; tìm kiếm chỉ trong nguồn được phép của tenant, ứng dụng và người hỏi; cùng câu hỏi ở hai ứng dụng hoặc hai tenant không được trộn nguồn hay hiển thị trích dẫn chéo.           |

**Ý nghĩa “thích nghi”:** agent dùng tri thức được chọn, quyền hiện hành và cấu hình/phiên bản quy trình của **ứng dụng trong doanh nghiệp đang đăng nhập** để trả lời khác nhau theo ngữ cảnh. Điều này có thể triển khai bằng truy xuất có kiểm soát (RAG) và cấu hình, **không** hứa hẹn mô hình tự huấn luyện hay tự vận hành doanh nghiệp.

## 4. Yêu cầu phi chức năng và giao diện ngoài

| Mã         | Nhóm            | Yêu cầu/tiêu chí đề xuất                                                                                                                                                                                    |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-SEC-01 | Bảo mật         | OAuth2/OIDC; MFA cho tài khoản quyền cao; TLS cho kết nối; bí mật không nằm trong mã nguồn; áp dụng nguyên tắc quyền tối thiểu và OWASP Top 10.                                                             |
| NFR-SEC-02 | Cách ly         | Lọc tenant ở lớp truy cập dữ liệu dùng chung hoặc RLS; kiểm tra tương đương tại tìm kiếm, dashboard, tệp, workflow, sự kiện và agent. Test âm giữa hai tenant và hai vai trò là điều kiện phát hành.        |
| NFR-AI-01  | AI có kiểm soát | [Thiết kế RAG/vòng đời dữ liệu](DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md): chỉ dùng nguồn có quyền hiện hành; không lưu nội dung prompt/đáp án mặc định; audit metadata đề xuất 90 ngày, bản sao lưu mã hóa đề xuất vòng quay 30 ngày; thu hồi quyền trước khi báo thành công, dọn chỉ mục mục tiêu ≤ 24 giờ. Hạn lưu/xóa phải được đội xác nhận và đo khi triển khai; không bật AI bên ngoài trong demo. |
| NFR-REL-01 | Tin cậy         | Workflow bền vững; sao lưu PostgreSQL và kho tệp, thử khôi phục; mọi sự kiện ra ngoài có định danh chống trùng và cơ chế thử lại.                                                                           |
| NFR-PER-01 | Hiệu năng       | Mục tiêu ban đầu: API đọc thông thường p95 < 2 giây, cổng việc cần làm < 3 giây ở môi trường thử; thời gian xử lý AI đo riêng, không chặn luồng thủ công. Các ngưỡng cần xác nhận bằng đo tải.              |
| NFR-UX-01  | Dễ dùng         | Giao diện tiếng Việt, responsive, lỗi biểu mẫu chỉ rõ cách sửa; luồng thiết kế/duyệt cấu hình nêu rõ đây là bản nháp, bản chạy thử hay phiên bản đã xuất bản.                                               |
| NFR-MNT-01 | Bảo trì         | API có phiên bản và OpenAPI; cấu hình ứng dụng có thể xuất/nhập theo định dạng mở được tài liệu hóa; triển khai từ mã nguồn, CI chạy kiểm thử và cấu hình có phiên bản.                                     |
| NFR-OSS-01 | Nguồn mở        | Điều kiện dự thi theo Thể lệ: repo công khai và giấy phép OSI-approved. Chuẩn bị LICENSE toàn văn, thông báo giấy phép trong từng tệp mã, README/build guide, CHANGELOG, bug tracker và release có phiên bản/định dạng mở **trước hạn gửi bài 17:00 06/12/2026**; rà soát tương thích giấy phép phụ thuộc, chứng minh cài/build từ mã nguồn và chạy ngoài thư mục nguồn. |

**Giao diện ngoài:** Builder **và giao diện của ứng dụng đã xuất bản** (Next.js) gọi API NestJS qua Gateway bằng HTTPS; xác thực qua OIDC dùng chung; API nghiệp vụ kết nối kho dữ liệu và workflow engine; tệp truy cập bằng URL có thời hạn sau khi API cấp quyền; mô-đun Tầng 3 dùng API có phiên bản và sự kiện/webhook đã xác thực. Frontend, kể cả phần chạy phía máy chủ của Next.js, không nối trực tiếp PostgreSQL/kho tệp; hệ thống ngoài chỉ dùng dữ liệu mẫu hoặc kết nối được cấp phép.

## 5. Nghiệm thu, truy vết và kịch bản demo

### 5.1. Kịch bản nghiệm thu xuyên ba tầng

1. Tạo tenant A và B; mỗi tenant có quản trị, người thiết kế và người thực hiện riêng; xác nhận SSO và API Gateway hoạt động.
2. Tenant A lấy mẫu mua sắm, nhập mô tả riêng, xem bản nháp được chuẩn hóa, sửa ngưỡng duyệt, kiểm tra hợp đồng ba tầng/H-P-D-I, chạy thử rồi xuất bản v1.
3. Tenant B nhập quy trình nghỉ phép khác (không sao chép luồng mua sắm), **tự cấu hình qua builder** biểu mẫu/bước giao việc/nhánh quyết định, kiểm tra hợp đồng, chạy thử rồi xuất bản v1 từ **cùng** hệ thống; không sửa hoặc triển khai lại mã lõi, không dùng luồng nghỉ phép viết cứng.
4. Người dùng A tạo đề nghị; quản lý A duyệt/từ chối; người dùng B nộp nghỉ phép; trạng thái và nhật ký hai luồng tồn tại sau khi làm mới giao diện/khởi động lại API.
5. Sửa quy trình A, xuất bản v2; hồ sơ A đã mở ở v1 vẫn gắn v1, hồ sơ mới theo v2; B không bị ảnh hưởng.
6. Trong **từng ứng dụng đã xuất bản**, kiểm tra H (người/việc), P (bước đang chạy), D (hồ sơ/chỉ số nguồn), I (trợ lý theo ngữ cảnh hoặc trạng thái chưa có nguồn); hỏi agent A và B cùng một câu: câu trả lời chỉ dẫn nguồn được phép của ứng dụng/tenant; tài khoản không đủ quyền không truy ra tài liệu hạn chế. Tắt AI và xác nhận các thao tác H/P/D vẫn chạy.
7. Truy một số liệu dashboard về hồ sơ gốc; thử gọi API, URL tệp và truy vấn agent chéo tenant đều bị chặn và có audit phù hợp.

### 5.2. Ma trận truy vết tối thiểu

| Mục tiêu                                 | Yêu cầu                                | Ca kiểm thử                                                                                                                                                           |
| ---------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hai doanh nghiệp, một nền tảng           | FR-CORE-01..06, FR-L3-01               | TC-TEN-01: hai tenant/cấu hình khác nhau; TC-TEN-02: truy cập chéo bị chặn                                                                                            |
| Nhập và chuẩn hóa quy trình              | FR-BLD-01..04, FR-AI-03                | TC-BLD-01: ánh xạ nguồn; TC-BLD-02: thiếu vai trò/nhánh bị báo lỗi; TC-BLD-03: chỉnh thủ công không cần AI                                                            |
| Kiểm tra, xuất bản, thay đổi             | FR-BLD-05, FR-WRK-01..03               | TC-PUB-01: nháp không chạy thật; TC-PUB-02: phiên v1/v2 và hồ sơ đang chạy                                                                                            |
| Ứng dụng xuất bản theo open-core ba tầng | FR-BLD-08, FR-CORE-01..06, FR-L3-01    | TC-ARC-01: cả hai ứng dụng dùng chung SSO/Gateway/API/workflow; TC-ARC-02: Tầng 3 không vượt Gateway/quyền; TC-ARC-03: thiếu hợp đồng bị chặn xuất bản                |
| H-P-D-I khi vận hành từng ứng dụng       | FR-WRK-01..04, FR-AI-02, FR-AI-06      | TC-HPDI-01: kiểm tra H/P/D/I ở ứng dụng A và B; TC-HPDI-02: không có nguồn AI thì I báo rõ, H/P/D vẫn chạy; TC-HPDI-03: truy vấn agent không trộn nguồn giữa ứng dụng |
| Hệ sinh thái Tầng 3                      | FR-L3-01..02                           | TC-L3-01: hai mẫu luồng chạy; TC-L3-02: connector mô phỏng không gửi trùng                                                                                            |
| Agent theo ngữ cảnh và quyền             | FR-AI-01..04, NFR-AI-01                | TC-AI-01: dẫn nguồn đúng tenant; TC-AI-02: quyền bị thu hồi không còn truy xuất; TC-AI-03: AI không tự xuất bản                                                       |
| Truy vết, an toàn, phục hồi              | FR-CORE-04..06, NFR-SEC-02, NFR-REL-01 | TC-AUD-01: audit quyết định/xuất bản; TC-REL-01: khởi động lại giữ trạng thái; TC-DAT-01: dashboard truy về hồ sơ                                                     |

### 5.3. Điều kiện hoàn tất bản tối thiểu

- Chứng minh được **khả năng tạo hệ thống cho hai doanh nghiệp khác nhau**, chứ không chỉ chạy một ứng dụng mua sắm được viết cứng.
- Quy trình nghỉ phép được tạo và chạy từ cấu hình builder, không sửa mã lõi; hai ví dụ chỉ chứng minh tính tổng quát **trong phạm vi builder đã xây**, không tuyên bố hỗ trợ mọi ngành/quy trình.
- Lát cắt từ nhập mô tả → chuẩn hóa/chỉnh tay → chạy thử → xuất bản → làm việc → truy vết hoạt động xuyên ba tầng; **ứng dụng được xuất bản**, không riêng builder, dùng chung lõi open-core và có trải nghiệm H-P-D-I khi vận hành.
- AI có thể tắt mà luồng thiết kế và vận hành vẫn chạy; không có thao tác nguy hiểm do AI tự quyết.
- Kiểm thử quyền/tenant có trường hợp thất bại và không rò rỉ qua dữ liệu, tệp, báo cáo hoặc câu trả lời agent.
- Có bằng chứng cho ngưỡng Đề §3 và giải trình bốn nguyên lý §4; bảng bảy lớp tham chiếu và tuân thủ nguồn mở được tổng hợp riêng; không đánh dấu đạt chỉ vì đã liệt kê tên công nghệ.

## 6. Quyết định phạm vi và việc cần xác minh

### 6.1. Định hướng đã được người yêu cầu xác nhận

| Chủ đề | Phạm vi chốt cho bản trình diễn | Chưa cam kết |
| --- | --- | --- |
| Builder | Cấu hình vai trò, biểu mẫu/trường, dữ liệu, điều kiện, các bước và tuyến giao việc; giao diện từ các mẫu danh sách, biểu mẫu, chi tiết, hộp việc, dashboard. | Kéo-thả màn hình tùy ý; sinh mã ứng dụng hoàn chỉnh từ lời nhắc. |
| Quy trình chuẩn hóa | Schema trung gian **có phiên bản** cho bước, vai trò, điều kiện, dữ liệu, ngoại lệ; kiểm tra rồi ánh xạ sang workflow engine. Người thiết kế rà soát; người có quyền xuất bản của tenant xác nhận. | Tự chứng nhận quy trình đúng nghiệp vụ; xuất BPMN bắt buộc. |
| Agent | [Phương án RAG nội bộ](DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md): chỉ nạp chính sách được chọn và cấu hình ứng dụng xuất bản; kho tệp lưu nguồn, PostgreSQL giữ metadata/quyền + FTS/pgvector; suy luận/embedding nội bộ, kiểm quyền nguồn tại DB ngay sau thu hồi và trước trả lời; dọn index sau. | Nạp mọi hồ sơ mặc định; gọi AI ngoài trong demo; tự huấn luyện; tuyên bố đã xóa mọi backup sau 24 giờ. |
| Minh chứng tính tổng quát | Mua sắm ở tenant A và **nghỉ phép được tạo mới bằng builder** ở tenant B trên cùng lõi ba tầng; có thay đổi phiên bản mà không sửa mã lõi. | Tuyên bố đã đáp ứng mọi ngành hoặc mọi quy trình. |
| Bảy lớp và đề thi | [Đã đối chiếu Đề §3–4](OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md): bốn dịch vụ lõi headless + ít nhất một app UI Tầng 2 là ngưỡng rõ ràng; bốn nguyên lý kỹ thuật cần có giải trình/bằng chứng. Bảy lớp là **giải pháp công nghệ tham chiếu**, không phải bảy stack bắt buộc. | Không gọi WAF, NGSI-LD, lakehouse, ledger, bản đồ, OCR... là từng sản phẩm bắt buộc; cũng không bỏ qua nguyên lý §4 chỉ vì stack là ví dụ. |
| Thứ tự thực hiện | Lõi tenant/quyền/workflow → builder tối thiểu → xuất bản/chạy ứng dụng → hai quy trình khác nhau → kiểm thử cách ly → agent → phần bảy lớp nâng cao; giữ mốc đóng băng tính năng cho kiểm thử và chuẩn bị nguồn mở. | Giữ nguyên roadmap cũ hoặc coi các mốc/owner hiện tại đã được cả đội phê duyệt. |

### 6.2. Việc còn phải xác minh và cập nhật

1. Đã có [đề xuất thiết kế builder, schema, ánh xạ Flowable, quyền xuất bản và fixture nghỉ phép](DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md) để cả đội review. **Chưa được cả đội ký duyệt, chưa chạy thử thật:** chỉ đánh dấu hoàn tất khi TC-LEAVE-01..07 chạy trên ứng dụng được tạo bằng builder, không viết cứng và có bằng chứng.
2. **Đã đối chiếu** [Đề §2–6 và Thể lệ 2026](OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md) theo từng lớp và tiêu chí chấm: phải làm đủ bốn dịch vụ lõi và ít nhất một app UI Tầng 2; bảy lớp/stack là tham chiếu, bốn nguyên lý §4 vẫn cần bằng chứng. Hai luồng demo là quyết định DigiX, không phải điều kiện đủ điểm. **Còn lại:** theo dõi thông báo mới của BTC, tạo bằng chứng kỹ thuật và sửa roadmap theo hạn nộp **17:00 06/12/2026**, 15 phút trình bày.
3. **Đã soạn [thiết kế chỉ mục, suy luận nội bộ, lưu/xóa và kịch bản thu hồi quyền](DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md)** (TC-AI-REV-01..04, TC-AI-ISO-01, TC-AI-OFF-01). **Chưa hoàn tất thực nghiệm:** đội phải xác nhận model/trọng số/giấy phép, tài nguyên máy, thời hạn retention và chạy test worker dừng/chưa xóa index/in-flight request trên hệ thống thật trước khi tuyên bố quyền đã được chặn đúng.
4. Cập nhật [roadmap](digix-roadmap.md), phân công owner/reviewer, máy chủ và ngân sách, mốc kiểm thử hai tenant và feature freeze; ghi rõ người xác nhận và ngày chốt. Việc người yêu cầu đồng ý định hướng **không thay thế phê duyệt của toàn đội**.
