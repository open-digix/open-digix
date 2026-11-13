# DigiX Web

Frontend DigiX dùng Next.js, React, TypeScript và Tailwind CSS. Trong môi trường phát triển local, ứng dụng dùng Auth.js để đăng nhập qua Keycloak và gọi API NestJS để lấy thông tin người dùng.

Hướng dẫn dưới đây chạy **web trên máy**, còn PostgreSQL, Keycloak, Gateway và API chạy bằng Docker Compose. Cấu hình này chỉ dành cho phát triển local.

## Yêu cầu

- Node.js 24 và npm.
- Docker Desktop đang chạy, có Docker Compose v2.
- Các cổng 3000, 3001 và 8080 khả dụng.

## 1. Chuẩn bị dịch vụ và tài khoản demo

Mở PowerShell tại thư mục gốc repo `open-digix`. Nếu chưa có `.env`, tạo từ file mẫu:

```powershell
Copy-Item .env.example .env
```

Mở `.env`, thay các mật khẩu mẫu bằng giá trị chỉ dùng cho local và cấu hình các biến `DEMO_*`. Sau đó chạy:

```powershell
docker compose up -d --build --wait db keycloak api gateway
docker compose --profile demo run --rm auth-demo-seed
```

Seed tạo hoặc cập nhật tài khoản synthetic trong Keycloak và gán identity, membership mẫu trong database. Tên đăng nhập và mật khẩu demo lấy từ `DEMO_USER_USERNAME` và `DEMO_USER_PASSWORD` trong `.env`. **Chạy lại seed sẽ đặt lại mật khẩu của tài khoản demo** theo giá trị hiện tại trong file này.

Nếu service `web` của Compose đang chiếm cổng 3000, dừng riêng service đó trước khi chạy web trên máy:

```powershell
docker compose stop web
```

Xem thêm [hướng dẫn Keycloak](../../infra/keycloak/README.md) và [README của dự án](../../README.md).

## 2. Cấu hình frontend

Tạo file `apps/web/.env.local` với các biến sau:

```env
AUTH_SECRET=<chuoi-ngau-nhien-rieng>
AUTH_URL=http://localhost:3000
AUTH_KEYCLOAK_ID=digix-web
AUTH_KEYCLOAK_ISSUER=http://localhost:8080/realms/digix
API_INTERNAL_URL=http://localhost:3001
```

Tạo giá trị ngẫu nhiên cho `AUTH_SECRET` bằng lệnh sau và chép kết quả vào file:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Client `digix-web` trong cấu hình local là public client. Không commit file `.env`, `.env.local`, mật khẩu, secret hoặc token. Khởi động lại web sau khi thay đổi biến môi trường.
`API_INTERNAL_URL` trỏ tới APISIX trên cổng `GATEWAY_PORT` (mặc định 3001), không phải NestJS. Nếu web cũng chạy trong Compose, địa chỉ nội bộ được đặt tự động là `http://gateway:9080`.

Nếu đổi cổng web hoặc Keycloak, phải cập nhật URL và cấu hình redirect/origin của client Keycloak cho khớp. Realm đã tồn tại trong database sẽ không tự cập nhật khi sửa file import.

## 3. Chạy frontend

Từ thư mục `apps/web`:

```powershell
npm ci
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Các trang chính:

- `/`: trang giới thiệu DigiX.
- `/login`: hộp thoại đăng nhập.
- `/register`: thông báo về việc cấp tài khoản; tự đăng ký hiện chưa bật.
- `/dashboard`: trang tổng quan cần phiên đăng nhập; số liệu đang là dữ liệu mẫu.
- `/status`: kiểm tra kết nối web, API và database.

## 4. Kiểm tra đăng nhập

1. Truy cập trang chủ và chọn **Đăng nhập**. Trang sẽ chuyển sang Keycloak.
2. Đăng nhập bằng tài khoản demo đã seed. Sau callback, ứng dụng gọi `GET /v1/me` và hiển thị thông tin tài khoản trên dashboard.
3. Bấm **Đăng xuất**, sau đó truy cập trực tiếp `/dashboard`: ứng dụng phải yêu cầu đăng nhập lại.
4. Kiểm tra trường hợp chưa đăng nhập bằng cửa sổ trình duyệt ẩn danh.

Phiên Keycloak có thể vẫn còn sau khi đăng xuất khỏi ứng dụng, vì vậy lần đăng nhập tiếp theo có thể không yêu cầu nhập lại mật khẩu. Hiện chưa có tự làm mới access token; khi token không còn hợp lệ cần đăng nhập lại. Một tài khoản Keycloak cũng cần identity và membership tương ứng trong DigiX để API nhận diện và cấp quyền.

## 5. Kiểm tra mã

Chạy trong `apps/web`:

```powershell
npm run lint
npm run build
```

## Xử lý sự cố

- **`MissingSecret`:** kiểm tra `AUTH_SECRET` trong `apps/web/.env.local`, lưu file và khởi động lại web.
- **`/api/auth/providers` trả 404:** kiểm tra route `app/api/auth/[...nextauth]/route.ts` và khởi động lại web.
- **Keycloak báo redirect URI không hợp lệ:** kiểm tra URL và cấu hình client `digix-web`; xem hướng dẫn Keycloak ở trên.
- **Không kết nối được API:** kiểm tra `docker compose ps` ở thư mục gốc và mở `http://localhost:3001/health` qua Gateway.
- **Đăng nhập được nhưng không có quyền:** kiểm tra tài khoản demo đã được seed và có membership đang hoạt động.
