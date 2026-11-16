# Báo cáo tiến độ DigiX — 15/11/2026

## Về digix

DigiX Lab là nền tảng mã nguồn mở giúp các tổ chức xây dựng và vận hành các ứng dụng nghiệp vụ tùy chỉnh trên một nền tảng dùng chung về định danh, dữ liệu, API và quy trình làm việc.

Các ứng dụng được xây dựng theo kiến trúc ba tầng:

1. **Tầng 1 — Open Core:** nền tảng lõi dùng chung, cung cấp định danh và đăng
   nhập một lần (SSO), API Gateway, dịch vụ API, dữ liệu, tệp, quy trình làm
   việc và nhật ký kiểm toán.
2. **Tầng 2 — Không gian làm việc:** giao diện để người dùng thiết kế và vận
   hành ứng dụng nghiệp vụ; cung cấp các năng lực về con người, quy trình, dữ
   liệu và trí tuệ số (H-P-D-I), theo đúng tenant và quyền được cấp.
3. **Tầng 3 — Mô-đun nghiệp vụ và tích hợp:** các mô-đun hoặc đầu nối chuyên
   biệt theo nhu cầu, có thể được bổ sung hoặc gỡ bỏ mà không phải dựng lại nền
   tảng lõi. Tầng này là tùy chọn; mọi truy cập dữ liệu và thay đổi trạng thái
   vẫn phải đi qua API, kiểm tra quyền và quy trình của Tầng 1.

## Tiến độ làm việc (15/11)

### Về tài liệu + lisence

Nhóm đã hoàn thiện toàn bộ các tài liệu và lisence để đảm bảo về phần điểm pof

### Về sản phẩm

Hoàn thiện tầng 1 - lõi cho toàn bộ ứng dung

Nhóm hiện tại đang tiếp tục hoàn hiện Builder (cả front end + back)

Builder là công cụ giúp người dùng tạo và cấu hình ứng dụng nghiệp vụ mà không
cần lập trình toàn bộ từ đầu.

## Kế hoạch kế tiếp

Hoàn thiện builder và luồng demo sản phẩm để chuẩn bị demo cho thầy Tuấn vào thứ 6 tuần này (20/11)
