# DigiX Lab — Luồng nhập liệu và kịch bản demo Builder

**Trạng thái:** Tài liệu đề xuất để Dũng, Tú và An thống nhất trước khi làm API/UI.  
**Phạm vi:** Giải thích Builder hoạt động như thế nào, người thiết kế phải nhập gì và các dữ liệu liên kết với nhau ra sao.

## 1.

Builder không phải ứng dụng nghiệp vụ cuối cùng. Builder là công cụ để **tạo ra ứng dụng nghiệp vụ**.

```text
Giai đoạn A — Thiết kế
Quản trị viên dùng Builder tạo khuôn ứng dụng một lần
                          │
                          ▼
Giai đoạn B — Vận hành
Nhân viên dùng khuôn đó để tạo và xử lý nhiều hồ sơ thật
```

Ví dụ:

- Trong Builder, người thiết kế khai báo: “Ứng dụng có trường `Giá dự kiến`”.
- Khi vận hành, nhân viên nhập giá thật: “25.000.000 đồng”.
- Trong Builder, người thiết kế khai báo: “Quản lý là người duyệt bước đầu”.
- Khi vận hành, một quản lý thật nhận việc và bấm Đồng ý hoặc Từ chối.

Tài liệu dùng một ví dụ xuyên suốt: **ứng dụng đề nghị cấp laptop**.

---

## 2. Kịch bản demo hoàn chỉnh

### 2.1. Câu chuyện nghiệp vụ ban đầu

Người thiết kế nhập mô tả:

> Nhân viên gửi đề nghị cấp laptop. Quản lý có thể đồng ý hoặc từ chối. Nếu quản lý đồng ý và giá dưới 20 triệu đồng thì đề nghị được chấp thuận. Nếu giá từ 20 triệu đồng trở lên thì giám đốc phải duyệt thêm.

Từ mô tả này, Builder cần giúp người thiết kế tạo:

- Biểu mẫu đề nghị.
- Danh sách người tham gia.
- Các bước duyệt.
- Điều kiện giá 20 triệu đồng.
- Kết quả được chấp thuận hoặc bị từ chối.

## Phần A — Quản trị viên thiết kế ứng dụng trong Builder

### Màn hình 1 — Tạo ứng dụng

Người thiết kế nhập:

| Nội dung | Giá trị demo |
| --- | --- |
| Tên ứng dụng | Đề nghị cấp laptop |
| Mã ứng dụng | `laptop_request` |
| Mục tiêu | Quản lý việc gửi và duyệt đề nghị cấp laptop |
| Bộ phận phụ trách | Hành chính |
| Mô tả nghiệp vụ | Nội dung tại mục 2.1 |

Builder tạo một dự án ở trạng thái `draft` và giữ nguyên mô tả gốc làm nguồn đối chiếu.

```text
Draft: laptop_request
Nguồn: Mô tả nghiệp vụ do người thiết kế nhập
```

### Màn hình 2 — Xác định người tham gia

Builder có thể gợi ý vai trò từ mô tả; người thiết kế kiểm tra và xác nhận:

| Mã vai trò | Tên | Trách nhiệm |
| --- | --- | --- |
| `employee` | Nhân viên | Tạo đề nghị |
| `manager` | Quản lý | Duyệt bước đầu |
| `director` | Giám đốc | Duyệt đề nghị từ 20 triệu đồng trở lên |

Kết quả màn hình này là danh sách role. Các bước xử lý phía sau chỉ được chọn role có trong danh sách này.

### Màn hình 3 — Tạo biểu mẫu

Người thiết kế khai báo thông tin nhân viên phải nhập:

| Mã field | Nhãn hiển thị | Kiểu | Bắt buộc | Người nhập |
| --- | --- | --- | --- | --- |
| `device_name` | Tên thiết bị | `string` | Có | `employee` |
| `estimated_price` | Giá dự kiến | `integer` | Có | `employee` |
| `reason` | Lý do đề nghị | `string` | Có | `employee` |
| `needed_date` | Ngày cần sử dụng | `date` | Có | `employee` |

