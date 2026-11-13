# DigiX Lab — đặc tả thiết kế UI/UX cho Builder và ứng dụng vận hành

**Phiên bản:** 0.1 · **Ngày:** 13/11/2026 · **Trạng thái:** đề xuất thiết kế, chờ đội review; không phải UI đã triển khai hoặc được nghiệm thu.  
**Đối tượng:** Product/UX, UI designer, frontend, backend, QA và người duyệt nghiệp vụ.  
**Phạm vi:** giao diện Web tiếng Việt responsive của không gian thiết kế và ứng dụng đã xuất bản (Tầng 2); màn hình quản trị tenant cần cho hành trình; không đặc tả giao diện quản trị hạ tầng, cổng đối tác hay website marketing.

## 1. Nguồn, thứ tự ưu tiên và quyết định còn mở

1. [SRS DigiX Lab v2.4](SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md) là nguồn phạm vi sản phẩm chính, đặc biệt §2.3, FR-CORE, FR-BLD, FR-WRK, FR-AI và NFR-UX. [SRS DigiX v1.5](SRS%20DigiX%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md) cung cấp ví dụ mua sắm/kiểm tra trường và yêu cầu accessibility; **không** lấy mua sắm làm toàn bộ sản phẩm hoặc coi danh sách công nghệ cũ là phạm vi UI bắt buộc.
2. [Hợp đồng builder và fixture nghỉ phép](DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md), [schema v1](schema/digix-app-v1.schema.json), [fixture](fixtures/leave-app-v1.json), [thiết kế AI](DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md) ràng buộc ngữ nghĩa và trạng thái; nhãn UI có thể thân thiện hơn tên trường máy.
3. **Logo được đội sử dụng: option A — Modular X**, theo xác nhận của người dùng ngày 13/11/2026. Lấy asset gốc từ [`docs/branding/`](branding/README.md), không dùng logo tự vẽ thay thế. README của bộ nhận diện vẫn mô tả ba concept ở thời điểm soạn trước đó; nếu cập nhật quy chuẩn thương hiệu chính thức, cần đồng bộ tài liệu nguồn.
4. [README hiện trạng](../README.md): Web mới có trang giới thiệu/đăng nhập và status/dashboard kỹ thuật; chưa có API nghiệp vụ, builder, workflow, kho tệp hay AI. Những màn hình dưới đây là **thiết kế mục tiêu**, không mô tả tính năng đang chạy. Trang marketing hiện có màu cam, số liệu quảng bá và danh mục CRM/kế toán; **không** dùng chúng làm token hay lời hứa sản phẩm cho Lab. Không đưa số liệu chưa kiểm chứng vào mockup.

**Cần chốt trước hi-fi/handoff:** người duyệt copy nghiệp vụ; hợp đồng API/khả năng của runtime và tệp; danh sách quyền thực; quy tắc trường/lý do từng mẫu; hỗ trợ thiết bị nào ở builder; AI có được bật trong demo không. Không biến các giá trị minh họa dưới đây thành logic cố định.

## 2. Định hướng trải nghiệm

**Lời hứa giao diện:** “Thiết kế quy trình có thể kiểm tra; xuất bản có trách nhiệm; làm việc và truy vết trong đúng doanh nghiệp của bạn.” Giao diện là công cụ vận hành tin cậy, không phải bảng điều khiển AI tự động hóa mọi quyết định.

| Nguyên tắc | Hệ quả thiết kế có thể kiểm tra |
| --- | --- |
| Rõ ngữ cảnh | Luôn thấy tên tenant; trong app thấy tên app và phiên bản đang chạy; builder thấy `Nháp`/`Chạy thử`/`Đã xuất bản` bằng chữ và màu. |
| Người chịu trách nhiệm | Đề xuất AI luôn là nháp có nguồn/chỗ chưa rõ; chạy thử và xem khác biệt trước khi người có quyền xác nhận xuất bản. Không có nút “AI tự xuất bản/duyệt”. |
| Ít nhầm lẫn | Một hành động chính/màn; trường bắt buộc, điều kiện và lỗi chỉ rõ cách sửa; quyết định không thể hoàn tác có bước xác nhận. |
| Truy được nguồn | Trạng thái hồ sơ gắn mốc thời gian/người xử lý/phiên bản; chỉ số dashboard mở được danh sách hồ sơ nguồn trong cùng phạm vi quyền. |
| Cô lập mặc định | Đổi tenant phải đổi toàn bộ ngữ cảnh, xóa dữ liệu UI/cache của tenant cũ; không hiển thị thông tin từ tenant khác, kể cả gợi ý tìm kiếm/citation. UI không thay kiểm quyền API. |
| Không phụ thuộc AI | Tạo/sửa quy trình bằng tay và H/P/D sau xuất bản hoạt động khi AI chưa có nguồn, đang lỗi hoặc tắt. |

