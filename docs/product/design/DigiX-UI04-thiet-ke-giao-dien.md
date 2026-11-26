# **DigiX — Thiết kế giao diện UI-04: chế độ Sáng/Tối, kính mờ và chuyển động**

**Mã việc:** UI-04
**Phiên bản:** 1.0 — phương án chốt
**Ngày:** 26/11/2026
**Người soạn:** Duy Anh (Frontend) · **Người duyệt:** anh An · **Trạng thái:** chốt thiết kế UI-04, chưa code

## **1. Mục đích và phạm vi**

Tài liệu này chốt màu sắc, token và thiết kế component **cho UI-04** trước khi triển khai
chế độ Sáng/Tối, kính mờ và chuyển động. [UI/UX v2.5](DigiX%20Lab%20-%20UI%20UX%20v2.5.md)
là tài liệu thiết kế tổng thể của ứng dụng; UI-04 không thay thế hay mở rộng phạm vi tài liệu đó.

#### **Trong phạm vi UI-04:**

- Chế độ Sáng / Tối / Theo hệ thống cho khu làm việc (sau đăng nhập), trang đăng ký,
  trang điều khoản và trang lỗi đăng nhập do DigiX Web hiển thị.
- Kính mờ cho topbar, thẻ, panel, hộp thoại, menu; không áp cho sidebar, ô nhập và hàng bảng.
- Chuyển động cho hover, mở menu, hộp thoại, chuyển trang và đổi chế độ.

#### **Ngoài phạm vi UI-04:**

- Trang giới thiệu, `/login` và hộp đăng nhập trên landing; theme đăng nhập của Keycloak.
- Đổi bố cục, luồng nghiệp vụ, quyền và phạm vi màn hình theo UI/UX v2.5.

## **2. Hiện trạng**

- **Biến màu:** workspace.css có một số biến nền tảng ( --ws-ink , --ws-surface , --ws-accent …)
  và nhiều biến đặt tên theo chính mã màu, ví dụ --ws-c-0b1e30 . Số lượng và lượt dùng phải đo lại khi bắt đầu PR chuyển token.

- **Hệ quả:** không làm chế độ tối bằng cách đổi giá trị biến được, vì tên biến chính là màu (đổi --ws-c-0b1e30 sang màu khác sẽ sai nghĩa).
  Cần thêm một lớp biến theo vai trò (semantic) trước.

- **Bo góc:** đang dùng lẫn 4, 7, 8, 9, 11 px.

- **Chữ:** Be Vietnam Pro, cỡ gốc 14px, dòng 1.55. Giữ nguyên.

- **Đã có sẵn:** chuyển động 0.15–0.28s với --ws-ease và khối tắt chuyển động khi hệ điều hành bật "giảm chuyển động".

