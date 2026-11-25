# Roadmap đề xuất — DigiX Lab v2.5

**Nguồn phạm vi:** [SRS DigiX Lab v2.5](../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md). **Trạng thái:** đề xuất, chưa được cả đội phê duyệt, chưa có mốc/owner mới được xác nhận. [Roadmap v2.4](roadmap.md) ghi lại baseline và tiến độ trước thay đổi; không lấy các mốc M2–M4/TC-LEAVE trong đó làm bằng chứng đạt v2.5.

## Cửa quyết định trước khi cam kết

1. Kiểm kê tính năng đã chạy thật so với SRS; ghi commit, môi trường, test report cho lõi, builder và runtime. Không đánh đồng schema/fixture/UI mẫu với sản phẩm chạy được.
2. Đội xác nhận hoặc giảm phạm vi A của SRS v2.5: danh mục ERP (vật tư, yêu cầu mua, nhập/xem tồn kho), CRM (khách hàng/liên hệ, cơ hội/giai đoạn), builder UI, runtime, nhiều app cùng tenant, quyền/cách ly. Nếu không đủ nguồn lực cho hạn nộp **17:00 06/12/2026**, phải quyết định thay đổi SRS, không đánh dấu đã hoàn tất ngầm.
3. Ghi owner/reviewer, ước lượng và bằng chứng đầu ra cho từng cửa dưới đây; xác nhận ngày freeze/go-no-go bằng biên bản. Các ngày ở roadmap v2.4 là lịch sử, không tự chuyển sang baseline này.

## Chuỗi triển khai theo phụ thuộc (chưa ấn định ngày)

| Cửa | Đầu ra cần chạy/kiểm tra | Bằng chứng để mở cửa kế |
| --- | --- | --- |
| R0 — Lõi an toàn | SSO, Gateway, tenant guard, dữ liệu/tệp, workflow, audit và khởi động lại giữ trạng thái. | Smoke E2E qua Gateway; thử chéo tenant bị từ chối; ghi phiên bản môi trường. |
| R1 — Hợp đồng chức năng & preset | Danh mục chức năng có mã/phiên bản, schema dữ liệu, hành động, quyền, phụ thuộc, thành phần UI; preset ERP/CRM là danh sách gợi ý có phiên bản, từ trống không gợi ý; cả ba dùng cùng Builder/runtime. | FR-L3-04, FR-BLD-06/10/13; kiểm TC-MOD-03 và TC-START-01..04. |
| R2 — Hai lát cắt nghiệp vụ | ERP: vật tư → đề nghị mua → duyệt → nhập kho → xem tồn; CRM: khách hàng/liên hệ → cơ hội → chuyển giai đoạn. Cả hai dùng API/dữ liệu thật của demo. | TC-L3-01; sau refresh/restart dữ liệu còn; không dùng mock/toast làm bằng chứng. |
| R3 — Builder và xuất bản | Ba lối vào → một màn chọn/bỏ chức năng → kiểm phụ thuộc → xem trước → lưu nháp; tạo trang/menu/bố cục, gắn dữ liệu/hành động, chặn cấu hình/quyền sai và phát hành phiên bản bất biến. Nháp rỗng lưu được nhưng không xuất bản. | TC-START-01..04, TC-UI-01..03, TC-PUB-01/02, TC-ARC-01..03. |
| R4 — Vận hành và nhiều app | A có ERP và CRM nhỏ trong cùng tenant; B có CRM riêng. Chọn app theo quyền; app không chọn chức năng không hiện/không gọi API được; không chia sẻ dữ liệu ngầm giữa app. | TC-APP-01..03, TC-MOD-01/02, TC-TEN-01/02, TC-HPDI-01/02 và thử âm URL/API/tệp/task/dashboard/AI. |
| R5 — Ổn định/phát hành | Regression từ môi trường sạch, license, tài liệu triển khai, sao lưu/khôi phục, test report và danh sách chưa đạt. AI chỉ công bố đạt nếu kiểm đủ quyền/nguồn/thu hồi; tắt AI không dừng H/P/D. | Biên bản go/no-go có xác nhận; release đúng hạn, không phát triển tính năng mới sau freeze được đội chốt. |

## Kịch bản demo mục tiêu

1. Đăng nhập A, chọn chức năng ERP cần thiết, thiết kế giao diện, kiểm tra/publish; tạo và duyệt yêu cầu, ghi nhận nhập kho, xem tồn từ dữ liệu thật.
2. A tạo thêm CRM nhỏ từ cùng danh mục và publish song song; chứng minh người không có quyền không mở được và CRM A không đọc dữ liệu ERP A nếu chưa cấu hình chia sẻ.
3. Đăng nhập B, chọn chức năng CRM, bố trí trang khác A; tạo khách hàng, cơ hội và chuyển giai đoạn; không có kho/mua hàng ở menu hoặc API.
4. Đổi CRM A lên v2, ERP A/B không đổi; thử truy cập chéo tenant và chéo app. Chỉ số, lịch sử và trạng thái phải truy về bản ghi nguồn. AI không khả dụng thì báo rõ.
5. Trước demo, kiểm ba lối vào trên **cùng Builder**: ERP bỏ tồn kho, CRM thêm vật tư, từ trống chọn khách hàng/cơ hội; không dùng lối vào làm app type. Nháp trống bị chặn xuất bản; chỉ chức năng đã chọn xuất hiện trong runtime.

**Không cam kết:** ERP/kế toán/CRM đầy đủ, tích hợp ngân hàng/thuế/hóa đơn thật, sinh mọi chức năng từ prompt, hay so sánh định lượng với MISA khi chưa có dữ liệu đo.