**Hai hành trình thiết kế chuẩn:** A dùng mẫu **đề nghị mua hàng** rồi chỉnh ngưỡng duyệt; B **tạo nghỉ phép bằng builder** (không có màn nghỉ phép viết cứng). Cả hai dùng cùng mẫu UI danh sách, biểu mẫu, chi tiết, hộp việc, dashboard; nội dung trường và nhánh lấy từ cấu hình ứng dụng. H/P/D/I là năng lực hiện diện trong **mỗi app đã xuất bản**, không phải bốn module tách rời hay bốn màu của logo.

## 3. Vai trò, quyền và kiến trúc thông tin

| Vai trò theo ngữ cảnh | Đích đến chính | Hành động UI cần thể hiện | Không được ngầm cấp |
| --- | --- | --- | --- |
| Quản trị nền tảng | Danh sách tenant/vận hành | Tạo tenant, xử lý lời mời theo quyền | Đọc hồ sơ/tri thức tenant mặc định. |
| Quản trị tenant / publisher được ủy quyền | Quản trị, danh sách app, review phát hành | Mời/gán vai trò; xem diff, chạy thử, xuất bản app được cấp quyền | Duyệt mọi hồ sơ nghiệp vụ hay xem mọi nguồn AI chỉ vì là publisher. |
| Designer | Danh sách app, builder | Tạo/sửa nháp, nhập mô tả, validate, chạy thử trong phạm vi được cấp | Tự xuất bản chỉ vì tạo nháp. |
| Nhân viên | App, hồ sơ của tôi, hộp việc | Tạo/lưu/gửi hồ sơ, theo dõi trạng thái | Xem việc và hồ sơ ngoài quyền. |
| Manager / HR / người phê duyệt | Hộp việc, chi tiết được giao | Xem dữ liệu cần quyết định, duyệt/từ chối kèm lý do | Tự duyệt nếu cấu hình cấm; xử lý task đã hoàn tất. |

Một người có thể mang nhiều vai trò. Menu và CTA phản ánh quyền từ API theo **tenant + app + đối tượng + trạng thái + hành động**; trạng thái ẩn/disabled chỉ hỗ trợ hiểu giao diện, không thay thế kiểm tra phía server. Khi deep link tới tài nguyên không được phép, trả trang từ chối an toàn, không lộ tên/metadata đối tượng.

```text
Chưa đăng nhập
  Giới thiệu (nếu giữ) → Đăng nhập SSO → Chọn tenant (nếu có nhiều)
Đã vào tenant
  Tổng quan / Ứng dụng / Việc của tôi / Hồ sơ của tôi
  Ứng dụng → [App đang xuất bản] → Tổng quan / Việc cần làm / Hồ sơ / Báo cáo / Trợ lý
  Thiết kế (chỉ khi có quyền) → Danh sách dự án → Builder / Chạy thử / Lịch sử phiên bản
  Quản trị (theo quyền) → Thành viên & vai trò / Nguồn tri thức / Thiết lập ứng dụng
  Cá nhân → Tài khoản / Đổi tenant / Đăng xuất
```

**App switcher** và **tenant switcher** là hai điều khiển khác nhau. Bất cứ khi nào đổi tenant: xác nhận nếu nháp chưa lưu, điều hướng về tổng quan tenant mới, làm mới quyền, không mang theo app ID, bộ lọc, lịch sử trợ lý hay toast chứa dữ liệu tenant cũ. Đổi app: tương tự với ngữ cảnh app/phiên bản. Không yêu cầu người dùng chọn `tenant_id` bằng nhập tay. Menu mobile mở dưới dạng drawer có nhãn và focus trap; desktop dùng thanh điều hướng bên trái, vùng nội dung ở giữa, thanh ngữ cảnh ở trên.

## 4. Hệ thị giác từ logo — đề xuất để dựng Figma

**Ẩn dụ:** bốn khối hình học độc lập tạo X, có khoảng âm trung tâm: lõi chung kết nối các cấu hình nhưng vẫn giữ ranh giới. Dùng lưới/khoảng trắng và panel phân lớp để gợi modularity; **không** vẽ logo thành flowchart, không tô bốn khối thành H/P/D/I. Navy tạo tin cậy, teal dành cho hành động chủ đạo/tiến trình có thể tiếp tục; màu trạng thái phải có nhãn chữ. Tránh gradient, bóng nặng và neon/sci-fi.

