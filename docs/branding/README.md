# DigiX Lab — đề xuất nhận diện

Ba concept dựa trên SRS DigiX Lab v2.4, GĐ0 và thiết kế builder: doanh nghiệp
tự cấu hình hệ thống vận hành trên lõi nguồn mở dùng chung. Không định vị DigiX
là phần mềm mua sắm, chatbot hoặc phòng thí nghiệm hóa học.

Mở **[preview.html](preview.html)** trực tiếp trong trình duyệt để so sánh.
Các concept là đề xuất thiết kế, chưa được đội duyệt, chưa kiểm tra nhãn hiệu.

## A · Modular X — đề xuất ưu tiên

Bốn khối độc lập cùng tạo thành chữ X, gợi bốn năng lực H–P–D–I kết nối
quanh lõi chung. Khoảng âm ở giữa giữ biểu tượng thoáng; một khối teal gợi
khả năng thay thế mô-đun mà vẫn duy trì cấu trúc tổng thể. Không gán từng màu
cho một năng lực riêng. Góc vuông thể hiện tính cấu trúc của builder.

**Phù hợp:** nhận diện chính, favicon, slide, avatar dự án. Đơn giản nhất ở cỡ nhỏ.
**Đánh đổi:** X là hình phổ biến, cần kiểm tra tương đồng trước khi dùng chính thức.

## B · Flow D

Một nét bao hình chữ D kết hợp mũi tên đi vào: từ mô tả công việc tới quy trình
có thể chạy. Nét bao mở phía trái gợi nền tảng mở; luồng đi vào biểu đạt cấu hình
được kiểm tra trên lõi chung, không phải AI tự quyết định.

**Phù hợp:** nhấn mạnh workflow, vận hành và hành trình chuyển đổi số.
**Đánh đổi:** thiên về quy trình hơn hệ sinh thái; không hàm ý nút đăng nhập.

## C · Open Layers

Ba lớp hình học gợi kiến trúc ba tầng DX-OS: lõi dịch vụ, không gian H–P–D–I,
hệ sinh thái mô-đun. Các khe tách lớp thể hiện ranh giới rõ ràng; lỗ hình thoi
ở lớp trên gợi điểm kết nối mở. Đây là ẩn dụ thương hiệu, không phải sơ đồ
thứ tự triển khai hoặc mô tả một database.

**Phù hợp:** nhấn mạnh nền tảng, kiến trúc và khả năng mở rộng.
**Đánh đổi:** nhiều chi tiết hơn A; ưu tiên kích thước từ 32px.

## Cấu trúc và sử dụng

- `digix-logo-icon-{a,b,c}.svg`: biểu tượng màu, nền trong suốt, khung 512².
- `*-mono.svg`: một màu navy, dùng in một màu hoặc nền sáng.
- `*-dark.svg`: trắng/teal sáng, đặt trên nền tối; SVG không chứa nền.
- `digix-logo-wordmark-{a,b,c}.svg`: biểu tượng và chữ DigiX LAB, dạng path,
  không cần font ngoài; có bản `-dark`.
- `digix-logo-wordmark.svg`: bản A tiện tham chiếu, **không phải quyết định đã duyệt**.
- `digix-logo-maskable.svg`: icon A nền navy tràn khung; hình trong vùng an toàn.
- `digix-logo-adaptive-foreground.svg`: foreground A nền trong suốt.
  Đây là tài sản nguồn SVG, chưa phải bộ Android VectorDrawable.
- `export/`: PNG biểu tượng 48/192/512/1024px, wordmark 1560px, foreground/maskable.
- `generate.py`: nguồn dựng hình; chạy `python docs/branding/generate.py`
  từ gốc repo; cần `rsvg-convert` của librsvg. Sửa nguồn rồi tái tạo SVG/PNG.

**Màu:** navy `#112B45`, teal `#0D9488`; trên nền tối dùng trắng và teal
`#2DD4BF`. Không dùng gradient, bóng hoặc đường mảnh. Chữ được dựng hình học
thành path để kết quả hiển thị không lệ thuộc font cài trên máy.

Giữ khoảng trống ít nhất 1/8 chiều rộng biểu tượng quanh logo; không kéo méo,
xoay, đổi thứ tự các khối hoặc dùng bản navy trên nền tối. Kích thước biểu tượng
đề xuất tối thiểu A/B 24px, C 32px; kiểm tra mẫu 16–48px trong preview trước
khi chọn favicon. Chưa tích hợp logo vào giao diện ứng dụng.
