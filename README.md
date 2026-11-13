# DigiX — môi trường phát triển tối thiểu

Lát cắt hiện có: **Keycloak/OIDC + Next.js → APISIX → NestJS → PostgreSQL**. Trang Web
gọi API qua Gateway từ server Next.js; `/health` của API chạy `SELECT 1` để kiểm tra kết
nối DB. API chạy migration có version trước khi khởi động; schema nền đã có
tenant, membership/role, application/version, business record, workflow
reference, metadata tệp và audit với ràng buộc tenant ở PostgreSQL. Keycloak
development import realm `digix` cùng client `digix-web` và audience
`digix-api` từ cấu hình có version trong repo.

Chưa có API nghiệp vụ, RLS, kho tệp hoặc workflow engine. Gateway định tuyến
`/health` và `/v1/*`, kiểm JWT Keycloak/JWKS (issuer, chữ ký, audience `digix-api`)
và giới hạn tần suất `/v1/*`. NestJS vẫn
xác minh JWT bằng issuer/audience/JWKS, resolve identity sang tenant và kiểm tra
membership/role từ PostgreSQL. Đây **không phải** bằng chứng đã hoàn tất GĐ0 hay
MVP theo đề thi. Xem [ERD và quy tắc database](docs/database-schema.md) và
[hướng dẫn Keycloak](infra/keycloak/README.md).

## Yêu cầu

- Docker Engine đang chạy và Docker Compose v2 (lệnh `docker compose`).
- Có thể tải image Node 24, PostgreSQL 17, Keycloak 26.8.2 và APISIX 3.13.0 từ registry, cũng
  như npm packages trong lần build đầu. Dự trù vài GB dung lượng trống; cổng
  3000/3001/8080 rảnh.
- Nếu chạy app ngoài container: Node.js 24 và npm (mỗi app có `package-lock.json`).

## Chạy từ bản clone sạch

```sh
cp .env.example .env
# Thay các giá trị password mẫu trong .env bằng mật khẩu riêng cho máy của bạn.
docker compose up --build --wait
```

- Web: <http://localhost:3000> — phải hiện `API and database: connected`.
- Gateway: <http://localhost:3001/health> — chuyển tới API và trả `{"status":"ok","database":"ok"}`.
- Keycloak: <http://localhost:8080> — realm development là `digix`.
- DB chỉ mở trong mạng Compose (không công bố cổng 5432 ra máy host).
- Đổi `WEB_PORT`/`GATEWAY_PORT`/`KEYCLOAK_PORT` trong `.env` nếu cổng host bị chiếm.

APISIX chạy standalone từ `infra/apisix/config.yaml` và `apisix.yaml`, không mở
Admin API hay etcd. API không publish cổng host; `3001` là cổng Gateway. Keycloak
vẫn phục vụ đăng nhập OIDC trực tiếp. Keycloak dùng backchannel động: issuer
trong token giữ `localhost:8080`, còn JWKS từ Compose truy cập qua `keycloak:8080`.
APISIX kiểm JWT trước khi proxy `/v1/*`; NestJS **kiểm lại** JWT, membership,
tenant và role. `GATEWAY_OIDC_CLIENT_SECRET` trong `.env` là giá trị local ngẫu
nhiên APISIX 3.13 yêu cầu trong schema, **không dùng** trong chế độ bearer/JWKS
(không dùng introspection). Đây là cấu hình HTTP chỉ dùng trên máy local, **không
đưa ra Internet** khi chưa bổ sung TLS và chính sách bảo mật tương ứng.

Kiểm tra đường đi Gateway sau khi Compose khởi động:

```sh
sh infra/apisix/smoke-test.sh
```

Script kiểm tra `/health`, request thiếu/sai Bearer token bị **APISIX** từ chối ở `/v1/me`,
đường dẫn không được định tuyến và trang Web `/status` gọi API qua Gateway.
Có thể truyền `ACCESS_TOKEN` hợp lệ (không
ghi token vào log/repo) để script kiểm tra thêm `GET /v1/me` trả `200` qua
Gateway. `429` có thể xuất hiện khi vượt 10 request/giây trên `/v1/*`
(burst 20 theo IP). Đã kiểm chứng local bằng token Keycloak hợp lệ trả `200`,
token đúng chữ ký nhưng sai audience bị APISIX từ chối `403`, chữ ký bị sửa
bị từ chối `401`. Chưa cấu hình TLS, metrics/tracing hoặc chính sách production.

Kiểm tra DB trực tiếp mà không cần cài `psql` trên máy:

```sh
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1"'
docker compose ps
docker compose logs --tail=100 gateway api web db
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
apps/web/          Next.js; trang status/dashboard gọi Gateway bằng API_INTERNAL_URL nội bộ
infra/apisix/      APISIX standalone, chỉ định tuyến /health và /v1/*
infra/keycloak/    Realm OIDC development có version và hướng dẫn kiểm chứng
compose.yaml       DB, Keycloak, API, Gateway, Web + healthcheck/depends_on
.env.example       Chỉ là ví dụ; .env thật được git bỏ qua
docs/              SRS, roadmap, ERD và tài liệu thiết kế
```

Không đưa secret thật vào `.env.example`, source, ảnh log hoặc commit. Cấu
hình cổng host chỉ bind `127.0.0.1`; môi trường này **không** dành cho public
Internet. Khi `docker compose` báo không kết nối được daemon, hãy bật Docker
Engine; khi Web hiện “unavailable”, xem `docker compose ps`/`logs` rồi kiểm
tra `http://localhost:3001/health`. Một phản hồi HTTP 503 nghĩa là API đang
chạy nhưng chưa kết nối được DB; kiểm `.env` và trạng thái DB trước.
