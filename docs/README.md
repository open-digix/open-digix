# Tài liệu DigiX

Mục lục tài liệu dự án, phân theo nhu cầu của người đọc. Trạng thái “đề xuất”,
“bản nháp” hay “đã triển khai” được ghi trong từng tài liệu; không suy diễn
trạng thái từ vị trí của tài liệu trong cây thư mục.

## Sản phẩm

- [SRS DigiX Lab v2.5](product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md) — phạm vi ERP/CRM lắp ghép **đề xuất**, chờ đội xác nhận/triển khai.
- [SRS DigiX](product/requirements/SRS%20DigiX%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md) — tài liệu phiên bản trước, giữ để đối chiếu.
- [UI/UX v2.5](product/design/DigiX%20Lab%20-%20UI%20UX%20v2.5.md) — thiết kế mục tiêu; [UI/UX v0.1](product/design/DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20thi%E1%BA%BFt%20k%E1%BA%BF%20UI%20UX.md) — baseline v2.4.

## Kỹ thuật

- [Kiến trúc database và quy tắc schema](engineering/architecture/database-schema.md).
- [Thiết kế dữ liệu nhiều app v2.5](engineering/architecture/du-lieu-da-ung-dung-v2.5.md) — đề xuất, không phải migration đã chạy.
- [Quyết định đủ để khởi công code v2.5](engineering/architecture/quyet-dinh-khoi-cong-code-v2.5.md) và [hợp đồng kỹ thuật Builder/runtime](engineering/builder/hop-dong-ky-thuat-v2.5.md) — đã chốt thiết kế, chưa triển khai/nghiệm thu.
- [Hợp đồng ứng dụng v2.5](engineering/builder/hop-dong-ung-dung-v2.5.md), [schema draft](reference/schema/digix-app-draft-v2.5.schema.json), [schema published](reference/schema/digix-app-v2.5.schema.json), [fixture ERP A](examples/erp-a-app-v2.5.json), [CRM A](examples/crm-a-app-v2.5.json), [CRM B](examples/crm-b-app-v2.5.json) và [app ERP/CRM kết hợp](examples/hybrid-app-v2.5.json) — thiết kế, chưa nghiệm thu.
- [Hợp đồng dữ liệu Builder](engineering/builder/DigiX%20Lab%20-%20H%E1%BB%A3p%20%C4%91%E1%BB%93ng%20d%E1%BB%AF%20li%E1%BB%87u%20Builder.md).
- [Thiết kế Builder và nghiệm thu nghỉ phép](engineering/builder/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20builder%20v%C3%A0%20nghi%E1%BB%87m%20thu%20ngh%E1%BB%89%20ph%C3%A9p.md).
- [Database, luồng hoạt động và demo Builder](engineering/builder/digix-builder-database-va-demo.md).
- [Thiết kế AI nội bộ và vòng đời dữ liệu](engineering/ai/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md).
- [JSON Schema](reference/schema/digix-app-v1.schema.json), [fixtures demo](examples/).
- [Tài sản branding](assets/branding/README.md).

## Điều hành và cuộc thi

- [Roadmap v2.5 đề xuất](delivery/roadmap-v2.5.md), [kiểm kê hiện trạng mức A](delivery/kiem-ke-hien-trang-uu-tien-a-v2.5.md) và [kế hoạch nghiệm thu v2.5](delivery/ke-hoach-nghiem-thu-v2.5.md); [roadmap v2.4](delivery/roadmap.md) giữ baseline lịch sử.
- [Hồ sơ khởi động GĐ0](delivery/planning/GD0.md), [checklist GĐ0](delivery/planning/GD0-checklist.md), [tài liệu chuẩn bị họp](delivery/planning/GD0-hop-16h-hien-trang-va-quyet-dinh.md) và [mẫu trả lời Q1–Q9](delivery/planning/GD0-mau-tra-loi-Q1-Q9.md).
- [Đối chiếu đề và thể lệ OLP 2026](competition/OLP%202026%20-%20%C4%90%E1%BB%91i%20chi%E1%BA%BFu%20%C4%91%E1%BB%81%20ch%C3%ADnh%20th%E1%BB%A9c.md).

## Quy ước

- Tài liệu mô tả hiện trạng phải phân biệt nội dung đã triển khai, đã kiểm thử
  và mới là đề xuất.
- Khi có nhiều tài liệu cùng chủ đề, ghi rõ tài liệu nào là nguồn chuẩn và tài
  liệu nào chỉ để đối chiếu; ưu tiên SRS DigiX Lab cho phạm vi sản phẩm hiện hành.
- Tài liệu Markdown được quản lý cùng mã nguồn; cập nhật liên kết khi di chuyển
  hoặc đổi tên tài liệu.
