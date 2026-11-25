# Roadmap đề xuất — DigiX Lab v2.5

**Nguồn phạm vi:** [SRS DigiX Lab v2.5](../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md). **Trạng thái:** đề xuất, chưa được cả đội phê duyệt, chưa có mốc/owner mới được xác nhận. [Roadmap v2.4](roadmap.md) ghi lại baseline và tiến độ trước thay đổi; không lấy các mốc M2–M4/TC-LEAVE trong đó làm bằng chứng đạt v2.5.

## Cửa quyết định trước khi cam kết

1. [Bảng kiểm kê hiện trạng yêu cầu A](kiem-ke-hien-trang-uu-tien-a-v2.5.md) đã đối chiếu code/test với SRS và ghi commit, môi trường kiểm; **chưa có báo cáo E2E môi trường tích hợp** cho lõi, builder và runtime. Cần bổ sung bằng chứng chạy thật trước khi đánh dấu đạt. Không đánh đồng schema/fixture/UI mẫu với sản phẩm chạy được.
2. Đội xác nhận hoặc giảm phạm vi A của SRS v2.5: danh mục ERP (vật tư, yêu cầu mua, nhập/xem tồn kho), CRM (khách hàng/liên hệ, cơ hội/giai đoạn), builder UI, runtime, nhiều app cùng tenant, quyền/cách ly, chia sẻ liên app có kiểm soát và AI theo quyền/nguồn. **Người yêu cầu đã xác nhận phạm vi chức năng:** demo có chia sẻ liên app và AI. **Chưa cần chốt lúc này:** ước lượng khối lượng/nhân lực, tính khả thi với hạn **17:00 06/12/2026**, phương án giảm phạm vi và lịch go/no-go; các con số gợi ý trong trao đổi chưa phải cam kết. Trước khi cam kết tiến độ hoặc đánh dấu hoàn tất, đội phải đánh giá và ghi quyết định; nếu giảm phạm vi phải được duyệt và sửa SRS công khai, không giảm ngầm.
3. [Plan chi tiết](ke-hoach-trien-khai-chi-tiet-v2.5.md) đã phân vai theo yêu cầu: Dũng Backend, Duy Anh Frontend, An review/nhận thêm việc nếu xác nhận được năng lực; mỗi mã việc có phụ thuộc và bằng chứng dự kiến. **Chưa chốt giờ khả dụng, ước lượng, lịch, ngày freeze/go-no-go hoặc giao thêm task cho An.** Khi đội sẵn sàng lập cam kết mới điền và xác nhận bằng biên bản. Các ngày ở roadmap v2.4 là lịch sử, không tự chuyển sang baseline này.

## Chuỗi triển khai theo phụ thuộc (chưa ấn định ngày)