Người thiết kế khai báo thêm các field mà người duyệt sẽ ghi:

| Mã field | Nhãn hiển thị | Kiểu | Lựa chọn | Người ghi |
| --- | --- | --- | --- | --- |
| `manager_decision` | Quyết định của quản lý | `enum` | `approved`, `rejected` | `manager` |
| `director_decision` | Quyết định của giám đốc | `enum` | `approved`, `rejected` | `director` |

Các field này sẽ được bước xử lý sử dụng và sẽ trở thành dữ liệu cho điều kiện rẽ nhánh.

### Màn hình 4 — Tạo các bước xử lý

Người thiết kế tạo các điểm trong quy trình:

| Mã bước | Loại | Người xử lý | Dữ liệu sử dụng |
| --- | --- | --- | --- |
| `submitted` | Bắt đầu | — | — |
| `manager_review` | Công việc | `manager` | Xem đề nghị, ghi `manager_decision` |
| `manager_route` | Rẽ nhánh | — | Đọc `manager_decision` và `estimated_price` |
| `director_review` | Công việc | `director` | Xem đề nghị, ghi `director_decision` |
| `director_route` | Rẽ nhánh | — | Đọc `director_decision` |
| `accepted` | Kết thúc | — | Kết quả `approved` |
| `declined` | Kết thúc | — | Kết quả `rejected` |

Ở màn hình này, Builder mới biết quy trình có những điểm nào. Đường nối được tạo ở màn hình tiếp theo.

### Màn hình 5 — Nối luồng và đặt điều kiện

Người thiết kế cấu hình:

```text
submitted → manager_review → manager_route

manager_decision = rejected
→ declined

manager_decision = approved AND estimated_price < 20000000
→ accepted

manager_decision = approved AND estimated_price >= 20000000
→ director_review → director_route

director_decision = approved
→ accepted

director_decision = rejected
→ declined
```

Builder hiển thị sơ đồ:

```text
Nhân viên gửi đề nghị
          │
          ▼
     Quản lý duyệt
          │
          ├── Từ chối ─────────────────────► Bị từ chối
          │
          ├── Đồng ý và giá < 20 triệu ────► Được chấp thuận
          │
          └── Đồng ý và giá >= 20 triệu
                         │
                         ▼
                   Giám đốc duyệt
                         ├── Đồng ý ────────► Được chấp thuận
                         └── Từ chối ───────► Bị từ chối
```

### Màn hình 6 — Kiểm tra và chạy thử

Builder kiểm tra:

```text
✓ Mỗi công việc có người xử lý
✓ Các vai trò được sử dụng đều tồn tại
✓ Các field được sử dụng đều tồn tại
✓ Giá dự kiến là số nên có thể so sánh với 20.000.000
✓ Có một điểm bắt đầu
✓ Mọi nhánh đều dẫn đến một điểm kết thúc
✓ Không có bước bị bỏ rơi
```

Người thiết kế thử hai bộ dữ liệu:

| Dữ liệu thử | Đường đi mong đợi |
| --- | --- |
| Giá 15 triệu, quản lý đồng ý | Kết thúc `approved`, không qua giám đốc |
| Giá 25 triệu, quản lý đồng ý, giám đốc đồng ý | Qua giám đốc rồi kết thúc `approved` |

Nếu đúng, người có quyền mới được xuất bản ứng dụng.

## Phần B — Nhân viên sử dụng ứng dụng đã xuất bản

### Cảnh 1 — Nhân viên gửi đề nghị thật

Nhân viên mở ứng dụng `Đề nghị cấp laptop` và nhập:

```text
Tên thiết bị: Dell Latitude 5450
Giá dự kiến: 25.000.000 đồng
Lý do: Cấp máy cho nhân viên mới
Ngày cần sử dụng: 20/11/2026
```

Nhân viên bấm `Gửi`. Hệ thống tạo hồ sơ và hiển thị:

```text
Trạng thái: Chờ quản lý duyệt
```

### Cảnh 2 — Quản lý duyệt

Quản lý mở `Việc của tôi`, xem đề nghị và bấm `Đồng ý`.

