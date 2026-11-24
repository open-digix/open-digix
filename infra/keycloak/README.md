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
- Discovery từ container Gateway/API vẫn công bố issuer `localhost:8080`, nhưng
  `jwks_uri` backchannel trỏ `keycloak:8080` nhờ `KC_HOSTNAME_BACKCHANNEL_DYNAMIC`.
  Điều này cho phép APISIX xác minh JWT bằng JWKS mà không thay issuer công khai.

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

## Tạo dữ liệu đăng nhập demo

Profile `demo` cung cấp một bước seed tùy chọn để kiểm thử tích hợp. Điền các
biến `DEMO_*` trong `.env`, dùng email `.test` và mật khẩu chỉ dành cho máy
local, sau đó chạy:

```sh
docker compose --profile demo run --rm auth-demo-seed
```

Lệnh này chạy migration, tạo hoặc cập nhật user synthetic trong Keycloak, rồi
liên kết `sub` của user với identity, membership và các role `employee`,
`manager` trong PostgreSQL. Lệnh có tính lặp lại an toàn; chạy lại không tạo bản
ghi trùng. Nó cũng tạo `tenant_beta` nhưng không cấp membership để kiểm tra
trường hợp truy cập tenant bị từ chối.

Service seed không chạy trong `docker compose up` thông thường. Không dùng tài
khoản hoặc mật khẩu thật, và không commit `.env`.

## Giao diện đăng nhập (KC-01)

Theme đăng nhập `digix` được cấu hình tại `infra/keycloak/themes/digix/login`:
- Kế thừa từ `parent=base` nhằm tránh xung đột với PatternFly 5 CSS của Keycloak v2.
- Giao diện đáp ứng: Bố cục 2 cột chia đôi theo mẫu B ở máy tính (≥ 900px), thẻ kính mờ theo mẫu F ở điện thoại (< 900px).
- Font chữ: Tự host font **Be Vietnam Pro** từ package npm `@fontsource/be-vietnam-pro` phiên bản `5.3.0` (giấy phép SIL Open Font License 1.1) gồm 4 độ đậm (400, 500, 600, 700) và 3 subset (`vietnamese`, `latin`, `latin-ext`), kèm tệp giấy phép `OFL.txt`. Tuyệt đối không gọi tài nguyên ra bên ngoài (Google Fonts).
- Ngôn ngữ: Hỗ trợ tiếng Việt (`vi`) là ngôn ngữ mặc định, không hiển thị bộ chọn ngôn ngữ.

### Áp dụng theme cho realm đang chạy trên máy local

Khi database Keycloak đã tồn tại, cờ `--import-realm` không ghi đè cấu hình realm `digix`. Để áp dụng theme mà không xóa volume dữ liệu:

1. **Cách 1: Dùng lệnh kcadm.sh bên trong container**
   ```sh
   docker compose exec keycloak sh -c '/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" && /opt/keycloak/bin/kcadm.sh update realms/digix -s loginTheme=digix -s internationalizationEnabled=true -s "supportedLocales=[\"vi\"]" -s defaultLocale=vi'
   ```
   *Lưu ý*: Lệnh sử dụng trực tiếp biến môi trường `$KC_BOOTSTRAP_ADMIN_USERNAME` và `$KC_BOOTSTRAP_ADMIN_PASSWORD` sẵn có trong container, không truyền mật khẩu qua host CLI hay in mật khẩu ra log.

2. **Cách 2: Qua Web Admin Console**
   - Truy cập <http://localhost:8080/admin/>
   - Chọn realm `digix`
   - Vào **Realm settings**:
     - Tab **Themes**: Chọn **Login theme** = `digix` -> Bấm Save.
     - Tab **Localization**: Bật toggle **Internationalization** = ON, chọn **Supported locales** = `vi`, đặt **Default locale** = `vi` -> Bấm Save.

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
