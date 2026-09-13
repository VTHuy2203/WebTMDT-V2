# RBAC và ownership matrix

## Vai trò

- `BUYER`: quyền mua hàng của user đã đăng nhập.
- `SELLER_STAFF`: đọc/xử lý đơn được giao, không quản trị tiền hay thành viên.
- `SELLER_MANAGER`: quản lý listing, inventory và vận hành order trong shop.
- `SELLER_OWNER`: toàn quyền shop, payout và thành viên (trừ quyền platform).
- `SUPPORT`: hỗ trợ user/order, không có quyền tài chính hoặc secret mặc định.
- `MODERATOR`: duyệt catalog/report/dispute theo phạm vi.
- `FINANCE_ADMIN`: reconciliation, refund/payout theo hạn mức.
- `ADMIN`: quản trị platform thông thường; sensitive permission cấp riêng.
- `SUPER_ADMIN`: break-glass, bắt buộc MFA và audit; không bỏ qua business invariant.

## Matrix

`O` = tài nguyên của mình, `S` = shop đang quản lý, `A` = toàn hệ thống,
`P` = cần permission nhạy cảm riêng, `-` = không cho phép.

| Năng lực | Buyer | Staff | Manager | Owner | Support | Moderator | Finance | Admin | Super |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Product public read | A | A | A | A | A | A | A | A | A |
| Cart/checkout | O | O | O | O | O | O | O | O | O |
| Buyer order read | O | O | O | O | A | A | A | A | A |
| Seller order read/process | - | S | S | S | - | A | A | A | A |
| Listing create/edit | - | - | S | S | - | A | - | A | A |
| Inventory manage | - | - | S | S | - | - | - | A | A |
| Seller payout request | - | - | - | S | - | - | - | A | A |
| Product/seller moderation | - | - | - | - | - | A | - | A | A |
| Dispute view/respond | O | S | S | S | A | A | A | A | A |
| Refund approve | - | - | - | - | - | - | P | P | A |
| Payout approve | - | - | - | - | - | - | P | P | A |
| Wallet adjustment | - | - | - | - | - | - | P | P | A |
| Digital credential reveal | O | P/S | P/S | P/S | - | P | - | P | P |
| KYC sensitive read | - | - | - | O/masked | - | P | P | P | P |
| User password reveal | - | - | - | - | - | - | - | disabled | P/break-glass |
| Audit read | - | - | - | S/limited | - | P | P | P | A |
| Permanent ban | - | - | - | - | - | - | - | P | P |

## Permission keys

`PRODUCT_WRITE`, `PRODUCT_REVIEW`, `INVENTORY_WRITE`, `ORDER_READ`,
`ORDER_PROCESS`, `SHOP_MEMBER_MANAGE`, `PAYOUT_REQUEST`, `PAYOUT_APPROVE`,
`REFUND_APPROVE`, `WALLET_ADJUST`, `DISPUTE_RESOLVE`, `USER_SUSPEND`,
`USER_PERMANENT_BAN`, `KYC_SENSITIVE_READ`, `INVENTORY_CREDENTIAL_REVEAL`,
`USER_PASSWORD_REVEAL`, `AUDIT_READ`.

## Evaluation order

1. Authenticate session and reject revoked/reused token.
2. Reject `SUSPENDED`, `BANNED`, `DELETED` user.
3. Verify global permission and, với seller, active shop membership.
4. Enforce ownership using IDs loaded server-side; never accept `shopId` as proof.
5. Enforce current aggregate state and optional re-auth/MFA/dual approval.
6. Write audit/security event for sensitive allow and deny decisions.

Cross-tenant lookup should normally return `404` to avoid resource enumeration.

