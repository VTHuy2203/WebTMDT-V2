# Domain glossary

## Thuật ngữ canonical

| Thuật ngữ | Định nghĩa và invariant |
|---|---|
| User | Tài khoản đăng nhập của một người; trạng thái khóa được kiểm tra trước mọi authorization. |
| Session | Một refresh-token family trên một thiết bị. Chỉ lưu hash token; reuse sẽ revoke cả family. |
| Seller application | Hồ sơ xin bán hàng, tách khỏi shop và dữ liệu public. |
| Shop | Tenant bán hàng. Mọi dữ liệu seller-private luôn có `shop_id`. |
| Shop member | Liên kết user-shop cùng vai trò nội bộ; không suy quyền chỉ từ global role. |
| Product | Listing chung, có đúng một `product_type`; type bất biến sau order đầu tiên. |
| Physical variant | SKU có giá và tồn kho định lượng của hàng vật lý. |
| App plan | Gói ứng dụng có giá, fulfillment, service duration và warranty riêng. |
| Inventory item | Đơn vị cấp phát; payload hàng số luôn mã hóa, không nằm trong DTO danh sách. |
| Stock level | Số lượng vật lý theo variant; `available >= 0`, thay đổi bằng movement/reservation. |
| Reservation | Quyền giữ inventory/stock có TTL cho một order group. Chỉ một reservation active trên một inventory item. |
| Cart | Ý định mua có thể cũ; không phải nguồn giá/tồn kho. |
| Checkout snapshot | Kết quả tính giá ngắn hạn, có hash/version và expiry; server phải xác minh lại khi đặt. |
| Order group | Kết quả một checkout; gom nhiều seller order và gắn payment intent. |
| Seller order | Phần đơn thuộc đúng một shop. Seller chỉ đọc/order command trong shop mình quản lý. |
| Order item snapshot | Bản bất biến của tên, loại, SKU/plan, giá, phí, duration và policy lúc mua. |
| Payment intent | Yêu cầu thu một số tiền/currency, có payment code duy nhất và expiry. |
| Payment transaction | Giao dịch provider đã nhận; `provider + external_id` duy nhất. |
| Webhook event | Payload provider đã xác thực/ghi nhận bền vững, dùng chống replay và điều tra. |
| Reconciliation | Luồng xử lý unmatched, thiếu/thừa tiền hoặc payment đến muộn. |
| Digital delivery | Quyền truy cập hàng số của một order item; response reveal luôn `no-store`. |
| Warranty | Quyền bảo hành được tính từ snapshot, không tham chiếu policy hiện tại để đổi lịch sử. |
| Ledger transaction | Một nghiệp vụ tài chính bất biến, tổng debit bằng tổng credit. |
| Ledger entry | Một vế debit/credit; không sửa/xóa sau khi post. |
| Wallet | Read model theo owner/currency; số dư authoritative được suy từ ledger. |
| Idempotency record | Kết quả mutation theo actor + route + key + body hash; body khác cùng key là conflict. |
| Outbox event | Event ghi cùng transaction với aggregate; worker publish ít nhất một lần. |
| Audit log | Nhật ký append-only của hành động nhạy cảm, không chứa secret plaintext. |

## Product và fulfillment

| Product type | Reference mua bắt buộc | Inventory |
|---|---|---|
| `PHYSICAL` | `product_variant_id` | stock level/reservation theo quantity |
| `DIGITAL_GAME_ACCOUNT` | `product_id` | từng `GAME_CREDENTIAL` riêng biệt |
| `DIGITAL_APP_ACCOUNT` | `app_plan_id` | credential, license key hoặc capacity slot |

Fulfillment ứng dụng: `PRE_CREATED_ACCOUNT`, `LICENSE_KEY`,
`BUYER_EMAIL_ACTIVATION`, `FAMILY_OR_TEAM_INVITATION`, `MANUAL_SERVICE`.
Không schema nào được yêu cầu OTP, thông tin thẻ hoặc mật khẩu email của buyer.

## Quy ước dữ liệu

- API camelCase; database snake_case.
- Giá trị tiền: integer/`BigInt`, VND là đồng; không dùng float.
- Timestamp: `timestamptz`, serialize ISO-8601 UTC.
- Public identifier: UUID; code hiển thị là chuỗi random riêng, không dùng sequence lộ traffic.
- Soft delete chỉ dùng nơi cần lưu lịch sử. Uniqueness active phải dùng partial unique index trong migration SQL.
- Secret payload được envelope-encrypt, có `key_version`; log/analytics chỉ nhận metadata đã mask.

