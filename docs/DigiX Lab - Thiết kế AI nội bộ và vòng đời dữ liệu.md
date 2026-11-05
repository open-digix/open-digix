# DigiX Lab — thiết kế RAG nội bộ, chỉ mục và thu hồi quyền

**Trạng thái:** phương án kỹ thuật đề xuất cho SRS v2.3, **chưa triển khai/chưa chạy thử** (05/11/2026). Quyền truy cập do Tầng 1 quyết định, Tầng 2 chỉ hiển thị trợ lý; không coi câu trả lời AI là quyết định nghiệp vụ. Các mốc lưu/xóa dưới đây là mặc định thiết kế cần đội xác nhận theo pháp lý và hạ tầng thực tế, không phải SLA đã đo được.

## 1. Lựa chọn triển khai v1

| Thành phần | Chốt cho lát cắt đầu tiên | Lý do và giới hạn |
| --- | --- | --- |
| Nguồn được phép | Chính sách/quy định do quản trị tenant chọn và cấu hình ứng dụng **đã xuất bản** theo `(tenant_id, app_id, version)`; không tự nạp mọi hồ sơ, tệp đính kèm hay nội dung chat. | Nguồn tài liệu phải có owner, ACL, phiên bản, trạng thái và giấy phép sử dụng. Tóm tắt hồ sơ cá nhân nếu thêm sau phải kiểm tra quyền hồ sơ riêng. |
| Kho tệp | Kho đối tượng tương thích S3 trong hạ tầng nội bộ, giữ bản gốc. Chỉ API kiểm tra quyền mới cấp truy cập; khóa tệp ngẫu nhiên, không đưa nội dung vào log. | Phân tách văn bản nguồn và chỉ mục; kho tệp không phải nơi xác định quyền. Quét tệp trước khi lập chỉ mục. |
| Metadata/quyền | PostgreSQL: `knowledge_sources` (tenant/app/version, source ID, owner, trạng thái, content hash, loại, thời điểm, chính sách lưu), `source_grants` (user/role + scope), `knowledge_chunks` (source ID, chunk ID, văn bản, vector, phiên bản chỉ mục), `index_jobs` (job ID, trạng thái/thử lại). `tenant_id` trên mọi bảng; ràng buộc khóa ngoại cùng tenant/app hoặc guard ở lớp truy cập chung. | **PostgreSQL là nguồn chân lý về quyền và trạng thái**. Không sao chép ACL tĩnh vào chỉ mục rồi coi đó là quyền hiện hành. RLS hoặc lớp truy cập tenant chung, quyền theo app/source kiểm tra ở truy vấn. |
| Tìm kiếm | PostgreSQL full-text search + extension `pgvector` cho top-k vector; ứng viên phải JOIN tới nguồn `active`, đúng tenant/app/version và quyền hiện hành, **trước khi lấy nội dung gửi vào prompt**. Nếu embedding tạm ngừng, chỉ dùng FTS hoặc báo không khả dụng. | Chỉ mục chung trong PostgreSQL nhưng lọc bắt buộc theo tenant, app, phiên bản và nguồn được phép; không cần một CSDL vector mới cho demo. Kiểm tra giấy phép đúng phiên bản của extension trước release. |
| Sinh câu trả lời | Máy chủ suy luận **nội bộ** chạy `llama.cpp` hoặc adapter tương đương trên hạ tầng do DigiX quản lý; API chỉ dùng model đã được kiểm tra giấy phép và năng lực máy. Embedding cũng phải chạy nội bộ. Không bật API model ngoài trong bản demo. | Chốt kiến trúc local-only, **chưa chốt tên/trọng số model**: phải xác minh giấy phép trọng số, chất lượng tiếng Việt và RAM/latency trước khi tải vào bản phát hành; không đồng nhất giấy phép runtime với giấy phép trọng số. Chạy CPU/model nhỏ nếu phù hợp, không hứa thời gian phản hồi chưa đo. |
| Hành vi | RAG chỉ trả lời khi có nguồn đang được phép và dẫn nguồn đến `source_id + version`; không có nguồn thì từ chối trả lời thay vì bịa. Tool gọi ra ngoài hoặc thay đổi workflow/quyền bị tắt. | Prompt injection trong tài liệu được coi là dữ liệu không tin cậy; nguồn chỉ dùng làm bằng chứng, không được chỉ dẫn agent cấp quyền hoặc bỏ guard. |

