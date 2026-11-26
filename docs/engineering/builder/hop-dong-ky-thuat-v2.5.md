# Hợp đồng kỹ thuật Builder/runtime v2.5 — quyết định thiết kế

**Trạng thái:** người yêu cầu đã **chốt phương án thiết kế** trong tài liệu này; **chưa triển khai API/runtime, chưa nghiệm thu E2E và chưa có OpenAPI/migration chính thức**. Đội cần hiện thực và review kỹ thuật bảo mật/tương thích trước phát hành; không diễn giải “chốt” thành “đã chạy”. Đối chiếu [SRS v2.5](../../product/requirements/SRS%20DigiX%20Lab%20-%20%C4%90%E1%BA%B7c%20t%E1%BA%A3%20y%C3%AAu%20c%E1%BA%A7u%20ph%E1%BA%A7n%20m%E1%BB%81m.md), [schema app xuất bản thiết kế](../../reference/schema/digix-app-v2.5.schema.json), [ranh giới dữ liệu](../architecture/du-lieu-da-ung-dung-v2.5.md), [thiết kế RAG v2.3](../ai/DigiX%20Lab%20-%20Thi%E1%BA%BFt%20k%E1%BA%BF%20AI%20n%E1%BB%99i%20b%E1%BB%99%20v%C3%A0%20v%C3%B2ng%20%C4%91%E1%BB%9Di%20d%E1%BB%AF%20li%E1%BB%87u.md) và [ca nghiệm thu](../../delivery/ke-hoach-nghiem-thu-v2.5.md).

**Hiện trạng cần giữ tương thích:** API đã có `POST /v1/apps`, `GET/PATCH /v1/apps/:appId/drafts/:version`, `POST .../normalize`, `POST .../validate` cho manifest **v1.0**; Web liệt kê Builder qua `localStorage`. Không được thay ý nghĩa route v1 hoặc ghi đè draft v1 bằng schema xuất bản 2.5. Các route dưới đây là **hợp đồng mục tiêu**, chưa tồn tại trong code trừ những route v1 đã nêu.

## 1. Thư viện trang và thành phần tối thiểu

| Phần | Quyết định v2.5 | Giới hạn/bảo vệ |
| --- | --- | --- |
| Trang/menu | Tạo, đổi nhãn, sắp xếp, ẩn trang theo role; path nội bộ duy nhất trong app; trang thuộc bản xuất bản bất biến. | Không nhập URL API tùy ý hay script; path không vượt namespace app. |
| Bố cục | `single` (một vùng `main`), `two_columns` (`main` + `side`); mobile xếp `side` dưới `main`. | Không kéo-thả pixel tự do; thứ tự vùng/component được lưu trong cấu hình. |
| Component | `form` (nhập/sửa), `table` (lọc, phân trang), `detail` (xem bản ghi), `metric` (chỉ số có nguồn), `action` (nút có xác nhận khi ghi). | `type` chỉ nhận registry có version; không cho tenant tự thêm JS/SQL/URL. |
| Binding | `featureId`, `resource`, `action` tham chiếu danh mục do server phát hành; `label`, `zone` và thứ tự là cấu hình. | Validator xác nhận feature bật, resource/action hợp lệ, quyền role, kiểu dữ liệu, trạng thái ghi, version component. UI ẩn không thay thế API guard. |
| Preview | Cùng renderer và registry với runtime, theo role và viewport mobile/desktop; dùng dữ liệu thử cô lập, ghi rõ “Preview”. | Không chạy workflow, không ghi DB nghiệp vụ, không gọi action thật. API publish **tự kiểm lại**, không tin trạng thái preview của client. |

Schema app xuất bản thiết kế đã có `layout`, `components`, `featureId`, `resource`, `action`, `zone` và đã được bổ sung `componentVersion` (số nguyên dương, mặc định 1 cho fixture cũ), `order` (số nguyên không âm, thứ tự trong vùng), `visibleToRoles` (mảng role ID tùy chọn; vắng mặt là không giới hạn thêm ngoài ACL), `hidden` (boolean, mặc định false); `menuOrder` sắp xếp trang. `hidden` chỉ điều khiển hiển thị, không cấp hay thu hồi quyền. [Schema draft v2.5](../../reference/schema/digix-app-draft-v2.5.schema.json) cho phép `features: []`; schema published yêu cầu `features`/`pages` không rỗng. Duy trì đọc được app/draft v1 thiếu `startingPoint`. `tenantId`/`appId` của hai schema v2.5 là UUID để khớp DB hiện hành; fixture dùng UUID tổng hợp, không phải dữ liệu thật. JSON Schema kiểm hình dạng, validator server kiểm tham chiếu, quyền và thứ tự trùng; fixture cũ vẫn hợp lệ nhờ trường UI mới là tùy chọn.