| Token đề xuất (light) | Giá trị | Cách dùng / giới hạn |
| --- | --- | --- |
| `brand.navy` | `#112B45` | Logo sáng, chữ tiêu đề/điều hướng; không dùng bản này trên nền tối. |
| `brand.teal` | `#0D9488` | Viền/nhấn, nút chính **kèm chữ trắng chỉ sau khi kiểm tra tương phản thực tế**; nếu không đạt, chọn sắc tối hơn cho nền nút, giữ màu logo nguyên bản. |
| `brand.tealOnDark` | `#2DD4BF` | Chỉ trên nền tối, đi cùng SVG `-dark`. |
| `surface.canvas` / `surface.panel` | `#F6F8FA` / `#FFFFFF` | Nền workspace / card, độ tương phản phải đo với chữ và viền. |
| `text.primary` / `text.secondary` | `#172B3A` / `#4B6071` | Văn bản / mô tả phụ; màu cuối phải được đo WCAG. |
| `border.default` / `focus.ring` | `#D8E1E8` / `#0B776F` | Phân vùng / focus rõ trên nền sáng. |
| `state.success` / `warning` / `danger` / `info` | `#176B4D` / `#8A5A00` / `#B42318` / `#245A87` | **Màu đề xuất, chưa chuẩn hóa**; có chữ/biểu tượng và cặp nền nhạt riêng sau kiểm tra tương phản. |

Token màu **không** phải bằng chứng WCAG. Trước khi khóa UI kit, đo từng cặp foreground/background ở trạng thái default, hover, disabled, focus; mục tiêu WCAG 2.1 AA: chữ thường ≥ 4.5:1, chữ lớn ≥ 3:1, viền/đối tượng UI quan trọng ≥ 3:1. Không dùng teal sáng làm chữ nhỏ trên trắng nếu đo không đạt.

| Hạng mục | Quy ước đề xuất |
| --- | --- |
| Font | Sans hỗ trợ đầy đủ tiếng Việt (đề xuất Inter hoặc Noto Sans); kiểm dấu, ký tự số, chữ đậm trên Windows/macOS/Linux. Fallback `Arial, sans-serif`; không dùng path chữ của wordmark cho text UI. |
| Thang chữ | 12 (metadata hạn chế), 14 (secondary), 16 (body/form), 20/24 (heading), 32 (hero nếu có); line-height body 1.5, không lấy cỡ 12 làm nội dung nghiệp vụ chính. |
| Lưới/khoảng cách | Base 4px, bước chính 8/16/24/32; vùng đọc form ~640–760px, bảng có thể rộng hơn; vùng trống có mục đích, không nhồi dashboard. |
| Hình khối | Card bo góc nhẹ 8–12px, viền rõ; icon nét nhất quán 20–24px và có nhãn ở hành động quan trọng. Độ nổi dùng tiết chế. |
| Chuyển động | 120–200ms cho phản hồi nhỏ; tôn trọng `prefers-reduced-motion`; không dùng animation để truyền trạng thái duy nhất. |
| Logo | Ưu tiên [`wordmark-a.svg`](branding/digix-logo-wordmark-a.svg) ở header sáng; [`wordmark-a-dark.svg`](branding/digix-logo-wordmark-a-dark.svg) trên nền navy; [`icon-a.svg`](branding/digix-logo-icon-a.svg) khi thu gọn. Khoảng trống ≥ 1/8 chiều rộng icon, không méo/đổi màu khối. Icon A/B tối thiểu 24px, C 32px theo brand README; favicon kiểm ở 16–48px. |

**Nguyên tắc responsive:** khung thiết kế tham chiếu 1440 (desktop), 1024 (tablet), 390/360 (mobile); breakpoint là đề xuất layout, không ràng buộc framework. Desktop sidebar 240px có thể thu gọn; tablet sidebar thu gọn/overlay; mobile ưu tiên một cột, action chính ở cuối form nhưng không che nội dung/bàn phím. Bảng trên mobile chuyển thành danh sách thẻ trường quan trọng + mở chi tiết; **không** giấu quyền/lý do/trạng thái trong tooltip chỉ hover. Builder phức tạp ưu tiên desktop; mobile vẫn xem bản nháp, trạng thái/lỗi và điều hướng được, nhưng thao tác biên tập nhiều bước có thể được dẫn dùng desktop **nếu đội chốt giới hạn này**. Luồng nhân viên gửi hồ sơ và người duyệt xử lý phải dùng được trên mobile.

