# Đối chiếu DigiX Lab với đề và thể lệ PMNM OLP 2026

**Ngày đối chiếu:** 05/11/2026 · **Trạng thái:** đối chiếu văn bản chính thức, **không phải bằng chứng đã triển khai**.

**Nguồn trực tiếp:** [Đề thi VFOSSA, đăng 30/09/2026](https://vfossa.vn/tin-tuc/de-thi-phan-mem-nguon-mo-olp-2026-798.html) (§2–6; gọi tắt **Đề**); [Thể lệ VFOSSA, đăng 09/06/2026](https://vfossa.vn/tin-tuc/the-le-olp-phan-mem-nguon-mo-nam-2026-760.html) (mục *Lịch trình tổ chức*, *Các tiêu chí chấm điểm*; gọi tắt **Thể lệ**). Đề đăng ngày 30/09 dù Thể lệ dự kiến tháng 11 mới công bố; khi có văn bản cập nhật phải đối chiếu lại. Trích đoạn ngắn bên dưới dùng để nhận diện yêu cầu, không thay thế nguồn gốc.

## 1. Ngưỡng bài thi và phạm vi đội tự chọn

| Phân loại | Căn cứ trực tiếp | Áp dụng cho DigiX Lab |
| --- | --- | --- |
| **Bắt buộc — kiến trúc** | Đề §3: “nền tảng dịch vụ lõi chạy ngầm (headless) ở Tầng 1 và ít nhất một ứng dụng minh họa giao diện nằm trong không gian H-P-D-I ở Tầng 2” | Chứng minh dịch vụ Tầng 1 không có UI nghiệp vụ và ứng dụng Tầng 2 thực sự gọi lõi; UI quản trị hạ tầng không tính là ứng dụng minh họa. Tầng 3 là định hướng của mô hình DX-OS §2, **không được nêu là điều kiện tối thiểu trong §3**. |
| **Bắt buộc — năng lực lõi** | Đề §3: “Định danh bảo mật (Identity/SSO), Cổng API (API Gateway), Quản trị dữ liệu cấu trúc/phi cấu trúc và Động cơ luồng công việc (Workflow)” | Demo đăng nhập và dùng chung SSO; tuyến API qua Gateway; bản ghi và tệp qua API có quyền; khởi chạy/duyệt quy trình bền vững. Chỉ SSO + Gateway **không đủ** theo Đề §3. |
| **Nguyên lý kỹ thuật trong đề** | Đề §4 nêu bốn nguyên lý: vòng đời/tốc độ dữ liệu; hội tụ IT/OT; phả hệ/nguồn gốc/chất lượng dữ liệu; Zero-Trust + GitOps + kiểm dịch mã độc ở biên. | Phải giải thích cách kiến trúc đáp ứng và có bằng chứng cho lát cắt hiện thực; không đánh đồng mô tả thiết kế với đã vận hành. Các phần chưa có, đặc biệt OT, lakehouse, GitOps/kiểm dịch, phải ghi rõ khoảng trống và kế hoạch. Đề không đặt tên riêng từng sản phẩm công nghệ là bắt buộc. |
| **Không nêu là bắt buộc riêng** | Đề §4: “các đội thi có toàn quyền lựa chọn công nghệ”; bảng bảy lớp là “một giải pháp tham chiếu công nghệ ... để minh họa làm ví dụ”. | **Không bắt buộc cài đủ bảy stack/công nghệ ví dụ**; cũng không có câu quy định mỗi lớp phải chạy một thành phần riêng. Bảng lớp hữu ích để đánh giá độ bao phủ và ưu tiên, không được gọi là checklist bắt buộc của BTC. |
| **DigiX tự chọn, không phải ngưỡng đề** | Không có quy định về builder, hai tenant, nghỉ phép, mua sắm hay agent trong Đề §3. | Builder, hai ứng dụng khác nhau, Tầng 3 cắm-rút và agent theo ngữ cảnh là **luận điểm sáng tạo và cách chứng minh khả năng mở rộng**. Một app Tầng 2 đủ ngưỡng tối thiểu theo câu chữ; hai luồng **không bảo đảm điểm** về mức hoàn thiện. |

## 2. Đối chiếu bảy lớp tham chiếu (Đề §4)

**Chú giải:** “Tham chiếu” = lớp/stack được nêu làm ví dụ, **không phải nghĩa vụ cài sản phẩm liệt kê**. “Dự kiến” = có yêu cầu trong SRS, repo hiện chưa có code để chứng minh. Mỗi hàng nêu một phép thử/bằng chứng mong muốn; không đánh dấu đã đạt.

| Lớp tham chiếu | Vai trò trong Đề §4 (diễn giải sát ý) | Lát cắt DigiX Lab và bằng chứng cần có | Mức/status |
| --- | --- | --- | --- |
| **1. Trải nghiệm & giao diện đa kênh** | Web/mobile và cập nhật trạng thái thời gian thực; Nuxt/Flutter/Centrifugo là ví dụ. | Giao diện Next.js responsive cho builder và app xuất bản; TC-HPDI-01 thao tác trên trình duyệt; thông báo thời gian thực là nâng cao nếu có. Không bắt buộc Flutter. | Tham chiếu; SRS có yêu cầu, chưa hiện thực. |
| **2. Biên mạng & an toàn** | Gateway, SSO/MFA, bảo vệ bí mật và quét mã độc; APISIX/Keycloak/Vault/ClamAV/WAF là ví dụ. | TC-ARC-01/API chỉ qua Gateway, token sai và vượt quyền bị chặn; kiểm tra tệp tải lên và log quét; MFA/bảo vệ bí mật/WAF đánh giá riêng, không tuyên bố đã làm. | Identity/Gateway thuộc lõi bắt buộc; phần còn lại là năng lực trong mô tả kiến trúc/nguyên lý §4; chưa hiện thực. |
| **3. Tác nghiệp, logic & trạng thái** | Giao dịch, API, ngữ cảnh NGSI-LD/bản sao số; Hasura/MongoDB/Orion là ví dụ. | NestJS/PostgreSQL API hồ sơ có kiểm tra tenant; TC-TEN-02, TC-LEAVE-02..04. Không dựng Digital Twin hoặc báo đã nối OT nếu chưa có nguồn; NGSI-LD cần kế hoạch riêng nếu chọn. | Dữ liệu cấu trúc thuộc lõi bắt buộc; NGSI-LD là tham chiếu; chưa hiện thực. |
| **4. Tự động hóa, quy trình & DevSecOps** | Workflow BPMN, GitOps, backup/restore; Flowable/n8n/ArgoCD/... là ví dụ. | TC-LEAVE-01..07 chứng minh workflow phiên bản hóa và bền vững; CI, cấu hình có phiên bản và thử khôi phục có log riêng. | Workflow thuộc lõi bắt buộc; GitOps thuộc nguyên lý §4; chưa hiện thực. |
| **5. Dữ liệu, streaming & sổ cái** | Sự kiện, tệp, dữ liệu lịch sử/lakehouse, niêm phong; Redpanda/Iceberg/MinIO/ImmuDB là ví dụ. | Tệp phi cấu trúc có quyền và audit; sự kiện/đẩy lịch sử không làm chậm giao dịch và kiểm tra toàn vẹn khi triển khai thêm; không nói ledger/lakehouse đã có. | Tệp thuộc lõi bắt buộc; xử lý vòng đời dữ liệu thuộc nguyên lý §4; stack ví dụ không bắt buộc; chưa hiện thực. |
| **6. Phân tích, không gian & trí tuệ** | Báo cáo, GIS, LLM; Trino/GeoServer/Metabase/Ollama là ví dụ. | Dashboard truy về hồ sơ nguồn; agent có dẫn nguồn và phân quyền nếu đủ thời gian. GIS không phải ngưỡng bắt buộc riêng. | Tham chiếu; SRS có dashboard/agent, chưa hiện thực. |
| **7. Quản trị, tìm kiếm & giám sát** | Log/audit, lineage, tìm kiếm và monitoring; OpenMetadata/Meilisearch/Grafana/... là ví dụ. | Audit publish/approve; từ chỉ số truy hồ sơ nguồn; log/health và kiểm tra quyền tìm kiếm khi triển khai. Không đồng nhất truy vết một chỉ số với hệ thống lineage tự động hoàn chỉnh. | Nguồn gốc/chất lượng dữ liệu thuộc nguyên lý §4; stack ví dụ không bắt buộc; chưa hiện thực. |

**Bốn nguyên lý cần kế hoạch bằng chứng riêng:** (1) giao dịch không bị chặn bởi xử lý lịch sử: thử API khi xuất dữ liệu nền; (2) IT/OT: nguồn OT thật hoặc dữ liệu mô phỏng gắn nhãn, **chưa có** trong demo hai luồng; (3) lineage/chất lượng: chọn chỉ số dashboard, truy ngược hồ sơ, kiểm tra dữ liệu đầu vào; (4) Zero-Trust/GitOps/kiểm dịch: test truy cập trái quyền, pipeline/config có phiên bản, tệp nhiễm mẫu thử bị từ chối ở biên. Nếu nhóm không triển khai được một nguyên lý, ghi rủi ro đáp ứng đề, không tự hạ thành “không bắt buộc” vì nó không có tên công nghệ riêng.

## 3. Thể lệ: điều kiện dự thi, điểm và hạn

| Nội dung | Quy định chính thức | Việc phải làm/điều chỉnh |
| --- | --- | --- |
| Điều kiện để được chấm | Thể lệ *Các tiêu chí chấm điểm*: phần mềm nguồn mở, giấy phép **OSI-approved**, mã nguồn truy cập tự do trên Internet; chỉ dự án đáp ứng yêu cầu này mới được chấm xếp hạng. | Xác nhận LICENSE toàn văn, license từng tệp, tương thích phụ thuộc, repo công khai; không chỉ ghi “open-core” trong slide. |
| PoF (50 điểm), tiêu chí 1–6 | Repo sử dụng thật (5); giấy phép (10); release có phiên bản, tạo trước hạn nộp (5); build/cài từ nguồn (10); dùng gói không nhúng/sửa phụ thuộc tùy tiện (10); README, hướng dẫn, changelog, tracker (10). | Giữ NFR-OSS-01, bổ sung checklist bằng chứng build từ ngoài thư mục nguồn và release trước **06/12**; không coi hoàn thành tài liệu SRS là đạt PoF. |
| Sản phẩm (50 điểm), tiêu chí 7–11 | Nguyên gốc giải pháp (10); hoàn thiện qua demo (10); thân thiện (10); phát triển bền vững/tài liệu kỹ thuật (10); trình diễn/thu hút cộng đồng (10). Không công bố công thức điểm cho từng lớp. | Chứng minh headless + app dùng lõi, thao tác người dùng, khả năng cài lại, tài liệu và demo ổn định. Builder/AI không thay thế sản phẩm chạy được. |
| **Hạn gửi bài** | Đề §5: **17:00 Chủ Nhật 06/12/2026**, email tới **olpvietnam@vaip.vn** và **thuky@vfossa.vn**, theo mẫu nêu đội/trường/thành viên/giảng viên/repo. | Chốt release, repo và thư gửi **trước hạn**; lịch chấm repo 07–09/12 không phải hạn nộp bài. |
| **Chung kết** | Đề §6: hệ thống chạy thử; đội có **15 phút tổng trình bày** cho thiết kế/công nghệ, nền tảng + ứng dụng, demo, định hướng tiếp theo; khuyến khích Internet. Thể lệ ghi chấm chung kết 10/12/2026. | Kịch bản demo 10–12 phút của roadmap chỉ là phân bổ nội bộ, phải dành đủ thời gian trong 15 phút cho thuyết minh; chuẩn bị môi trường và phương án dự phòng. |
| Đội | Thể lệ *Yêu cầu tham gia*: tối đa 3 thí sinh, có giảng viên hướng dẫn; mỗi trường tối đa 2 đội. | Xác minh danh sách đăng ký và thông tin thư nộp, không suy ra từ README. |

## 4. Kết luận và khoảng trống so với SRS

1. **Phải giữ** bốn nhóm dịch vụ lõi (SSO, Gateway, dữ liệu cấu trúc/phi cấu trúc, workflow) + ít nhất một giao diện ứng dụng Tầng 2. SRS DigiX Lab đã nêu đủ trên giấy, nhưng **chưa có hiện thực trong repo**.
2. **Sửa cách gọi bảy lớp:** không khẳng định BTC bắt buộc đủ bảy lớp/cài tất cả stack tham chiếu. Đây là hệ tham chiếu, trong khi bốn nguyên lý §4 vẫn là yêu cầu kỹ thuật phải được đối chiếu bằng minh chứng và báo cáo thiếu hụt.
3. **Đổi ưu tiên demo nếu thiếu thời gian:** giữ lõi + một ứng dụng Tầng 2 chạy thật trước; builder, hai tenant/hai luồng, Tầng 3 và agent là mục tiêu DigiX tự chọn nhằm thuyết phục về tính nguyên gốc và khả năng mở rộng, không thay điều kiện dự thi. Nếu giảm phạm vi phải cập nhật SRS và trình bày trung thực.
4. **Cập nhật lịch:** hạn email 06/12 lúc 17:00, release phải có trước khi gửi; chung kết 15 phút ngày 10/12. Cần điều chỉnh roadmap và kiểm tra các thông báo mới của BTC trước khi nộp.