Các giá trị `default` trong JSON Schema là **chú thích hợp đồng**, không bảo đảm validator tự thêm trường: khi đọc fixture/cấu hình cũ, server chủ động chuẩn hóa `componentVersion=1`, `hidden=false` và dùng vị trí trong mảng nếu thiếu `order`; không sửa bản xuất bản bất biến tại chỗ.

## 2. ACL: nguồn quyết định ở API

1. Xác thực token qua Gateway **và** API; resolve tenant/membership từ danh tính được kiểm chứng. `X-Tenant-Id` chỉ chọn tenant mà người dùng thuộc về; `appId`, `version`, `recordId` trong path không phải bằng chứng quyền.
2. Resolve app thuộc tenant, bản xuất bản/phiên bản; kiểm membership có quyền mở app (hoặc quyền truy cập **được ủy quyền rõ** từ liên kết chia sẻ đối với đúng đối tượng), role app và feature được bật trong bản tương ứng. `startingPoint` và tên app **không** tham gia phân quyền.
3. Kiểm `resource:action` do **catalog server** công bố, quyền role, trạng thái/phiên bản bản ghi và chính sách bản ghi. Bản ghi demo có ba phạm vi `creator`, `assignee`, `manager`; `manager` chỉ có quyền khi được gán trong app/chức năng, không mặc định là quyền đọc mọi app. Tác vụ và thao tác ghi kiểm thêm người được giao, trạng thái, chống tự duyệt và idempotency theo nghiệp vụ.
4. Query dữ liệu/tệp/task/dashboard/search/AI phải lọc tenant + app + bản ghi và recheck quyền ở server. Không chỉ lọc ở Web; không nhận `tenantId`, `createdBy` hay role do client tự khai để cấp quyền. Trả `403` cho app đã biết nhưng thiếu quyền thao tác; `404` cho app/bản ghi ngoài phạm vi để tránh lộ tồn tại; danh sách lọc bỏ bản ghi ngoài phạm vi.
5. **Truy cập qua chia sẻ:** nếu app đích không sở hữu bản ghi, chỉ mở đúng loại dữ liệu/record/action được liên kết còn hiệu lực cấp, với quyền người dùng ở app đích và quyền ủy quyền do app nguồn phê duyệt. Không đòi người dùng phải là thành viên app nguồn (nếu thế chia sẻ không còn ý nghĩa), nhưng không biến liên kết thành membership toàn app nguồn. Ghi phải đi qua service/hành động nghiệp vụ **của app nguồn** để giữ invariant, version và audit; không cho sửa JSON bản ghi trực tiếp.

**Khóa truy vấn/quyền:** `(tenant_id, application_id, application_version_id, record_id)` cho bản ghi; app version gắn theo lúc tạo và không chuyển ngầm khi publish v2. ACL app/role, feature policy, liên kết chia sẻ và audit cần migration mới; khóa ngoại hiện có theo tenant/app **chưa** thay được kiểm quyền. Kiểm danh sách/đếm/metric trên cùng policy để tránh lộ số lượng bản ghi bị chặn.

## 3. Danh mục, draft, preview, publish và runtime — route mục tiêu

Mọi route nghiệp vụ `/v1/*` đi qua Gateway, dùng token OIDC và tenant context hiện hành; server lấy tenant từ membership, không từ request body. **Tên route, phương thức và các trường cốt lõi dưới đây đã chốt làm hợp đồng mục tiêu**; OpenAPI phải đặc tả chi tiết, chưa route v2.5 nào được triển khai.

