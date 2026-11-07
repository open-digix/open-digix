# DigiX — môi trường phát triển tối thiểu

Lát cắt hiện có: **Next.js → NestJS → PostgreSQL**. Trang Web gọi API từ
server Next.js; `/health` của API chạy `SELECT 1` để kiểm tra kết nối DB.
Chưa có migration/nghiệp vụ, Keycloak, Gateway, kho tệp hoặc workflow engine;
đây **không phải** bằng chứng đã hoàn tất GĐ0 hay lõi theo đề thi.

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
cd apps/api && npm ci && npm run build && npm test
cd ../web && npm ci && npm run build && npm run lint
```

## Bố cục

```text
apps/api/          NestJS; GET /health truy vấn PostgreSQL
apps/web/          Next.js; trang chính gọi API bằng API_INTERNAL_URL nội bộ
compose.yaml       DB, API, Web + healthcheck/depends_on
.env.example       Chỉ là ví dụ; .env thật được git bỏ qua
docs/              SRS, roadmap, GĐ0 và thiết kế (chưa thay thế code chạy)
```

Không đưa secret thật vào `.env.example`, source, ảnh log hoặc commit. Cấu
hình cổng host chỉ bind `127.0.0.1`; môi trường này **không** dành cho public
Internet. Khi `docker compose` báo không kết nối được daemon, hãy bật Docker
Engine; khi Web hiện “unavailable”, xem `docker compose ps`/`logs` rồi kiểm
tra `http://localhost:3001/health`. Một phản hồi HTTP 503 nghĩa là API đang
chạy nhưng chưa kết nối được DB; kiểm `.env` và trạng thái DB trước.