## 5. Mẫu trang và đặc tả màn hình

**Khung chung:** header có logo, tenant hiện hành, app hiện hành (nếu có), tìm kiếm trong phạm vi hiện hành, tài khoản; breadcrumb ngắn; tiêu đề mô tả đối tượng; badge trạng thái và phiên bản; vùng thông báo nhất quán. Mỗi trang có skeleton, empty, error, forbidden và trạng thái phiên hết hạn. Không nhúng thông tin nhạy cảm vào URL/toast. Trong bản nháp, rời trang khi chưa lưu phải cảnh báo; thành công chỉ báo khi API xác nhận.

| ID / màn hình | Người dùng & thông tin ưu tiên | Tác vụ và trạng thái quan trọng | Liên kết yêu cầu |
| --- | --- | --- | --- |
| U01 — SSO / chọn tenant | Người dùng được mời; rõ tên DigiX và doanh nghiệp khi đã biết | CTA `Đăng nhập bằng SSO`; lỗi chung không tiết lộ tài khoản; MFA do IdP điều khiển; nếu nhiều tenant chọn từ danh sách được cấp, không nhập ID. Chưa có quyền → hướng dẫn liên hệ quản trị. | FR-CORE-01, NFR-SEC-01 |
| U02 — Tổng quan tenant | Vai trò bất kỳ; ứng dụng được phép, việc cần xử lý, hồ sơ của tôi | App card có tên/phiên bản/trạng thái; chỉ số có thời điểm cập nhật và liên kết tới nguồn; tenant trống → hướng dẫn tạo app nếu có quyền, hoặc liên hệ quản trị. | FR-WRK-03/04 |
| U03 — Danh sách dự án/ứng dụng | Designer/publisher | Tabs `Bản nháp` / `Đã xuất bản`, tìm theo tên trong tenant, tạo từ đầu hoặc mẫu mua sắm; mẫu tạo **nháp riêng** và không ghi đè app đã có. Tên trùng/không có quyền → thông báo rõ. | FR-BLD-01/06 |
| U04 — Tạo dự án & mô tả gốc | Designer | Tên, mục tiêu, bộ phận/vai trò; nguồn văn bản/tệp; mẫu có cấu trúc: đầu vào, bước, người chịu trách nhiệm, điều kiện, đầu ra, ngoại lệ. Autosave chỉ khi API hỗ trợ; nếu không có, nút `Lưu nháp` rõ ràng. Thiếu thông tin → lỗi tại trường + danh sách ở đầu form. | FR-BLD-01/02 |
| U05 — Đề xuất chuẩn hóa | Designer | Hai cột `Mô tả gốc` ↔ `Bản nháp chuẩn hóa`, liên kết từng bước về đoạn nguồn, chip `Chưa rõ`, `Thiếu vai trò` và hành động `Sửa thủ công`. AI lỗi/không bật → form cấu trúc vẫn dùng được; không tự điền ngưỡng/quy định không có nguồn. | FR-BLD-03, FR-AI-03 |
| U06 — Builder | Designer | Sections `Vai trò` / `Trường & biểu mẫu` / `Các bước & nhánh` / `Quyền & nguồn` / `Tổng quan`; editor bên trái, preview/kiểm tra bên phải desktop. Mỗi bước có ID ổn định, tên hiển thị, vai trò, trường quyết định, nhánh/ngoại lệ. Không hứa canvas kéo-thả/BPMN tùy ý. | FR-BLD-04/08 |
| U07 — Kiểm tra & chạy thử | Designer/publisher | Danh sách lỗi có cấp độ, liên kết tới trường/bước, `Chạy thử` bằng dữ liệu giả cùng tenant; cho chọn nhánh và xem đường đi/kết quả, H/P/D/I + ánh xạ lớp lõi. Lỗi thiếu người phụ trách/nhánh/role/quyền → chặn xuất bản. Dữ liệu giả có nhãn `Chạy thử — không tạo hồ sơ thật`. | FR-BLD-05/08 |
| U08 — Review & xuất bản | Publisher theo quyền app | So sánh phiên hiện hành ↔ nháp: schema, vai trò, bước/điều kiện, nguồn I, mô-đun; checksum/version được review; xác nhận tên app và phiên bản, cảnh báo hồ sơ đang chạy giữ phiên cũ. Quyền thiếu → không có CTA; API từ chối → không hiển thị đã xuất bản. | FR-BLD-05/07/08 |
| U09 — Phiên bản | Designer/publisher | Dòng thời gian v1/v2: người xuất bản, lúc xuất bản, diff, trạng thái, cách tạo nháp từ phiên cũ; không chỉnh sửa bản đã xuất bản. “Quay về” là **tạo phát hành được kiểm soát**, không sửa ngầm phiên/hồ sơ cũ. | FR-BLD-05/07 |
| U10 — Tổng quan app vận hành | Nhân viên/quản lý | Tiêu đề app, phiên bản áp dụng cho hồ sơ mới, shortcut `Tạo hồ sơ`, `Việc của tôi`, `Hồ sơ`, `Báo cáo`, trạng thái trợ lý; chỉ hiện thao tác có quyền. | FR-WRK-01/04 |
| U11 — Danh sách & biểu mẫu hồ sơ | Nhân viên | Danh sách `Của tôi` với trạng thái/ngày cập nhật; form dựng từ schema đã xuất bản, trường bắt buộc, loại/giới hạn, bản nháp/gửi; tệp có `Đang kiểm tra`/`Không an toàn`/`Sẵn sàng`, chưa sẵn sàng không gửi nếu bắt buộc. Gửi nhiều lần cùng yêu cầu không tạo hồ sơ trùng. | FR-WRK-01, FR-CORE-04 |
| U12 — Hộp việc | Người được giao | Tab `Cần xử lý`/`Đã xử lý`, bộ lọc trạng thái/hạn/app; item có tên hồ sơ, bước, hạn, người giao/nguồn trong phạm vi quyền; mở chi tiết, không duyệt trực tiếp từ hàng bảng khi chưa đọc hồ sơ. Trống → `Bạn chưa có việc được giao`. | FR-WRK-02/04 |
| U13 — Chi tiết & quyết định | Người tạo/người được giao | Tóm tắt, biểu mẫu, tệp được phép, stepper/timeline, người xử lý, lý do, phiên bản **của hồ sơ**; thanh action `Duyệt` / `Từ chối` / `Yêu cầu bổ sung` **chỉ khi cấu hình hỗ trợ**. Xác nhận quyết định + lý do theo quy tắc; task stale/đã xử lý → tải lại và chỉ hiện trạng thái mới. | FR-WRK-02/03 |
| U14 — Dashboard & drill-down | Quản lý theo quyền | KPI có định nghĩa/công thức/thời điểm cập nhật, lọc theo app/phạm vi được phép; click KPI → danh sách hồ sơ nguồn với cùng filter; không cộng dữ liệu hai tenant; không hiện KPI khi thiếu nguồn hoặc quyền. | FR-WRK-03/04 |
| U15 — Trợ lý trong app | Người có quyền nguồn | Bảng hỏi đáp gắn nhãn app + version, trạng thái `Có nguồn`/`Chưa có nguồn`/`Tạm ngừng`; câu trả lời kèm trích dẫn link nguồn được phép; thiếu bằng chứng → nói không biết. Không hiện lịch sử chat xuyên app/tenant; không có action duyệt/xuất bản. | FR-AI-01..06, FR-WRK-04 |
| U16 — Thành viên, quyền, nguồn tri thức | Quản trị tenant được cấp | Mời/gán vai trò; chọn từng chính sách/cấu hình **đã xuất bản** để lập chỉ mục; trạng thái chờ/đạt/lỗi/đã thu hồi; cảnh báo trước thu hồi, UI chặn hiển thị sau khi API xác nhận. Không mặc định nạp mọi hồ sơ. | FR-CORE-01/06, FR-AI-01/04 |