| Phương thức/đường mục tiêu | Request/response tối thiểu | Quyền và quy tắc |
| --- | --- | --- |
| `GET /v1/catalog/features` | `catalogVersion`, danh sách `{id, version, domain, resources, actions, permissions, dependencies, components, status}`; mỗi phần tử `actions` là `{resource, action, permission}` | Đọc theo tenant; client chỉ hiển thị, không tự định nghĩa action/quyền. `permissions` là danh sách không trùng lặp suy ra từ `actions[].permission`, không phải nguồn cấu hình độc lập. ID/version không đổi nghĩa sau publish. |
| `GET /v1/catalog/presets` | `{id: erp\|crm\|blank, version, suggestedFeatures[]}` | Snapshot gợi ý lúc tạo; từ trống rỗng. Không tự cấp quyền/bật chức năng sau khi user chỉnh. |
| `POST /v1/apps` *(mở rộng route đã có)* | `{schemaVersion:"2.5", name, appKey, startingPoint?, presetVersion?}` → `appId`, draft v2.5, `lockVersion`; features được xác nhận/lưu trong draft | `designer`/`tenant_admin`; request không có `schemaVersion` giữ hành vi v1.0. Validator và persistence định tuyến theo schema, không chuyển draft v1 ngầm. |
| `GET /v1/apps` | Danh sách app/nháp/version phù hợp membership | Không đọc từ `localStorage`; app không có quyền không lộ. |
| `GET/PATCH /v1/apps/:appId/drafts/:version` *(đã có v1)* | v2.5 draft `definition`, `lockVersion`/ETag; `PATCH` trả revision/checksum | `designer`; optimistic concurrency (`409` khi cũ), tenant/app ownership; v1 vẫn đi validator v1. Draft rỗng được lưu. |
| `POST /v1/apps/:appId/drafts/:version/validate` *(đã có v1)* | `{valid, snapshotChecksum, issues:[{code,path,message}]}` | Validator v2.5 kiểm phụ thuộc, catalog version, page/action/role/feature, workflow, nguồn AI, version; không thay kết quả v1 bằng schema published. |
| `POST /v1/apps/:appId/drafts/:version/preview` | `{roleId, viewport}` → mô hình render từ **snapshot draft**, `snapshotChecksum`, dữ liệu thử có nhãn | `designer`/`publisher`; role giả lập chỉ cho preview, không cấp quyền thật; không side effect nghiệp vụ. |
| `POST /v1/apps/:appId/drafts/:version/publish` | `{expectedChecksum, lockVersion, idempotencyKey}` → `{appId, version, publishedAt, checksum}` | `publisher`/`tenant_admin` theo app; validate lại tại snapshot, audit ai/diff, atomic state theo DB và có xử lý lỗi/reconcile khi deploy workflow thất bại; bản xuất bản bất biến. Draft lỗi/rỗng trả vấn đề cụ thể, không tạo runtime link. |
| `GET /v1/apps/:appId/runtime` và `GET /v1/apps/:appId/versions/:version` | menu/pages/feature theo quyền; bản phiên bản để xem lịch sử theo quyền | Chỉ bản published; runtime chọn version hiện hành, hồ sơ cũ pin version lúc tạo. API nghiệp vụ phải kiểm feature/action, không dựa vào menu. |

**Mẫu phản hồi lỗi thống nhất:** `400` đầu vào sai; `401` thiếu token; `403` thiếu quyền; `404` app/bản ghi ngoài phạm vi theo chính sách; `409` draft đã đổi hoặc version xung đột; `422` cấu hình không thể publish (issues có `path`). Web không tự suy ra publish thành công từ preview.

**Ví dụ catalog rút gọn** (chỉ thể hiện trường cốt lõi, OpenAPI sẽ bổ sung kiểu và lỗi). Permission nghiệp vụ theo `<featureId>.<resource>.<action>`; mỗi `(resource, action)` thuộc feature có đúng một permission. Web tra catalog bằng binding `(featureId, resource, action)` để kiểm nháp/hiển thị; API kiểm quyền lại trên cùng bộ ba. Quyền hệ thống theo app như `share.manage`, `ai.sources.manage` công bố riêng, không xuất hiện trong `actions` của feature:

```json
{
  "catalogVersion": "2026-11-demo-1",
  "features": [
    {
      "id": "crm.opportunities",
      "version": 1,
      "domain": "crm",
      "dependencies": ["crm.customers"],
      "resources": ["opportunities"],
      "actions": [
        { "resource": "opportunities", "action": "read", "permission": "crm.opportunities.opportunities.read" },
        { "resource": "opportunities", "action": "create", "permission": "crm.opportunities.opportunities.create" },
        { "resource": "opportunities", "action": "advance", "permission": "crm.opportunities.opportunities.advance" }
      ],
      "permissions": ["crm.opportunities.opportunities.read", "crm.opportunities.opportunities.create", "crm.opportunities.opportunities.advance"],
      "components": ["form", "table", "detail", "action"],
      "status": "supported"
    },
    {
      "id": "erp.inventory",
      "version": 1,
      "domain": "erp",
      "dependencies": ["erp.materials"],
      "resources": ["receipts", "stock"],
      "actions": [
        { "resource": "receipts", "action": "receive", "permission": "erp.inventory.receipts.receive" },
        { "resource": "receipts", "action": "read", "permission": "erp.inventory.receipts.read" },
        { "resource": "stock", "action": "read", "permission": "erp.inventory.stock.read" }
      ],
      "permissions": ["erp.inventory.receipts.receive", "erp.inventory.receipts.read", "erp.inventory.stock.read"],
      "components": ["form", "table"],
      "status": "supported"
    }
  ]
}
```

