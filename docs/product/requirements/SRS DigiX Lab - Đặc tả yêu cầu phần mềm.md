# Đặc tả yêu cầu phần mềm (SRS) — DigiX Lab

**Phiên bản:** v2.5 (đề xuất thay đổi định hướng: ứng dụng ERP/CRM lắp ghép)  
**Ngày:** 25/11/2026  
**Nguồn kế thừa:** [SRS DigiX v1.5](SRS%20DigiX%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md)  
**Tổ chức:** DigiX · **Kho mã nguồn:** [githubcuaan/digi](https://github.com/githubcuaan/digi)

> Định hướng ERP/CRM lắp ghép trong bản này do người yêu cầu đề xuất;
> **chưa được toàn đội chốt phạm vi, tiến độ hay xác nhận hiện thực**.
> Bản v1.5 được giữ nguyên để đối chiếu.
> [Roadmap](../../delivery/roadmap.md), thiết kế builder/UI và kịch bản demo cũ vẫn theo phạm vi v2.4,
> cần đánh giá lại trước khi dùng làm kế hoạch triển khai.
> Các mức ưu tiên dưới đây là mục tiêu sản phẩm, không phải bằng chứng đã làm xong hay yêu cầu bắt buộc của đề thi.

**Nguồn thi đã đối chiếu:** [Đề thi VFOSSA](https://vfossa.vn/tin-tuc/de-thi-phan-mem-nguon-mo-olp-2026-798.html) (§2–6),
[Thể lệ 2026](https://vfossa.vn/tin-tuc/the-le-olp-phan-mem-nguon-mo-nam-2026-760.html) và [bảng đối chiếu từng lớp/tiêu chí](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md).
Mức A/B/C do DigiX tự đặt, không phải mức bắt buộc của BTC.

## 1. Giới thiệu

### 1.1. Mục đích và tầm nhìn

**DigiX Lab** là nền tảng mã nguồn mở giúp mỗi doanh nghiệp lắp ghép **ứng dụng vận hành ERP/CRM vừa đủ nhu cầu** trên một lõi dùng chung.
Doanh nghiệp chọn các chức năng nghiệp vụ có sẵn, cấu hình dữ liệu, vai trò, quy trình và tự bố trí giao diện cho ứng dụng của mình;
có thể bổ sung chức năng mới qua hợp đồng mở rộng có kiểm soát.
Nhân viên dùng ứng dụng đã xuất bản để làm việc hằng ngày.
DigiX không buộc mọi doanh nghiệp dùng cùng một bộ phân hệ hay một giao diện cồng kềnh.

**Tuyên bố giá trị có thể kiểm chứng:** cùng một bản triển khai nền tảng phải cho doanh nghiệp A lắp ghép một ứng dụng ERP tối giản và doanh nghiệp B lắp ghép một ứng dụng CRM tối giản;
mỗi bên chỉ thấy chức năng và giao diện mình chọn, không sửa mã nguồn lõi, không để dữ liệu của bên này xuất hiện ở bên kia.

**Phân biệt với bản v1.5/v2.4:**
mua sắm và nghỉ phép chỉ là ví dụ quy trình;
đối tượng nghiệm thu mới là **chọn, ghép, tùy biến và vận hành các chức năng ERP/CRM** thành hai ứng dụng khác nhau, không chỉ tạo hai luồng duyệt hồ sơ.

### 1.2. Phạm vi và giới hạn

Trong phạm vi bản tối thiểu, nền tảng cho phép:

- khởi tạo không gian doanh nghiệp;
- quản lý người dùng và quyền;
- duyệt danh mục chức năng ERP/CRM có sẵn, chọn/bỏ chọn theo nhu cầu;
- cấu hình thực thể, trường dữ liệu, quy tắc nghiệp vụ, vai trò, luồng xử lý và mối liên hệ giữa các chức năng đã chọn;
- thiết kế giao diện ứng dụng theo cấu hình: trang, menu, bố cục, thành phần, biểu mẫu, bảng và dashboard gắn dữ liệu/hành động theo quyền;
- thu thập mô tả quy trình, đề xuất rồi xác nhận một quy trình có cấu trúc khi cần;
- xuất bản phiên bản ứng dụng nội bộ;
- vận hành ứng dụng đã xuất bản theo kiến trúc open-core ba tầng và không gian làm việc H-P-D-I;
- thực hiện nghiệp vụ ERP/CRM đã chọn, chạy công việc, theo dõi tiến độ và xem lịch sử;
- trợ lý truy xuất tri thức được phép trong phạm vi doanh nghiệp.

Ngoài phạm vi bản tối thiểu:

- tự động hiểu chính xác mọi quy trình phi cấu trúc;
- tự động xuất bản hoặc thay đổi quy trình mà không có người xác nhận;
- agent tự học hoặc tự huấn luyện trên dữ liệu doanh nghiệp;
- agent tự phê duyệt, chuyển tiền, cấp quyền hay gửi dữ liệu ra ngoài;
- bộ ERP/CRM đầy đủ mọi phân hệ, kế toán tuân thủ pháp luật, kê khai thuế, hóa đơn điện tử hoặc tích hợp ngân hàng thật trong bản demo;
- tự sinh chức năng nghiệp vụ chưa có trong danh mục từ một câu lệnh, hoặc cho phép mã tùy ý chạy không kiểm soát trong tenant;
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
| Chức năng có sẵn    | Đơn vị nghiệp vụ ERP/CRM có hợp đồng dữ liệu, hành động, quyền, sự kiện và các thành phần giao diện; có thể bật và cấu hình trong ứng dụng theo phụ thuộc được công bố.                                                        |
| Ứng dụng lắp ghép   | Tập chức năng được doanh nghiệp chọn cùng dữ liệu, giao diện, quy trình và quyền đã cấu hình; chức năng không chọn không hiển thị hoặc cấp quyền truy cập.                                                                     |
| Giao diện tùy biến  | Doanh nghiệp tạo/sắp xếp trang, bố cục và thành phần được nền tảng hỗ trợ, liên kết dữ liệu/hành động đã đăng ký; không đồng nghĩa thực thi mã tùy ý hay sinh mọi chức năng từ văn bản.                                        |
| Ứng dụng xuất bản   | Phiên bản cấu hình nghiệp vụ đã được duyệt, chạy bằng dịch vụ dùng chung Tầng 1, trải nghiệm thiết kế/vận hành H-P-D-I ở Tầng 2 và năng lực miền nghiệp vụ/đầu nối Tầng 3 khi cần; không phải bản sao độc lập của cả nền tảng. |
| Agent thích nghi    | Trợ lý sử dụng cấu hình và nguồn dữ liệu được phép của tenant để trả lời/đề xuất theo ngữ cảnh; không hàm ý tự huấn luyện mô hình hoặc sở hữu quyền quyết định nghiệp vụ.                                                      |
| H-P-D-I             | Con người số, Quy trình số, Dữ liệu số, Trí tuệ số: năng lực ở Tầng 2 khi thiết kế **và** khi dùng ứng dụng đã xuất bản. Trí tuệ là hỗ trợ theo quyền, không thay quyết định con người.                                        |
| A/B/C               | A: bắt buộc cho lát cắt sản phẩm tối thiểu; B: nâng chất lượng; C: mở rộng. Không đồng nghĩa với mức bắt buộc của đề thi nếu chưa đối chiếu đề chính thức.                                                                     |

## 2. Mô tả tổng thể

### 2.1. Kiến trúc DX-OS Lab ba tầng

| Tầng                                            | Vai trò                                                                            | Năng lực tối thiểu                                                                                                                       | Ranh giới                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **1 — Lõi dịch vụ headless**                    | Cung cấp dịch vụ dùng chung cho mọi doanh nghiệp/ứng dụng                          | Định danh/SSO, API Gateway, phân quyền và cách ly tenant, lưu dữ liệu/tệp, workflow bền vững, audit, API có phiên bản                    | Không chứa giao diện nghiệp vụ cho người dùng cuối; Gateway không thay thế kiểm tra quyền tại API. |
| **2 — Không gian thiết kế và làm việc H-P-D-I** | Nơi doanh nghiệp lắp ghép, thiết kế giao diện **và** vận hành ứng dụng đã xuất bản | Builder trang/bố cục/thành phần và cấu hình chức năng; giao diện runtime theo quyền; vai trò (H), quy trình (P), dữ liệu (D), trợ lý (I) | Chỉ truy cập dữ liệu qua Gateway và API có kiểm tra quyền.                                         |
| **3 — Danh mục chức năng/đầu nối**              | Đóng gói chức năng nghiệp vụ ERP/CRM chọn được theo ứng dụng                       | Chức năng mua sắm, tồn kho tối giản, khách hàng và cơ hội bán hàng cho demo; hợp đồng mở rộng và đầu nối mô phỏng nếu dùng               | Không xây lại SSO/Gateway; mô-đun không truy cập trực tiếp dữ liệu của tenant khác.                |

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

**Đề §4 gọi bảng bảy lớp là giải pháp tham chiếu “để minh họa làm ví dụ” và cho phép đội tự chọn công nghệ:** không bắt buộc cài từng công nghệ hoặc mỗi lớp một stack riêng. Tuy nhiên, bốn nguyên lý kỹ thuật của §4 (vòng đời dữ liệu, IT/OT, phả hệ/chất lượng, Zero-Trust/GitOps/kiểm dịch biên) cần được giải trình và kiểm chứng; xem [bảng đối chiếu](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md). Không coi tên công nghệ hay bản thiết kế là bằng chứng đã chạy.

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
2. Doanh nghiệp chọn nhóm chức năng ERP/CRM từ danh mục, xem phụ thuộc và chỉ bật những gì cần;
   có thể nhập mô tả quy trình làm nguồn tham chiếu.
3. Người thiết kế tùy biến thực thể/trường/quy tắc, vai trò, bước xử lý và trang/menu/bố cục/thành phần;
   hệ thống kiểm tra ánh xạ dữ liệu/hành động, phụ thuộc và quyền. Nếu dùng AI đề xuất quy trình, kết quả vẫn là bản nháp cần xác nhận.
4. Người có quyền kiểm tra và **xác nhận** cấu hình chức năng, giao diện, biểu mẫu, tuyến giao việc và quyền xem;
   chức năng không chọn không xuất hiện trong ứng dụng.
5. Chạy thử trên dữ liệu mẫu, kiểm tra ánh xạ Tầng 1/2/3 và H-P-D-I lúc vận hành, xử lý lỗi;
   xuất bản phiên bản ứng dụng. Phiên bản đang chạy không bị sửa ngầm.
6. Nhân viên làm việc trên giao diện ứng dụng ở Tầng 2;
   dịch vụ Tầng 1 xác thực, lưu dữ liệu, thực thi workflow và audit;
   mô-đun Tầng 3 bổ sung nghiệp vụ/tích hợp nếu có.
7. Trợ lý trong ứng dụng đã xuất bản trả lời từ tài liệu/cấu hình/hồ sơ được phép của ứng dụng và tenant, dẫn nguồn;
   góp ý cải tiến quy trình nhưng không tự áp dụng.
8. Doanh nghiệp tạo phiên bản mới để thích nghi khi nhu cầu thay đổi; các hồ sơ cũ tiếp tục gắn với phiên bản đã khởi chạy.

### 2.4. Giả định và điểm cần xác nhận

- “Giao diện và chức năng tùy ý” nghĩa là doanh nghiệp **tự quyết định tổ hợp chức năng có sẵn và thiết kế trang/bố cục trong khả năng của builder**,
  có đường mở rộng để phát triển chức năng mới. Không hứa hẹn tự sinh mọi nghiệp vụ chưa có hoặc mã ứng dụng hoàn chỉnh từ một câu lệnh.
- AI là bộ phận hỗ trợ chuẩn hóa và tra cứu; nếu thiếu nguồn tin cậy hoặc dịch vụ AI không khả dụng, người dùng vẫn có thể nhập/chỉnh quy trình thủ công và vận hành ứng dụng đã xuất bản.
- Bản trình diễn cần schema cấu hình ứng dụng có phiên bản cho chức năng, thực thể, trang/bố cục, vai trò, hành động và workflow;
  công cụ dựng trang có khả năng sắp xếp thành phần và gắn dữ liệu/hành động. Chi tiết định dạng, thư viện thành phần và giới hạn biểu thức nghiệp vụ phải được đội chốt khi thiết kế kỹ thuật.
- Đã đối chiếu đề/thể lệ VFOSSA tính đến 05/11/2026; cần theo dõi thông báo mới. Hạn gửi bài **17:00 ngày 06/12/2026**, release phải có trước khi gửi; phần trình bày chung kết **15 phút** (Thể lệ ghi ngày 10/12/2026).

## 3. Yêu cầu chức năng

Mỗi yêu cầu dưới đây mô tả **hành vi phải kiểm chứng**, không khẳng định đã xây xong.
Ưu tiên A tạo thành lát cắt xuyên ba tầng; ưu tiên B/C không được làm hỏng khả năng chạy thủ công của A.

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

| Mã        | Ưu tiên | Yêu cầu và điều kiện nghiệm thu                                                                                                                                                                                                                                                                |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-BLD-01 | A       | Người có quyền tạo một dự án ứng dụng trong tenant, đặt tên, mô tả mục tiêu, vai trò và bộ phận; dự án ở trạng thái nháp, không tự xuất bản.                                                                                                                                                   |
| FR-BLD-02 | A       | Nhập quy trình bằng biểu mẫu cấu trúc: đầu vào, bước, người chịu trách nhiệm, điều kiện rẽ nhánh, đầu ra và ngoại lệ; lưu bản mô tả gốc và nguồn tham chiếu. Nhập thiếu dữ liệu phải báo trường cần bổ sung.                                                                                   |
| FR-BLD-03 | A       | Chuyển bản mô tả thành **bản nháp quy trình chuẩn hóa** có điểm bắt đầu/kết thúc, bước, vai trò, biểu mẫu, điều kiện và nhánh ngoại lệ; hiển thị ánh xạ từng bước về nội dung gốc, đánh dấu chỗ chưa rõ. Có đường nhập/chỉnh thủ công khi không dùng AI.                                       |
| FR-BLD-04 | A       | Trình biên tập cho phép người có quyền sửa bước, vai trò, biểu mẫu, trường dữ liệu, quy tắc kiểm tra và tuyến duyệt theo tenant; kiểm tra trước khi xuất bản: không có bước mất người phụ trách, nhánh không có đích, vai trò không tồn tại hoặc thiếu điều kiện bắt buộc.                     |
| FR-BLD-05 | A       | Chạy thử quy trình trên dữ liệu mẫu và xem đường đi/kết quả; chỉ vai trò được cấp mới xuất bản phiên bản bất biến. Thay đổi sau đó tạo phiên bản mới, có lịch sử và cách quay về phiên bản trước; hồ sơ đang chạy giữ phiên bản ban đầu trừ khi có thao tác chuyển phiên bản được kiểm soát.   |
| FR-BLD-06 | A       | Danh mục cho phép chọn/bỏ từng chức năng và thông báo phụ thuộc: demo ERP gồm danh mục vật tư, yêu cầu mua hàng và nhập/xem tồn kho đơn giản; demo CRM gồm khách hàng/liên hệ, cơ hội và giai đoạn bán hàng. Chọn chức năng tạo cấu hình riêng của tenant; không mặc định bật toàn bộ ERP/CRM. |
| FR-BLD-07 | B       | Cho phép thay đổi cấu hình đã xuất bản bằng quy trình đề xuất → xem khác biệt → duyệt → phát hành; thông báo tác động đến người dùng, dữ liệu và các tích hợp liên quan.                                                                                                                       |

**FR-BLD-08 (A) — Kiểm tra hợp đồng trước khi xuất bản:** bản nháp phải khai báo ứng dụng/tenant/phiên bản, chức năng được chọn và phụ thuộc, trang/thành phần/ánh xạ hành động, mô hình quyền và vai trò (H), quy trình có phiên bản (P), schema và nguồn dữ liệu (D), nguồn tri thức/quyền truy xuất và điểm hiển thị trợ lý (I), cùng mô-đun/đầu nối Tầng 3 nếu dùng. Trình chạy thử chứng minh giao diện Tầng 2 gọi dịch vụ Tầng 1 qua Gateway; mô-đun Tầng 3 không được nối thẳng CSDL hoặc tạo Gateway/SSO riêng. Thiếu ánh xạ hay kiểm tra quyền thì chặn xuất bản; cấu hình chưa có tài liệu AI vẫn có thể xuất bản nhưng phải hiển thị trạng thái I chưa có nguồn, không bịa câu trả lời.

**Giới hạn builder (A):** người thiết kế chọn chức năng, cấu hình vai trò, dữ liệu, quy trình và tự sắp xếp trang/bố cục/thành phần bằng trình dựng giao diện; thành phần phải liên kết tới dữ liệu/hành động được đăng ký, không chỉ là màn hình mẫu cố định. Giao diện có thể khác nhau theo tenant/vai trò nhưng nằm trong thư viện thành phần và quy tắc an toàn được hỗ trợ; chức năng mới ngoài danh mục cần mô-đun mở rộng, không hứa hẹn sinh toàn bộ mã nguồn ứng dụng. Schema có định danh/phiên bản, chức năng, trang, vai trò, bước, dữ liệu và ngoại lệ; kiểm tra tính hợp lệ trước khi xuất bản. Người thiết kế chịu trách nhiệm rà soát nghiệp vụ; người có quyền xác nhận trước khi xuất bản. AI chỉ đề xuất bản nháp.

**FR-BLD-09 (A) — Dựng giao diện:** người có quyền tạo/sắp xếp menu và trang, bố cục theo vùng, đặt/ẩn/đổi tên thành phần biểu mẫu, bảng, chi tiết, thẻ chỉ số và hành động; gắn vào dữ liệu/hành động của chức năng đã chọn và xem trước theo vai trò. Hai tenant dựng bố cục khác nhau từ cùng bộ công cụ, không sửa mã Web/lõi.

**FR-BLD-10 (A) — Phụ thuộc và an toàn cấu hình:** kiểm tra phụ thuộc chức năng, kiểu dữ liệu, quyền và ánh xạ thành phần → API/hành động; chặn xuất bản khi trang tham chiếu chức năng đã tắt hoặc hành động thiếu quyền. Tắt chức năng không xóa dữ liệu cũ; với hồ sơ đang chạy phải có quy trình thay đổi được kiểm soát.

**FR-BLD-11 (B) — Mở rộng nghiệp vụ:** cho phép thêm thực thể/trường, phép kiểm tra và điều kiện từ tập toán tử an toàn có phiên bản. Chức năng ngoài danh mục/quy tắc hỗ trợ cần mô-đun mở rộng được kiểm duyệt, không chạy mã tenant tùy ý.

**FR-BLD-12 (A) — Nhiều ứng dụng trong một tenant:** người có quyền tạo, liệt kê, sửa bản nháp và xuất bản **từ hai ứng dụng trở lên trong cùng một tenant**, mỗi ứng dụng có `app_id`, tên, bộ chức năng, cấu hình giao diện/quy trình/quyền và lịch sử phiên bản riêng. Tạo hoặc phát hành ứng dụng thứ hai không ghi đè hay đổi phiên bản ứng dụng thứ nhất; cùng một chức năng trong danh mục có thể được chọn cho nhiều ứng dụng.

**FR-BLD-13 (A) — Ba lối vào cùng một Builder:** khi tạo ứng dụng, người thiết kế chọn `Bắt đầu với ERP`, `Bắt đầu với CRM` hoặc `Tạo từ trống`. ERP chỉ gợi ý vật tư/yêu cầu mua/tồn kho, CRM chỉ gợi ý khách hàng/liên hệ/cơ hội, còn từ trống không chọn sẵn chức năng. Cả ba dẫn đến **cùng màn chọn/bỏ chức năng và cùng cơ chế lưu nháp, kiểm phụ thuộc, thiết kế UI, kiểm tra và xuất bản**; người dùng có thể bỏ chức năng gợi ý, chọn thêm chức năng từ nhóm kia hoặc kết hợp ERP/CRM trước khi xuất bản. Danh sách `features` đã xác nhận quyết định runtime/quyền; lối vào chỉ là metadata nguồn gốc, không khóa loại app, không tự sinh chức năng chưa có, không cho xuất bản nháp rỗng hay thiếu phụ thuộc. Lối vào được ghi để truy vết nhưng bản nháp cũ không có metadata này vẫn đọc được.

**Tiêu chí “chuẩn hóa”:** chuẩn hóa _hình thức mô tả và khả năng thực thi_, không tuyên bố tự động biến mọi thực tiễn của doanh nghiệp thành “quy trình tốt nhất”. Hệ thống phải chỉ ra thông tin chưa biết, không tự bịa người duyệt, ngưỡng tiền hay quy định pháp lý.

### 3.3. Không gian làm việc và ứng dụng Tầng 3

| Mã        | Ưu tiên | Yêu cầu và điều kiện nghiệm thu                                                                                                                                                                                                                                                                                                                             |
| --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-WRK-01 | A       | Sau xuất bản, người dùng được phép tạo hồ sơ bằng biểu mẫu của ứng dụng; kiểm tra dữ liệu trước khi gửi, lưu nháp, gửi không tạo hồ sơ trùng khi thử lại cùng yêu cầu.                                                                                                                                                                                      |
| FR-WRK-02 | A       | Hộp việc hiển thị đúng việc được giao; người có quyền xem hồ sơ và xử lý theo nhánh quy trình; API chặn tự duyệt khi cấu hình cấm và chặn xử lý lại công việc đã hoàn tất.                                                                                                                                                                                  |
| FR-WRK-03 | A       | Màn hình lịch sử thể hiện trạng thái, người xử lý, lý do, thời điểm và phiên bản quy trình; dashboard chỉ dùng dữ liệu có quyền xem, mỗi chỉ số truy về hồ sơ nguồn.                                                                                                                                                                                        |
| FR-WRK-04 | A       | Trong **mỗi ứng dụng đã xuất bản**, người dùng thấy vai trò/việc của mình (H), bước và trạng thái quy trình (P), hồ sơ và nguồn số liệu được phép (D), điểm truy cập trợ lý/cảnh báo theo ngữ cảnh ứng dụng (I); nếu chưa có nguồn AI hoặc AI tạm ngừng, I báo rõ không khả dụng và H/P/D vẫn hoạt động.                                                    |
| FR-WRK-05 | A       | Runtime chỉ hiện trang/menu/hành động của các chức năng đã bật mà vai trò hiện tại được phép dùng; API từ chối hành động lên chức năng không bật hoặc thiếu quyền, kể cả gọi trực tiếp. Chức năng không chọn không hiện trong tìm kiếm, dashboard hay điều hướng của ứng dụng.                                                                              |
| FR-L3-01  | A       | Tenant A lắp ghép ứng dụng **ERP tối giản** gồm danh mục vật tư, yêu cầu mua và nhập/xem tồn kho; tenant B lắp ghép ứng dụng **CRM tối giản** gồm khách hàng/liên hệ, cơ hội và chuyển giai đoạn. Mỗi ứng dụng có giao diện riêng, ít nhất hai chức năng phối hợp qua dữ liệu/hành động, không dùng màn hình/luồng viết cứng riêng cho tenant hoặc sửa lõi. |
| FR-L3-02  | B       | Đầu nối kế toán/kho mô phỏng nhận sự kiện khi mua sắm được duyệt, có thử lại và chống gửi trùng; hiển thị rõ là mô phỏng. Mô-đun có thể tắt mà không làm mất dữ liệu lõi.                                                                                                                                                                                   |
| FR-L3-03  | C       | Công bố danh mục API và giao diện cắm-rút mô-đun có phiên bản, giấy phép, quyền xin cấp và cách gỡ/khôi phục.                                                                                                                                                                                                                                               |
| FR-L3-04  | A       | Mỗi chức năng trong danh mục công bố mã/phiên bản, mô hình dữ liệu, thao tác, quyền, phụ thuộc, thành phần UI, sự kiện và trạng thái hỗ trợ; cả chức năng ERP lẫn CRM dùng cùng hợp đồng triển khai và quản lý theo tenant/phiên bản ứng dụng.                                                                                                              |

**FR-WRK-06 (A) — Vận hành nhiều ứng dụng cùng tenant:** người dùng chỉ thấy và mở các ứng dụng mình được cấp quyền trong tenant; mọi thao tác, bản ghi, tệp, công việc, dashboard và truy vấn trợ lý gắn với `app_id`/phiên bản phù hợp. Mặc định ứng dụng này không đọc/sửa dữ liệu ứng dụng kia dù cùng tenant. Bản demo có chia sẻ liên app **trong cùng tenant** qua liên kết do người có quyền cấu hình, chỉ rõ app nguồn/đích, loại dữ liệu, quyền đọc/ghi và phạm vi bản ghi; API kiểm lại quyền hiện hành, audit việc cấp/sử dụng/thu hồi và chặn truy cập mới sau thu hồi. Liên kết không cấp quyền truy cập chéo tenant hay tự động đưa dữ liệu chia sẻ vào nguồn AI. Đổi ứng dụng hoặc xuất bản phiên bản mới của một ứng dụng không làm thay đổi dữ liệu/quy trình đang chạy ở ứng dụng khác.

### 3.4. Agent thích nghi theo doanh nghiệp

| Mã       | Ưu tiên | Yêu cầu và điều kiện nghiệm thu                                                                                                                                                                                                                                                                                                                                          |
| -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-AI-01 | A       | Quản trị tenant chỉ định tài liệu chính sách và cấu hình ứng dụng đã xuất bản nào được lập chỉ mục; tệp lưu trong kho tệp, metadata/quyền và chỉ mục FTS/vector (`pgvector`) trong PostgreSQL, phân tách/lọc theo tenant, app, phiên bản và quyền hiện hành; quá trình nạp ghi nguồn, thời điểm, phiên bản, trạng thái. Không mặc định nạp toàn bộ dữ liệu doanh nghiệp. |
| FR-AI-02 | A       | Trợ lý truy xuất theo `tenant_id` **và quyền của người hỏi tại thời điểm truy vấn**, trả lời/đề xuất có dẫn nguồn tới tài liệu hoặc phiên bản cấu hình; nếu không đủ bằng chứng phải nói không biết hoặc yêu cầu bổ sung.                                                                                                                                                |
| FR-AI-03 | A       | Trợ lý có thể đề xuất ánh xạ bản mô tả sang quy trình chuẩn hóa và cảnh báo bước thiếu/mâu thuẫn; đề xuất ở trạng thái nháp, người dùng sửa và xác nhận trước khi xuất bản. Không tự phê duyệt hồ sơ, thay đổi quyền, gọi tích hợp có tác động hoặc tự cập nhật cấu hình đang chạy.                                                                                      |
| FR-AI-04 | A       | Sau khi giao dịch thu hồi quyền/xóa nguồn được commit và API xác nhận, truy vấn mới không được dùng nguồn đó dù chunk còn trong chỉ mục; kiểm tra lại trước khi trả đáp án đang xử lý; dọn chỉ mục bất đồng bộ mục tiêu ≤ 24 giờ. Kiểm thử không rò rỉ qua trích dẫn, log hoặc kết quả tìm kiếm khi index worker đang dừng.                                              |
| FR-AI-05 | A       | Bản demo chỉ dùng suy luận và embedding **nội bộ** qua adapter (dự kiến `llama.cpp`), không bật AI bên ngoài; chỉ chọn trọng số model khi đã xác minh giấy phép, chất lượng tiếng Việt và tài nguyên máy. Không lưu nội dung prompt/đáp án mặc định hoặc dùng dữ liệu doanh nghiệp để tự huấn luyện.                                                                     |
| FR-AI-06 | A       | Trong ứng dụng đã xuất bản, truy vấn trợ lý mang `app_id` và phiên bản ứng dụng/quy trình hiện hành; tìm kiếm chỉ trong nguồn được phép của tenant, ứng dụng và người hỏi; cùng câu hỏi ở hai ứng dụng hoặc hai tenant không được trộn nguồn hay hiển thị trích dẫn chéo.                                                                                                |

**Ý nghĩa “thích nghi”:** agent dùng tri thức được chọn, quyền hiện hành và cấu hình/phiên bản quy trình của **ứng dụng trong doanh nghiệp đang đăng nhập** để trả lời khác nhau theo ngữ cảnh. Điều này có thể triển khai bằng truy xuất có kiểm soát (RAG) và cấu hình, **không** hứa hẹn mô hình tự huấn luyện hay tự vận hành doanh nghiệp.

## 4. Yêu cầu phi chức năng và giao diện ngoài

| Mã         | Nhóm             | Yêu cầu/tiêu chí đề xuất                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-SEC-01 | Bảo mật          | OAuth2/OIDC; MFA cho tài khoản quyền cao; TLS cho kết nối; bí mật không nằm trong mã nguồn; áp dụng nguyên tắc quyền tối thiểu và OWASP Top 10.                                                                                                                                                                                                                                                                                                                                                                                            |
| NFR-SEC-02 | Cách ly          | Lọc tenant ở lớp truy cập dữ liệu dùng chung hoặc RLS; kiểm tra tương đương tại tìm kiếm, dashboard, tệp, workflow, sự kiện và agent. Test âm giữa hai tenant và hai vai trò là điều kiện phát hành.                                                                                                                                                                                                                                                                                                                                       |
| NFR-AI-01  | AI có kiểm soát  | [Thiết kế RAG/vòng đời dữ liệu](../../engineering/ai/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md): chỉ dùng nguồn có quyền hiện hành; không lưu nội dung prompt/đáp án mặc định; audit metadata đề xuất 90 ngày, bản sao lưu mã hóa đề xuất vòng quay 30 ngày; thu hồi quyền trước khi báo thành công, dọn chỉ mục mục tiêu ≤ 24 giờ. Hạn lưu/xóa phải được đội xác nhận và đo khi triển khai; không bật AI bên ngoài trong demo. |
| NFR-REL-01 | Tin cậy          | Workflow bền vững; sao lưu PostgreSQL và kho tệp, thử khôi phục; mọi sự kiện ra ngoài có định danh chống trùng và cơ chế thử lại.                                                                                                                                                                                                                                                                                                                                                                                                          |
| NFR-PER-01 | Hiệu năng        | Mục tiêu ban đầu: API đọc thông thường p95 < 2 giây, cổng việc cần làm < 3 giây ở môi trường thử; thời gian xử lý AI đo riêng, không chặn luồng thủ công. Các ngưỡng cần xác nhận bằng đo tải.                                                                                                                                                                                                                                                                                                                                             |
| NFR-UX-01  | Dễ dùng          | Giao diện tiếng Việt, responsive, lỗi biểu mẫu chỉ rõ cách sửa; luồng thiết kế/duyệt cấu hình nêu rõ đây là bản nháp, bản chạy thử hay phiên bản đã xuất bản.                                                                                                                                                                                                                                                                                                                                                                              |
| NFR-UX-02  | Gọn theo nhu cầu | Không hiện chức năng chưa chọn trong menu/trang/hành động; dashboard chỉ có thành phần được cấu hình cho vai trò. Kiểm thử hai tenant bằng danh sách chức năng bật và giao diện thực tế, không dùng so sánh định lượng chưa đo với sản phẩm khác.                                                                                                                                                                                                                                                                                          |
| NFR-MNT-01 | Bảo trì          | API có phiên bản và OpenAPI; cấu hình ứng dụng có thể xuất/nhập theo định dạng mở được tài liệu hóa; triển khai từ mã nguồn, CI chạy kiểm thử và cấu hình có phiên bản.                                                                                                                                                                                                                                                                                                                                                                    |
| NFR-OSS-01 | Nguồn mở         | Điều kiện dự thi theo Thể lệ: repo công khai và giấy phép OSI-approved. Chuẩn bị LICENSE toàn văn, thông báo giấy phép trong từng tệp mã, README/build guide, CHANGELOG, bug tracker và release có phiên bản/định dạng mở **trước hạn gửi bài 17:00 06/12/2026**; rà soát tương thích giấy phép phụ thuộc, chứng minh cài/build từ mã nguồn và chạy ngoài thư mục nguồn.                                                                                                                                                                   |

**Giao diện ngoài:** Builder **và giao diện của ứng dụng đã xuất bản** (Next.js) gọi API NestJS qua Gateway bằng HTTPS; xác thực qua OIDC dùng chung; API nghiệp vụ kết nối kho dữ liệu và workflow engine; tệp truy cập bằng URL có thời hạn sau khi API cấp quyền; mô-đun Tầng 3 dùng API có phiên bản và sự kiện/webhook đã xác thực. Frontend, kể cả phần chạy phía máy chủ của Next.js, không nối trực tiếp PostgreSQL/kho tệp; hệ thống ngoài chỉ dùng dữ liệu mẫu hoặc kết nối được cấp phép.

## 5. Nghiệm thu, truy vết và kịch bản demo

### 5.1. Kịch bản nghiệm thu xuyên ba tầng

1. Tạo tenant A và B; mỗi tenant có quản trị, người thiết kế và người thực hiện riêng; xác nhận SSO và API Gateway hoạt động.
2. **Doanh nghiệp A — ERP vừa đủ:** chọn danh mục vật tư, yêu cầu mua hàng, nhập/xem tồn kho; không chọn kế toán, bán hàng, nhân sự.
   Tự bố trí menu, trang yêu cầu mua và trang tồn kho, cấu hình ngưỡng duyệt; chạy thử, kiểm tra hợp đồng ba tầng/H-P-D-I rồi xuất bản v1.
3. **Doanh nghiệp B — CRM vừa đủ:** chọn khách hàng/liên hệ, cơ hội, giai đoạn bán hàng;
   không chọn kho, mua sắm, kế toán hoặc marketing tự động.
   Tự bố trí trang khách hàng và bảng cơ hội, cấu hình vai trò nhân viên kinh doanh/quản lý và quy tắc chuyển giai đoạn;
   chạy thử rồi xuất bản v1 từ **cùng** builder, không sửa hoặc triển khai lại mã lõi.
4. Người dùng A tạo yêu cầu mua, quản lý duyệt, bộ phận kho ghi nhận nhập và xem tồn;
   người dùng B tạo khách hàng/liên hệ, tạo cơ hội gắn khách hàng và chuyển giai đoạn.
   Thao tác ghi dữ liệu thật của demo qua API, trạng thái và lịch sử tồn tại sau tải lại/khởi động API;
   không dùng toast hoặc dữ liệu tĩnh thay cho nghiệp vụ.
5. Đổi bố cục hoặc cấu hình chức năng/quy trình A và xuất bản v2;
   dữ liệu/hồ sơ v1 vẫn đọc được theo quyền, việc đang chạy không bị đổi phiên bản ngầm, B không bị ảnh hưởng.
   Thử tắt chức năng có phụ thuộc/hồ sơ đang chạy và xác nhận hệ thống chặn hoặc yêu cầu xử lý an toàn.
6. Trong **từng ứng dụng đã xuất bản**, kiểm tra H (người/việc), P (bước đang chạy), D (hồ sơ/chỉ số nguồn), I (trợ lý theo ngữ cảnh hoặc trạng thái chưa có nguồn);
   hỏi agent A và B cùng một câu: câu trả lời chỉ dẫn nguồn được phép của ứng dụng/tenant;
   tài khoản không đủ quyền không truy ra tài liệu hạn chế. Tắt AI và xác nhận các thao tác H/P/D vẫn chạy.
7. Chứng minh menu, trang, hành động và API của chức năng **không chọn** đều không dùng được;
   truy số liệu dashboard về bản ghi gốc; thử gọi API, URL tệp và truy vấn agent chéo tenant đều bị chặn và có audit phù hợp.
8. Trong **tenant A**, tạo thêm một ứng dụng CRM nhỏ từ cùng danh mục (chọn khách hàng và cơ hội), xuất bản song song với ERP A; không sửa mã lõi hay thay ERP A. Người có quyền chọn được đúng ứng dụng, người thiếu quyền không thấy/mở được. Thử truy cập chéo app qua URL/API khi chưa cấp liên kết (bị từ chối), sau khi cấp liên kết (chỉ đọc/ghi loại dữ liệu, bản ghi và hành động được phép), rồi sau thu hồi (truy cập mới lại bị từ chối); kiểm audit và tenant B luôn bị chặn. Tệp, công việc, dashboard, nguồn trợ lý không tự động được chia sẻ chỉ vì có liên kết dữ liệu. Sửa/xuất bản CRM A v2, xác nhận ERP A vẫn chạy theo phiên bản và dữ liệu của nó.
9. Tạo ba bản nháp bằng ba lối vào trên cùng Builder: từ ERP **bỏ tồn kho** rồi bổ sung trang cho vật tư/yêu cầu mua; từ CRM **thêm vật tư** từ nhóm ERP; từ trống tự chọn khách hàng và cơ hội (thử xuất bản khi vẫn rỗng phải bị chặn). Sửa quyền/bố cục, kiểm phụ thuộc, xem trước rồi xuất bản từng app; khi vận hành chỉ thấy `features` đã chọn, không có runtime hoặc API riêng theo lối vào.

### 5.2. Ma trận truy vết tối thiểu

| Mục tiêu                                 | Yêu cầu                                             | Ca kiểm thử                                                                                                                                                           |
| ---------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hai doanh nghiệp, một nền tảng           | FR-CORE-01..06, FR-L3-01                            | TC-TEN-01: hai tenant/cấu hình khác nhau; TC-TEN-02: truy cập chéo bị chặn                                                                                            |
| Nhiều ứng dụng trong cùng tenant         | FR-BLD-12, FR-WRK-06, FR-AI-06                      | TC-APP-01: A tạo/xuất bản ERP và CRM song song, chọn/mở theo quyền; TC-APP-02: truy cập chéo app bị chặn khi chưa chia sẻ; TC-APP-03: cập nhật CRM không đổi ERP      |
| Chia sẻ dữ liệu liên app có kiểm soát | FR-WRK-06, FR-CORE-02/06 | TC-SHARE-01: chưa cấp liên kết bị từ chối; TC-SHARE-02: đã cấp chỉ đọc/ghi đúng loại, phạm vi bản ghi và quyền; TC-SHARE-03: thu hồi chặn truy cập mới, có audit; tenant khác luôn bị chặn |
| Chọn chức năng ERP/CRM vừa đủ            | FR-BLD-06, FR-BLD-10, FR-L3-01, FR-L3-04, FR-WRK-05 | TC-MOD-01: A có mua sắm/vật tư/tồn kho, B có khách hàng/cơ hội; TC-MOD-02: chức năng không chọn không hiện và API từ chối; TC-MOD-03: phụ thuộc thiếu chặn xuất bản   |
| Ba lối vào, một cơ chế lắp ghép | FR-BLD-13, FR-BLD-06/10, FR-WRK-05 | TC-START-01: ERP bỏ tồn kho; TC-START-02: CRM thêm vật tư; TC-START-03: từ trống chọn chức năng, nháp rỗng không xuất bản; TC-START-04: cùng builder/runtime, chỉ `features` quyết định quyền |
| Giao diện tùy biến theo doanh nghiệp     | FR-BLD-09, FR-BLD-08, NFR-UX-02                     | TC-UI-01: A/B sắp xếp trang và menu khác nhau không sửa mã; TC-UI-02: thành phần lỗi ánh xạ/quyền chặn xuất bản; TC-UI-03: xem trước và runtime theo vai trò          |
| Nhập và chuẩn hóa quy trình              | FR-BLD-01..04, FR-AI-03                             | TC-BLD-01: ánh xạ nguồn; TC-BLD-02: thiếu vai trò/nhánh bị báo lỗi; TC-BLD-03: chỉnh thủ công không cần AI                                                            |
| Kiểm tra, xuất bản, thay đổi             | FR-BLD-05, FR-WRK-01..03                            | TC-PUB-01: nháp không chạy thật; TC-PUB-02: phiên v1/v2 và hồ sơ đang chạy                                                                                            |
| Ứng dụng xuất bản theo open-core ba tầng | FR-BLD-08, FR-CORE-01..06, FR-L3-01                 | TC-ARC-01: cả hai ứng dụng dùng chung SSO/Gateway/API/workflow; TC-ARC-02: Tầng 3 không vượt Gateway/quyền; TC-ARC-03: thiếu hợp đồng bị chặn xuất bản                |
| H-P-D-I khi vận hành từng ứng dụng       | FR-WRK-01..04, FR-AI-02, FR-AI-06                   | TC-HPDI-01: kiểm tra H/P/D/I ở ứng dụng A và B; TC-HPDI-02: không có nguồn AI thì I báo rõ, H/P/D vẫn chạy; TC-HPDI-03: truy vấn agent không trộn nguồn giữa ứng dụng |
| Hệ sinh thái Tầng 3                      | FR-L3-01..04                                        | TC-L3-01: ERP và CRM có thao tác liên chức năng chạy thật trong demo; TC-L3-02: connector mô phỏng không gửi trùng nếu bật                                            |
| Agent theo ngữ cảnh và quyền             | FR-AI-01..06, NFR-AI-01                             | TC-AI-01: dẫn nguồn đúng tenant/app hoặc nói không biết; TC-AI-02: quyền/nguồn bị thu hồi không còn truy xuất; TC-AI-03: AI không tự xuất bản; TC-AI-04: liên kết chia sẻ không tự cấp nguồn AI; TC-AI-05: AI ngừng, H/P/D vẫn chạy |
| Truy vết, an toàn, phục hồi              | FR-CORE-04..06, NFR-SEC-02, NFR-REL-01              | TC-AUD-01: audit quyết định/xuất bản; TC-REL-01: khởi động lại giữ trạng thái; TC-DAT-01: dashboard truy về hồ sơ                                                     |

### 5.3. Điều kiện hoàn tất bản tối thiểu

- Chứng minh được **hai doanh nghiệp tự lắp ghép ERP tối giản và CRM tối giản** từ cùng danh mục chức năng/builder, không phải hai ứng dụng viết cứng.
- Tenant A tạo và vận hành đồng thời ít nhất hai ứng dụng độc lập (ERP và CRM nhỏ); kiểm thử quyền theo ứng dụng, không rò rỉ dữ liệu mặc định giữa hai app cùng tenant và cập nhật một app không ảnh hưởng app còn lại.
- Demo cấp và thu hồi liên kết chia sẻ trong cùng tenant: trước cấp bị từ chối, sau cấp chỉ đọc/ghi đúng dữ liệu/bản ghi/hành động được phép, sau thu hồi truy cập mới lại bị chặn; có audit, không chia sẻ xuyên tenant hoặc tự đưa dữ liệu vào nguồn AI.
- Ba lối vào tạo app đều chạy qua cùng Builder/runtime; ERP/CRM là bộ gợi ý có thể sửa, không phải hai loại app cố định. Nháp rỗng được lưu nhưng không được xuất bản; quyền và hành vi chạy chỉ dựa trên chức năng đã xác nhận.
- Cả hai có giao diện do tenant tự cấu hình, ít nhất hai chức năng có dữ liệu/hành động liên kết chạy thật; chức năng không chọn không hiện và không gọi API được. Hai ví dụ chỉ chứng minh khả năng lắp ghép **trong danh mục đã xây**, không tuyên bố hỗ trợ mọi ERP/CRM.
- Lát cắt từ nhập mô tả → chuẩn hóa/chỉnh tay → chạy thử → xuất bản → làm việc → truy vết hoạt động xuyên ba tầng; **ứng dụng được xuất bản**, không riêng builder, dùng chung lõi open-core và có trải nghiệm H-P-D-I khi vận hành.
- AI trên nguồn được chọn phải trả lời có dẫn nguồn được phép hoặc nói không biết, không trộn nguồn giữa tenant/app (kể cả khi có liên kết chia sẻ), quyền/nguồn bị thu hồi không còn truy xuất; AI có thể tắt mà luồng thiết kế và vận hành vẫn chạy, không có thao tác nguy hiểm do AI tự quyết.
- Kiểm thử quyền/tenant có trường hợp thất bại và không rò rỉ qua dữ liệu, tệp, báo cáo hoặc câu trả lời agent.
- Có bằng chứng cho ngưỡng Đề §3 và giải trình bốn nguyên lý §4; bảng bảy lớp tham chiếu và tuân thủ nguồn mở được tổng hợp riêng; không đánh dấu đạt chỉ vì đã liệt kê tên công nghệ.

## 6. Quyết định phạm vi và việc cần xác minh

### 6.1. Định hướng người yêu cầu đề xuất, chờ đội xác nhận khả thi

| Chủ đề                    | Phạm vi đề xuất cho bản trình diễn                                                                                                                                                                                                                                                                                                                                                                                                   | Chưa cam kết                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Builder                   | Chọn chức năng ERP/CRM, cấu hình dữ liệu/quy trình/quyền và thiết kế trang, menu, bố cục, thành phần gắn dữ liệu/hành động; không phải chỉ đổi nội dung trên mẫu màn hình cố định.                                                                                                                                                                                                                                                   | Sinh tùy ý mọi chức năng chưa có trong danh mục; chạy mã tenant chưa kiểm duyệt; sinh mã ứng dụng hoàn chỉnh từ lời nhắc.                  |
| Khởi tạo app | Ba lối vào ERP/CRM/từ trống chung một Builder; hai lối đầu chỉ điền sẵn gợi ý có thể thêm/bỏ, lối cuối bắt đầu không chức năng. Không dùng lối vào làm phân quyền hoặc khóa loại app. | Ba runtime khác nhau hoặc tự tạo chức năng mới chỉ bằng cách chọn ERP/CRM. |
| Quy trình chuẩn hóa       | Schema trung gian **có phiên bản** cho bước, vai trò, điều kiện, dữ liệu, ngoại lệ; kiểm tra rồi ánh xạ sang workflow engine. Người thiết kế rà soát; người có quyền xuất bản của tenant xác nhận.                                                                                                                                                                                                                                   | Tự chứng nhận quy trình đúng nghiệp vụ; xuất BPMN bắt buộc.                                                                                |
| Agent                     | [Phương án RAG nội bộ](../../engineering/ai/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md): chỉ nạp chính sách được chọn và cấu hình ứng dụng xuất bản; kho tệp lưu nguồn, PostgreSQL giữ metadata/quyền + FTS/pgvector; suy luận/embedding nội bộ, kiểm quyền nguồn tại DB ngay sau thu hồi và trước trả lời; dọn index sau. | Nạp mọi hồ sơ mặc định; gọi AI ngoài trong demo; tự huấn luyện; tuyên bố đã xóa mọi backup sau 24 giờ.                                     |
| Minh chứng tính tổng quát | Tenant A lắp ghép ERP vừa đủ (vật tư, yêu cầu mua, tồn kho); tenant B lắp ghép CRM vừa đủ (khách hàng/liên hệ, cơ hội, giai đoạn) trên cùng lõi; giao diện khác nhau, chức năng không chọn bị ẩn và API từ chối.                                                                                                                                                                                                                     | ERP/kế toán/CRM đầy đủ hoặc tuyên bố hỗ trợ mọi ngành; so sánh tính năng/hiệu quả với MISA khi chưa có phép đo.                            |
| Bảy lớp và đề thi         | [Đã đối chiếu Đề §3–4](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md): bốn dịch vụ lõi headless + ít nhất một app UI Tầng 2 là ngưỡng rõ ràng; bốn nguyên lý kỹ thuật cần có giải trình/bằng chứng. Bảy lớp là **giải pháp công nghệ tham chiếu**, không phải bảy stack bắt buộc.                                                                             | Không gọi WAF, NGSI-LD, lakehouse, ledger, bản đồ, OCR... là từng sản phẩm bắt buộc; cũng không bỏ qua nguyên lý §4 chỉ vì stack là ví dụ. |
| Thứ tự thực hiện          | Lõi tenant/quyền/dữ liệu/workflow → hợp đồng chức năng → danh mục ERP/CRM tối thiểu → builder giao diện → xuất bản/chạy hai ứng dụng → kiểm thử phụ thuộc/quyền/cách ly → agent nếu có điều kiện. Chỉ ấn định mốc sau khi đánh giá nguồn lực.                                                                                                                                                                                        | Giữ nguyên mốc/owner roadmap v2.4 hoặc coi phạm vi mới đã được cả đội phê duyệt.                                                           |

### 6.2. Việc còn phải xác minh và cập nhật

1. [Thiết kế builder/fixture nghỉ phép v2.4](../../engineering/builder/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md) không còn là tiêu chí nghiệm thu chính. Cần thiết kế và duyệt hợp đồng chức năng, danh mục ERP/CRM tối thiểu, trình dựng UI, thay đổi phiên bản và test TC-MOD/TC-UI/TC-L3 mới; không đánh dấu hoàn tất chỉ vì fixture nghỉ phép chạy.
2. **Đã đối chiếu** [Đề §2–6 và Thể lệ 2026](../../competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md) theo từng lớp và tiêu chí chấm: phải làm đủ bốn dịch vụ lõi và ít nhất một app UI Tầng 2; bảy lớp/stack là tham chiếu, bốn nguyên lý §4 vẫn cần bằng chứng. Hai luồng demo là quyết định DigiX, không phải điều kiện đủ điểm. **Còn lại:** theo dõi thông báo mới của BTC, tạo bằng chứng kỹ thuật và sửa roadmap theo hạn nộp **17:00 06/12/2026**, 15 phút trình bày.
3. **Đã soạn [thiết kế chỉ mục, suy luận nội bộ, lưu/xóa và kịch bản thu hồi quyền](../../engineering/ai/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md)** (TC-AI-REV-01..04, TC-AI-ISO-01, TC-AI-OFF-01). **Chưa hoàn tất thực nghiệm:** đội phải xác nhận model/trọng số/giấy phép, tài nguyên máy, thời hạn retention và chạy test worker dừng/chưa xóa index/in-flight request trên hệ thống thật trước khi tuyên bố quyền đã được chặn đúng.
4. Đánh giá lại tính khả thi với hạn nộp hiện có, chốt chính xác chức năng ERP/CRM, thành phần UI, phụ thuộc, owner/reviewer, máy chủ và ngân sách; sau đó cập nhật [roadmap](../../delivery/roadmap.md), tài liệu UI/thiết kế builder và feature freeze. Việc người yêu cầu đổi định hướng **không thay thế phê duyệt phạm vi/tiến độ của toàn đội**.
