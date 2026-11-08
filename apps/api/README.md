# DigiX API

NestJS API cho DigiX. Lát cắt hiện tại cung cấp health check PostgreSQL,
versioned database migrations, công cụ kiểm chứng tenant isolation và xác thực
access token OIDC bằng issuer/audience/JWKS. API nghiệp vụ, tenant
membership/role authorization, workflow và Builder chưa được triển khai.

## Chạy bằng Docker Compose

Cách tái lập được khuyến nghị nằm ở README thư mục gốc:

```sh
cp .env.example .env
# Đặt POSTGRES_PASSWORD riêng cho máy local.
docker compose up --build --wait
```

Compose chạy migration trước khi khởi động API. API chỉ healthy sau khi kết nối
PostgreSQL và migration thành công.

## OIDC access-token validation

API cần ba biến môi trường:

```env
OIDC_ISSUER=http://localhost:8080/realms/digix
OIDC_AUDIENCE=digix-api
OIDC_JWKS_URI=http://keycloak:8080/realms/digix/protocol/openid-connect/certs
```

`OIDC_ISSUER` phải khớp chính xác claim `iss` trong token. `OIDC_JWKS_URI` là
địa chỉ nội bộ mà container API dùng để lấy public keys; hai địa chỉ khác host
là có chủ đích. Token chỉ được chấp nhận khi:

- chữ ký hợp lệ với key hiện hành trong JWKS;
- thuật toán là `RS256`;
- `iss` và `aud` khớp cấu hình;
- có `sub`, `iat`, `exp` và token chưa hết hạn.

Global auth guard bảo vệ mọi endpoint trừ endpoint được đánh dấu `@Public()`.
Hiện `/` và `/health` là public để phục vụ smoke test và health probe. Guard gắn
identity đã xác minh vào request dưới dạng `authenticatedIdentity`, gồm
`issuer`, `subject` và profile claim an toàn. API không dùng `tenant_id`, role
hoặc permission trong JWT để quyết định quyền; checkpoint tenant context sẽ
resolve cặp `(iss, sub)` sang membership/role hiện hành trong PostgreSQL.

Request thiếu token trả `401 AUTHENTICATION_REQUIRED`; Bearer token sai hoặc
hết hạn trả `401 INVALID_ACCESS_TOKEN`. Chi tiết lỗi JOSE không được trả cho
client.

## `GET /v1/me`

Endpoint được bảo vệ này resolve cặp `(iss, sub)` từ token sang
`identity_users`, sau đó đọc memberships và role hiện hành từ PostgreSQL:

```http
GET /v1/me
Authorization: Bearer <access-token>
X-Tenant-Id: <optional-tenant-uuid>
```

Không gửi `X-Tenant-Id` khi tải phiên lần đầu; response trả tất cả memberships
và `activeMembership: null`. Sau khi người dùng chọn tenant, frontend gửi UUID
tenant trong header. API chỉ đặt active membership khi user, tenant và
membership đều đang `active`.

```json
{
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "subject": "keycloak-subject",
    "email": "dung@example.test",
    "displayName": "Dung",
    "status": "active"
  },
  "memberships": [
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "status": "active",
      "tenant": {
        "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "slug": "tenant_alpha",
        "name": "Tenant Alpha",
        "status": "active"
      },
      "roles": ["employee"]
    }
  ],
  "activeMembership": null
}
```

Các lỗi riêng của endpoint:

- `400 INVALID_TENANT_ID`: header không phải UUID.
- `403 USER_NOT_PROVISIONED`: token hợp lệ nhưng chưa có identity mapping.
- `403 ACCOUNT_DISABLED`: tài khoản DigiX bị vô hiệu hóa.
- `403 TENANT_ACCESS_DENIED`: không có active membership trong tenant đã chọn.

Header tenant chỉ biểu thị tenant người dùng muốn chọn; API không coi giá trị do
client gửi là bằng chứng quyền. Role trong response đến từ
`membership_roles`/`tenant_roles`, không lấy từ JWT.

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