## 4. API liên kết chia sẻ liên app — hợp đồng mục tiêu

**Bản ghi chính sách tối thiểu:** `{id, tenantId, sourceAppId, targetAppId, resourceType, allowedActions: ["read"|"write"], writeActions, recordScope, targetRoles, status, revision, createdBy, approvedBy, revokedAt}`. `recordScope` bản demo dùng `{type:"ids", ids:[recordId]}` với ID bản ghi nguồn được chọn rõ ràng (không nhập SQL/filter tùy ý); `allowedActions` map sang action cụ thể của feature nguồn trước khi ghi. App nguồn/đích phải khác nhau nhưng cùng tenant, feature nguồn còn hỗ trợ; policy không tự mở tệp/task/dashboard/index AI. `writeActions` chỉ chứa action ghi đã đăng ký ở catalog; **bản demo giới hạn một action ghi trên một loại dữ liệu** cho mỗi liên kết, không mặc định cho mọi bản ghi/role.

Hành động ghi demo đã chọn: `materials:update_note` thuộc feature `erp.materials` (permission `erp.materials.materials.update_note`) trên đúng bản ghi vật tư được chỉ định; service nguồn chỉ cho sửa trường ghi chú, có kiểm phiên bản và audit. Catalog phải công bố action này trước khi chia sẻ; không coi hành động minh họa là đã chạy trong API.

**Ví dụ request cấp liên kết** (ID minh họa; OpenAPI quy định UUID và định dạng lỗi):

```json
{
  "sourceAppId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "targetAppId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "resourceType": "materials",
  "allowedActions": ["read", "write"],
  "writeActions": ["update_note"],
  "recordScope": { "type": "ids", "ids": ["cccccccc-cccc-4ccc-8ccc-cccccccccccc"] },
  "targetRoles": ["sales"]
}
```

ID ở ví dụ chỉ minh họa; `write` không có `writeActions` hợp lệ phải bị từ chối, không diễn giải là quyền sửa mọi trường.

| Phương thức/đường mục tiêu | Hành vi |
| --- | --- |
| `POST /v1/app-shares` | Thành viên có quyền `share.manage` **app nguồn** và vai trò `publisher`/`tenant_admin` phê duyệt liên kết; nếu thiếu một trong hai điều kiện thì từ chối. Khi đủ quyền, tạo `active` trong giao dịch có audit, trả ID/revision/approver; không cho tạo chéo tenant. |
| `GET /v1/app-shares?appId=...` | Chỉ liệt kê liên kết liên quan tới app người gọi có quyền quản lý; che phạm vi không được phép xem. |
| `PATCH /v1/app-shares/:shareId` | Cùng điều kiện cấp quyền như `POST`, kiểm revision và audit; mở rộng phạm vi/hành động phải được phê duyệt lại, không tự nới vì role hoặc app đổi. |
| `POST /v1/app-shares/:shareId/revoke` | Chuyển `revoked` và tăng revision **trong giao dịch DB** cùng audit; trả thành công sau commit; mọi truy cập mới kiểm DB, không dùng quyền cache/JWT cũ. |
| `GET /v1/apps/:targetAppId/shares/:shareId/records/:recordId`, `POST /v1/apps/:targetAppId/shares/:shareId/records/:recordId/actions/:action` | Truy cập qua app đích; service resolve bản ghi nguồn từ `shareId` + liên kết còn hiệu lực + target role + action + trạng thái nguồn. Không nhận `sourceAppId` từ client để bỏ qua policy. |

**Kiểm thử:** chưa cấp bị chặn; sau cấp chỉ đọc/ghi ID và action hợp lệ; role khác/bản ghi ngoài scope/tenant B bị chặn; sau revoke gọi mới với cùng token và URL bị chặn, kể cả list/search/cache; log cấp, truy cập, từ chối, thu hồi. Không hứa thu hồi HTTP response đã trả xong trước commit; request đang xử lý ghi phải recheck revision trước commit để tránh ghi sau thu hồi.

## 5. Nguồn AI và dữ liệu chia sẻ — hợp đồng mục tiêu