**Ghi chú tách màn:** U06–U09 là workspace thiết kế, U10–U15 là runtime chung. Các trường `days`, `leave_type`, `manager_decision`, `hr_decision` ở fixture B là dữ liệu cấu hình để render và đặt nhãn tiếng Việt, không phải những cột hardcode trong mẫu giao diện chung. Những mục v1.5 như cổng nhà cung cấp, kế toán thật, OCR, bản đồ, chợ ứng dụng, AI tự động hay dashboard DTI không nằm trong lát cắt UI này; nếu mở rộng phải có scope và quyền riêng.

## 6. Luồng tương tác trọng yếu

### F1 — Tạo, kiểm tra, xuất bản app

`Chọn tenant → Ứng dụng → Tạo nháp (trống hoặc từ mẫu) → Mô tả gốc → Chuẩn hóa/chỉnh tay → Editor → Kiểm tra → Chạy thử → Publisher review diff → Xác nhận xuất bản → Mở app`. Tại mỗi bước lưu trạng thái nháp và chỉ ra bước kế tiếp. Trước xuất bản hiển thị checklist: schema/ngữ nghĩa đạt, H (role/quyền), P (workflow/nhánh), D (trường/nguồn), I (nguồn đã chọn hoặc `Chưa có nguồn`), mô-đun tùy chọn và kết quả chạy thử. I không có tài liệu **không tự động chặn** phát hành; thiếu ánh xạ/quyền cốt lõi thì chặn. Chạy thử không thay thế review nội dung nghiệp vụ. Nếu deploy/ghi nhận thất bại hoặc cần đối soát: thông báo `Chưa xuất bản`, giữ bản nháp, không tạo link app chạy thật cho đến khi API xác nhận trạng thái published.