**Luồng nạp:** quản trị chỉ định nguồn → kiểm quyền và quét tệp → lưu metadata `pending` → worker trích văn bản/chia chunk/tạo embedding nội bộ → ghi chunks/FTS/vector với định danh tenant/app/source/version → đánh dấu nguồn `active` khi đủ điều kiện. Job lặp lại theo content hash/version và idempotency key; lỗi giữ `failed`, không tự đưa dữ liệu chưa kiểm tra vào tìm kiếm. Thay nguồn tạo version mới và vô hiệu version cũ trước khi nạp xong; chỉ nguồn active mới truy xuất.

**Luồng hỏi đáp:** token OIDC → Gateway → NestJS lấy tenant/người dùng từ danh tính xác thực (**không tin `tenant_id` do client gửi**) và kiểm tra quyền ứng dụng → truy vấn có ràng buộc nguồn/chunk hiện hành → lấy top-k → **kiểm lại quyền nguồn ở DB trước khi dùng chunk** → gọi máy chủ suy luận nội bộ (không cung cấp tool ghi) → **kiểm lại quyền/trạng thái nguồn trước khi trả câu trả lời/trích dẫn** → chỉ trả phần còn được phép; nếu không thể bảo đảm, bỏ câu trả lời và báo nguồn đã thay đổi. V1 không streaming và không cache văn bản/response xuyên người dùng/tenant. Không trả nội dung chunk qua endpoint tìm kiếm chưa guard.

## 2. Thu hồi quyền và xóa dữ liệu

**Hai thao tác khác nhau:** (a) thu hồi quyền của người/nhóm/app đối với một nguồn; (b) xóa/thu hồi chính nguồn. Cả hai làm **mất quyền truy xuất ngay sau khi API xác nhận thao tác**, độc lập việc index worker đã xóa vector hay chưa. Không hứa thu hồi một gói HTTP đã gửi xong trước đó.

1. API kiểm tra quyền quản trị và ghi trong **một giao dịch PostgreSQL**: bỏ grant hoặc đặt `knowledge_sources.status = revoked/deleting`, tăng `auth_revision`, ghi audit và outbox job xóa chỉ mục. Chỉ trả thành công sau commit; nếu giao dịch lỗi, trả lỗi và không báo đã thu hồi.
2. Mọi truy vấn mới JOIN đến nguồn/grant hiện hành ở DB, không dùng quyền cache/claims đã cũ để quyết định truy cập tài liệu. Xóa quyền của người dùng/role phải có hiệu lực tại DB cho các truy vấn mới ngay sau commit, kể cả JWT còn hạn.
3. Với truy vấn đang chạy trong lúc thu hồi, kiểm tra `auth_revision`/trạng thái và quyền trước khi gửi đáp án. Nếu thay đổi, **hủy đáp án**, trả trạng thái nguồn thay đổi và không gửi trích dẫn. Không streaming ở v1 để không phát một phần câu trả lời trước bước kiểm tra cuối. Thử tranh chấp giữa thu hồi và trả lời khi triển khai; nếu không chứng minh được ranh giới này thì chưa tuyên bố “ngay lập tức” cho in-flight request.
4. Job bất đồng bộ xóa `knowledge_chunks`/vector/FTS liên quan và báo số chunk còn lại; mặc định mục tiêu **trong 24 giờ** sau commit, có retry và cảnh báo nếu quá hạn. Quyền đã bị chặn **trước** khi job xóa chạy; xóa chỉ mục là xử lý tồn dư dữ liệu, không phải lớp bảo vệ truy cập chính.
5. Không lập chỉ mục lại từ hàng đợi cũ: worker kiểm tra trạng thái nguồn, `auth_revision`, content hash/version trước khi ghi/đánh dấu active; job trễ bị loại. Khi khôi phục backup, phải chạy reconciliation quyền/nguồn bị thu hồi trước khi mở truy cập API/worker; không làm sống lại quyền và chunks cũ.

**Lưu/xóa mặc định đề xuất:**