- `knowledge_sources` thuộc `(tenantId, ownerAppId, appVersion, sourceId, status, authRevision)`; chỉ nguồn **được quản trị chọn, quét và kích hoạt** mới được index. Ban đầu gồm chính sách/tài liệu được phép và cấu hình app đã publish; không tự nạp toàn bộ hồ sơ hoặc nội dung liên kết chia sẻ.
- API mục tiêu: `POST /v1/apps/:appId/ai/sources` (chọn nguồn, quyền `ai.sources.manage` theo app), `POST /v1/apps/:appId/ai/sources/:sourceId/revoke` (thu hồi nguồn), `POST /v1/apps/:appId/ai/sources/:sourceId/grants` (owner nguồn cấp cho `targetAppId` kèm `shareId` còn hiệu lực), `DELETE /v1/apps/:appId/ai/sources/:sourceId/grants/:grantId` (thu hồi grant), `POST /v1/apps/:appId/ai/ask` (`question` → `answer`, citations `{sourceId, version}`, hoặc trạng thái `no_evidence`/`unavailable`), `POST /v1/apps/:appId/drafts/:version/ai-suggestions` (`sourceRevisionId` → đề xuất/issue cho bản nháp, không tự ghi/publish). App đích phải chọn nguồn được grant qua route sources của mình; endpoint tìm kiếm nếu có phải dùng đúng guard như hỏi đáp; **chưa triển khai**.
- Truy vấn trong app đích **không tự dùng nguồn của app nguồn chỉ vì có liên kết dữ liệu**. Nếu muốn cho AI đọc một nguồn chia sẻ, cần **đồng thời**: liên kết dữ liệu còn hiệu lực cho `read` đúng bản ghi/loại dữ liệu; owner nguồn cho phép nguồn đó dùng cho AI ở app đích; quản trị app đích chọn nguồn và cấp grant; người hỏi có quyền app đích và nguồn tại thời điểm truy vấn. Một điều kiện mất hiệu lực → không đưa chunk vào prompt, search hay citation. Không bao giờ dùng liên kết xuyên tenant.
- Trước khi lấy chunk, trước khi gửi tới model nội bộ và ngay trước khi trả đáp án/citation, kiểm quyền/trạng thái nguồn và liên kết tại DB. Thu hồi grant/nguồn/liên kết làm truy vấn mới bị chặn sau commit ngay cả khi worker dừng, JWT còn hạn hoặc index chưa dọn; request đang sinh đáp án phải bỏ nếu revision đổi. Dọn index bất đồng bộ theo mục tiêu SRS; không trả lời từ cache cũ. Không ghi nội dung prompt/answer mặc định; chỉ audit metadata. Model/embedding nội bộ, không gọi API ngoài.
- Không có nguồn đủ quyền → nói không biết; AI tắt → trả `unavailable`, H/P/D vẫn vận hành. Không tự xuất bản, tự duyệt hoặc thực thi action ghi từ câu trả lời AI.

## 6. Việc triển khai/kiểm chứng còn lại (không phải quyết định lại phạm vi)

1. Hai schema thiết kế đã có; triển khai validator riêng draft/published, giữ đường đọc/validator v1, bổ sung test schema và migration append-only. Preview role là **mô phỏng UI và dữ liệu thử do server lọc theo role giả lập**; không phát dữ liệu thật hay tạo quyền thật.
2. API/Security tạo OpenAPI chính thức theo route/trường cốt lõi trên, bảng ACL/app-share và kiểm trên mọi truy vấn; thử transaction/revision khi revoke cạnh tranh với ghi. Nếu thay đổi hợp đồng cần ghi quyết định mới, không lặng lẽ đổi API. Dùng authorizer API + repository scope/khóa ngoại theo [quyết định khởi công](../architecture/quyet-dinh-khoi-cong-code-v2.5.md); RLS nếu bổ sung sau không được thay thế guard API.
3. Backend triển khai idempotency/lock/version/publish và workflow reconcile, event/audit, API nghiệp vụ ERP/CRM theo catalog. Hình dạng DB vật lý, pagination và error code cụ thể trong OpenAPI là chi tiết triển khai nhưng không được thay đổi tính chất quyền/route/semantics đã chốt.
4. AI/backend xác minh model nội bộ/giấy phép, triển khai source grant riêng cho dữ liệu chia sẻ, kiểm quyền trước truy xuất và trước trả lời, test race revoke-vs-answer; không tự coi chia sẻ dữ liệu là cấp quyền cho AI.
5. QA map vào `TC-UI`, `TC-MOD`, `TC-START`, `TC-PUB`, `TC-APP`, `TC-SHARE`, `TC-AI`; chỉ dùng E2E qua Gateway để đánh dấu đạt. Owner, lịch và ước lượng **chưa cần chốt lúc này** theo [roadmap](../../delivery/roadmap-v2.5.md).
