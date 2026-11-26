# Báo cáo đối chiếu Client F00–F02 với API thật (Gateway & Backend)

**Mã việc:** WEB-F00-02b  
**Ngày thực hiện:** 27/11/2026 (Cập nhật sau khi gộp `main` mới nhất chứa PR #70 `CatalogController`)  
**Môi trường:** Docker Compose Dev (`http://localhost:3001` qua APISIX Gateway, NestJS API & Keycloak SSO)  
**Tài khoản thử nghiệm:** `dung.demo@example.test` (Tenant: `tenant_alpha`, Roles: `designer`, `employee`, `manager`)  
**Tệp dữ liệu mẫu sống:** `apps/web/lib/app-config/__fixtures__/catalog-api-2026-11-27.json`

---

## 1. Mục tiêu đối chiếu
Kiểm tra thực tế kết nối giữa client `apps/web/lib/app-config` với Gateway API thật (`http://localhost:3001`), xác nhận mức độ tương thích hợp đồng dữ liệu giữa mock frontend và backend NestJS thực tế, cập nhật bảng đối chiếu từng trường và làm rõ các khoảng trống backend thật sự còn thiếu đối với kiến trúc v2.5.

---

## 2. Kết quả gọi API thực tế qua Gateway

| Endpoint | Phương thức | Trạng thái HTTP | Đánh giá hiện trạng |
| :--- | :--- | :--- | :--- |
| `/v1/me` | `GET` | **200 OK** | **Hoạt động chuẩn xác.** Trả về đúng thông tin user, danh sách memberships, tenant và roles (`designer`). |
| `/v1/catalog/features` | `GET` | **200 OK** | **Đã triển khai hoàn chỉnh.** `CatalogController` có `@TenantScoped()`, trả về đúng 5 module tính năng (ERP & CRM) với định dạng quyền 4 đoạn `<featureId>.<resource>.<action>`. |
| `/v1/catalog/presets` | `GET` | **200 OK** | **Đã triển khai hoàn chỉnh.** Trả về đúng 3 mẫu xuất phát (`erp`, `crm`, `blank`) kèm mảng `suggestedFeatures`. |
| `/v1/apps` | `POST` (payload v2.5) | **400 Bad Request** | **Chưa hỗ trợ v2.5.** Backend chỉ nhận schema v1 cũ (bắt buộc `goal`, từ chối `schemaVersion` và `startingPoint`). |

---

## 3. Bảng đối chiếu chi tiết từng trường Mock ↔ API thật

### 3.1. Danh mục tính năng (`GET /v1/catalog/features`)

| Trường dữ liệu | Kiểu dữ liệu thật | Giá trị Mock (`catalog-mock.ts`) | Giá trị API thật (`/v1/catalog/features`) | Trạng thái khớp | Nhận xét & Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `catalogVersion` | `string` | `"2026-11-v2.5-demo"` | `"2026-11-demo-1"` | **Tương thích** | Kiểu chuỗi phiên bản danh mục hợp lệ. |
| `features[].id` | `string` | 5 IDs (`erp.materials`, `erp.purchase_requests`, `erp.inventory`, `crm.customers`, `crm.opportunities`) | 5 IDs tương tự | **Khớp 100%** | Danh sách 5 tính năng cơ bản hoàn toàn trùng khớp. |
| `features[].version` | `number` | `1` | `1` | **Khớp 100%** | Phiên bản tính năng khởi tạo = 1. |
| `features[].domain` | `string` | `"erp" \| "crm"` | `"erp" \| "crm"` | **Khớp 100%** | Phân nhóm nghiệp vụ đồng nhất. |
| `features[].dependencies` | `string[]` | Mảng string rỗng hoặc chứa `["erp.materials"]`, `["crm.customers"]` | Hoàn toàn giống mock | **Khớp 100%** | Cây phụ thuộc logic nghiệp vụ hoàn toàn khớp. |
| `features[].resources` | `string[]` | `["materials"]`, `["requests"]`,... | `["materials"]`, `["requests"]`,... | **Khớp 100%** | Danh sách tài nguyên thuộc tính năng khớp nhau. |
| `features[].actions` | `FeatureAction[]` | Danh sách `{ resource, action, permission }` | Danh sách tương tự | **Khớp 100%** | Cấu trúc hành động từng tài nguyên trùng khớp. |
| `features[].permissions` | `string[]` | Định dạng 4 đoạn: `<featureId>.<resource>.<action>` | Định dạng 4 đoạn: `<featureId>.<resource>.<action>` | **Khớp 100%** | Ví dụ: `erp.materials.materials.create`, `erp.purchase_requests.requests.approve`. Chuẩn phân quyền mới hoàn toàn đồng bộ. |
| `features[].components` | `string[]` | `["form", "table", "detail", "action"]` | Hoàn toàn giống mock | **Khớp 100%** | Các khối giao diện được phép dùng cho từng tính năng khớp nhau. |
| `features[].status` | `string` | `"supported"` | `"supported"` | **Khớp 100%** | Trạng thái tính năng sẵn sàng phục vụ. |
| `features[].label`, `description` | `string?` | Có nhãn tiếng Việt trên mock | API không trả nhãn (chỉ có schema kỹ thuật) | **Tương thích** | Frontend tự động ánh xạ nhãn tiếng Việt qua bảng từ điển `feature-labels.ts` (`feat.label \|\| getFeatureLabel(feat.id)`). |

### 3.2. Mẫu dựng sẵn (`GET /v1/catalog/presets`)

| Trường dữ liệu | Kiểu dữ liệu thật | Giá trị Mock | Giá trị API thật | Trạng thái khớp | Nhận xét & Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `catalogVersion` | `string` | `"2026-11-v2.5-demo"` | `"2026-11-demo-1"` | **Tương thích** | Đồng bộ phiên bản danh mục. |
| `presets[].id` | `string` | `"erp"`, `"crm"`, `"blank"` | `"erp"`, `"crm"`, `"blank"` | **Khớp 100%** | 3 lối vào khởi tạo tiêu chuẩn. |
| `presets[].version` | `number` | `1` | `1` | **Khớp 100%** | Phiên bản preset = 1. |
| `presets[].suggestedFeatures` | `string[]` | ERP: 3 modules, CRM: 2 modules, Blank: 0 module | Hoàn toàn giống mock | **Khớp 100%** | Danh sách tính năng gợi ý ban đầu trùng khớp. |

---

## 4. Xử lý trên Frontend Client (`apps/web/lib/app-config`)

1. **Kết nối trực tiếp API Catalog thật:**
   - Khi chạy ở chế độ API (`APP_CONFIG_API_MODE=api`), client gọi trực tiếp `GET /v1/catalog/features` và `GET /v1/catalog/presets` thông qua Gateway APISIX với header xác thực `Authorization: Bearer <token>` và `X-Tenant-Id: <tenantId>`.
   - Cả hai endpoint đều trả về HTTP 200 OK. Frontend render đầy đủ danh mục tính năng và các lối vào xuất phát từ dữ liệu backend thực tế.
2. **Cơ chế Fallback an toàn (Graceful Degradation):**
   - Giữ cơ chế bắt lỗi `ApiError` 404: nếu trong tương lai endpoint bảo trì hoặc gặp lỗi định tuyến, client tự động fallback sang `catalog-mock` để tránh sập trang (crash UI).
3. **Dịch lỗi chi tiết khi tạo ứng dụng (`actions.ts` & `errors.ts`):**
   - Khi người dùng hoàn thành wizard và bấm "Lưu bản nháp", client gửi request `POST /v1/apps`.
   - Backend hiện tại trả về `400 INVALID_APP_INPUT` do chưa nhận schema v2.5 (`/schemaVersion`, `/startingPoint`, bắt buộc `/goal`).
   - Frontend bắt lỗi và hiển thị rõ ràng thông báo tiếng Việt:  
     *"Thông tin ứng dụng chưa hợp lệ: Phiên bản schema (Property is not allowed.); Điểm xuất phát (Property is not allowed.); Mục tiêu quy trình (goal must be a non-empty string.) (Backend hiện tại chưa hỗ trợ cấu trúc ứng dụng v2.5; cần cập nhật API backend)."*

---

## 5. Khoảng trống backend (Action Items cho Team Backend)

Backend đã có `CatalogController` hoàn chỉnh. Các khoảng trống thật sự còn thiếu để hoàn thiện luồng ứng dụng v2.5 gồm:

### 5.1. Nâng cấp `POST /v1/apps` chấp nhận Schema v2.5
- **Hiện trạng:** DTO backend chỉ nhận schema v1 (bắt buộc `goal`, cấm `schemaVersion`, `startingPoint`).
- **Yêu cầu:** Chấp nhận payload tạo ứng dụng v2.5:
  - **Request Body:**
    ```json
    {
      "schemaVersion": "2.5",
      "name": "Ứng dụng Mua sắm & Vật tư",
      "appKey": "ung_dung_mua_sam_vat_tu",
      "startingPoint": "erp"
    }
    ```
  - **Cho phép:** `goal` là tùy chọn (optional) đối với schema v2.5.
  - **Response Body kỳ vọng (HTTP 201 Created):**
    ```json
    {
      "appId": "c5f87b32-9b6e-4c7a-b924-1f7c32d84a1e",
      "appKey": "ung_dung_mua_sam_vat_tu",
      "schemaVersion": "2.5",
      "lockVersion": 1,
      "createdAt": "2026-11-27T00:30:00.000Z"
    }
    ```

### 5.2. Nâng cấp `PATCH /v1/apps/:appId/drafts/:version` lưu tính năng đã chọn
- **Hiện trạng:** Backend mới hỗ trợ patch schema v1.
- **Yêu cầu:** Cho phép lưu danh sách module tính năng mà người dùng đã chọn ở Bước 2 của Wizard:
  - **Request Body:**
    ```json
    {
      "lockVersion": 1,
      "features": [
        { "id": "erp.materials", "version": 1 },
        { "id": "erp.purchase_requests", "version": 1 }
      ]
    }
    ```
  - **Response Body kỳ vọng (HTTP 200 OK):**
    ```json
    {
      "appId": "c5f87b32-9b6e-4c7a-b924-1f7c32d84a1e",
      "version": 1,
      "lockVersion": 2,
      "features": [
        { "id": "erp.materials", "version": 1 },
        { "id": "erp.purchase_requests", "version": 1 }
      ]
    }
    ```

### 5.3. Bổ sung Endpoint `GET /v1/apps` (Danh sách ứng dụng doanh nghiệp)
- **Hiện trạng:** Controller mới chỉ có `GET /v1/apps/:appId/drafts/:version`, chưa có route lấy danh sách toàn bộ app của tenant.
- **Yêu cầu:** Cung cấp `GET /v1/apps` với header `X-Tenant-Id`.
  - **Response Body kỳ vọng (HTTP 200 OK):**
    ```json
    [
      {
        "id": "c5f87b32-9b6e-4c7a-b924-1f7c32d84a1e",
        "name": "Ứng dụng Mua sắm & Vật tư",
        "appKey": "ung_dung_mua_sam_vat_tu",
        "schemaVersion": "2.5",
        "status": "draft",
        "updatedAt": "2026-11-27T00:30:00.000Z"
      }
    ]
    ```

### 5.4. Endpoint Runtime cho Ứng dụng đã Xuất bản
- Cung cấp `GET /v1/apps/:appKey/runtime` hoặc `GET /v1/apps/:appId/published` trả về cấu hình xuất bản v2.5 (`publishedAppConfig`) để `AppRenderer` hiển thị và thực thi giao diện thật thay vì đọc fixture mẫu.