### F2 — Mua sắm tenant A

Publisher lấy **mẫu mua sắm** thành nháp tenant A, cấu hình ngưỡng và vai trò, chạy thử rồi phát hành. Nhân viên tạo đề nghị với danh sách hàng/số lượng/đơn giá, lý do, báo giá nếu vượt ngưỡng cấu hình; tổng tiền được tính từ các dòng (UI hiển thị phép tính, API xác minh). Quản lý mở việc, xem chứng từ/trạng thái, duyệt hoặc từ chối kèm lý do; nếu có đầu nối mô phỏng, hiển thị nhãn `Mô phỏng` và không hàm ý đã gửi kế toán thật. Không dùng con số 20 triệu như ngưỡng mặc định nếu tenant chưa cấu hình.

### F3 — Nghỉ phép tenant B tạo qua builder

Designer nhập/cấu hình form `Ngày bắt đầu`, `Số ngày` (1–30), `Loại nghỉ`, `Lý do` (5–500 ký tự), hai bước manager/HR và nhánh từ [fixture](fixtures/leave-app-v1.json); publisher chạy thử và xuất bản. Nhân viên gửi **2 ngày** → manager duyệt → chấp thuận; **4 ngày** → manager duyệt → HR duyệt → chấp thuận; manager từ chối → từ chối và có lý do. Kiểm trường hợp biên **3 ngày** đi HR (`days >= 3`). `manager_decision`/`hr_decision` chỉ là field nội bộ dành cho task được giao, không hiển thị như trường nhân viên tự nhập. Nhân viên không thấy `Xuất bản`; manager A không thấy hồ sơ B; người tạo không tự duyệt khi `noSelfApproval`. Thay ngưỡng ở v2: form tạo mới theo v2, hồ sơ v1 vẫn hiển thị nhãn `Quy trình v1` và chạy theo v1.

### F4 — Trợ lý và thu hồi quyền

Trong app B, hỏi về chính sách được cho phép → hiện câu trả lời và trích dẫn tên tài liệu/phiên bản; click nguồn mở tài liệu qua kiểm quyền hiện hành. Không có nguồn hoặc không đủ bằng chứng → `Chưa có tài liệu phù hợp để trả lời. Bạn có thể tiếp tục làm việc bình thường.` Thu hồi quyền trong quản trị → chỉ thông báo thành công sau API commit; đang hỏi mà quyền đổi → hủy câu trả lời và báo `Quyền truy cập nguồn đã thay đổi. Vui lòng hỏi lại.` Không giữ nội dung prompt/đáp án mặc định, không streaming v1; không render trích dẫn của nguồn đã thu hồi. AI tắt: U11/U12/U13/U14 không bị khóa.

## 7. Quy tắc tương tác, trạng thái và nội dung