Vì giá là 25 triệu đồng, hệ thống tự đi theo nhánh từ 20 triệu đồng trở lên:

```text
Trạng thái: Chờ giám đốc duyệt
```

### Cảnh 3 — Giám đốc duyệt

Giám đốc mở `Việc của tôi` và bấm `Đồng ý`.

Hệ thống cập nhật:

```text
Quản lý: Đã đồng ý
Giám đốc: Đã đồng ý
Kết quả: Đề nghị được chấp thuận
```

### Điều demo chứng minh

Ứng dụng cấp laptop không được viết cứng bằng một controller riêng. Nó được tạo từ cấu hình Builder:

```text
Role + Field + Step + Điều kiện
                │
                ▼
        Ứng dụng có thể vận hành
```

---

## 3. Sáu bước đầu vào tổng quát của Builder

Kịch bản trên chỉ là ví dụ. Với nghiệp vụ khác, người thiết kế vẫn đi qua sáu bước giống nhau.

| Bước | Câu hỏi người thiết kế trả lời | Kết quả tạo ra | Được dùng tiếp ở đâu? |
| --- | --- | --- | --- |
| 1. Ứng dụng | Muốn tạo ứng dụng gì? | App draft và nguồn nghiệp vụ | Là căn cứ cho toàn bộ ứng dụng |
| 2. Vai trò | Ai tham gia? | Danh sách role | Gán người xử lý cho task |
| 3. Biểu mẫu | Cần nhập hoặc quyết định dữ liệu gì? | Danh sách field | Task đọc/ghi; điều kiện kiểm tra |
| 4. Xử lý | Ai làm việc gì? | Danh sách step | Là điểm nguồn/đích của đường nối |
| 5. Điều kiện | Xử lý xong thì hồ sơ đi đâu? | Danh sách transition | Tạo quy trình từ start tới end |
| 6. Kiểm tra | Các phần có khớp nhau không? | Validation | Cho phép hoặc chặn chạy thử/xuất bản |

Luồng phụ thuộc luôn là:

```text
App
 ├── Roles ───────────────┐
 ├── Fields ──────────┐   │
 └── Steps           │   │
                     ▼   ▼
                Task dùng Role + Field
                     │
                     ▼
         Transition nối Step và kiểm tra Field
```

## 4. Mỗi bước tối thiểu cần có gì?

### Bước 1 — Thông tin ứng dụng và nguồn

- Tên và mã ứng dụng.
- Mục tiêu.
- Bộ phận phụ trách nếu có.
- Mô tả quy trình bắt đầu, xử lý và kết thúc như thế nào.
- Quy tắc đã biết và điểm chưa rõ.
- Nội dung hoặc file làm nguồn tham chiếu.

Kết quả: `app` và `sources`.

### Bước 2 — Vai trò

Mỗi role có:

- Mã role.
- Tên hiển thị.
- Trách nhiệm.
- Hành động được phép.
- Nguồn giải thích role nếu có.

Kết quả: `roles`.

### Bước 3 — Dữ liệu và biểu mẫu

Mỗi field có:

- Mã và nhãn.
- Kiểu `string`, `integer`, `date`, `boolean` hoặc `enum`.
- Có bắt buộc hay không.
- Giới hạn hoặc danh sách lựa chọn.
- Role được nhập hoặc sửa.
- Mục đích và nguồn của field.

Kết quả: `fields`.

### Bước 4 — Các bước xử lý

Mỗi step có:

- Mã và tên.
- Loại `start`, `task`, `gateway` hoặc `end`.
- Role xử lý nếu là task.
- Field cần đọc và field được ghi.
- Field quyết định nếu là bước duyệt.
- Quy tắc chặn tự duyệt nếu cần.
- Trạng thái cuối nếu là end.

Kết quả: `steps`.

### Bước 5 — Đường đi và điều kiện

Mỗi transition có:

- Step nguồn.
- Step đích.
- Điều kiện nếu đi ra từ gateway.

Mỗi điều kiện có field, phép so sánh và giá trị. Schema v1 hỗ trợ `eq`, `lt`, `gte` và nhóm điều kiện `all`.

