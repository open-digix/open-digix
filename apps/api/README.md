# DigiX API

NestJS API cho DigiX. Lát cắt hiện tại cung cấp health check PostgreSQL,
versioned database migrations và công cụ kiểm chứng tenant isolation. API nghiệp
vụ, xác thực, workflow và Builder chưa được triển khai.

## Chạy bằng Docker Compose

Cách tái lập được khuyến nghị nằm ở README thư mục gốc:

```sh
cp .env.example .env
# Đặt POSTGRES_PASSWORD riêng cho máy local.
docker compose up --build --wait
```

Compose chạy migration trước khi khởi động API. API chỉ healthy sau khi kết nối
PostgreSQL và migration thành công.

## Scripts

```sh
npm ci
npm run lint
npm run build
npm test
npm run test:e2e
```

Các lệnh database khi API có thể kết nối PostgreSQL:

```sh
npm run db:migrate
npm run db:verify
```

Lệnh tương ứng trong production image:

```sh
node dist/database/migrate.js
node dist/database/verify-schema.js
```

## Migration workflow

1. Tạo migration mới trong `src/database/migrations/` với ID
   `NNNN_lowercase_name`.
2. Đăng ký migration theo thứ tự trong `src/database/migrations.ts`.
3. Không sửa migration đã áp dụng; thêm migration mới cho mọi thay đổi tiếp
   theo.
4. Chạy lint, build, unit test, migration và schema verification.
5. Review SQL, tenant constraints và bằng chứng kiểm thử trước khi merge.

Migration runner dùng transaction, PostgreSQL advisory lock và SHA-256 checksum.
Lịch sử được lưu trong bảng `schema_migrations`.

## Cấu trúc database source

```text
src/database/
├── database.config.ts
├── migrate.ts
├── migration-runner.ts
├── migration-runner.spec.ts
├── migrations.ts
├── migrations.spec.ts
├── migrations/
│   └── 0001-initial-schema.ts
└── verify-schema.ts
```

Xem ERD, mô tả bảng và quy tắc tenant isolation tại
[`docs/database-schema.md`](../../docs/database-schema.md).

## Trạng thái kiểm chứng

- Migration chạy trên PostgreSQL 17.
- Chạy migration lặp lại không tạo schema trùng.
- Verification xác nhận 13 bảng bắt buộc.
- Sáu liên kết chéo tenant bị PostgreSQL từ chối.
- Dữ liệu verification được rollback hoàn toàn.

Các kết quả trên chỉ chứng minh database foundation, không chứng minh MVP
đầu-cuối đã hoàn thành.