| Dữ liệu | Giữ khi hoạt động | Khi người có quyền yêu cầu xóa/thu hồi | Ghi chú |
| --- | --- | --- | --- |
| Tài liệu/chính sách nguồn | Cho tới khi owner xóa hoặc hết hạn theo chính sách tenant. | Chặn ngay sau commit, xóa bản gốc trong kho tệp và bản văn/chunk/vector/FTS mục tiêu ≤ 24 giờ; đánh dấu lỗi và cảnh báo nếu không xóa được. | Không xóa hồ sơ nghiệp vụ gốc chỉ vì gỡ khỏi AI; hai vòng đời phải được giải thích rõ. |
| Cấu hình ứng dụng đã xuất bản | Theo vòng đời phiên bản ứng dụng. | Rút quyền đọc AI ngay; xóa bản sao trong chỉ mục ≤ 24 giờ. | Bản cấu hình lưu cho workflow/audit có thể vẫn phải giữ; ngừng cho AI đọc không đồng nghĩa xóa nghiệp vụ. |
| Prompt/câu trả lời | **Không lưu nội dung** mặc định ở DB, log, telemetry hoặc bộ nhớ lâu dài; chỉ xử lý trong request. | Không có nội dung lưu thường trực để xóa. | Không đưa prompt/chunk vào lỗi, trace, proxy logs; kiểm tra cấu hình runtime model. |
| Audit truy cập AI | Chỉ giữ metadata: người, tenant/app, source IDs, thời điểm, kết quả, không lưu prompt/chunk/đáp án; đề xuất **90 ngày**. | Xử lý theo chính sách bảo mật/quy định retention của tenant; hạn chế người xem. | Cần chốt có phải giữ lâu hơn vì yêu cầu kiểm toán trước release. |
| Bản sao lưu | Sao lưu có mã hóa và phân quyền; đề xuất vòng quay **30 ngày**, kiểm thử khôi phục. | Bản sao có thể còn dữ liệu đã xóa đến khi hết vòng quay; không phục hồi quyền đã thu hồi. Nếu có yêu cầu xóa vật lý nhanh hơn, cần thiết kế lại chính sách backup. | Không được tuyên bố xóa vĩnh viễn mọi bản sao trong 24 giờ; ghi rõ ngoại lệ cho người dùng. |

## 3. Bằng chứng kiểm thử bắt buộc trước khi tuyên bố hoàn tất

| Ca thử | Cách dựng | Kết quả đạt |
| --- | --- | --- |
| TC-AI-REV-01 — chỉ mục chưa xóa | Nạp nguồn Beta, cho user B hỏi có dẫn nguồn; tạm dừng index worker, thu hồi quyền B và đợi API thu hồi trả thành công; xác minh chunk/vector vẫn còn bằng truy vấn quản trị. | User B hỏi lại, endpoint tìm kiếm và trả lời **không lộ văn bản hay citation**; A (tenant khác) chưa từng thấy nguồn Beta. Audit ghi sự kiện thu hồi và từ chối. |
| TC-AI-REV-02 — JWT/role cũ | Giữ token người B, thu hồi grant/role ở DB, không làm mới token; hỏi lại. | Quyền hiện hành được áp dụng, token còn hạn không đủ để đọc nguồn. |
| TC-AI-REV-03 — đang sinh câu trả lời | Dùng model trả lời chậm bằng test double, bắt đầu hỏi rồi thu hồi nguồn trước khi model trả; hoàn tất thu hồi. | Không trả nội dung/citation của nguồn đã thu hồi; truy vấn đang chạy bị bỏ. Kiểm thử nhiều lần để phát hiện race. |
| TC-AI-REV-04 — worker cũ/restore | Sau thu hồi, cho chạy job nạp cũ, job xóa lỗi một lần rồi retry; thử restore backup trong môi trường cách ly. | Nguồn không active lại; job retry dọn chunks, có cảnh báo khi quá 24 giờ; restore không phục vụ tài liệu đã thu hồi trước reconciliation. |
| TC-AI-ISO-01 — cô lập app/tenant | Tenant A/B có chính sách khác nhau, hai app trong cùng tenant có nguồn khác nhau; cùng câu hỏi ở ba ngữ cảnh. | Dẫn nguồn đúng tenant + app + phiên bản, không trộn khi không có grant chung. |
| TC-AI-OFF-01 — dịch vụ AI tắt | Dừng local inference/embedding sau khi đã xuất bản ứng dụng nghỉ phép. | UI báo I chưa sẵn sàng; tạo hồ sơ, giao việc, duyệt và dashboard H/P/D vẫn chạy. |

**Tình trạng:** chưa chạy ca nào — kho hiện có tài liệu và fixture, chưa có backend/indexer/local model. Khi triển khai phải ghi phiên bản PostgreSQL/pgvector/runtime/model, giấy phép trọng số, cấu hình giữ/xóa, bằng chứng benchmark và log test (không chứa dữ liệu nhạy cảm). Quyết định phần cứng, model cụ thể và khả năng đạt thời hạn xóa là **điều kiện xác minh**, không được đánh dấu đã xong chỉ nhờ tài liệu này.
