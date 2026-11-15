# Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)

## DigiX – Nền tảng hỗ trợ chuyển đổi số cho doanh nghiệp vừa và nhỏ

**Phiên bản:** v1.5 (bản nháp) | **Ngày phát hành:** 31/10/2026 | **Tác giả:** Phạm Lê Đình An | **Tổ chức:** DigiX

**Kho mã nguồn:** [github.com/githubcuaan/digi](https://github.com/githubcuaan/digi)

### Lịch sử phiên bản

| Phiên bản | Ngày | Người thực hiện | Nội dung chỉnh sửa |
| --- | --- | --- | --- |
| v0.1 | 31/10/2026 | Phạm Lê Đình An | Khởi tạo khung SRS từ khung kiến trúc DX-OS Open-Core |
| v1.0 | 31/10/2026 | Phạm Lê Đình An | Hoàn thiện bản nháp đầu: giới thiệu, mô tả tổng thể, yêu cầu chi tiết, phụ lục, RTM |
| v1.1 | 31/10/2026 | Phạm Lê Đình An | Đối chiếu với đề thi, thể lệ PoF và tài liệu DX-OS: thêm mục 2.8, A.4, B.6, Phụ lục I-J; nâng ưu tiên FR-PRC-01, FR-INT-01; cảnh báo giấy phép n8n/Vault |
| v1.2 | 31/10/2026 | Phạm Lê Đình An | Bổ sung bảy lớp công nghệ tham chiếu (mục 2.9), cảnh báo giấy phép mở rộng (B.6), cập nhật Phụ lục J |
| v1.3 | 31/10/2026 | Phạm Lê Đình An | Theo đề chính thức: bảy lớp chức năng đều bắt buộc (công nghệ tự chọn); viết lại mục 2.9, thêm A.5, nâng ưu tiên các chức năng liên quan |
| v1.4 | 31/10/2026 | Phạm Lê Đình An | Chốt công nghệ: Next.js (frontend), NestJS (backend); thêm mục 2.10; cập nhật các phần liên quan |
| v1.5 | 31/10/2026 | Phạm Lê Đình An | Cập nhật tổ chức DigiX và kho mã nguồn; thêm hiện trạng kho theo tiêu chí PoF ở B.6 |

---

## 1. Giới thiệu tổng quan

### 1.1. Mục đích

Tài liệu này đặc tả yêu cầu phần mềm của **DigiX**, nền tảng mã nguồn mở giúp doanh nghiệp vừa và nhỏ (SME) chuyển từ giao việc, duyệt hồ sơ và tổng hợp số liệu thủ công sang vận hành trên một hệ thống thống nhất. Kịch bản trình diễn chính là **đề nghị mua hàng và phê duyệt chi phí**.

| Đối tượng đọc | Mục đích sử dụng |
| --- | --- |
| Nhà phát triển (Dev) | Hiểu yêu cầu để thiết kế và lập trình |
| Kiểm thử (Tester) | Xây dựng test case từ yêu cầu và luồng xử lý |
| Quản lý dự án (PM) | Theo dõi phạm vi, ưu tiên và tiến độ |
| Khách hàng/giám khảo | Xác nhận sản phẩm đáp ứng nhu cầu và đề thi |

### 1.2. Phạm vi sản phẩm

**Tên phần mềm:** DigiX.

**Nhiệm vụ:** cung cấp (1) nền tảng dịch vụ lõi headless gồm định danh/SSO, API Gateway, quản trị dữ liệu và Workflow Engine; (2) không gian làm việc số cho nhân viên, quản lý; (3) ứng dụng chuyên ngành cắm-rút và đầu nối với đối tác.

**Lợi ích:** số hóa quy trình duyệt, lưu vết minh bạch ai làm gì và lúc nào, số liệu dashboard truy được về hồ sơ gốc, dữ liệu mỗi doanh nghiệp được cách ly.

**Phần mềm không làm (ngoài phạm vi v1.0):**

- Không thay thế phần mềm kế toán hay ERP đầy đủ.
- Không tự động phê duyệt thay con người; AI chỉ đề xuất hoặc cảnh báo.
- Không tích hợp dịch vụ thương mại thật (kế toán, hóa đơn điện tử, thanh toán) khi chưa có quyền truy cập; bản demo dùng hệ thống giả lập.
- Chưa xây chợ ứng dụng thương mại đầy đủ và không tạo Digital Twin giả: bản sao số chỉ dựng trên dữ liệu thật hoặc nguồn mô phỏng được ghi rõ là mô phỏng.

### 1.3. Định nghĩa, thuật ngữ và từ viết tắt

| Thuật ngữ | Giải thích |
| --- | --- |
| SME | Doanh nghiệp vừa và nhỏ |
| Tenant | Một doanh nghiệp sử dụng nền tảng; mọi bản ghi gắn `tenant_id` |
| SSO | Đăng nhập một lần cho nhiều ứng dụng |
| RBAC | Phân quyền theo vai trò |
| PaaS / Headless | Nền tảng cung cấp dịch vụ qua API, không chứa giao diện nghiệp vụ |
| H-P-D-I | Con người số, Quy trình số, Dữ liệu số, Trí tuệ số (Tầng 2) |
| BPMN | Ký pháp mô hình hóa quy trình nghiệp vụ |
| RAG | Sinh câu trả lời dựa trên truy xuất tài liệu nội bộ |
| Poka-yoke | Cơ chế chống sai sót ngay tại biểu mẫu |
| RTM | Ma trận truy xuất yêu cầu |
| NFR | Yêu cầu phi chức năng |
| ĐNMH | Đề nghị mua hàng |
| VFOSSA | Hội Phần mềm Tự do và Nguồn mở Việt Nam (đơn vị ra đề thi PMNM OLP 2026) |

**Thuật ngữ bổ sung (theo tài liệu DX-OS và thể lệ):**

- **Open-core:** lõi nền tảng mã nguồn mở, các mô-đun mở rộng cắm thêm bên trên.
- **5 RÕ:** Rõ vai trò, Rõ trách nhiệm, Rõ quy trình, Rõ tiêu chuẩn, Rõ công cụ; kỷ luật vận hành mà DigiX phải thực thi bằng hệ thống.
- **GIGO:** dữ liệu đầu vào kém thì kết quả đầu ra kém; lý do biểu mẫu chặn dữ liệu sai ngay từ đầu.
- **Zero-Trust:** xác thực và kiểm tra quyền mọi yêu cầu, không tin mặc định bất kỳ thành phần nào.
- **GitOps:** cấu hình triển khai lưu trong Git, dựng và cập nhật hệ thống lặp lại được.
- **IT/OT:** công nghệ thông tin và công nghệ vận hành (thiết bị, cảm biến hiện trường).
- **NGSI-LD, Data Lineage, ImmuDB:** chuẩn dữ liệu ngữ cảnh, phả hệ dữ liệu, kho dữ liệu bất biến; thuộc mô hình tham chiếu của đề, DigiX v1.0 chỉ nêu ở mức mở rộng.
- **DTI:** chỉ số đo năng lực chuyển đổi số doanh nghiệp theo Quyết định 1567/QĐ-BKHCN; **HPDI** đo ai đang điều khiển vận hành (người, quy trình, dữ liệu, trí tuệ).
- **PoF (Proof of FOSS):** nhóm tiêu chí chấm kho mã nguồn (50 điểm) trước chung kết.
- **OSI-approved:** giấy phép nguồn mở được Open Source Initiative công nhận.

### 1.4. Tài liệu tham khảo

1. Khung kiến trúc DX-OS Open-Core cho doanh nghiệp vừa và nhỏ (tệp khung-kiến-trúc-dx-os-sme-tầng-3-phân-quyền).
2. Đề thi PMNM OLP 2026 của VFOSSA và thể lệ chấm điểm.
3. Tệp đặc tả chức năng của nhóm.
4. Khung SRS (IEEE 830 / ISO/IEC/IEEE 29148) do nhóm cung cấp.
5. Tài liệu công nghệ tham chiếu: Keycloak, Apache APISIX, PostgreSQL, MinIO, Flowable, n8n.
6. OWASP Top 10.

**Tài liệu bổ sung:**

- Sách tham khảo "Xây dựng Hệ điều hành Doanh nghiệp số: Từ Tư duy đến Hành động (DX-OS in Action)", TS. Tạ Tuấn Anh, 2026 (Chương 1: kiến trúc doanh nghiệp, 5 RÕ, GIGO, kiến trúc lắp ghép; Chương 2: mô hình HPDI, DTI).
- Quyết định 1567/QĐ-BKHCN, Bộ tiêu chí đánh giá mức độ chuyển đổi số doanh nghiệp.
- Tóm tắt yêu cầu đề thi (Open-core headless PaaS, HPDI, mô hình kinh doanh Tầng 3, bốn nguyên lý).
- Thể lệ và tiêu chí chấm OpenSources Olympics 2026 (Phần I PoF 50 điểm, Phần II sản phẩm 50 điểm).

### 1.5. Bố cục tài liệu

- **Phần 1:** mục đích, phạm vi, thuật ngữ, tham khảo.
- **Phần 2:** bối cảnh, chức năng tổng quát, người dùng, môi trường, ràng buộc, giả định.
- **Phần 3:** yêu cầu chức năng, phi chức năng và giao diện bên ngoài.
- **Phụ lục:** ERD, BPMN, use case, ma trận phân quyền, RTM.

---

## 2. Mô tả tổng thể

### 2.1. Bối cảnh sản phẩm

DigiX là sản phẩm độc lập, mở rộng được, gồm ba tầng. Mỗi ứng dụng ở tầng trên dùng lại SSO, Gateway, kho dữ liệu và workflow của tầng dưới mà không phải xây lại.

| Tầng | Tên | Thành phần chính | Công nghệ tham chiếu |
| --- | --- | --- | --- |
| 3 | Hệ sinh thái kinh doanh và đối tác | Ứng dụng chuyên ngành cắm-rút, danh mục API, khung mô-đun bên thứ ba, đầu nối | Mô-đun mua sắm, đầu nối giả lập |
| 2 | Không gian năng lực số H-P-D-I | Cổng làm việc, quy trình, dashboard, trợ lý | Next.js (React, TypeScript) |
| 1 | Nền tảng dịch vụ lõi Headless PaaS | SSO, API Gateway, dữ liệu, workflow | NestJS, Keycloak, APISIX, PostgreSQL, MinIO, Flowable |

**Sơ đồ ngữ cảnh (các tác nhân bên ngoài):**

- Người dùng nội bộ (nhân viên, quản lý, kế toán, chủ doanh nghiệp) → Cổng Web Tầng 2 → API Gateway.
- Quản trị nền tảng → công cụ vận hành, giám sát (không tính là ứng dụng Tầng 2).
- Nhà cung cấp/đại lý → cổng đối tác qua API Gateway, chỉ thấy dữ liệu được chia sẻ.
- Nhà phát triển mô-đun → cổng nhà phát triển và môi trường thử nghiệm.
- Hệ thống ngoài (kế toán, hóa đơn điện tử, thanh toán, chấm công) → đầu nối Tầng 3.

**Nguyên tắc ranh giới:** Tầng 1 không chứa giao diện nghiệp vụ cho người dùng cuối; không dựng API Gateway thứ hai ở Tầng 3; Gateway không thay thế phân quyền trong dịch vụ.

### 2.2. Chức năng sản phẩm

| Nhóm | Chức năng tổng quát | Tầng | Ưu tiên |
| --- | --- | --- | --- |
| A | Quản lý doanh nghiệp, người dùng, vai trò; đăng nhập SSO | 1 | Bắt buộc |
| A | API Gateway làm cửa vào chung | 1 | Bắt buộc |
| A | Lưu bản ghi cấu trúc (PostgreSQL) và tệp (MinIO) | 1 | Bắt buộc |
| A | Workflow Engine giữ trạng thái đề nghị, tuyến duyệt, quyết định | 1 | Bắt buộc |
| A | Cổng Web: tạo, sửa, gửi, duyệt/từ chối, tìm kiếm, theo dõi đề nghị | 2 | Bắt buộc |
| A | Dashboard cơ bản: số hồ sơ theo trạng thái, thời gian xử lý, chi phí | 2 | Bắt buộc |
| A | Nhật ký kiểm toán, kiểm tra quyền, cách ly dữ liệu | 1 | Bắt buộc |
| B | Nhắc hạn, thông báo trong ứng dụng và email | 2 | Cao |
| B | Cấu hình ngưỡng duyệt, người thay thế, luồng trả hồ sơ | 2 | Cao |
| B | Danh mục nhà cung cấp, ngân sách, so sánh báo giá, xuất CSV/PDF | 3 | Cao |
| A | Giám sát, sao lưu, thử khôi phục, kiểm tra tệp tải lên | 1 | Cao |
| A | Trợ lý RAG hỏi đáp chính sách, tóm tắt hồ sơ có dẫn nguồn | 2 | Mở rộng |
| C | Danh mục API, đầu nối giả lập kế toán/kho, sự kiện webhook | 3 | Mở rộng |
| A | Kho dữ liệu lịch sử, phả hệ dữ liệu, kiểm tra chất lượng | 1-2 | Mở rộng |
| A | Kết nối dữ liệu OT (nguồn thật hoặc mô phỏng ghi rõ) | 3 | Mở rộng |

### 2.3. Lớp người dùng và đặc điểm

| Vai trò | Trình độ kỹ thuật | Quyền hạn tối đa đề xuất |
| --- | --- | --- |
| Quản trị nền tảng | Cao | Tạo doanh nghiệp, cấu hình kỹ thuật, giám sát; mặc định không đọc nội dung hồ sơ |
| Chủ doanh nghiệp/quản trị doanh nghiệp | Trung bình | Mời người dùng, gán vai trò, bật mô-đun Tầng 3, đặt tuyến duyệt, xem báo cáo doanh nghiệp mình |
| Quản lý bộ phận/người phê duyệt | Trung bình | Xem hồ sơ bộ phận, duyệt/từ chối trong hạn mức, không tự duyệt hồ sơ của mình |
| Nhân viên | Cơ bản | Tạo, sửa hồ sơ của mình trước khi gửi; xem trạng thái; thực hiện việc được giao |
| Kế toán | Trung bình | Xem đơn đã duyệt và chứng từ, cập nhật trạng thái thanh toán |
| Nhà cung cấp/đối tác | Cơ bản | Xem lời mời báo giá hoặc đơn hàng được chia sẻ, gửi báo giá, cập nhật giao hàng |
| Nhà phát triển mô-đun | Cao | Đọc tài liệu API, thử nghiệm trong môi trường mẫu |

Một người có thể kiêm nhiều vai trò; hệ thống vẫn kiểm tra quyền trên từng hành động. Chi tiết ma trận quyền ở Phụ lục D.

### 2.4. Môi trường vận hành

- **Máy chủ:** Linux, triển khai bằng container (Docker/Kubernetes), cấu hình lưu phiên bản theo GitOps.
- **Cơ sở dữ liệu:** PostgreSQL (giao dịch); MinIO (đối tượng/tệp).
- **Trình duyệt người dùng:** phiên bản mới của Chrome, Edge, Firefox, Safari; hiển thị tốt trên máy tính và máy tính bảng.
- **Mạng:** kết nối HTTPS giữa trình duyệt, Gateway và dịch vụ.

### 2.5. Ràng buộc thiết kế và triển khai

- Toàn bộ thành phần dùng giấy phép nguồn mở tương thích yêu cầu cuộc thi; kiểm tra giấy phép trước khi đóng gói.
- Trình duyệt không kết nối trực tiếp cơ sở dữ liệu; mọi truy cập đi qua API Gateway rồi API nghiệp vụ NestJS; phần máy chủ của Next.js cũng không nối thẳng cơ sở dữ liệu.
- Mật khẩu thuộc hệ thống định danh, không lưu trong cơ sở dữ liệu nghiệp vụ.
- Workflow Engine là nơi duy nhất giữ trạng thái quy trình; n8n chỉ bổ sung thông báo/đồng bộ.
- Hạn mức duyệt do doanh nghiệp cấu hình, không ghi cứng trong mã nguồn.
- Mô hình bảo mật Zero-Trust: xác thực mọi yêu cầu, quyền tối thiểu, mã hóa kết nối, che bí mật hệ thống.
- Kho mã nguồn công khai, bản phát hành có phiên bản, README, Changelog và Bug Tracker.

### 2.6. Tài liệu cho người dùng

- Hướng dẫn sử dụng theo vai trò (nhân viên, quản lý, kế toán, chủ doanh nghiệp, nhà cung cấp).
- Tài liệu API (phiên bản, ví dụ tích hợp, môi trường thử nghiệm không chứa dữ liệu thật).
- Hướng dẫn cài đặt, sơ đồ triển khai, Changelog.
- Kịch bản demo 10-12 phút từ đăng nhập đến báo cáo; video demo.

### 2.7. Giả định và phụ thuộc

- Hạ tầng máy chủ và mạng ổn định trong quá trình trình diễn.
- Các thành phần nguồn mở tham chiếu (Keycloak, APISIX, Flowable...) tiếp tục có giấy phép và bản phát hành tương thích.
- Hệ thống ngoài (kế toán, hóa đơn điện tử, thanh toán) chỉ tích hợp thật khi nhà cung cấp cấp API và quyền truy cập; nếu chưa có, dùng bản giả lập và nói rõ trong demo.
- Dữ liệu mẫu không chứa thông tin thật.
- Dịch vụ email/SMTP sẵn sàng cho chức năng thông báo (nhóm B).

### 2.8. Đối chiếu với đề thi và thể lệ

Đề thi chỉ bắt buộc Tầng 1 headless và ít nhất một ứng dụng giao diện ở Tầng 2; đội được tự chọn công nghệ. Nhóm quyết định đáp ứng đủ cả bảy lớp chức năng của giải pháp tham chiếu (mục 2.9), mỗi lớp ở mức tối thiểu chạy được, và phân ưu tiên để đội tối đa 3 sinh viên hoàn thành trước ngày chấm.

| Yêu cầu của đề | Mã SRS | Ghi chú |
| --- | --- | --- |
| Build Open-core headless Tầng 1: Identity/SSO | FR-IAM-01..03 | Bắt buộc |
| Build API Gateway | FR-GW-01 | Bắt buộc |
| Ít nhất một ứng dụng demo có giao diện ở Tầng 2 | FR-WEB-01..03, FR-DSB-01 | Bắt buộc; giao diện quản trị của Keycloak, Flowable, MinIO không tính là ứng dụng Tầng 2 |
| Dữ liệu và workflow | FR-DAT-01..02, FR-WF-01 | Khung kiến trúc coi là bốn nhóm dịch vụ lõi; giữ ưu tiên A để luồng demo chạy được |

Bản tóm tắt đề nêu mức tối thiểu là SSO và Gateway, còn khung kiến trúc nêu bốn nhóm dịch vụ lõi. SRS lấy bốn nhóm làm mục tiêu cho luồng demo và coi SSO + Gateway là ngưỡng không được thiếu; cần đối chiếu lại khi Ban tổ chức công bố đề chính thức.

**Mốc thời gian (cấp quốc gia):**

| Mốc | Thời điểm |
| --- | --- |
| Công bố đề thi, tiếp nhận đăng ký | Tháng 11/2026 |
| Chấm kho mã nguồn (PoF) | 07-09/12/2026 |
| Trình diễn và chấm chung kết | 10/12/2026 |
| Công bố kết quả, trao giải | 11/12/2026 |

**Bốn nguyên lý của đề và cách DigiX đáp ứng:**

| Nguyên lý | Cách đáp ứng | Mức |
| --- | --- | --- |
| Tách tốc độ và vòng đời dữ liệu | PostgreSQL cho giao dịch hiện hành; kết xuất sang kho phân tích khi quy mô tăng (NFR-PER-04, FR-DAT-04) | A |
| Hội tụ IT và OT | IT trước; OT qua nguồn thật hoặc nguồn mô phỏng ghi rõ (FR-L3-01) | A |
| DataOps và Lineage tự động | Chỉ số dashboard truy về bản ghi gốc; lineage tự động ở FR-DAT-04 | A |
| Zero-Trust, GitOps, kiểm dịch biên | NFR-SEC, NFR-MNT, kiểm dịch tệp tại biên (FR-DAT-02) | A / B |

**Thành phần tham chiếu của đề chưa nằm trong v1.0:** chat, kanban, eOffice/HR/KPI/hóa đơn (Tầng 2); IOC và DaaS (NGSI-LD, Lakehouse, GIS, sổ cái bất biến, OCR và tìm kiếm vector đã đưa vào bảy lớp ở mục 2.9); OMS/WMS/POS/TMS, PSA/Timesheet, BIM-CDE, eKYC/LMS/EMR/CRM (Tầng 3). DigiX chọn mua sắm và chi phí làm mô-đun trình diễn; các mô-đun còn lại là lộ trình mở rộng.

**Kỷ luật 5 RÕ được hệ thống thực thi:**

| Nguyên tắc | Yêu cầu tương ứng |
| --- | --- |
| Rõ vai trò | Vai trò, người duyệt, người được giao ở từng bước (FR-IAM-02, FR-WF-01) |
| Rõ trách nhiệm | Lý do quyết định và nhật ký người thực hiện (FR-WEB-03, FR-AUD-01) |
| Rõ quy trình | Tuyến duyệt BPMN, bước nào xong mới sang bước sau (FR-WF-01) |
| Rõ tiêu chuẩn | Trường bắt buộc, hạn duyệt, định nghĩa chỉ số công bố (FR-WEB-02, FR-DSB-01) |
| Rõ công cụ | Mọi việc giao và duyệt trên hệ thống, không qua tin nhắn hay lời nói (FR-WEB-01) |

### 2.9. Bảy lớp chức năng tham chiếu: đều bắt buộc

Đề cho đội toàn quyền chọn công nghệ và dùng bảy lớp làm ví dụ tham chiếu; nhóm quyết định đáp ứng đủ cả bảy lớp, mỗi lớp ở mức tối thiểu chạy được trong luồng demo. Bốn nguyên lý thiết kế của đề (tách theo vòng đời dữ liệu, hội tụ IT và OT, quản trị dữ liệu có phả hệ và chất lượng, Zero-Trust cùng GitOps và kiểm dịch biên) áp dụng cho mọi lớp.

| Lớp | Công nghệ ví dụ của đề | Mức tối thiểu DigiX v1.0 | Yêu cầu liên quan |
| --- | --- | --- | --- |
| 1. Trải nghiệm và giao diện đa kênh | Nuxt 3/Vue 3, Tailwind CSS, Centrifugo, Flutter | Cổng Web Next.js responsive dùng được trên di động; cập nhật trạng thái thời gian thực qua WebSocket; ứng dụng Flutter nếu còn thời gian | FR-WEB-01..03, FR-MSG-01, FR-L1-01 |
| 2. Biên mạng, cửa ngõ, an toàn thông tin | APISIX, Keycloak, Vault, ClamAV, Coraza WAF | SSO và MFA; Gateway kiểm tra token; kho bí mật; quét mã độc tệp; WAF tại biên | FR-IAM-01..04, FR-GW-01, FR-DAT-02, FR-L2-01 |
| 3. Tác nghiệp, logic, trạng thái thực thể | Hasura, PostgreSQL (+PostGIS), MongoDB, Orion Context Broker | PostgreSQL giao dịch cùng API nghiệp vụ NestJS có phân quyền theo \`tenant\_id\`; một nhóm thực thể ngữ cảnh theo NGSI-LD; kho tài liệu riêng chỉ khi cần | FR-DAT-01, FR-DAT-03, FR-L3-01 |
| 4. Tự động hóa, quy trình, DevSecOps | GitLab CI, ArgoCD, Flowable, n8n, Kestra, Velero | Flowable giữ trạng thái quy trình; pipeline CI/CD và GitOps; sao lưu và khôi phục thử; công cụ tác vụ ngầm giấy phép OSI | FR-WF-01..02, FR-OPS-01 |
| 5. Dữ liệu siêu hội tụ, truyền phát, sổ cái | Redpanda, Apache Iceberg, MinIO, ImmuDB | Bus sự kiện; MinIO lưu tệp; đẩy dữ liệu lịch sử sang lakehouse; sổ cái bất biến niêm phong quyết định duyệt | FR-MSG-01, FR-DAT-02, FR-L5-01..02 |
| 6. Phân tích, không gian, trí tuệ | Trino/DuckDB, GeoServer, Metabase/Cube.dev, Ollama/vLLM | Dashboard; truy vấn phân tích trên lakehouse; một lớp bản đồ; mô hình ngôn ngữ chạy nội bộ cho trợ lý RAG | FR-DSB-01, FR-AI-01, FR-L6-01..02 |
| 7. Quản trị, tìm kiếm, giám sát | Vector, Parseable, OpenMetadata, Meilisearch, Qdrant, Prometheus/Grafana | Thu nhật ký kiểm toán; danh mục dữ liệu và lineage; tìm toàn văn và tìm vector; giám sát | FR-AUD-01, FR-DAT-04, FR-AI-02, FR-OPS-01, FR-L7-01..02 |

**Ranh giới với ba tầng (giả định):** Tầng 1 gồm các lớp 2-5 và 7, Tầng 2 dùng lớp 1 và 6, Tầng 3 là ứng dụng nghiệp vụ và đầu nối cắm lên trên. Mọi truy cập dữ liệu vẫn đi qua API Gateway và API có kiểm tra quyền.

**Dữ liệu OT:** bản sao số chỉ dựng trên dữ liệu thật nếu có; nếu chưa có, dùng bộ phát mô phỏng, ghi rõ "mô phỏng" trên giao diện và tài liệu, không tuyên bố đã nối cảm biến thật.

**Công nghệ:** cột "công nghệ ví dụ" không bắt buộc; đội thay bằng thành phần khác cùng chức năng, miễn đạt giấy phép OSI-approved (B.6). Nên chọn thành phần nhẹ cho từng lớp (ví dụ DuckDB thay Trino) để vừa sức đội.

**Rủi ro phạm vi:** bảy lớp với tối đa 3 sinh viên là khối lượng lớn. Giảm rủi ro bằng cách làm mỗi lớp một lát cắt dọc nhỏ gắn vào luồng demo; thứ tự đề xuất lớp 2, 3-4, 1, 5, 7, 6; nếu thiếu thời gian, giữ SSO, Gateway và ứng dụng Tầng 2 chạy ổn trước vì đó là ngưỡng tối thiểu của đề.

**Hiệu lực:** nếu mức ưu tiên ở mục 2.2, A.1, A.4 khác mục này, mục 2.9 và A.5 có hiệu lực.

### 2.10. Công nghệ lựa chọn của DigiX

DigiX dùng Next.js cho giao diện và NestJS cho API nghiệp vụ; cả hai viết bằng TypeScript nên đội dùng chung kiểu dữ liệu và công cụ. Các thành phần hạ tầng khác theo mục 2.9.

| Thành phần | Công nghệ | Vai trò | Ràng buộc |
| --- | --- | --- | --- |
| Frontend | Next.js (React, TypeScript), Tailwind CSS | Cổng Web Tầng 2, dùng được trên di động | Chỉ gọi API qua Gateway; server components và route handlers không truy cập thẳng PostgreSQL hay MinIO; đăng nhập OIDC với Keycloak, phiên giữ bằng cookie httpOnly |
| Thời gian thực | Centrifugo (client JavaScript) | Cập nhật trạng thái, thông báo | Token ngắn hạn do NestJS cấp theo người dùng và `tenant_id` |
| Backend | NestJS (TypeScript) | API nghiệp vụ headless Tầng 1 | Không giữ trạng thái quy trình, không lưu mật khẩu; mọi endpoint qua guard kiểm tra token, vai trò, `tenant_id` và phạm vi bản ghi |
| Truy cập dữ liệu | ORM hoặc query builder trên PostgreSQL (ví dụ Prisma hoặc TypeORM; đội chốt) | Truy vấn dữ liệu giao dịch | Điều kiện `tenant_id` bắt buộc ở lớp truy cập chung hoặc row-level security của PostgreSQL, không chỉ ở từng controller |
| Workflow | Flowable (dịch vụ Java riêng) | Giữ trạng thái duyệt | NestJS gọi qua REST và đồng bộ nhiệm vụ sang trang việc cần làm |
| Tệp | MinIO | Lưu chứng từ | NestJS kiểm tra quyền rồi cấp URL có thời hạn |
| Tài liệu API | OpenAPI (Swagger) sinh từ NestJS | Danh mục API cho Tầng 3 và nhà phát triển | API có tiền tố phiên bản, ví dụ /v1 |
| Kiểm thử | Jest và Supertest cho API; Playwright cho giao diện | Tự động hóa các tình huống ở Phụ lục F | Chạy trong pipeline CI trước khi phát hành |

**Mô-đun NestJS đề xuất:** auth, tenants, users, purchase-requests, approvals, files, audit, dashboard, notifications, integrations (đầu nối, webhook). Tầng 3 (mô-đun mua sắm) có thể là mô-đun NestJS riêng hoặc dịch vụ riêng, nhưng vẫn đi qua Gateway và dùng chung SSO.

**Build và giấy phép:** Next.js và NestJS dựng bằng npm hoặc pnpm với lockfile, chạy trong container riêng, dùng gói từ kho npm chính thức, không nhúng mã dự án khác (NFR-OSS-04, NFR-OSS-05). Next.js, NestJS và React theo hiểu biết hiện tại dùng giấy phép MIT; cần quét giấy phép các phụ thuộc bắc cầu trước khi phát hành.

---

## 3. Yêu cầu chi tiết hệ thống

### A. Yêu cầu chức năng

Quy ước mã: **FR-\<nhóm>-\<số>**. Ưu tiên A = bắt buộc cho đề thi, B = nâng chất lượng, C = mở rộng.

#### A.1. Danh mục yêu cầu chức năng

| Mã | Tên chức năng | Tầng | Ưu tiên |
| --- | --- | --- | --- |
| FR-IAM-01 | Quản lý doanh nghiệp (tenant) | 1 | A |
| FR-IAM-02 | Quản lý người dùng và vai trò | 1 | A |
| FR-IAM-03 | Đăng nhập SSO, đăng xuất, MFA cho tài khoản quyền cao | 1 | A |
| FR-GW-01 | Định tuyến, kiểm tra token, giới hạn tần suất qua Gateway | 1 | A |
| FR-DAT-01 | API nghiệp vụ NestJS dùng chung (đọc/ghi có kiểm soát) | 1 | A |
| FR-DAT-02 | Tải lên, kiểm tra và truy cập tệp đính kèm | 1 | A |
| FR-WF-01 | Khởi chạy và vận hành quy trình duyệt đề nghị | 1 | A |
| FR-WF-02 | Ngưỡng duyệt, người thay thế, trả hồ sơ sửa, quá hạn | 1 | B |
| FR-AUD-01 | Nhật ký kiểm toán | 1 | A |
| FR-WEB-01 | Cổng làm việc: việc cần làm, thông báo, tìm kiếm | 2 | A |
| FR-WEB-02 | Tạo, sửa, gửi đề nghị mua hàng | 2 | A |
| FR-WEB-03 | Duyệt, từ chối, yêu cầu bổ sung | 2 | A |
| FR-DSB-01 | Dashboard quản lý | 2 | A |
| FR-NTF-01 | Nhắc hạn, thông báo trong ứng dụng, email | 2 | B |
| FR-AI-01 | Trợ lý nội bộ RAG có dẫn nguồn | 2 | A |
| FR-PRC-01 | Mô-đun mua sắm: nhà cung cấp, báo giá, đơn mua, ngân sách | 3 | B (cần cho demo) |
| FR-INT-01 | Đầu nối giả lập kế toán/kho, sự kiện webhook, hàng đợi thử lại | 3 | C (cần cho demo) |
| FR-INT-02 | Danh mục API và cấp khóa cho ứng dụng | 3 | C |
| FR-PTN-01 | Cổng nhà cung cấp/đối tác | 3 | B |

#### A.2. Đặc tả chi tiết các chức năng cốt lõi

**FR-IAM-03 — Đăng nhập SSO**

- **Điều kiện tiên quyết:** người dùng đã được mời và có tài khoản trong doanh nghiệp.
- **Luồng chính:** (1) Người dùng mở cổng Web; (2) được chuyển sang trang đăng nhập của hệ thống định danh; (3) nhập thông tin xác thực (kèm MFA nếu vai trò quyền cao); (4) hệ thống phát hành token mang `tenant_id` và vai trò; (5) người dùng vào cổng, và vào mô-đun Tầng 3 mà không phải đăng nhập lại.
- **Luồng ngoại lệ:** sai mật khẩu (báo lỗi chung, khóa tạm sau số lần sai cấu hình được); tài khoản bị vô hiệu hóa (từ chối); token hết hạn (làm mới hoặc đăng nhập lại).
- **Điều kiện sau:** phiên hợp lệ được tạo; sự kiện đăng nhập ghi vào nhật ký.
- **Ràng buộc dữ liệu:** mật khẩu không lưu trong cơ sở dữ liệu nghiệp vụ; tuân thủ chính sách độ mạnh mật khẩu do doanh nghiệp cấu hình.

**FR-WEB-02 — Tạo, sửa, gửi đề nghị mua hàng**

- **Điều kiện tiên quyết:** nhân viên đã đăng nhập, thuộc một bộ phận.
- **Luồng chính:** (1) Chọn "Tạo đề nghị"; (2) nhập tiêu đề, mô tả, nhà cung cấp, danh sách hàng hóa, số lượng, đơn giá, lý do; (3) tải báo giá/chứng từ; (4) lưu nháp; (5) nhấn "Gửi"; (6) hệ thống kiểm tra, lưu vào PostgreSQL, lưu tham chiếu tệp MinIO và khởi chạy quy trình ở Workflow Engine.
- **Luồng ngoại lệ:** thiếu trường bắt buộc hoặc số tiền không hợp lệ (chặn gửi, hiện lỗi từng trường — Poka-yoke); tệp sai loại, quá dung lượng hoặc nhiễm mã độc (từ chối, báo lý do); mất kết nối khi gửi (giữ bản nháp, không tạo bản ghi trùng).
- **Điều kiện sau:** đề nghị ở trạng thái "Chờ duyệt", hiện trong việc cần làm của người duyệt và lịch sử của người tạo.
- **Ràng buộc dữ liệu (validation):**

| Trường | Quy tắc |
| --- | --- |
| Tiêu đề | Bắt buộc, 5-200 ký tự |
| Số lượng | Số nguyên dương |
| Đơn giá, tổng tiền | Số lớn hơn 0; tổng tiền tính tự động từ các dòng |
| Báo giá | Bắt buộc khi tổng tiền vượt mức do doanh nghiệp cấu hình |
| Tệp đính kèm | Loại cho phép (PDF, ảnh, DOCX, XLSX), tối đa kích thước cấu hình, quét mã độc |
| Bộ phận | Bắt buộc, thuộc `tenant_id` của người tạo |

**FR-WF-01 — Quy trình duyệt đề nghị**

- **Điều kiện tiên quyết:** đề nghị đã được gửi; tuyến duyệt của doanh nghiệp đã cấu hình.
- **Luồng chính:** tạo yêu cầu → kiểm tra thông tin → trưởng bộ phận duyệt → chủ doanh nghiệp/kế toán duyệt nếu vượt ngưỡng → chấp thuận hoặc từ chối. Mỗi bước giao đúng người/nhóm đủ thẩm quyền và ghi lý do quyết định.
- **Luồng ngoại lệ:** người duyệt yêu cầu bổ sung (trả về người tạo, sửa rồi nộp lại, quy trình tiếp tục từ bước phù hợp); quá hạn (nhắc việc, leo thang hoặc chuyển người thay thế); người duyệt vắng mặt (giao cho người thay thế đã cấu hình); người tạo trùng người duyệt (hệ thống bỏ qua người đó, chuyển cấp trên).
- **Điều kiện sau:** trạng thái cuối "Đã duyệt" hoặc "Từ chối" được lưu; sự kiện "đơn mua đã duyệt" phát cho mô-đun mua sắm (nếu bật).
- **Ràng buộc:** quy trình giữ nguyên trạng thái khi người dùng đóng trình duyệt hoặc dịch vụ khởi động lại; người tạo không được duyệt yêu cầu của chính mình; hạn mức duyệt lấy từ cấu hình doanh nghiệp.

**FR-WEB-03 — Duyệt, từ chối, yêu cầu bổ sung**

- **Điều kiện tiên quyết:** người duyệt có việc được giao trong hạn mức của mình.
- **Luồng chính:** mở việc cần làm → xem hồ sơ, chứng từ và lịch sử → chọn Duyệt / Từ chối / Yêu cầu bổ sung → nhập lý do → xác nhận.
- **Luồng ngoại lệ:** vượt hạn mức (API từ chối và ghi nhật ký truy cập bị từ chối); hồ sơ đã bị người khác xử lý (báo trạng thái hiện tại, không ghi đè); bỏ trống lý do khi từ chối (chặn).
- **Điều kiện sau:** trạng thái cập nhật tức thì trên cổng việc cần làm của các bên liên quan.

**FR-DAT-02 — Tệp đính kèm**

- Tệp lưu ở MinIO; PostgreSQL chỉ giữ mã tham chiếu, loại tệp, chủ sở hữu, thời điểm và trạng thái kiểm tra.
- Truy cập tệp qua URL có thời hạn sau khi API kiểm tra quyền; URL hết hạn hoặc bị thu hồi không còn truy cập được.
- Tệp chỉ khả dụng sau khi kiểm tra loại, kích thước và quét mã độc đạt.

**FR-DSB-01 — Dashboard quản lý**

- **Chỉ số:** số yêu cầu mới, đang chờ, quá hạn; thời gian duyệt trung bình; chi phí theo bộ phận; ngân sách còn lại.
- **Quy tắc:** số liệu lấy từ bản ghi giao dịch chuẩn hóa, không nhập tay; mỗi chỉ số có định nghĩa, công thức và thời điểm cập nhật được công bố; có thể truy từ số liệu về hồ sơ gốc; lọc theo phạm vi người xem được phép.

**FR-AUD-01 — Nhật ký kiểm toán**

- Ghi người thực hiện, doanh nghiệp, thao tác, hồ sơ, thời điểm và kết quả cho mọi lần duyệt, thay đổi quyền và truy cập bị từ chối.
- Nhật ký không cho sửa/xóa tùy tiện; chỉ vai trò được cấp mới xem trong phạm vi doanh nghiệp mình.

**FR-AI-01 — Trợ lý nội bộ (ưu tiên C)**

- Trả lời câu hỏi về chính sách mua sắm (ví dụ: "Quy trình mua thiết bị trên 20 triệu đồng là gì?") và tóm tắt hồ sơ, kèm trích dẫn nguồn.
- Chỉ truy xuất tài liệu mà người hỏi có quyền đọc, trong phạm vi `tenant_id` của họ.
- AI chỉ đề xuất hoặc cảnh báo thiếu chứng từ; không tự phê duyệt hoặc xử lý ngoại lệ.

**FR-INT-01 — Đầu nối giả lập và sự kiện**

- Khi đơn mua được duyệt, mô-đun mua sắm tạo đơn mua; đầu nối giả lập gửi dữ liệu sang kế toán/kho.
- Sự kiện kiểm tra quyền, lưu nhật ký, nhận xác nhận, xử lý gửi trùng (idempotent) và có hàng đợi thử lại khi đối tác tạm ngừng.
- Mỗi đầu nối dùng tài khoản dịch vụ, phạm vi API tối thiểu, token có thời hạn và thu hồi được. Không kết nối thẳng PostgreSQL/MinIO.
- Bản demo ghi rõ hệ thống giả lập, không tuyên bố tích hợp dịch vụ thật.

**FR-PTN-01 — Cổng nhà cung cấp**

- Nhà cung cấp đăng nhập bằng tài khoản đối tác, chỉ thấy lời mời báo giá được chia sẻ, gửi báo giá và cập nhật giao hàng.
- Không đọc dữ liệu nhân sự, ngân sách, hồ sơ nội bộ hay dữ liệu đối tác khác.

#### A.3. Giao diện người dùng (mockup cần có)

| Màn hình | Mô tả ngắn |
| --- | --- |
| Đăng nhập | Chuyển hướng SSO, thông báo lỗi chung |
| Trang việc cần làm | Danh sách việc giao cho tôi, lọc theo trạng thái/hạn |
| Biểu mẫu đề nghị | Trường bắt buộc, tính tổng tự động, tải báo giá |
| Chi tiết hồ sơ | Thông tin, chứng từ, dòng thời gian trạng thái, nút Duyệt/Từ chối |
| Dashboard | Thẻ chỉ số, biểu đồ chi phí theo bộ phận, bảng quá hạn |
| Quản trị doanh nghiệp | Người dùng, vai trò, ngưỡng duyệt, bật/tắt mô-đun |
| Cổng nhà cung cấp | Danh sách lời mời báo giá, form gửi báo giá |

*Hình mockup chi tiết sẽ đính kèm khi hoàn thiện thiết kế giao diện.*

#### A.4. Yêu cầu bổ sung theo đề thi và tài liệu DX-OS

Các chức năng dưới đây lấp khoảng trống so với mô hình tham chiếu của đề (Open-core, H-P-D-I, bốn nguyên lý) và phương pháp DX-OS. Không chức năng nào ở đây nằm trong ngưỡng tối thiểu của đề.

| Mã | Chức năng | Tầng | Ưu tiên | Kiểm thử |
| --- | --- | --- | --- | --- |
| FR-IAM-04 | Quản lý bí mật và chứng thư (secret vault, PKI nội bộ cho kết nối giữa dịch vụ) | 1 | A | TC-IAM-05: bí mật không nằm trong mã nguồn hay biến môi trường rõ |
| FR-MSG-01 | Truyền thông và giao vận dữ liệu: hàng đợi, sự kiện bất đồng bộ, WebSocket cho thông báo; sự kiện ký số và lưu vết để chống chối bỏ | 1 | A | TC-MSG-01: mất kết nối rồi gửi lại không trùng; TC-MSG-02: tra được ai gửi, lúc nào |
| FR-OPS-01 | Vận hành, giám sát, kiểm toán: thu thập log, kênh sự kiện, CI/CD tự động kiểm tra, sao lưu và khôi phục | 1 | A | TC-OPS-01: pipeline chạy kiểm thử trước khi phát hành; TC-REL-01 |
| FR-DAT-03 | Lưu hồ sơ bán cấu trúc (PostgreSQL JSONB; chỉ thêm kho NoSQL riêng khi có nhu cầu thật) | 1 | C | TC-DAT-03: truy vấn hồ sơ có `tenant_id` |
| FR-DAT-04 | Phả hệ dữ liệu (lineage) tự động và kiểm tra chất lượng dữ liệu; kho lạnh bất biến cho nhật ký | 1-2 | A | TC-DAT-04: từ chỉ số dashboard truy ngược tới bản ghi nguồn |
| FR-AI-02 | OCR chứng từ và tìm kiếm ngữ nghĩa trong tài liệu được phép | 2 | A | TC-AI-03: OCR báo giá; tìm kiếm không trả tài liệu ngoài quyền |
| FR-WEB-04 | Nhắn tin nội bộ và bảng công việc (kanban) trong cổng | 2 | C | TC-WEB-01: giao việc hiện đúng người |
| FR-MKT-01 | Khung đóng gói mô-đun bên thứ ba: mô tả, phiên bản, giấy phép, quyền cần xin; kiểm tra tương thích, nguồn gói, gỡ/khôi phục | 3 | C | TC-MKT-01: cài, gỡ mô-đun mẫu không mất dữ liệu lõi |
| FR-DTI-01 | Khảo sát tự đánh giá DTI và biểu đồ radar H-P-D-I cho doanh nghiệp (đề xuất; công thức quy đổi chờ tài liệu DX-OS Chương 2 mục 2.4) | 2 | C | TC-DTI-01: khảo sát ba tầng (giám đốc, quản lý, nhân viên) cho ra điểm và biểu đồ |

#### A.5. Yêu cầu theo bảy lớp chức năng (mức tối thiểu)

Các chức năng dưới đây bảo đảm mỗi lớp trong mục 2.9 có ít nhất một thành phần chạy được trong luồng demo.

| Mã | Chức năng | Lớp | Ưu tiên | Kiểm thử |
| --- | --- | --- | --- | --- |
| FR-L1-01 | Cổng Web dùng tốt trên điện thoại (responsive/PWA); ứng dụng Flutter là phần thêm | 1 | A | TC-L1-01: thao tác duyệt trên màn hình hẹp |
| FR-L2-01 | WAF tại biên chặn tấn công web phổ biến, ghi nhật ký sự kiện bị chặn | 2 | A | TC-L2-01: gửi yêu cầu có mẫu tấn công, bị chặn và có log |
| FR-L3-01 | Thực thể ngữ cảnh theo NGSI-LD cho ít nhất một loại (đơn mua hoặc tồn kho), cập nhật theo sự kiện; nguồn OT là dữ liệu thật hoặc bộ phát mô phỏng ghi rõ trên giao diện | 3 | A | TC-L3-01: đổi trạng thái đơn mua, thực thể ngữ cảnh cập nhật |
| FR-L5-01 | Đẩy dữ liệu lịch sử và sự kiện từ PostgreSQL sang lakehouse theo lịch, không làm chậm giao dịch | 5 | A | TC-L5-01: dữ liệu cũ xuất hiện ở lakehouse, API giao dịch không chậm |
| FR-L5-02 | Sổ cái bất biến: niêm phong mật mã mỗi quyết định duyệt và thay đổi quyền; có kiểm tra phát hiện sửa đổi | 5 | A | TC-L5-02: sửa bản ghi gốc thì kiểm tra sổ cái báo lệch |
| FR-L6-01 | Truy vấn phân tích trên lakehouse cho báo cáo chi phí nhiều kỳ | 6 | A | TC-L6-01: báo cáo nhiều kỳ khớp bản ghi giao dịch |
| FR-L6-02 | Bản đồ vị trí nhà cung cấp hoặc kho, lọc theo phạm vi được phép | 6 | A | TC-L6-02: nhà cung cấp chỉ thấy điểm của mình |
| FR-L7-01 | Danh mục dữ liệu và lineage: tra được chỉ số dashboard từ đâu ra (liên hệ FR-DAT-04) | 7 | A | TC-L7-01: từ một chỉ số truy tới bảng nguồn |
| FR-L7-02 | Giám sát toàn diện: số đo dịch vụ, cảnh báo, bảng điều khiển vận hành | 7 | A | TC-L7-02: dừng một dịch vụ thì có cảnh báo |

### B. Yêu cầu phi chức năng

#### B.1. Hiệu năng

| Mã | Yêu cầu | Chỉ tiêu đề xuất |
| --- | --- | --- |
| NFR-PER-01 | Thời gian phản hồi API đọc thông thường | Dưới 2 giây ở phân vị 95 |
| NFR-PER-02 | Số người dùng đồng thời mỗi hệ thống | Tối thiểu 100 (hướng tới SME) |
| NFR-PER-03 | Tải trang cổng việc cần làm | Dưới 3 giây trên mạng thông thường |
| NFR-PER-04 | Báo cáo nặng | Kết xuất sang kho phân tích khi quy mô tăng, không làm chậm luồng tác nghiệp |

Các chỉ tiêu là đề xuất ban đầu, cần đo và điều chỉnh khi kiểm thử tải.

#### B.2. Bảo mật

| Mã | Yêu cầu |
| --- | --- |
| NFR-SEC-01 | Xác thực mọi yêu cầu bằng token OAuth2/OIDC (JWT) do hệ thống định danh phát hành |
| NFR-SEC-02 | Kiểm tra quyền tại API theo doanh nghiệp, vai trò, bộ phận, hồ sơ, trạng thái, số tiền; ẩn nút giao diện không được coi là bảo vệ |
| NFR-SEC-03 | Cách ly dữ liệu giữa các doanh nghiệp bằng `tenant_id` trong API, truy vấn, tìm kiếm, báo cáo và AI |
| NFR-SEC-04 | Mã hóa kết nối (TLS/HTTPS); che bí mật hệ thống; không lưu mật khẩu trong cơ sở dữ liệu nghiệp vụ |
| NFR-SEC-05 | MFA cho tài khoản quyền cao |
| NFR-SEC-06 | Kiểm tra loại/kích thước, quét mã độc, URL tệp có thời hạn |
| NFR-SEC-07 | Giới hạn tần suất truy cập và ghi nhật ký tại Gateway |
| NFR-SEC-08 | Tuân thủ OWASP Top 10 (kiểm tra injection, phân quyền hỏng, cấu hình sai...) |
| NFR-SEC-09 | Nhật ký kiểm toán được bảo vệ khỏi sửa/xóa tùy tiện |

#### B.3. Độ tin cậy và khả dụng

| Mã | Yêu cầu |
| --- | --- |
| NFR-REL-01 | Mục tiêu khả dụng đề xuất 99% (môi trường SME); có thể nâng lên 99,9% theo triển khai |
| NFR-REL-02 | Trạng thái workflow được lưu bền vững; dừng giao diện hoặc khởi động lại dịch vụ không làm mất trạng thái |
| NFR-REL-03 | Sao lưu định kỳ PostgreSQL và MinIO; thử khôi phục định kỳ và ghi lại kết quả |
| NFR-REL-04 | Giám sát dịch vụ và cảnh báo sự cố |
| NFR-REL-05 | Gửi sự kiện cho đối tác có xử lý gửi trùng và thử lại |

#### B.4. Khả năng duy trì và mở rộng

- Kiến trúc mô-đun theo ba tầng; ứng dụng Tầng 3 có thể thay hoặc gỡ mà không xây lại SSO, Gateway, kho dữ liệu, workflow.
- Vận hành GitOps: cấu hình có phiên bản, dựng lại được môi trường mới từ mã nguồn và tài liệu, tự động kiểm tra trước khi cập nhật.
- API có phiên bản; tài liệu API cập nhật cùng mã nguồn.
- Dịch vụ không trạng thái ở phía ứng dụng để co giãn ngang.

#### B.5. Tính dễ sử dụng

- Giao diện tiếng Việt, rõ ràng, nhất quán; hướng dẫn nội bộ ngay trong cổng.
- Thông báo lỗi chỉ rõ trường sai và cách sửa (Poka-yoke).
- Hỗ trợ truy cập cơ bản: tương phản màu, điều hướng bàn phím, nhãn cho thành phần giao diện (hướng tới WCAG 2.1 AA).
- Một nhân viên mới tạo được đề nghị đầu tiên chỉ với tài liệu hướng dẫn ngắn.

#### B.6. Tuân thủ nguồn mở (tiêu chí PoF, 50 điểm)

Phần I của thể lệ chấm kho mã nguồn trước chung kết (07-09/12/2026), nên các yêu cầu sau phải hoàn tất trước ngày đó.

| Mã | Yêu cầu | Tiêu chí thể lệ |
| --- | --- | --- |
| NFR-OSS-01 | Kho mã nguồn công khai, truy cập mở không cần đăng nhập, được dùng thật để phát triển (có lịch sử commit) | 1 (5 điểm) |
| NFR-OSS-02 | Giấy phép OSI-approved; có LICENSE toàn văn, thông báo mục đích giấy phép, tiêu đề giấy phép hoặc nhãn SPDX trong từng tệp mã; rà soát tương thích giữa các giấy phép thành phần | 2 (10 điểm) |
| NFR-OSS-03 | Ít nhất một bản phát hành có số phiên bản (SemVer), đóng gói định dạng mở như tar.gz, không dùng zip/rar | 3 (5 điểm) |
| NFR-OSS-04 | Dịch và cài từ mã nguồn: có hướng dẫn build; cấu hình trước khi dịch bằng biến môi trường hoặc tệp cấu hình, không sửa tay header; công cụ build mã nguồn mở; chạy được ngoài thư mục mã nguồn | 4 (10 điểm) |
| NFR-OSS-05 | Dùng thư viện/gói có sẵn của hệ thống hoặc kho gói chính thức; không nhúng kèm mã dự án khác; không sửa mã gói đính kèm; tệp triển khai tham chiếu image chính thức theo phiên bản | 5 (10 điểm) |
| NFR-OSS-06 | README, hướng dẫn sử dụng, CHANGELOG, bug tracker công khai | 6 (10 điểm) |

**Hiện trạng kho mã nguồn (kiểm tra ngày 31/10/2026):** kho [githubcuaan/digi](https://github.com/githubcuaan/digi) ở chế độ công khai, nhánh main, mới có 1 commit và một tệp README.md (nội dung "digix"). Chưa thấy các mục sau, cần hoàn tất trước 07/12/2026:

- Tệp LICENSE toàn văn và thông báo mục đích giấy phép (NFR-OSS-02).
- Tiêu đề giấy phép hoặc nhãn SPDX trong từng tệp mã (NFR-OSS-02).
- Bản phát hành có số phiên bản (NFR-OSS-03); mục Releases đang trống.
- Hướng dẫn build từ mã nguồn trong README (NFR-OSS-04).
- CHANGELOG và việc dùng Issues làm bug tracker thật, có nội dung (NFR-OSS-06).
- Lịch sử commit đều đặn để chứng minh kho được dùng thật (NFR-OSS-01).

**Cảnh báo giấy phép thành phần (dựa trên hiểu biết hiện tại; cần kiểm tra lại đúng phiên bản sẽ dùng trước khi đóng gói):**

| Thành phần | Giấy phép dự kiến | Xử lý đề xuất |
| --- | --- | --- |
| Keycloak, Apache APISIX, Flowable | Apache-2.0 | Dùng bình thường |
| PostgreSQL | PostgreSQL License | Dùng bình thường |
| MinIO | AGPL-3.0 (OSI-approved, ràng buộc copyleft qua mạng) | Kiểm tra phiên bản và cách phân phối hiện hành; chuẩn bị phương án thay thế tương thích S3 |
| n8n | Sustainable Use License (không thuộc danh sách OSI) | Không dùng làm thành phần bắt buộc; thay bằng bộ hẹn giờ của Flowable cùng SMTP, hoặc công cụ OSI như Node-RED |
| HashiCorp Vault | Business Source License (không thuộc OSI) | Dùng bản nhánh nguồn mở như OpenBao (MPL-2.0) cho FR-IAM-04 |

**Cảnh báo bổ sung từ bảy lớp tham chiếu (cùng điều kiện: cần kiểm tra lại từng phiên bản):**

- **MongoDB** theo hiểu biết hiện tại dùng SSPL, không thuộc OSI; thay bằng PostgreSQL JSONB (FR-DAT-03).
- **Redpanda** bản cộng đồng theo hiểu biết hiện tại dùng Business Source License, không thuộc OSI; cần bus sự kiện có giấy phép OSI như Apache Kafka hoặc hàng đợi nhẹ hơn cho quy mô SME.
- **Orion Context Broker** (NGSI-LD) theo hiểu biết hiện tại là AGPL-3.0; chỉ dùng ở nhóm C và phải tuân thủ nghĩa vụ copyleft.
- **Metabase, Grafana, Parseable, MinIO** thuộc nhóm AGPL: dùng nguyên bản, không sửa mã, ghi rõ nguồn; nếu phải sửa thì công bố mã đã sửa.
- **Meilisearch (và Hasura nếu có dùng; DigiX dùng NestJS nên không cần Hasura)** có phần lõi mở và phần tính năng doanh nghiệp theo giấy phép riêng; chỉ dùng bản lõi mở và không bật tính năng thương mại.
- **ImmuDB, Centrifugo, ClamAV (GPL-2.0), GeoServer (GPL-2.0)**: kiểm tra giấy phép đúng phiên bản và tính tương thích với giấy phép của DigiX trước khi phát hành.
- **GPL/AGPL trộn với giấy phép của DigiX:** chạy dưới dạng dịch vụ riêng, giao tiếp qua mạng, thường không làm DigiX phải đổi giấy phép; nên xác nhận với người hướng dẫn trước khi chốt giấy phép.

### C. Giao diện bên ngoài

#### C.1. Giao diện người dùng

Cổng Web đáp ứng (responsive), ưu tiên máy tính và máy tính bảng; phong cách đồng nhất, font dễ đọc hỗ trợ tiếng Việt có dấu, màu sắc đạt độ tương phản. Giao diện xây bằng Next.js (React, TypeScript) và Tailwind CSS.

#### C.2. Giao diện phần cứng

Không bắt buộc ở v1.0. Máy quét mã vạch, máy chấm công hoặc cảm biến chỉ kết nối khi doanh nghiệp có nguồn dữ liệu thật (ưu tiên C), thông qua đầu nối có kiểm tra quyền.

#### C.3. Giao diện phần mềm

| Thành phần | Vai trò | Giao tiếp |
| --- | --- | --- |
| Keycloak | Định danh, SSO, MFA | OIDC/OAuth2 |
| Apache APISIX | API Gateway | HTTPS/REST |
| PostgreSQL | Dữ liệu cấu trúc | Truy cập qua API dữ liệu dùng chung |
| MinIO | Tệp phi cấu trúc | API tương thích S3, URL có thời hạn |
| Flowable | Workflow BPMN | REST |
| n8n (tùy chọn; kiểm tra giấy phép, xem 2.8) | Thông báo, đồng bộ | Webhook/REST, không giữ trạng thái nghiệp vụ |
| Hệ thống ngoài (giả lập) | Kế toán, kho, hóa đơn điện tử, thanh toán | REST/webhook qua đầu nối |
| Next.js (frontend) | Cổng Web Tầng 2 | HTTPS/REST tới Gateway; OIDC với Keycloak; WebSocket |
| NestJS (backend) | API nghiệp vụ headless Tầng 1 | REST/OpenAPI; kiểm tra JWT của Keycloak; gọi Flowable REST; PostgreSQL; MinIO |

#### C.4. Giao diện truyền thông/mạng

- HTTPS (TLS) cho mọi kết nối bên ngoài; REST/JSON cho API.
- Webhook cho sự kiện gửi đối tác, kèm chữ ký và cơ chế thử lại.
- WebSocket/SSE tùy chọn cho thông báo thời gian thực trong cổng.

---

## 4. Phụ lục và ma trận truy xuất

### Phụ lục A. Mô hình dữ liệu (ERD mức khái niệm)

| Thực thể | Thuộc tính chính | Quan hệ |
| --- | --- | --- |
| Tenant | tenant\_id, tên, trạng thái | 1 - n User, Department, Request |
| User | user\_id, tenant\_id, họ tên, bộ phận, trạng thái (không có mật khẩu) | n - n Role |
| Role | role\_id, tên, phạm vi | n - n User |
| Department | dept\_id, tenant\_id, tên, trưởng bộ phận | 1 - n User |
| Supplier | supplier\_id, tenant\_id, tên, liên hệ | 1 - n Quotation |
| PurchaseRequest | request\_id, tenant\_id, người tạo, bộ phận, tổng tiền, trạng thái, mã tiến trình workflow | 1 - n RequestLine, Attachment, ApprovalStep |
| RequestLine | line\_id, request\_id, mô tả, số lượng, đơn giá | n - 1 PurchaseRequest |
| ApprovalStep | step\_id, request\_id, người duyệt, quyết định, lý do, thời điểm | n - 1 PurchaseRequest |
| Attachment | file\_id, tenant\_id, tham chiếu MinIO, loại, chủ sở hữu, thời điểm, trạng thái kiểm tra | n - 1 PurchaseRequest |
| Budget | budget\_id, tenant\_id, bộ phận, kỳ, hạn mức, đã dùng | n - 1 Department |
| PurchaseOrder | po\_id, tenant\_id, request\_id, supplier\_id, trạng thái | 1 - 1 PurchaseRequest |
| AuditLog | log\_id, tenant\_id, người thực hiện, thao tác, đối tượng, kết quả, thời điểm | Chỉ ghi thêm |
| IntegrationClient | client\_id, tenant\_id, phạm vi API, thời hạn, trạng thái thu hồi | 1 - n EventDelivery |
| EventDelivery | event\_id, client\_id, loại sự kiện, trạng thái, số lần thử | n - 1 IntegrationClient |

### Phụ lục B. Quy trình nghiệp vụ (BPMN mô tả bằng văn bản)

1. **Bắt đầu:** nhân viên gửi đề nghị.
2. **Kiểm tra thông tin:** thiếu chứng từ → trả người tạo sửa và nộp lại.
3. **Trưởng bộ phận duyệt:** từ chối → kết thúc "Từ chối"; yêu cầu bổ sung → quay lại bước 2; duyệt → bước 4.
4. **Cổng điều kiện:** tổng tiền vượt ngưỡng cấu hình? Có → chủ doanh nghiệp/kế toán duyệt (từ chối hoặc chấp thuận); Không → chấp thuận.
5. **Quá hạn** ở bất kỳ bước duyệt: nhắc việc, sau đó chuyển người thay thế/leo thang.
6. **Kết thúc "Đã duyệt":** phát sự kiện cho mô-đun mua sắm tạo đơn mua và đầu nối giả lập gửi sang kế toán/kho.

### Phụ lục C. Biểu đồ use case tổng thể

| Tác nhân | Use case chính |
| --- | --- |
| Nhân viên | Đăng nhập, tạo/sửa/gửi đề nghị, xem trạng thái, tải chứng từ, hỏi trợ lý |
| Quản lý/người phê duyệt | Xem việc cần duyệt, duyệt/từ chối/yêu cầu bổ sung, xem dashboard bộ phận |
| Kế toán | Xem đơn đã duyệt, cập nhật trạng thái thanh toán, xuất dữ liệu được phép |
| Chủ doanh nghiệp | Mời người dùng, gán vai trò, đặt tuyến duyệt, bật/tắt mô-đun, xem báo cáo |
| Quản trị nền tảng | Tạo doanh nghiệp, giám sát, xử lý sự cố |
| Nhà cung cấp | Xem lời mời báo giá, gửi báo giá, cập nhật giao hàng |
| Nhà phát triển | Đọc tài liệu API, thử trong môi trường mẫu |
| Hệ thống ngoài | Nhận sự kiện, gửi xác nhận |

### Phụ lục D. Ma trận quyền minh họa

| Vai trò | Hồ sơ | Phê duyệt | Báo cáo | Tích hợp |
| --- | --- | --- | --- | --- |
| Quản trị nền tảng | Không xem dữ liệu doanh nghiệp | Không | Không | Cấu hình kỹ thuật |
| Chủ doanh nghiệp | Trong doanh nghiệp | Theo chính sách | Toàn doanh nghiệp | Bật/tắt mô-đun |
| Quản lý | Trong bộ phận | Được giao, đúng hạn mức | Trong bộ phận | Không |
| Nhân viên | Hồ sơ của mình | Không | Cá nhân | Không |
| Kế toán | Hồ sơ đã duyệt | Chỉ khi có thêm vai trò | Chi phí doanh nghiệp | Xuất dữ liệu được phép |
| Nhà cung cấp | Lời mời được chia sẻ | Không | Không | Báo giá, giao hàng |
| Nhà phát triển | Dữ liệu mẫu | Không | Không | API thử nghiệm |

Đây là phạm vi tối đa đề xuất; quyền thực tế vẫn được API kiểm tra theo doanh nghiệp, bộ phận, hồ sơ và trạng thái quy trình. Cột "Tích hợp" là quyền cấp hoặc dùng API, không phải quyền truy cập cơ sở dữ liệu trực tiếp.

### Phụ lục E. Ma trận truy xuất yêu cầu (RTM)

| Yêu cầu | Thành phần hiện thực | Test case |
| --- | --- | --- |
| FR-IAM-01/02 | Keycloak realm/nhóm, API dữ liệu | TC-IAM-01: tạo doanh nghiệp và người dùng; TC-IAM-02: gán vai trò |
| FR-IAM-03 | Keycloak, cổng Web | TC-IAM-03: SSO một lần vào cổng và mô-đun mua sắm; TC-IAM-04: sai mật khẩu |
| FR-GW-01 | APISIX | TC-GW-01: token sai bị chặn; TC-GW-02: vượt giới hạn tần suất |
| FR-DAT-01 | API NestJS, PostgreSQL | TC-DAT-01: cách ly `tenant_id`; TC-DAT-02: giao diện không nối thẳng CSDL |
| FR-DAT-02 | MinIO, module tệp của NestJS | TC-FILE-01: tệp sai loại; TC-FILE-02: URL hết hạn |
| FR-WEB-02 | Cổng Next.js, API NestJS, Flowable | TC-REQ-01: tạo và gửi hợp lệ; TC-REQ-02: thiếu trường/chứng từ |
| FR-WF-01/02 | Flowable | TC-WF-01: duyệt nhiều cấp; TC-WF-02: tạo không tự duyệt; TC-WF-03: khởi động lại giữ trạng thái; TC-WF-04: quá hạn |
| FR-WEB-03 | Cổng Next.js, API NestJS, Flowable | TC-APR-01: duyệt trong hạn mức; TC-APR-02: vượt hạn mức bị từ chối |
| FR-DSB-01 | Dashboard, nguồn giao dịch | TC-DSB-01: số liệu khớp bản ghi gốc; TC-DSB-02: lọc theo phạm vi |
| FR-AUD-01 | Dịch vụ nhật ký | TC-AUD-01: ghi mọi lần duyệt và truy cập bị từ chối |
| FR-NTF-01 | n8n/Notification service | TC-NTF-01: nhắc hạn và email |
| FR-PRC-01 | Mô-đun mua sắm Tầng 3 | TC-PRC-01: tạo đơn mua sau duyệt |
| FR-INT-01 | Đầu nối giả lập, hàng đợi | TC-INT-01: gửi trùng; TC-INT-02: đối tác ngừng rồi thử lại; TC-INT-03: thu hồi token |
| FR-PTN-01 | Cổng đối tác, API | TC-PTN-01: nhà cung cấp chỉ thấy lời mời của mình |
| FR-AI-01 | RAG service | TC-AI-01: câu trả lời có nguồn; TC-AI-02: không truy xuất tài liệu ngoài quyền |
| NFR-SEC-01..09 | Gateway, API, Keycloak | Tình huống phân quyền 1-5 (Phụ lục F) |
| NFR-REL-03 | Sao lưu/khôi phục | TC-REL-01: khôi phục thử thành công |

### Phụ lục F. Tình huống kiểm thử phân quyền

1. Nhân viên A tạo hồ sơ và xem được trạng thái của mình; nhân viên B ở bộ phận khác không mở được hồ sơ đó.
2. Quản lý đúng bộ phận duyệt được trong hạn mức; người tạo hồ sơ và quản lý không đủ hạn mức bị từ chối.
3. Kế toán xem được đơn đã duyệt để đối soát nhưng không tự sửa quyết định phê duyệt.
4. Nhà cung cấp chỉ mở được lời mời báo giá được chia sẻ; URL tệp hết hạn hoặc bị thu hồi không còn truy cập được.
5. Quản trị doanh nghiệp A, ứng dụng tích hợp A và trợ lý AI của A không đọc được bản ghi thuộc doanh nghiệp B.

### Phụ lục G. Kịch bản trình diễn (10-12 phút)

1. Đăng nhập SSO bằng tài khoản nhân viên, tạo đề nghị mua hàng, thử gửi thiếu chứng từ để thấy chặn lỗi.
2. Tải báo giá, gửi đề nghị; chứng minh giao diện chỉ gọi API qua Gateway.
3. Đăng nhập trưởng bộ phận, duyệt/từ chối với lý do; dừng giao diện rồi mở lại để thấy trạng thái workflow còn nguyên.
4. Đơn được chấp thuận: mô-đun mua sắm tạo đơn mua, đầu nối giả lập gửi sang kế toán/kho.
5. Xem dashboard, truy một con số về hồ sơ gốc.
6. Đăng nhập tài khoản nhà cung cấp, chỉ thấy lời mời báo giá của mình.
7. (Tùy chọn) Hỏi trợ lý AI về quy trình mua thiết bị trên 20 triệu đồng, nhận câu trả lời có trích dẫn; AI không tự duyệt.

### Phụ lục H. Danh sách kiểm tra hoàn thành

- Dựng lại môi trường mới từ mã nguồn và tài liệu; giấy phép các thành phần tương thích.
- Kho mã nguồn công khai, giấy phép nguồn mở phù hợp, bản phát hành có phiên bản, README, hướng dẫn cài đặt, Changelog, Bug Tracker.
- Tài khoản thử cho từng vai trò; dữ liệu mẫu không chứa thông tin thật.
- Đã kiểm thử: thiếu chứng từ, phê duyệt nhiều cấp, cách ly doanh nghiệp, quyền đối tác, thu hồi token đầu nối.

### Phụ lục I. Đối chiếu tiêu chí chấm Phần II (sản phẩm, 50 điểm)

| Tiêu chí | Điểm | SRS đáp ứng bằng |
| --- | --- | --- |
| 7. Tính nguyên gốc của giải pháp | 10 | Kiến trúc lắp ghép ba tầng thay cho ERP nguyên khối; phân quyền và cách ly từ giao diện tới AI (mục 9 khung kiến trúc); 5 RÕ và Poka-yoke thực thi bằng hệ thống; mô-đun cắm-rút |
| 8. Mức độ hoàn thiện | 10 | Luồng demo đầu-cuối nhóm A (Phụ lục G), kiểm thử phân quyền (Phụ lục F), không dàn trải sang mô-đun nhóm C |
| 9. Thân thiện người dùng | 10 | NFR mục B.5, thông báo lỗi theo trường, trang việc cần làm, hướng dẫn theo vai trò |
| 10. Phát triển bền vững | 10 | Tài liệu kỹ thuật và API, GitOps, sao lưu và khôi phục, RTM, khung đóng gói mô-đun |
| 11. Trình diễn và thu hút cộng đồng | 10 | Kịch bản 10-12 phút, tài khoản thử từng vai trò, dữ liệu mẫu, video demo |

### Phụ lục J. Vấn đề còn mở cần xác nhận

1. Mục "7 lớp tham chiếu" đã được bổ sung ở mục 2.9; cần xác nhận với đề chính thức lớp nào bắt buộc.
2. Mức tối thiểu của Tầng 1 giữa bản tóm tắt (SSO và Gateway) và khung kiến trúc (bốn nhóm dịch vụ); đối chiếu với đề chính thức tháng 11/2026.
3. Giấy phép của MinIO, n8n, Vault và mọi thành phần khác; chọn phương án thay thế trước khi dựng bản phát hành.
4. Công thức quy đổi DTI sang HPDI (Chương 2 mục 2.4 chưa có nội dung) nên FR-DTI-01 mới ở mức đề xuất.
5. Ngưỡng duyệt, chỉ tiêu hiệu năng và khả dụng là giá trị đề xuất ban đầu.
6. Đã chọn Next.js (frontend) và NestJS (backend); còn cần chốt thư viện truy cập dữ liệu, bộ kiểm thử và cách tích hợp Keycloak (mục 2.10).
7. Thông tin giảng viên hướng dẫn và các thành viên còn lại của đội (tác giả, tổ chức và kho mã nguồn đã có).