| Cửa | Đầu ra cần chạy/kiểm tra | Bằng chứng để mở cửa kế |
| --- | --- | --- |
| R0 — Lõi an toàn | SSO, Gateway, tenant guard, dữ liệu/tệp, workflow, audit và khởi động lại giữ trạng thái. | Smoke E2E qua Gateway; thử chéo tenant bị từ chối; ghi phiên bản môi trường. |
| R1 — Hợp đồng chức năng & preset | Danh mục chức năng có mã/phiên bản, schema dữ liệu, hành động, quyền, phụ thuộc, thành phần UI; preset ERP/CRM là danh sách gợi ý có phiên bản, từ trống không gợi ý; cả ba dùng cùng Builder/runtime. [Hợp đồng kỹ thuật](../engineering/builder/hop-dong-ky-thuat-v2.5.md) và [quyết định khởi công code](../engineering/architecture/quyet-dinh-khoi-cong-code-v2.5.md) **đã được người yêu cầu chốt về thiết kế**; schema draft/published thiết kế đã có. Đội còn phải review kỹ thuật, tạo OpenAPI/migration và triển khai; chưa đạt cửa R1. | FR-L3-04, FR-BLD-06/10/13, FR-WRK-06, FR-AI-01..06; kiểm hợp đồng/ca âm TC-MOD-03, TC-START-01..04, TC-SHARE-01..03 và TC-AI-01..05. |
| R2 — Hai lát cắt nghiệp vụ | ERP: vật tư → đề nghị mua → duyệt → nhập kho → xem tồn; CRM: khách hàng/liên hệ → cơ hội → chuyển giai đoạn. Cả hai dùng API/dữ liệu thật của demo. | TC-L3-01; sau refresh/restart dữ liệu còn; không dùng mock/toast làm bằng chứng. |
| R3 — Builder và xuất bản | Ba lối vào → một màn chọn/bỏ chức năng → kiểm phụ thuộc → xem trước → lưu nháp; tạo trang/menu/bố cục, gắn dữ liệu/hành động, chặn cấu hình/quyền sai và phát hành phiên bản bất biến. Nháp rỗng lưu được nhưng không xuất bản. | TC-START-01..04, TC-UI-01..03, TC-PUB-01/02, TC-ARC-01..03. |
| R4 — Vận hành và nhiều app | A có ERP và CRM nhỏ trong cùng tenant; B có CRM riêng. Chọn app theo quyền; app không chọn chức năng không hiện/không gọi API được. Không chia sẻ dữ liệu ngầm; triển khai liên kết được cấp quyền, giới hạn đọc/ghi và phạm vi bản ghi, audit, thu hồi chặn truy cập mới. AI chỉ dùng nguồn được chọn theo tenant/app/quyền hiện hành; chia sẻ dữ liệu không tự cấp quyền làm nguồn AI. | TC-APP-01..03, TC-SHARE-01..03, TC-MOD-01/02, TC-TEN-01/02, TC-HPDI-01..03, TC-AI-01..04 và thử âm URL/API/tệp/task/dashboard/AI. |
| R5 — Ổn định/phát hành | Regression từ môi trường sạch, license, tài liệu triển khai, sao lưu/khôi phục, test report và danh sách chưa đạt. Kiểm AI trả lời có dẫn nguồn hoặc nói không biết, không rò rỉ giữa tenant/app kể cả khi chia sẻ, thu hồi quyền/nguồn; tắt AI không dừng H/P/D. Chạy lại vòng chưa cấp → cấp đúng phạm vi → thu hồi của liên kết chia sẻ. | TC-SHARE-01..03, TC-AI-01..05 và biên bản go/no-go có xác nhận; release đúng hạn, không phát triển tính năng mới sau freeze được đội chốt. |

## Kịch bản demo mục tiêu

1. Đăng nhập A, chọn chức năng ERP cần thiết, thiết kế giao diện, kiểm tra/publish; tạo và duyệt yêu cầu, ghi nhận nhập kho, xem tồn từ dữ liệu thật.
2. A tạo thêm CRM nhỏ từ cùng danh mục và publish song song; chứng minh người không có quyền không mở được. Thử CRM A đọc dữ liệu ERP A: trước cấp bị từ chối, sau khi người có quyền cấp liên kết chỉ được đọc/ghi loại dữ liệu và bản ghi được phép, sau thu hồi truy cập mới lại bị từ chối; B không bao giờ được hưởng liên kết của A.
3. Đăng nhập B, chọn chức năng CRM, bố trí trang khác A; tạo khách hàng, cơ hội và chuyển giai đoạn; không có kho/mua hàng ở menu hoặc API.
4. Đổi CRM A lên v2, ERP A/B không đổi; thử truy cập chéo tenant và chéo app. Chỉ số, lịch sử và trạng thái phải truy về bản ghi nguồn. Chọn nguồn AI có quyền, hỏi có dẫn nguồn hoặc nói không biết; thử thu hồi nguồn/quyền, không trộn nguồn chéo app qua liên kết chia sẻ; tắt AI thì H/P/D vẫn chạy.
5. Trước demo, kiểm ba lối vào trên **cùng Builder**: ERP bỏ tồn kho, CRM thêm vật tư, từ trống chọn khách hàng/cơ hội; không dùng lối vào làm app type. Nháp trống bị chặn xuất bản; chỉ chức năng đã chọn xuất hiện trong runtime.

**Không cam kết:** ERP/kế toán/CRM đầy đủ, tích hợp ngân hàng/thuế/hóa đơn thật, sinh mọi chức năng từ prompt, hay so sánh định lượng với MISA khi chưa có dữ liệu đo.