| Thành phần | Quy tắc thiết kế / lỗi cần có |
| --- | --- |
| Form | Label nằm ngoài placeholder; dấu `*` và giải thích `Bắt buộc`; giữ giá trị đã nhập khi lỗi; lỗi tại trường + summary có link focus; server error không ghi đè dữ liệu. Date/number dùng định dạng Việt, lưu giá trị theo hợp đồng API, không tự đoán timezone. |
| Bước/nhánh builder | Danh sách có thứ tự, tên rõ, role và điều kiện đọc được bằng ngôn ngữ người dùng; lỗi `Nhánh “Manager duyệt, số ngày ≥ 3” chưa có đích` có link sửa. Bản nháp chưa hợp lệ vẫn lưu được, nhưng không chạy thật/xuất bản. |
| Tệp | Chọn/tải lên → `Đang tải` → `Đang kiểm tra` → `Sẵn sàng` hoặc `Bị từ chối` với lý do; không cho preview/download trước khi API cho phép; URL có hạn, hết hạn yêu cầu cấp lại qua API. Không hứa quét thành công khi dịch vụ chưa có. |
| Quyết định | Trước khi gửi nêu hành động, đối tượng, người/nhóm nhận bước kế; từ chối cần lý do (mẫu mua sắm); các quy tắc khác theo cấu hình/API. Disable trong lúc gửi, retry có idempotency; timeout giữ `Đang xác minh kết quả`, không báo thành công hoặc cho gửi trùng mù. |
| Bảng/list | Tìm kiếm/bộ lọc trong phạm vi quyền, chỉ rõ số kết quả, trạng thái rỗng theo filter, phân trang; dòng có tên liên kết rõ, không phụ thuộc icon-only. Không đưa dữ liệu tenant cũ vào optimistic cache. |
| Timeline | Mỗi sự kiện có trạng thái, người/nhóm nếu được phép, thời điểm, lý do và version; `Chưa có bước xử lý` khác với lỗi tải lịch sử. Không thể hiện bước dự đoán như sự kiện đã xảy ra. |
| Dashboard | KPI định nghĩa, đơn vị, thời điểm cập nhật; loading/không có dữ liệu/không đủ quyền là ba trạng thái khác nhau; drill-down giữ filter và chỉ cho xem nguồn được phép. |
| Trợ lý | Nêu phạm vi app/version; trạng thái xử lý, trích dẫn nguồn có tên/phiên bản, thông báo không biết; không tô đáp án như sự thật tuyệt đối, không có nút “Áp dụng” thay đổi workflow. |
| Feedback | Toast cho hoàn tất nhẹ; lỗi quan trọng và lỗi quyền dùng inline/banner; không dựa riêng vào màu. 401 → đăng nhập lại, 403 → không đủ quyền (không lộ tài nguyên), 404 → không tìm thấy/không thể truy cập, 409 → bản nháp/task đã thay đổi, 429 → chờ và thử lại, 5xx → thử lại an toàn. |

**Copy mẫu (đề xuất, cần nghiệp vụ duyệt):** `Lưu bản nháp`, `Kiểm tra quy trình`, `Chạy thử bằng dữ liệu mẫu`, `Xem thay đổi`, `Xuất bản phiên bản 2`, `Gửi hồ sơ`, `Yêu cầu bổ sung`. Tránh `Hoàn tất` khi workflow vẫn chờ, `AI đã phê duyệt`, `Bảo mật tuyệt đối`, `Đã đồng bộ kế toán` cho connector mô phỏng. Bất kỳ thông báo thành công nào phải phản ánh trạng thái API thực.

## 8. Accessibility, an toàn và triển khai thiết kế

- Hướng WCAG 2.1 AA: điều hướng toàn bộ bằng bàn phím, thứ tự focus theo DOM, focus visible, skip link, nhãn/description/error liên kết input, thông báo động qua live region có kiểm soát, modal trap và trả focus về trigger; không tạo keyboard trap ở builder/timeline. Vùng chạm mục tiêu ≥ 44×44px trên mobile (quy ước UI đề xuất).
- SVG/logo nếu đứng độc lập có accessible name; logo kèm chữ không đọc trùng; icon trang trí `aria-hidden`. Biểu đồ có mô tả và bảng dữ liệu tương đương. Dùng chữ + icon cho trạng thái, không chỉ màu. Kiểm ở zoom 200%, chữ tiếng Việt dài, dark scheme nếu được quyết định triển khai (không mặc nhiên có dark mode).
- Mật khẩu/MFA ở IdP, UI app không tự dựng form nhận mật khẩu riêng nếu SSO là luồng chính. Frontend không gửi tenant do người dùng nhập để cấp quyền; không đưa tệp/token/nội dung AI vào analytics hoặc ảnh minh họa thật. Chỉ demo với dữ liệu tổng hợp. Không cache trang protected công khai; thao tác chuyển tenant/đăng xuất làm sạch trạng thái nhạy cảm.
- Thiết kế màn lỗi trung gian không suy diễn dữ liệu không có từ API; dùng contract hành động/khả năng trả về từ server. Trước khi code, UX + backend chốt quyền, enum trạng thái, lỗi, version và mapping schema → field UI; phần nào API chưa có thì prototype gắn `concept`, không giả là chạy được.

## 9. Cấu trúc bàn giao Figma/thiết kế

