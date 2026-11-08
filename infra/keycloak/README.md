# Keycloak development setup

Cấu hình này cung cấp Identity/SSO cho môi trường phát triển DigiX bằng image
Keycloak được ghim phiên bản. Đây là cấu hình `start-dev`, chỉ bind vào
`127.0.0.1` và không dành cho Internet hoặc production.

## Mô hình định danh

- Một Keycloak realm `digix` quản lý đăng nhập và danh tính toàn nền tảng.
- `digix-web` là public OIDC client dùng Authorization Code flow với PKCE S256.
- `digix-api` là audience/resource server của NestJS và không có login flow.
- Keycloak xác định người dùng bằng các claim chuẩn `iss` và `sub`.
- Tenant membership, tenant role và permission có nguồn chân lý tại PostgreSQL
  nghiệp vụ, không phải Keycloak.

Không tạo một Keycloak realm cho mỗi tenant nghiệp vụ. Một danh tính có thể có
membership trong nhiều tenant; NestJS sẽ resolve `(iss, sub)` và kiểm tra
membership đang hoạt động trong PostgreSQL.

## Khởi động

Tạo `.env` từ `.env.example` và thay toàn bộ password mẫu bằng giá trị local
riêng. Không commit `.env`, token, client secret hoặc mật khẩu thật.

```sh
docker compose up -d --wait keycloak
```

Các địa chỉ mặc định:

- Admin Console: <http://localhost:8080/admin/>
- Realm: `digix`
- Issuer: <http://localhost:8080/realms/digix>
- Discovery: <http://localhost:8080/realms/digix/.well-known/openid-configuration>
- JWKS từ máy host: <http://localhost:8080/realms/digix/protocol/openid-connect/certs>
- JWKS từ container API: `http://keycloak:8080/realms/digix/protocol/openid-connect/certs`

Realm development mặc định cho phép redirect và web origin tại
`http://localhost:3000`. Nếu đổi `WEB_PORT`, phải cập nhật đồng thời cấu hình
client `digix-web`; chỉ đổi biến Compose sẽ làm OIDC redirect bị từ chối.

Tài khoản bootstrap admin dùng `KEYCLOAK_ADMIN` và
`KEYCLOAK_ADMIN_PASSWORD` trong `.env`. Keycloak đánh dấu đây là tài khoản
bootstrap tạm thời; môi trường dùng chung hoặc public phải có quy trình quản trị
và secret phù hợp trước khi triển khai.

## Cấu hình có version

[`digix-realm.json`](digix-realm.json) được mount read-only vào
`/opt/keycloak/data/import`; `--import-realm` import file khi database Keycloak
chưa có realm `digix`. Nếu realm đã tồn tại, Keycloak giữ trạng thái database và
bỏ qua import để tránh ghi đè. Vì vậy thay đổi JSON phải được review như cấu
hình hạ tầng và kiểm chứng trên database Keycloak mới trước khi merge.

Không thêm user password, admin credential, token hoặc client secret vào realm
JSON. Tài khoản demo phải dùng dữ liệu synthetic và credential được cấp ngoài
Git.

## Kiểm chứng

```sh
docker compose ps keycloak keycloak-db
docker compose logs --tail=100 keycloak
```

Một setup hợp lệ phải thỏa mãn:

1. `keycloak-db` và `keycloak` ở trạng thái `healthy`.
2. Discovery trả issuer `http://localhost:8080/realms/digix`.
3. `digix-web` bật standard flow, tắt implicit/direct grant và yêu cầu PKCE S256.
4. Access token của `digix-web` có audience `digix-api`.
5. `digix-api` là bearer-only client và không cung cấp login flow.

Keycloak được phát hành theo Apache License 2.0. Phiên bản image phải tiếp tục
được ghi rõ và kiểm tra trong danh mục dependency/license của bản phát hành.
