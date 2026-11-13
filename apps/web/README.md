# DigiX Web

Frontend DigiX dùng Next.js, React, TypeScript và Tailwind CSS. Đăng nhập đi qua Auth.js và Keycloak; dashboard gọi `GET /v1/me` qua APISIX Gateway để lấy người dùng và membership từ API NestJS.

Hướng dẫn chính dưới đây chạy **toàn bộ hệ thống bằng Docker Compose** trên máy local. Không cần cài Node.js để chạy web theo cách này. Cần Docker Desktop, Docker Compose v2, kết nối mạng cho lần tải image/package đầu và các cổng 3000, 3001, 8080 còn trống.

## Chạy lần đầu trên máy mới

Mở PowerShell tại **thư mục gốc repo** `open-digix`:

```powershell
Copy-Item .env.example .env
```

Mở `.env` và thay mọi mật khẩu mẫu bằng giá trị riêng cho máy. Thêm các biến frontend sau nếu file mẫu chưa có:

```env
AUTH_SECRET=<chuoi-ngau-nhien-rieng>
AUTH_URL=http://localhost:3000
AUTH_KEYCLOAK_ID=digix-web
AUTH_KEYCLOAK_ISSUER=http://localhost:8080/realms/digix
AUTH_KEYCLOAK_INTERNAL_URL=http://keycloak:8080
AUTH_TRUST_HOST=true
```

`GATEWAY_OIDC_CLIENT_SECRET` cũng phải có giá trị local riêng trong `.env`. Tạo một chuỗi cho từng secret bằng PowerShell:

```powershell
[Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
```

Không dùng cùng một giá trị cho các secret. `digix-web` là public client nên không cần `AUTH_KEYCLOAK_SECRET`. Không commit `.env`, `apps/web/.env.local`, mật khẩu hoặc token.

Kiểm tra cấu hình, rồi khởi động tất cả dịch vụ:

```powershell
docker compose config --quiet
docker compose up --build --wait
```

Web mở tại <http://localhost:3000>; Gateway tại <http://localhost:3001>; Keycloak tại <http://localhost:8080>. Nếu trước đó có `npm run dev` đang dùng cổng 3000, dừng nó bằng `Ctrl+C`. Không chạy hai bản web cùng lúc.

### Tạo tài khoản demo

Nếu cần đăng nhập bằng tài khoản demo, đặt `DEMO_USER_PASSWORD` riêng trong `.env`, rồi chạy **một lần**:

```powershell
docker compose --profile demo run --rm auth-demo-seed
```

Tên đăng nhập nằm ở `DEMO_USER_USERNAME` (mặc định trong file mẫu là `dung.demo`); mật khẩu là giá trị vừa đặt trong `DEMO_USER_PASSWORD`. Seed tạo hoặc cập nhật người dùng Keycloak và liên kết identity, membership trong PostgreSQL. Chạy lại seed sẽ đặt lại mật khẩu demo theo `.env`.

## Những lần chạy sau

Khi `.env` và dữ liệu demo đã có, khởi động bằng:

```powershell
docker compose up --build --wait
```

Dừng bằng `docker compose down`. Volume giữ dữ liệu khi dừng; tránh `docker compose down -v` nếu không chủ ý xóa dữ liệu local.

## Các trang và luồng đăng nhập

- `/`: trang giới thiệu DigiX.
- `/login`: mở giao diện đăng nhập. Nút tiếp tục đưa trình duyệt sang Keycloak.
- `/register`: thông báo cách xin cấp tài khoản; realm hiện tắt tự đăng ký.
- `/dashboard`: yêu cầu phiên đăng nhập; gọi `/v1/me` qua Gateway. Các số liệu nghiệp vụ hiện vẫn là dữ liệu mẫu.
- `/status`: kiểm tra đường đi từ web đến Gateway/API/database.

Luồng: trình duyệt mở Keycloak tại `localhost:8080` → Keycloak đưa người dùng về callback của Auth.js → server web dùng địa chỉ nội bộ `keycloak:8080` để đổi authorization code lấy token → dashboard gửi access token qua Gateway → API kiểm tra danh tính và membership. `AUTH_KEYCLOAK_ISSUER` phải giữ issuer công khai `localhost:8080`, còn `AUTH_KEYCLOAK_INTERNAL_URL` là địa chỉ chỉ container truy cập.

Để kiểm tra, đăng nhập bằng tài khoản demo rồi xem tên người dùng và doanh nghiệp trên dashboard. Bấm **Đăng xuất** và mở trực tiếp `/dashboard`: ứng dụng phải yêu cầu đăng nhập lại. Phiên SSO Keycloak có thể còn hiệu lực nên lần đăng nhập kế tiếp có thể không hỏi lại mật khẩu. Access token hiện chưa được tự làm mới.

## Kiểm tra và xử lý lỗi

Chạy tại gốc repo:

```powershell
docker compose ps
docker compose logs --tail=100 web keycloak gateway api
```

- **Compose báo thiếu biến:** kiểm tra tên biến trong `.env`, đặc biệt `AUTH_SECRET` và `GATEWAY_OIDC_CLIENT_SECRET`; chạy lại `docker compose config --quiet`.
- **Trang đăng nhập báo lỗi cấu hình:** kiểm tra `http://localhost:3000/api/auth/providers` có trả JSON và xem log service `web`.
- **`localhost:3000` khác `127.0.0.1:3000`:** có thể còn một `npm run dev` cũ chiếm cổng 3000; dừng tiến trình đó.
- **Keycloak từ chối redirect:** dùng đúng cổng 3000 hoặc cập nhật redirect URI/web origin của client `digix-web`. Realm đã tồn tại trong database không tự cập nhật khi sửa file import.
- **Đăng nhập được nhưng API trả 403:** kiểm tra đã chạy seed và dùng đúng tài khoản có membership.
- **Web báo không kết nối được API:** xem trạng thái `gateway` và `api`, rồi thử `http://localhost:3001/health`.

Để kiểm tra mã nguồn riêng, chạy `npm ci`, `npm run lint` và `npm run build` trong `apps/web`. Xem thêm [README dự án](../../README.md) và [hướng dẫn Keycloak](../../infra/keycloak/README.md).