| Trang trong file thiết kế | Nội dung tối thiểu |
| --- | --- |
| `00 · Cover & decisions` | Phiên bản, owner/reviewer, nguồn SRS, logo A đã chọn, những quyết định mở, phạm vi không làm. |
| `01 · Foundations` | Màu/token và cặp tương phản đã đo, typography tiếng Việt, spacing/grid/breakpoints, iconography, logo sáng/tối/clear space. |
| `02 · Components` | Button, field/date/number/select, file, badge trạng thái, tabs, table/card list, filter, stepper, timeline, toast/banner, modal/drawer, empty/error/loading, citation. Mỗi component có default/hover/focus/disabled/error/mobile. |
| `03 · Navigation` | Sitemap, shell theo quyền, desktop/tablet/mobile, switch tenant/app, breadcrumb, forbidden/expired session. |
| `04 · Builder` | U03–U09, F1 và F3, mọi trạng thái validation/chạy thử/review/diff/publish, trường hợp AI tắt. |
| `05 · Runtime` | U10–U15, F2/F3/F4, phiên bản v1/v2, hồ sơ/tệp/task/dashboard/AI. |
| `06 · Admin & handoff` | U16, ma trận quyền hiển thị, bản đồ trạng thái API, chú thích dữ liệu mẫu và tương tác prototype, checklist QA. |

**Quy tắc đặt tên:** `U06 / Builder / desktop / invalid-branch`, `U13 / Record / mobile / task-conflict`; component theo `Component / Variant / State / Size`. Dùng dữ liệu giả A/B có nhãn, không dùng tên người/tài liệu thật. Annotate trên từng frame: actor, tenant, app/version, điều kiện trước, hành động, kết quả/lỗi, nguồn dữ liệu API/fixture, yêu cầu SRS. Có prototype click-through cho luồng chính và tối thiểu một nhánh lỗi/quyền mỗi hành trình. Xuất asset option A từ `docs/branding/`, không vẽ lại logo trong Figma rồi coi là master.

## 10. Ma trận nghiệm thu thiết kế (chưa phải test sản phẩm)

| Kịch bản review prototype | Màn/luồng | Tiêu chí UX đạt | Nguồn |
| --- | --- | --- | --- |
| Designer B tạo nghỉ phép từ cấu hình, thiếu nhánh | U04–U07, F3 | Lỗi định vị được bước/nhánh, vẫn lưu nháp, không xuất bản; đường sửa thủ công không cần AI. | FR-BLD-02..05, TC-LEAVE-01 |
| Publisher xem khác biệt và phát hành v1/v2 | U07–U09 | Thấy thay đổi quyền/schema/điều kiện và phiên bản; xác nhận chủ động; hồ sơ v1 không bị đổi ngầm. | FR-BLD-05/08, TC-LEAVE-06 |
| Nhân viên A gửi đề nghị và manager xử lý | U11–U13, F2 | Field/tệp lỗi có cách sửa, gửi không nhân đôi, người duyệt thấy lịch sử và lý do; không tự duyệt trái quyền. | FR-WRK-01..03, SRS v1.5 FR-WEB-02/03 |
| Nhân viên B nộp 2/3/4 ngày | U11–U13, F3 | Nhìn rõ đường đi: 2 ngày kết thúc ở manager, 3/4 qua HR; nhánh từ chối có lý do. | TC-LEAVE-02..04 |
| Đổi tenant, deep link trái quyền, task đã xử lý | U01/U02/U12/U13 | Không lộ tên/nguồn tenant khác; context reset; 403/404/409 có hành động an toàn. | FR-CORE-01/02, TC-LEAVE-05 |
| AI tắt hoặc nguồn bị thu hồi | U15/U16, F4 | I báo trạng thái trung thực, không còn citation bị thu hồi; H/P/D vẫn dùng được. | FR-AI-02/04/06, TC-AI-OFF-01 |
| Dashboard truy vết | U14 → U11/U13 | KPI có công thức/thời điểm/phạm vi; drill-down tới hồ sơ gốc được phép. | FR-WRK-03, TC-DAT-01 |
| Mobile + accessibility | U11–U15 | Gửi/duyệt không cần hover, focus/nhãn/lỗi đọc được, bảng không mất thông tin quan trọng, màu đạt kiểm tra thực tế. | NFR-UX-01, SRS v1.5 B.5 |

**Điều kiện chốt tài liệu/UI kit:** UX, nghiệp vụ và an toàn review chéo; đối chiếu từng frame với quyền/API và SRS; đo tương phản chứ không ước lượng; thử với người dùng đại diện ít nhất một designer, một nhân viên, một publisher/người duyệt (đề xuất, chưa tiến hành); ghi issue và quyết định còn mở. Chỉ đánh dấu kịch bản *đã triển khai* sau khi chạy trên hệ thống thật, không dựa vào prototype hoặc fixture.
