# DigiX Lab — thiết kế UI/UX mục tiêu v2.5

**Trạng thái:** đề xuất theo [SRS DigiX Lab v2.5](../requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), chưa triển khai/nghiệm thu.
[UI/UX v0.1](DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20thi%E1%BA%BFt%20k%E1%BA%BF%20UI%20UX.md) giữ quy ước thương hiệu, accessibility, trạng thái lỗi và nguyên tắc bảo mật;
các hành trình mua sắm A/nghỉ phép B ở đó là baseline lịch sử, không còn là demo mục tiêu.

## Cấu trúc điều hướng

`Đăng nhập → Chọn tenant → Danh sách ứng dụng được phép → Chọn app → Menu riêng của app`.
Tenant switcher và app switcher phải tách biệt.
Trong tenant A, ERP và CRM nhỏ cùng hiện với người có quyền; người chỉ có quyền ERP không thấy hoặc mở được CRM.
Tenant B có CRM riêng.
Trong app chỉ thấy menu, trang, thao tác của chức năng đã bật **và** vai trò hiện hành; không dùng menu ERP/CRM toàn cục cố định.
API kiểm quyền độc lập với việc ẩn UI.

Khi đổi tenant hoặc app: cảnh báo nháp chưa lưu, hủy request cũ, xóa cache/bộ lọc/toast/phiên trợ lý của ngữ cảnh trước, tải lại quyền và cấu hình đã xuất bản;
deep link sai quyền trả trạng thái an toàn không lộ tên/bản ghi. Header hiện tenant, app, phiên bản; thao tác đổi phiên bản không sửa dữ liệu/hồ sơ đang chạy ngầm.

## Màn hình thiết kế cần có

| Màn                        | Nội dung/đường lỗi                                                                                                                                                                                                                                                     | Nguồn SRS                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Danh sách app trong tenant | Nhiều nháp/app xuất bản, tên và phiên bản từng app, CTA tạo app mới; lọc theo quyền; app thứ hai không ghi đè app thứ nhất.                                                                                                                                            | FR-BLD-12                |
| Chọn lối vào               | Ba lựa chọn `Bắt đầu với ERP`, `Bắt đầu với CRM`, `Tạo từ trống`, giải thích đây là **bộ gợi ý**, không khóa loại app. Cả ba đi tiếp tới một màn chọn chức năng; quay lại đổi lối vào phải hỏi trước khi thay các lựa chọn đã chỉnh.                                   | FR-BLD-13                |
| Chọn chức năng             | Danh mục ERP/CRM theo nhóm; chỉ bật chức năng cần dùng; mô tả dữ liệu, hành động, quyền và phụ thuộc; chưa chọn thì không sinh menu. Chặn phụ thuộc thiếu, cảnh báo khi tắt chức năng có dữ liệu/việc đang chạy.                                                       | FR-BLD-06/10, FR-L3-04   |
| Thiết kế giao diện         | Tạo/đổi thứ tự trang và menu; sắp xếp vùng bố cục và thành phần từ thư viện (form, bảng, chi tiết, KPI, hành động); gắn nguồn dữ liệu/hành động có quyền. Không cho gắn chức năng tắt hoặc chạy mã tùy ý. Preview theo vai trò, desktop/mobile và trạng thái rỗng/lỗi. | FR-BLD-09/10             |
| Cấu hình nghiệp vụ         | Trường, vai trò, bước/nhánh, quy tắc, quyền và cách chia sẻ dữ liệu có kiểm soát giữa app. Dùng nháp có nguồn và sửa thủ công khi AI tắt.                                                                                                                              | FR-BLD-02..05, FR-WRK-06 |
| Kiểm tra & xuất bản        | Checklist chức năng/phụ thuộc, ánh xạ UI → API, quyền, dữ liệu, workflow, version; lỗi đưa tới đúng trang/thành phần, không publish khi lỗi. Review diff cả trang/chức năng/quyền trước khi xác nhận.                                                                  | FR-BLD-05/08/10          |

**Luồng khởi tạo chung:**
`Tạo app → chọn lối vào → xem danh mục đã điền gợi ý (hoặc rỗng) → thêm/bỏ chức năng → kiểm phụ thuộc → xem trước bộ trang/role → lưu nháp → tiếp tục cấu hình và kiểm tra/xuất bản`.
Lưu nháp rỗng được nhưng nút xuất bản bị chặn với lý do rõ. Không tự lưu một preset như ứng dụng đã phát hành; chỉ lưu khi API xác nhận.
Sau khi đã sửa lựa chọn, đổi lối vào không được ghi đè im lặng: giữ cấu hình hiện có hoặc xác nhận đặt lại gợi ý.
Trên màn chọn hiển thị chức năng đã chọn cùng phụ thuộc; nếu bỏ tồn kho khỏi ERP, vật tư/yêu cầu mua còn hoạt động; nếu thêm vật tư vào CRM, không tự bật mua sắm hay kho.
Khi thêm cơ hội từ trống cần chọn khách hàng trước hoặc xử lý phụ thuộc theo quyết định đã chốt.