- **Màn mới F03 (PR #69):** dùng màu Tailwind thô và emoji nên lệch hệ thống.
  Đã yêu cầu sửa sang biến và class chung.

- **Phạm vi CSS:** token workspace hiện nằm trong `.ws-root`; trang đăng ký và điều khoản dùng
  `register.css`, lỗi đăng nhập dùng `landing.css`. `globals.css` còn tự đổi nền theo
  hệ điều hành. Vì vậy đổi riêng `workspace.css` sẽ không phủ hết các trang UI-04.

## **3. Nguyên tắc**

1. **Một nguồn màu:** component trong phạm vi UI-04 dùng biến theo vai trò
   ( --ws-text , --ws-border …), không dùng mã màu trực tiếp hoặc màu Tailwind thô.

2. **Đổi chế độ bằng đổi giá trị biến:** không sửa từng component.

3. **Đọc rõ trước, đẹp sau:** chữ thường đạt WCAG 2.1 AA (≥ 4.5:1), chữ lớn và
   thành phần giao diện quan trọng đạt ≥ 3:1 ở cả hai chế độ; kính mờ không được làm giảm độ tương phản.

4. **Sidebar giữ nền đặc:** là vùng điều hướng chính, cần ổn định và dễ đọc.

5. **Không emoji:** icon là SVG nét mảnh 18px, nét 1.9, màu theo chữ.

## **4. Bảng màu theo vai trò**

Màu Sáng là mục tiêu sau khi chuẩn hóa; PR chuyển token phải giữ nguyên màu thực tế từng vị trí.
Nếu giá trị dưới đây khác CSS hiện tại, ưu tiên màu hiện tại trong PR đó, rồi điều chỉnh ở PR giao diện
và ghi rõ chênh lệch. Màu Tối là phương án chốt.

| **Biến**            | **Vai trò**                               | **Sáng**      | **Tối**    |
| ------------------- | ----------------------------------------- | ------------- | ---------- |
| --ws-bg-canvas      | Nền vùng nội dung                         | ██ #f6f8fa    | ██ #0b1620 |
| --ws-bg-surface     | Bề mặt đặc, nền dự phòng                  | ██ #ffffff    | ██ #111f2b |
| --ws-bg-surface-2   | Bề mặt phụ, hàng xen kẽ                   | ██ #f1f5f7    | ██ #172a38 |
| --ws-bg-soft        | Nền nhấn nhẹ màu chủ đạo                  | ██ #edf5f4    | ██ #0f3532 |
| --ws-text           | Chữ chính                                 | ██ #172b3a    | ██ #e6eef3 |
| --ws-text-muted     | Chữ phụ, nhãn                             | ██ #5a6e7d    | ██ #9db0bd |
| --ws-text-on-accent | Chữ trên nút chính                        | ██ #ffffff    | ██ #04211e |
| --ws-border         | Viền mặc định                             | ██ #dce5eb    | ██ #253a4a |
| --ws-border-strong  | Viền ô nhập/checkbox chưa focus           | ██ #758b99    | ██ #8ca4b3 |
| --ws-accent         | Màu chủ đạo (nút chính, tab<br>đang chọn) | ██ #0b776f    | ██ #2bb5a7 |
| --ws-accent-hover   | Chủ đạo khi rê chuột                      | ██ #075e59    | ██ #42d2c4 |
| --ws-focus          | Vòng focus bàn phím                       | ██ #0d9488    | ██ #42d2c4 |
| --ws-danger         | Lỗi, xóa                                  | ██ #b42318    | ██ #f97066 |
| --ws-warning        | Cảnh báo, chờ duyệt                       | ██ #8a5a00    | ██ #f5b544 |
| --ws-success        | Thành công, đã duyệt                      | ██ #176b4d    | ██ #4ccf8f |
| --ws-info           | Thông tin, đã xuất bản                    | ██ #245a87    | ██ #7cb4e8 |
| --ws-sidebar-bg     | Nền sidebar (nền đặc)                     | ██ #112b45    | ██ #0a1824 |
| --ws-sidebar-text   | Chữ sidebar                               | ██ #b8cbd7    | ██ #b8cbd7 |

Các trạng thái có nền màu (badge, banner, nút nguy hiểm), mục sidebar đang chọn, hover và
overlay alpha cần **token theo vai trò riêng**, không lấy trực tiếp `--ws-accent`/`--ws-danger`
rồi pha opacity cho mọi tình huống. Ánh xạ theo *ngữ cảnh sử dụng* chứ không thay đồng loạt
mọi `--ws-c-*` cùng mã màu; bổ sung token chi tiết khi kiểm kê từng component. Với nền trạng thái,
kiểm lại màu chữ đặt trên nền đó. Không xóa alias cũ trước khi hết nơi sử dụng.

### **4.1. Biến kính mờ và đổ bóng**

| **Biến**             | **Vai trò**                             | **Sáng**                   | **Tối**                |
| -------------------- | --------------------------------------- | -------------------------- | ---------------------- |
| --ws-glass-bg        | Nền kính (topbar, panel,<br>thẻ)        | trắng 85%                  | #111F2B 85%            |
| --ws-glass-bg-strong | Nền kính đậm (menu,<br>hộp thoại)       | trắng 94%                  | #111F2B 94%            |
| --ws-glass-border    | Viền kính                               | trắng 60%                  | trắng 8%               |
| --ws-glass-blur      | Độ mờ                                   | blur 14px, bão hòa<br>140% | như Sáng               |
| --ws-shadow          | Đổ bóng thẻ                             | 0 8px 28px, navy<br>6%     | 0 8px 28px, đen<br>35% |
| --ws-canvas-glow     | 2 đốm sáng nền để kính<br>có thứ làm mờ | teal 16%, xanh 12%         | teal 14%, xanh 10%     |

**Dự phòng:** trình duyệt không hỗ trợ `backdrop-filter`, người dùng bật chế độ giảm trong
suốt (nơi có tín hiệu trình duyệt hỗ trợ), hoặc kiểm tra tương phản không đạt thì dùng nền
đặc `--ws-bg-surface`. Không đặt kính trên sidebar, vùng nhập liệu hay hàng bảng.

## **5. Độ tương phản (WCAG 2.1 AA)**

Tính bằng công thức WCAG trên đúng mã màu ở mục 4. Chữ thường cần ≥ 4.5:1; vòng focus và viền điều khiển cần ≥ 3:1.

| **Cặp màu**                 | **Sáng**  | **Tối**   | **Kết quả** |
| --------------------------- | --------- | --------- | ----------- |
| Chữ chính / bề mặt          | 14.55 : 1 | 14.26 : 1 | Đạt         |
| Chữ phụ / bề mặt            | 5.30 : 1  | 7.47 : 1  | Đạt         |
| Chữ phụ / nền vùng nội dung | 4.98 : 1  | 8.16 : 1  | Đạt         |
| Chủ đạo / bề mặt            | 5.41 : 1  | 6.59 : 1  | Đạt         |
| Chữ trên nút chính          | 5.41 : 1  | 6.66 : 1  | Đạt         |
| Lỗi / bề mặt                | 6.57 : 1  | 6.01 : 1  | Đạt         |
| Cảnh báo / bề mặt           | 5.93 : 1  | 9.23 : 1  | Đạt         |
| Thành công / bề mặt         | 6.47 : 1  | 8.47 : 1  | Đạt         |
| Thông tin / bề mặt          | 7.27 : 1  | 7.61 : 1  | Đạt         |
| Chữ sidebar / nền sidebar   | 8.63 : 1  | 10.75 : 1 | Đạt         |
| Vòng focus / bề mặt (≥ 3:1) | 3.74 : 1  | 8.96 : 1  | Đạt         |

Viền mặc định chỉ để phân vùng nên không áp ngưỡng 3:1. Ô nhập, checkbox dùng viền đậm hơn
(`--ws-border-strong`); đo ≥ 3:1 với nền kề bên ở cả hai chế độ. Các tỷ lệ bảng trên
là **màu đặc**; phải đo thêm chữ, icon, viền điều khiển, focus, badge và banner trên nền kính
khi đốm sáng ở vị trí bất lợi nhất. Không đạt thì tăng độ đặc hoặc chuyển thành nền đặc.

## **6. Chữ, khoảng cách, bo góc**

| **Nhóm**       | **Giá trị**                                                                                  | **Dùng cho**                 |
| -------------- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| Font           | Be Vietnam Pro; dự phòng Segoe UI,<br>Arial                                                  | Toàn hệ thống                |
| Cỡ chữ         | 11 · 12 · 13 · 14 (gốc) · 16 · 20 · 26                                                       | Nhãn nhỏ → tiêu đề trang     |
| Độ đậm         | 400 thường · 500 menu · 600 nút,<br>nhãn · 700 tiêu đề                                       | —                            |
| Khoảng cách    | bội số 4px: 4 · 8 · 12 · 16 · 20 · 24 · 32                                                   | padding, gap                 |
| Bo góc         | 6 (nhãn nhỏ) · 8 (nút, ô nhập) · 10<br>(banner) · 14 (thẻ, panel, hộp thoại) ·<br>999 (pill) | Thay cho 4/7/9/11px hiện tại |
| Cao điều khiển | 36px (nút, ô nhập) · 43px (mục<br>sidebar)                                                   | Giữ bố cục hiện tại; vùng bấm tối thiểu 24×24px, mục chạm chính trên mobile ưu tiên ≥ 44×44px |

## **7. Chuyển động**

| **Biến**      | **Giá trị**                     | **Dùng cho**                                          |
| ------------- | ------------------------------- | ----------------------------------------------------- |
| --ws-dur-fast | 150ms                           | Hover, focus, đổi màu nút                             |
| --ws-dur-base | 200ms                           | Mở menu, tooltip, đổi chế độ sáng/tối                 |
| --ws-dur-slow | 280ms                           | Sidebar thu/mở, hộp thoại, nội dung trang<br>hiện dần |
| --ws-ease     | cubic-bezier(.22, 1, .36,<br>1) | Giữ như hiện tại                                      |

- Hộp thoại và menu: mờ dần kết hợp phóng nhẹ 0.98 → 1.

- Chuyển trang: nội dung mờ dần, trượt lên 4px.

- Bật "giảm chuyển động" trên hệ điều hành thì bỏ animation/transition trang trí,
  nhưng vẫn giữ trạng thái mở/đóng rõ ràng; không dùng chuyển trang làm chậm điều hướng.

- Chỉ dùng CSS, không thêm thư viện animation.

## **8. Thiết kế component**

| **Component**                                    | **Thiết kế**                                                                                                                    | **Kính mờ** |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Sidebar                                          | Nền đặc navy; mục đang chọn nền đậm hơn, vạch teal<br>bên trái; thu gọn/ghim/rê chuột giữ như UI-02                             | Không       |
| Topbar                                           | Bo 14px, cách mép 12–16px; đường dẫn trang, doanh<br>nghiệp, ảnh đại diện                                                       | Có          |
| Nút                                              | Chính (nền chủ đạo), Phụ (nền bề mặt, viền), Liên kết,<br>Nguy hiểm; hover, focus nhìn rõ, vô hiệu dùng token riêng và `disabled` thật, không chỉ giảm opacity 45% | Không       |
| Ô nhập, chọn,<br>checkbox                        | Nền bề mặt, viền; focus viền màu focus + quầng 3px; lỗi<br>viền đỏ + dòng lỗi bên dưới                                          | Không       |
| Panel, thẻ, thẻ số liệu                          | Bo 14px, đầu panel có đường kẻ dưới                                                                                             | Có          |
| Bảng                                             | Tiêu đề chữ hoa nhỏ màu chữ phụ; hàng kẻ mảnh; cuộn<br>ngang trong khung                                                        | Theo panel  |
| Tab                                              | Chữ phụ; tab đang chọn chữ chủ đạo + gạch chân 2px                                                                              | Không       |
| Nhãn trạng thái                                  | Pill bo tròn, nền nhạt cùng tông + chấm màu: Đã duyệt,<br>Chờ duyệt, Từ chối, Đã xuất bản, Nháp                                 | Không       |
| Băng thông báo                                   | 4 loại: thông tin (MẪU THỬ), cảnh báo, lỗi, thành công;<br>chữ đậm đầu câu                                                      | Không       |
| Hộp thoại                                        | Bo 14px, nền kính đậm; focus vào tiêu đề hoặc thao tác phù hợp (hành động hủy khi dễ xóa nhầm); Esc đóng; giữ Tab trong hộp thoại và trả focus về nút mở khi đóng | Có (đậm)    |
| Menu thả xuống                                   | Menu tài khoản, chọn doanh nghiệp, chọn app                                                                                     | Có (đậm)    |
| Thông báo nhanh,<br>tooltip, trạng thái<br>trống | Toast có icon; tooltip nền đảo màu; trạng thái trống viền<br>đứt + icon + gợi ý hành động                                       | Toast: Có   |

<!-- Start of picture text -->

Digix ERP Av / Ung dung Doanh nghige: Tenant Alpha 0D<br>( 88. Ung dung Téng quan mua hang<br>B Yéucéumua we “icin — pa ‘sang 6i Hé thong.<br>128 7 23<br>@ Ténkho |* Bang ding © Cn xitty (© +450 véi tudn trade 9) Bang xudt<br>Ximéng PCB4O 4000<br>yo-1042 Thép hinh #150 (MAU THU) Note Méu cho dayge SnaPvco90. acay<br>Ye-toa1 —_ximangPca4o Hai aay em ténkho<br>Yeu1039 Ct ving dy 8 Non Méu wets<br><!-- End of picture text -->

_Hình 1. Khu làm việc, chế độ Sáng (dữ liệu MẪU THỬ). Sidebar nền đặc; topbar, thẻ, panel, menu tài khoản dùng kính mờ._

<!-- Start of picture text -->

Digix ER ‘Ung dung Doan Tenant Alpha<br>( Ung dung Téng quanr mua hang Dung Demo<br>128 7 23<br>Builder ‘Yéu cu mua gén day + Taoyauedu | ee)<br>Ximéng PCBAC 4000<br>Yo-1042_Théphinn iso (MAUTHU) Not Mu cha<br>SnaPve 090 B ety<br><!-- End of picture text -->

_Hình 2. Khu làm việc, chế độ Tối._

<!-- Start of picture text -->

Pry Lida © Lammas Lcaaaad Lya chon<br>abc@ :) @ ovsniyver ew<br>Email chua dingdinh dang, Toskhe,<br>‘Bang yéu cd<br>Yo-1041Xir , = -<br><!-- End of picture text -->

_Hình 3. Bộ component, chế độ Sáng._

<!-- Start of picture text -->

- ERP Quén ly vottu ‘erp_vat_tu<br>— Lya chon:<br><!-- End of picture text -->

_Hình 4. Bộ component, chế độ Tối._

## **9. Bộ chọn giao diện**

- **Vị trí:** menu tài khoản trên topbar, mục "Giao diện" (Hình 1, 2).
  Trang đăng ký, điều khoản và lỗi đăng nhập nhận lựa chọn đã lưu hoặc mặc định Theo hệ thống;
  UI-04 không thêm bộ chọn mới vào các trang này.

- **Lựa chọn:** Sáng · Tối · Hệ thống, dạng nhóm 3 nút có icon SVG, đi bằng phím mũi tên (radiogroup).

- **Mặc định:** Hệ thống (theo Windows/macOS), tự đổi khi người dùng đổi chế độ máy.

- **Lưu:** cookie `digix_theme=system|light|dark`, thời hạn 1 năm, `Path=/`,
  `SameSite=Lax`, `Secure` khi chạy HTTPS. Cookie là **lựa chọn** của người dùng, không phải
  giá trị sáng/tối đã tính ra; không gắn với tài khoản ở phiên bản này.

- **Kỹ thuật:** root layout đọc cookie và xuất `<html data-theme="system|light|dark">`
  ngay trong HTML đầu tiên. Giá trị không hợp lệ trở về `system`. CSS định nghĩa bộ token chung
  cho `:root[data-theme="light"]`, `:root[data-theme="dark"]` và
  `:root[data-theme="system"]` theo `prefers-color-scheme`; khi chọn Hệ thống, media query
  tự cập nhật mà không cần ghi lại cookie hay đợi JavaScript. Đặt `color-scheme` tương ứng
  cho điều khiển native. Đổi lựa chọn cập nhật cookie và thuộc tính `data-theme` cùng lúc.
  Không phụ thuộc vào `dark:` Tailwind dựa trực tiếp trên hệ điều hành; trong vùng UI-04,
  utility cần màu phải đọc semantic token. Không đổi giao diện landing và Keycloak.

- **Phủ phạm vi:** token dùng chung đặt ở lớp CSS toàn cục, component workspace vẫn giới hạn
  selector trong `.ws-root`. Đăng ký/điều khoản chuyển alias màu trong `register.css` sang
  token dùng chung; trang lỗi đăng nhập chỉ chuyển CSS/phần hiển thị riêng của nó,
  không đổi style landing chung.
  Loại bỏ quy tắc nền/chữ tự đổi theo `prefers-color-scheme` hiện tại của `globals.css`
  **trong vùng đã chuyển theme** để không có hai nguồn quyết định theme. Trường hợp trang tĩnh hoặc
  cache phải bảo đảm HTML ban đầu tôn trọng cookie. Chấp nhận root layout đọc cookie khiến
  HTML theo request (không cache nguyên trang chung cho mọi người); kiểm tra hiệu năng và
  CSS landing không đổi hiển thị. Không dùng localStorage làm nguồn theme thứ hai.

- **Truy cập:** bộ chọn là một `radiogroup` có nhãn, Tab vào/ra nhóm, phím mũi tên đổi
  lựa chọn, Space chọn; icon chỉ bổ trợ cho nhãn chữ và có trạng thái được chọn rõ ràng.

## **10. Kế hoạch triển khai UI-04**

1. **PR 1 — nền tảng token:** kiểm kê từng màu theo vị trí và trạng thái; thêm token theo
   vai trò cho giá trị Sáng **đúng CSS hiện tại**, bao gồm alias cho các trang trong phạm vi.
   Chưa chuẩn hóa bo góc, kính mờ hay màu theo bảng nếu khác màu hiện tại.

2. **PR 1 — chuyển nơi sử dụng:** chuyển `--ws-c-*` và màu hardcode theo từng nhóm
   (sidebar, topbar, nội dung, đăng ký/điều khoản, lỗi đăng nhập). Script chỉ hỗ trợ liệt kê
   và kiểm tra; ánh xạ phải review theo vai trò, không thay tự động chỉ theo mã hex.
   Ảnh chụp trước/sau phải tương đương; phần ngoại lệ ghi rõ.

3. **PR 2 — UI-04:** triển khai Sáng/Tối/Hệ thống, cookie, SSR, các trang thuộc UI-04
   và màu Tối; chuẩn hóa màu Sáng/bo góc theo bảng một cách tường minh.

4. **PR 2 — UI-04:** kính mờ, nền dự phòng, đốm nền, chuyển động, icon SVG.

5. **Nghiệm thu:** test token đủ cho cả ba lựa chọn; đổi hệ điều hành khi đang chọn Hệ thống;
   tải mới/deep link/đi qua đăng ký → workspace không nháy sai theme; cookie sai hoặc không có;
   sidebar không có kính mờ; focus/keyboard, giảm chuyển động, trình duyệt không hỗ trợ blur
   và chế độ giảm trong suốt nếu có; tương phản trên nền kính xấu nhất; ảnh workspace,
   đăng ký, điều khoản, lỗi đăng nhập ở Sáng/Tối × 1280px/375px. Kiểm tra landing/Keycloak
   không đổi ngoài ý muốn.

Chốt tách PR 1 (không đổi giao diện) và PR 2 (thay giao diện) để dễ review, dễ kiểm tra hồi quy.

## **11. Quyết định thiết kế**

1. Chế độ Tối dùng teal sáng `#2BB5A7`; chữ trên nút chính là `#04211E`.

2. Kính mờ 85% cho topbar/thẻ/panel, 94% cho menu/hộp thoại; không đạt tương phản
   trong bối cảnh thật thì tăng độ đặc hoặc dùng nền đặc, không cố giữ hiệu ứng.

3. Người dùng mới mặc định **Theo hệ thống**.

4. Tách PR chuyển token riêng; PR này không thay đổi giao diện.

5. Landing và theme Keycloak không thuộc UI-04; không đổi tài liệu UI/UX v2.5
   hay mở rộng thiết kế này thành thiết kế toàn ứng dụng.