Kết quả: `transitions`.

### Bước 6 — Kiểm tra và xác nhận

Builder phải kiểm tra:

- Task dùng role tồn tại.
- Task và điều kiện dùng field tồn tại, đúng kiểu.
- Transition dùng step tồn tại.
- Có đúng một start và ít nhất một end.
- Mọi step đi được từ start tới end.
- Mọi nhánh đều có đích.
- Không trùng mã role, field hoặc step.
- Không còn vấn đề `blocking`.

Kết quả: `validation` gồm trạng thái hợp lệ, lỗi và cảnh báo.

---

## 5. Đầu ra cuối cùng

Sáu bước không tạo sáu kết quả rời nhau. Chúng tạo một đối tượng duy nhất:

```text
Builder Draft
├── app                 thông tin ứng dụng
├── sources             mô tả và nguồn gốc
├── roles               người tham gia
├── fields              biểu mẫu và dữ liệu quyết định
├── steps               các điểm xử lý
├── transitions         đường đi và điều kiện
├── sourceMappings      ánh xạ từng phần về nguồn
└── validation          lỗi và cảnh báo
```

Phần định nghĩa gồm `roles`, `fields`, `steps` và `transitions` phải phù hợp với [`schema/digix-app-v1.schema.json`](../../reference/schema/digix-app-v1.schema.json).

Tenant ID, user ID, draft UUID, revision, checksum và thời gian tạo/cập nhật do hệ thống tự điền; người thiết kế không nhập.

---

## 6. Có dùng được cho mọi nghiệp vụ không?

Không nên tuyên bố Builder v1 hỗ trợ mọi nghiệp vụ. Nó phù hợp nhất với mô hình:

```text
Tạo hồ sơ
→ giao cho một vai trò xử lý
→ rẽ nhánh theo dữ liệu/quyết định
→ chấp thuận hoặc từ chối
```

Các ví dụ có thể cấu hình theo khung này:

- Nhân sự: nghỉ phép, yêu cầu tuyển dụng, đề nghị cấp tài khoản.
- Hành chính: cấp thiết bị, đăng ký phòng họp, tiếp nhận công văn đơn giản.
- Mua sắm: đề nghị mua hàng và duyệt theo hạn mức.
- Dịch vụ nội bộ: yêu cầu sửa chữa, cấp quyền hoặc hỗ trợ.

Schema v1 chưa thể hiện đầy đủ các nghiệp vụ cần:

- Nhiều nhánh chạy song song.
- Vòng lặp hoặc trả lại sửa nhiều lần.
- Hẹn giờ, SLA và tự động nhắc việc.
- Người xử lý được chọn động theo phòng ban/hạn mức.
- Quy trình con hoặc bước gọi dịch vụ tự động.
- Field file đính kèm có quy tắc loại/dung lượng.
- Trạng thái kết thúc khác `approved` và `rejected`.

Các khả năng này cần mở rộng schema hoặc để phiên bản sau. Tài liệu và demo chỉ chứng minh tính tổng quát trong phạm vi Builder đã xây.

---

## 7. Checklist hoàn tất đầu vào

- [ ] Có thông tin ứng dụng và mô tả nghiệp vụ gốc.
- [ ] Có đủ role tham gia.
- [ ] Có đủ field cần nhập hoặc quyết định.
- [ ] Mỗi task dùng role và field tồn tại.
- [ ] Có một start, các task/gateway cần thiết và ít nhất một end.
- [ ] Các step được nối từ start tới end.
- [ ] Điều kiện dùng field có thật và đúng kiểu.
- [ ] Mọi nhánh đều có đích rõ ràng.
- [ ] Ngoại lệ chưa hỗ trợ được đánh dấu.
- [ ] Không còn lỗi `blocking`.
- [ ] Người thiết kế đã đối chiếu sơ đồ với nguồn ban đầu.

Khi checklist đạt, đầu ra là một `Builder Draft` hợp lệ và sẵn sàng cho chạy thử/preview; chưa đồng nghĩa với đã publish.