`startingPoint` chỉ hiển thị như thông tin khởi tạo trong bản nháp/lịch sử; nhãn ứng dụng, menu, quyền và hành động runtime đều lấy từ `features` đã xác nhận, không từ lối vào. Bản nháp cũ thiếu `startingPoint` hiển thị “Không ghi nhận lối vào”, vẫn chỉnh được.

## Màn hình vận hành theo chức năng

- **ERP A:** menu chỉ có vật tư, yêu cầu mua và tồn kho; trang đề nghị mua → task duyệt/từ chối → ghi nhận nhập kho → xem tồn có nguồn.
  Không giả lập việc nhập kho chỉ vì đã duyệt; mỗi hành động phải được API xác nhận.
- **CRM B:** menu khách hàng/liên hệ, cơ hội/giai đoạn; tạo khách hàng → liên hệ → cơ hội gắn khách hàng → thay đổi giai đoạn, xem lịch sử.
  Không hiện kho/mua sắm/kế toán/marketing tự động.
- **CRM nhỏ A:** được tạo như app thứ hai trong tenant A với khách hàng/cơ hội; app switcher đổi giữa ERP và CRM theo quyền.
  Không hiển thị dữ liệu ERP trong CRM theo mặc định; nếu có liên kết chia sẻ được cấp quyền, ghi rõ nguồn, phạm vi bản ghi và quyền đọc/ghi, audit; thu hồi thì không cho truy cập mới.
- Với mọi app: form/list/detail/task/dashboard/trợ lý là thành phần có thể chọn/bố trí, không phải bộ màn hình bắt buộc giống nhau.
  H/P/D hoạt động khi I chưa có nguồn; KPI dẫn tới bản ghi được phép; trạng thái loading/empty/403/409 và lỗi backend có thông điệp trung thực.

## Luồng kiểm tra prototype và bàn giao

1. Thiết kế 3 cấu hình có menu/bố cục khác nhau: ERP A, CRM B, CRM nhỏ A; chỉ dùng dữ liệu giả có nhãn.
   Chụp màn trước/sau chọn chức năng và preview theo ít nhất hai vai trò.
2. Thử thêm thành phần tham chiếu chức năng chưa bật, thiếu quyền, và tắt chức năng có phụ thuộc: UI báo nguyên nhân, chặn xuất bản.
   Thử đổi app khi nháp chưa lưu, deep link chéo app/tenant và không trộn lịch sử trợ lý.
3. Trong Figma/prototype, mỗi frame nêu tenant/app/version/role, nguồn dữ liệu và trạng thái.
   Thử bàn phím/focus, WCAG 2.1 AA, zoom/mobile và nhãn tiếng Việt. Prototype **không** phải bằng chứng TC-APP/TC-MOD/TC-UI chạy thật.
4. Prototype đủ TC-START-01..04: ERP bỏ tồn kho; CRM thêm vật tư; từ trống chọn khách hàng + cơ hội và thử nháp rỗng;
   ba trường hợp đi cùng Builder/preview/runtime, không có màn/API riêng theo loại app. Kiểm trạng thái đổi lối vào sau khi đã sửa chức năng.

**Đã chốt phạm vi demo (chưa triển khai):** có chia sẻ liên app được người có quyền cấu hình, mặc định từ chối; liên kết chỉ rõ app nguồn/đích, loại dữ liệu, quyền đọc/ghi, phạm vi bản ghi, có audit và thu hồi chặn truy cập mới. AI dùng nguồn được chọn theo tenant/app/quyền hiện hành, có dẫn nguồn hoặc nói không biết; không trộn nguồn chéo app/tenant kể cả khi có liên kết, thu hồi nguồn/quyền phải có hiệu lực; AI ngừng thì H/P/D vẫn chạy. UI cần thể hiện trạng thái chưa cấp/đã cấp/đã thu hồi và nguồn dữ liệu, không giả lập quyền trên client.

**Đã chốt phương án thiết kế:** [hợp đồng kỹ thuật v2.5](../../engineering/builder/hop-dong-ky-thuat-v2.5.md) mô tả thư viện thành phần/bố cục, ACL, route danh mục–preview–publish, chia sẻ và AI. Chưa có OpenAPI/migration hoặc các API v2.5 chạy thật; không thiết kế một khả năng chưa có API như thể đã triển khai.
