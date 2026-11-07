# DigiX — môi trường phát triển tối thiểu

Lát cắt hiện có: **Next.js → NestJS → PostgreSQL**. Trang Web gọi API từ
server Next.js; `/health` của API chạy `SELECT 1` để kiểm tra kết nối DB. API
chạy migration có version trước khi khởi động; schema nền đã có tenant,
membership/role, application/version, business record, workflow reference,
metadata tệp và audit với ràng buộc tenant ở PostgreSQL.

Chưa có API nghiệp vụ, tenant guard/RLS, Keycloak, Gateway, kho tệp hoặc
workflow engine. Đây **không phải** bằng chứng đã hoàn tất GĐ0 hay MVP theo đề
thi. Xem [ERD và quy tắc database](docs/database-schema.md).

## Yêu cầu

- Docker Engine đang chạy và Docker Compose v2 (lệnh `docker compose`).
- Có thể tải image Node 24 và PostgreSQL 17 từ registry, cũng như npm packages
  trong lần build đầu. Dự trù vài GB dung lượng trống; cổng 3000/3001 rảnh.
- Nếu chạy app ngoài container: Node.js 24 và npm (mỗi app có `package-lock.json`).

## Chạy từ bản clone sạch

```sh
cp .env.example .env
# Sửa POSTGRES_PASSWORD trong .env thành mật khẩu riêng cho máy của bạn.
docker compose up --build --wait
```

- Web: <http://localhost:3000> — phải hiện `API and database: connected`.
- API: <http://localhost:3001/health> — trả `{"status":"ok","database":"ok"}`.
- DB chỉ mở trong mạng Compose (không công bố cổng 5432 ra máy host).
- Đổi `WEB_PORT`/`API_PORT` trong `.env` nếu cổng host bị chiếm.

Kiểm tra DB trực tiếp mà không cần cài `psql` trên máy:

```sh
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1"'
docker compose ps
docker compose logs --tail=100 api web db
```

Compose tự chạy migration trước khi API khởi động. Có thể chạy lại và kiểm
chứng schema bằng các lệnh sau:

```sh
docker compose exec api node dist/database/migrate.js
docker compose exec api node dist/database/verify-schema.js
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, checksum, applied_at FROM schema_migrations ORDER BY id"'
```

Verification kiểm tra đủ bảng, checksum migration, sáu trường hợp truy cập chéo
tenant ở lớp khóa ngoại và rollback toàn bộ dữ liệu thử.

Dừng bằng `docker compose down`. Volume `postgres_data` giữ dữ liệu qua lần
khởi động sau; **`docker compose down -v` sẽ xóa dữ liệu DB**, chỉ dùng khi
chủ động muốn reset. Khi thay đổi tên DB/user/password sau lần chạy đầu,
volume cũ không tự khởi tạo lại tài khoản; dùng thông số cũ hoặc chủ động
tạo DB/user mới trong volume đó.

## Phát triển ngoài Compose (tùy chọn)

Chạy DB bằng `docker compose up -d db`; API trên host cần `DB_HOST=localhost`
**và** cổng DB được expose tạm thời trong cấu hình riêng (Compose mặc định
không expose). Cách đơn giản để thử tái lập hiện tại là chạy toàn bộ bằng
Compose. Mỗi app có thể tự kiểm tra mã nguồn:

```sh
cd apps/api && npm ci && npm run lint && npm run build && npm test
cd ../web && npm ci && npm run build && npm run lint
```

## Bố cục

```text
apps/api/          NestJS; health, migration và schema verification
apps/web/          Next.js; trang chính gọi API bằng API_INTERNAL_URL nội bộ
compose.yaml       DB, API, Web + healthcheck/depends_on
.env.example       Chỉ là ví dụ; .env thật được git bỏ qua
docs/              SRS, roadmap, ERD và tài liệu thiết kế
```

Không đưa secret thật vào `.env.example`, source, ảnh log hoặc commit. Cấu
hình cổng host chỉ bind `127.0.0.1`; môi trường này **không** dành cho public
Internet. Khi `docker compose` báo không kết nối được daemon, hãy bật Docker
Engine; khi Web hiện “unavailable”, xem `docker compose ps`/`logs` rồi kiểm
tra `http://localhost:3001/health`. Một phản hồi HTTP 503 nghĩa là API đang
chạy nhưng chưa kết nối được DB; kiểm `.env` và trạng thái DB trước.
