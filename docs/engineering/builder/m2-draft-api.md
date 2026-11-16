# DigiX Builder — Hướng dẫn tích hợp API M2 (Dành cho Tú - Frontend)

Tài liệu đặc tả chi tiết các API của Builder Draft (Milestone M2) để tích hợp giao diện thiết kế quy trình (Canvas/Form Builder).

---

## 1. Tổng quan luồng thiết kế (End-to-End Workflow)

```
[BƯỚC 1: Tạo App] ──────> [BƯỚC 2: Nhập nguồn] ──────> [BƯỚC 3: Normalize]
POST /v1/apps             POST /descriptions          POST /drafts/1/normalize
(Khởi tạo app & draft v1) (Lưu văn bản phân đoạn)      (Sinh manifest & mapping sơ bộ)
                                                                 │
                                                                 ▼
[BƯỚC 5: Validate] <───── [BƯỚC 4: Vẽ & Chỉnh sửa trên UI] <──────┘
POST /drafts/1/validate   GET /drafts/1 & PATCH /drafts/1
(Kiểm tra schema/semantic (Hiển thị canvas, mapping nguồn,
 trước khi publish)        lưu thay đổi với optimistic lock)
```

---

## 2. Thông tin chung & Phân quyền (Authentication & Authorization)

Mọi request từ Frontend đều cần gửi kèm:
- Header `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- Header `X-Tenant-Slug: <tenant-slug>` (hoặc cookie tenant tương ứng)

### Phân quyền các Role trong Builder:
- **`tenant_admin`**: Toàn quyền cấu hình, tạo, sửa, đọc và validate.
- **`designer`**: Toàn quyền thiết kế (tạo app, lưu mô tả nguồn, normalize, sửa draft, validate).
- **`publisher`**: **Chỉ đọc** (`GET /drafts/:version`) và **Validate** (`POST /drafts/:version/validate`). Không được tạo hoặc sửa đổi draft (`PATCH` trả về `403`).
- **User thường / Thiếu role**: Nhận lỗi `403 Forbidden`.

---

## 3. Chi tiết từng Endpoint

### 3.1. Tạo Application mới (và sinh bản nháp Version 1)
- **Method & Path:** `POST /v1/apps`
- **Roles:** `designer`, `tenant_admin`
- **Request Body:**
```json
{
  "appKey": "purchase-request",
  "name": "Đề nghị mua sắm",
  "goal": "Quy trình đề xuất mua thiết bị và phần mềm",
  "departmentRefs": ["IT", "FINANCE"]
}
```
*Ghi chú:* `appKey` chỉ gồm chữ thường, số, dấu gạch nối/dưới `^[a-z][a-z0-9_-]{1,63}$`.

- **Response:** `201 Created`
```json
{
  "appId": "8b5f3a02-1234-4b56-789a-0123456789ab",
  "appKey": "purchase-request",
  "name": "Đề nghị mua sắm",
  "status": "draft",
  "version": 1,
  "versionStatus": "draft",
  "lockVersion": 1
}
```
- **Mã lỗi:**
  - `400 Bad Request`: `INVALID_INPUT` (thiếu `appKey`, `name`, hoặc sai định dạng).
  - `403 Forbidden`: User không có role `designer` hoặc `tenant_admin`.
  - `409 Conflict`: `APP_KEY_CONFLICT` (`appKey` đã tồn tại trong tenant).

---

### 3.2. Lưu mô tả nguồn (Source Description)
Mỗi lần người dùng nhập hoặc sửa văn bản mô tả quy trình, gọi endpoint này để lưu trữ phiên bản nguồn mới. Mỗi lần gọi sẽ tạo một `sourceRevisionId` mới, không ghi đè lịch sử.

- **Method & Path:** `POST /v1/apps/:appId/descriptions`
- **Roles:** `designer`, `tenant_admin`
- **Request Body:**
```json
{
  "sections": {
    "goal": "Yêu cầu cấp phát laptop làm việc",
    "inputs": "device_name: string, required\nestimated_price: integer, required, min: 1, max: 50000000\nmanager_decision: enum, options: approved, rejected\ndirector_decision: enum, options: approved, rejected",
    "roles": "employee: Nhân viên\nmanager: Quản lý\ndirector: Giám đốc",
    "steps": "manager_review: manager, decisionField: manager_decision\ndirector_review: director, decisionField: director_decision",
    "branches": "manager_decision = rejected -> declined\nmanager_decision = approved AND estimated_price < 20000000 -> accepted\nmanager_decision = approved AND estimated_price >= 20000000 -> director_review\ndirector_decision = approved -> accepted\ndirector_decision = rejected -> declined",
    "outputs": "accepted: approved\ndeclined: rejected",
    "exceptions": "Nếu người yêu cầu không có quản lý trực tiếp thì chuyển lên HR."
  },
  "fileRefs": []
}
```

- **Response:** `201 Created`
```json
{
  "sourceRevisionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "revisionNo": 1,
  "segments": [
    {
      "id": "goal_1",
      "section": "goal",
      "text": "Yêu cầu cấp phát laptop làm việc"
    },
    {
      "id": "inputs_1",
      "section": "inputs",
      "text": "device_name: string, required..."
    }
  ],
  "createdAt": "2026-11-16T09:00:00.000Z"
}
```
- **Mã lỗi:**
  - `400 Bad Request`: `INVALID_INPUT` (không có trường nội dung nào hoặc `appId` không hợp lệ).
  - `403 Forbidden`: Thiếu quyền.
  - `404 Not Found`: `APP_NOT_FOUND`.

---

### 3.3. Chuẩn hóa mô tả nguồn thành Manifest nháp (Normalize)
Chuyển đổi văn bản mô tả thành manifest có cấu trúc (`roles`, `fields`, `steps`, `transitions`), sinh `sourceMappings` và ghi nhận `openIssues`. Cơ chế hoàn toàn deterministic, hoạt động ngay cả khi không có AI.

- **Method & Path:** `POST /v1/apps/:appId/drafts/:version/normalize`
- **Roles:** `designer`, `tenant_admin`
- **Request Body:**
```json
{
  "sourceRevisionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
*(Nếu bỏ trống `sourceRevisionId`, hệ thống tự lấy source revision mới nhất).*

- **Response:** `200 OK`
```json
{
  "revisionId": "6c4b4a11-8901-4def-a234-56789abcdef0",
  "revisionNo": 1,
  "lockVersion": 1,
  "snapshotChecksum": "a1b2c3d4e5f60718...",
  "definition": {
    "schemaVersion": "1.0",
    "appId": "purchase-request",
    "tenantId": "acme",
    "version": 1,
    "name": "Đề nghị mua sắm",
    "roles": ["employee", "manager", "director"],
    "fields": [
      { "id": "device_name", "type": "string", "required": true },
      { "id": "estimated_price", "type": "integer", "required": true, "min": 1, "max": 50000000 },
      { "id": "manager_decision", "type": "enum", "required": false, "options": ["approved", "rejected"] },
      { "id": "director_decision", "type": "enum", "required": false, "options": ["approved", "rejected"] }
    ],
    "steps": [
      { "id": "submitted", "type": "start" },
      { "id": "manager_review", "type": "task", "role": "manager", "decisionField": "manager_decision", "noSelfApproval": true },
      { "id": "manager_route", "type": "gateway" },
      { "id": "director_review", "type": "task", "role": "director", "decisionField": "director_decision", "noSelfApproval": true },
      { "id": "director_route", "type": "gateway" },
      { "id": "accepted", "type": "end", "endState": "approved" },
      { "id": "declined", "type": "end", "endState": "rejected" }
    ],
    "transitions": [
      { "from": "submitted", "to": "manager_review" },
      { "from": "manager_review", "to": "manager_route" },
      {
        "from": "manager_route",
        "to": "accepted",
        "when": {
          "all": [
            { "field": "manager_decision", "op": "eq", "value": "approved" },
            { "field": "estimated_price", "op": "lt", "value": 20000000 }
          ]
        }
      },
      {
        "from": "manager_route",
        "to": "director_review",
        "when": {
          "all": [
            { "field": "manager_decision", "op": "eq", "value": "approved" },
            { "field": "estimated_price", "op": "gte", "value": 20000000 }
          ]
        }
      },
      {
        "from": "manager_route",
        "to": "declined",
        "when": {
          "all": [
            { "field": "manager_decision", "op": "eq", "value": "rejected" }
          ]
        }
      },
      { "from": "director_review", "to": "director_route" },
      {
        "from": "director_route",
        "to": "accepted",
        "when": { "all": [{ "field": "director_decision", "op": "eq", "value": "approved" }] }
      },
      {
        "from": "director_route",
        "to": "declined",
        "when": { "all": [{ "field": "director_decision", "op": "eq", "value": "rejected" }] }
      }
    ]
  },
  "sourceMappings": [
    {
      "targetType": "step",
      "targetId": "manager_review",
      "sourceRevisionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "segmentIds": ["steps_1"]
    }
  ],
  "openIssues": [
    {
      "code": "UNHANDLED_EXCEPTION_NOTE",
      "message": "Unhandled exception in source description: Nếu người yêu cầu không có quản lý trực tiếp thì chuyển lên HR.",
      "blocking": false
    }
  ],
  "createdAt": "2026-11-16T09:05:00.000Z"
}
```
- **Mã lỗi:**
  - `400 Bad Request`: `SOURCE_REVISION_NOT_FOUND` hoặc `CANNOT_NORMALIZE_NON_DRAFT`.
  - `403 Forbidden`: Thiếu quyền.
  - `404 Not Found`: `APP_NOT_FOUND`.

---

### 3.4. Đọc chi tiết Draft hiện tại
Lấy toàn bộ manifest, mapping nguồn, open issues và `lockVersion` để hiển thị trên UI.

- **Method & Path:** `GET /v1/apps/:appId/drafts/:version`
- **Roles:** `designer`, `publisher`, `tenant_admin`
- **Response:** `200 OK`
```json
{
  "appId": "8b5f3a02-1234-4b56-789a-0123456789ab",
  "version": 1,
  "status": "draft",
  "lockVersion": 1,
  "revisionId": "6c4b4a11-8901-4def-a234-56789abcdef0",
  "revisionNo": 1,
  "snapshotChecksum": "a1b2c3d4e5f60718...",
  "definition": { ... },
  "sourceMappings": [ ... ],
  "openIssues": [ ... ],
  "createdAt": "2026-11-16T09:05:00.000Z"
}
```
- **Mã lỗi:**
  - `403 Forbidden`: Thiếu quyền.
  - `404 Not Found`: `APP_NOT_FOUND`.

---

### 3.5. Chỉnh sửa Draft (Lưu thủ công với Optimistic Locking)
Khi người dùng kéo thả node, sửa field, đổi role hoặc cập nhật điều kiện trên Canvas:

- **Method & Path:** `PATCH /v1/apps/:appId/drafts/:version`
- **Roles:** `designer`, `tenant_admin` (`publisher` sẽ nhận `403 Forbidden`).
- **Request Body:**
```json
{
  "lockVersion": 1,
  "definition": {
    "schemaVersion": "1.0",
    "appId": "purchase-request",
    "tenantId": "acme",
    "version": 1,
    "name": "Đề nghị mua sắm",
    "roles": ["employee", "manager", "finance"],
    "fields": [ ... ],
    "steps": [ ... ],
    "transitions": [ ... ]
  },
  "designMetadata": {
    "sourceMappings": [ ... ],
    "openIssues": [ ... ]
  }
}
```

- **Cơ chế Optimistic Locking:**
  - Frontend bắt buộc phải gửi đúng `lockVersion` hiện tại nhận được từ GET hoặc lần PATCH trước.
  - Nếu `lockVersion` trùng khớp: Backend lưu revision mới, tự động tăng `lockVersion` lên `+1`.
  - Nếu `lockVersion` không khớp (do có tab khác hoặc người khác vừa lưu): Backend trả `409 Conflict`.
- **Response:** `200 OK`
```json
{
  "revisionId": "f9012345-6789-4abc-def0-1234567890ab",
  "revisionNo": 2,
  "lockVersion": 2,
  "snapshotChecksum": "e3b0c44298fc1c14...",
  "createdAt": "2026-11-16T09:10:00.000Z"
}
```
- **Mã lỗi:**
  - `400 Bad Request`: `INVALID_INPUT` (thiếu `lockVersion`, sai kiểu dữ liệu).
  - `403 Forbidden`: `publisher` hoặc user không có role thiết kế.
  - `404 Not Found`: `APP_NOT_FOUND`.
  - `409 Conflict`: `VERSION_CONFLICT` — Draft đã bị sửa đổi bởi phiên khác. Frontend cần báo người dùng tải lại trang để tránh mất dữ liệu.

---

### 3.6. Validate Draft
Kiểm tra tính toàn vẹn (JSON Schema) và ngữ nghĩa luồng (Semantic Rules) trước khi gửi duyệt hoặc publish. API này **không** publish và **không** deploy sang Flowable engine.

- **Method & Path:** `POST /v1/apps/:appId/drafts/:version/validate`
- **Roles:** `designer`, `publisher`, `tenant_admin`
- **Request Body:** Không cần body (`{}`).
- **Response (Trường hợp có lỗi):** `200 OK`
```json
{
  "valid": false,
  "snapshotChecksum": "a1b2c3d4e5f60718...",
  "issues": [
    {
      "severity": "error",
      "code": "UNKNOWN_TASK_ROLE",
      "path": "/steps/1/role",
      "message": "Task 'manager_review' references unknown role 'director'.",
      "stepId": "manager_review"
    },
    {
      "severity": "error",
      "code": "MISSING_GATEWAY_BRANCH",
      "path": "/steps/2",
      "message": "Gateway 'manager_route' does not cover every valid input.",
      "stepId": "manager_route"
    }
  ]
}
```
- **Response (Trường hợp hợp lệ):** `200 OK`
```json
{
  "valid": true,
  "snapshotChecksum": "e3b0c44298fc1c14...",
  "issues": []
}
```

#### Các mã lỗi Semantic thông dụng cần xử lý trên UI:
| Mã lỗi | Vị trí (`path` / `stepId`) | Ý nghĩa hiển thị trên UI |
|---|---|---|
| `UNKNOWN_TASK_ROLE` | `/steps/:i/role` | Bước duyệt gán cho vai trò chưa được khai báo trong danh sách Roles. |
| `TASK_ROLE_REQUIRED` | `/steps/:i/role` | Bước duyệt (type `task`) chưa chọn vai trò phụ trách. |
| `UNKNOWN_DECISION_FIELD` | `/steps/:i/decisionField` | Trường quyết định không tồn tại trong danh mục Fields. |
| `INVALID_DECISION_FIELD_TYPE` | `/steps/:i/decisionField` | Trường quyết định phải có kiểu `enum` hoặc `boolean`. |
| `MISSING_GATEWAY_BRANCH` | `/steps/:i` | Gateway thiếu nhánh rẽ (không bao phủ hết mọi giá trị điều kiện). |
| `AMBIGUOUS_GATEWAY_BRANCH` | `/steps/:i` | Gateway có các điều kiện nhánh bị trùng lặp / xung đột. |
| `UNREACHABLE_STEP` | `/steps/:i` | Bước trong sơ đồ không có đường nối tới (mồ côi). |
| `DEAD_END_STEP` | `/steps/:i` | Bước kết thúc cụt, không đi tiếp được tới bước End. |
| `DUPLICATE_STEP` / `DUPLICATE_FIELD` | `/steps/:i/id`, `/fields/:i/id` | ID bị trùng lặp. |

---

## 4. Hướng dẫn UI: Ánh xạ nguồn và Xử lý vấn đề mở

1. **`sourceMappings`:**
   - Mỗi item trong `sourceMappings` liên kết một `targetId` (Node Step, Field, Role) với một hoặc nhiều `segmentIds` trong đoạn văn bản nguồn.
   - Khi người dùng click chọn 1 node trên canvas hoặc 1 field trong form: UI đọc `sourceMappings` tìm `segmentIds` tương ứng để highlight đoạn văn bản gốc trong panel mô tả.

2. **`openIssues`:**
   - Mỗi item chứa `{ code, targetId?, message, blocking }`.
   - Nếu `blocking: true`: Hiển thị icon cảnh báo màu đỏ ở cạnh Node/Field liên quan để nhắc người thiết kế bổ sung cấu hình.
   - Nếu `blocking: false`: Hiển thị màu vàng (thông tin cần lưu ý, ví dụ ngoại lệ chưa được quy trình hóa).

---

## 5. Phân định dữ liệu thật vs Dữ liệu mẫu (Fixtures)

- **Dữ liệu thật:**
  - Toàn bộ các API trên đều đọc/ghi thật vào PostgreSQL qua các bảng:
    - `applications`: Thông tin ứng dụng.
    - `application_versions`: Bản nháp phiên bản và trạng thái khóa (`lock_version`).
    - `builder_source_revisions`: Phiên bản văn bản nguồn và phân đoạn text.
    - `builder_draft_revisions`: Bản lưu snapshot JSON manifest và metadata thiết kế.
  - Phân tách đa tenant nghiêm ngặt theo `tenant_id` từ Token/Context.

- **Dữ liệu Fixture:**
  - Trong backend có các fixture tại `apps/api/src/builder/fixtures/` (`purchaseValidFixture`, `purchaseMissingRoleFixture`, ...).
  - Các fixture này **chỉ phục vụ unit test và acceptance test tự động** trong backend, không bị hardcode trong API production.
  - Tú có thể dùng cấu trúc JSON của `purchaseValidFixture` làm dữ liệu mẫu (mock data) chuẩn nhất khi dựng trước giao diện đồ họa Canvas ở frontend.
