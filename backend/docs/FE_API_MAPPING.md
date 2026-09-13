# Frontend to backend API mapping

Base URL canonical là `/api/v1`. Cột legacy là URL hiện có trong
`packages/api-client/src/httpRepository.ts`; adapter frontend nên chuyển dần, backend
không duy trì endpoint nguy hiểm vô thời hạn.

## Buyer

| Màn hình/năng lực | Canonical API | Legacy cần map |
|---|---|---|
| Search/detail/featured/compare | `GET /products`, `/products/{slug}`, `/products/featured`, `/products/compare` | `/products/search`, `/products/slug/{slug}` |
| Category/brand/filter | `GET /categories`, `/brands`, `/categories/{slug}/tech-filters` | giống hiện tại |
| Cart CRUD/select | `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/{id}` | giữ tương thích |
| Checkout | `POST /checkout/preview`, `POST /checkout/order-groups` | `/checkout/create-order` |
| Payment modal | `GET /payments/{id}`, `/payments/{id}/status` | bỏ `simulate-success` ngoài dev/test |
| Order list/detail | `GET /orders`, `/orders/{id}` | giữ tương thích |
| Cancel/confirm | `POST /orders/{id}/cancel`, `/orders/{id}/confirm-received` | digital `/confirm` map sang command chung |
| Delivery | `GET /digital-deliveries/{orderItemId}`, `POST .../reveal`, `.../report-issue` | legacy đang dùng `orderId`; adapter phải dùng orderItemId |
| Warranty/return | `GET /warranties`, `POST /warranty-claims`, `POST /returns` | `/warranties/claims` có alias chuyển tiếp |
| Shop/review/follow | `GET /shops/{slug}`, `/shops/{id}/products`, review/follow command | gần như hiện tại |

## Seller

| Năng lực | Canonical API | Thay đổi quan trọng |
|---|---|---|
| Dashboard/finance | `GET /seller/dashboard`, `/seller/finance`, `POST /seller/payouts` | money trả string trong JSON nếu vượt safe integer |
| Listing | `GET/POST /seller/products`, `PATCH /seller/products/{id}`, `POST .../submit-review` | DTO riêng cho mỗi product type, không `Partial<Product>` |
| Physical stock | `POST /seller/inventory/adjust-stock` | bỏ patch stock tuyệt đối không có reason/version |
| Digital inventory | `GET /seller/inventory`, `POST /seller/inventory/items`, `POST /seller/inventory/import`, enable/disable | hợp nhất `/game-inventory` và `/app-inventory`; DTO discriminated |
| Order | `GET /seller/orders`, `POST /seller/orders/{id}/accept`, `/mark-shipped` | bỏ `PATCH .../status` tùy ý |
| App fulfillment | `POST /seller/app-orders/{id}/complete`, `/resend-invite` | giữ command cụ thể |

## Admin

| Năng lực | Canonical API | Thay đổi quan trọng |
|---|---|---|
| Seller/product review | `POST /admin/seller-applications/{id}/review`, `/admin/products/{id}/review` | action enum + reason |
| User support | `GET /admin/users/{id}`, `PATCH /admin/users/{id}/profile`, ban/unban/reset-password | bỏ `PUT Partial<AdminManagedUser>`, bỏ trả `password` |
| Finance | `POST /admin/wallet-adjustments`, reconciliation/refund/payout commands | không nhận `newBalance` |
| Shop sanction | warn/suspend/ban/reactivate command riêng | reason bắt buộc, audit |
| Secret/KYC | endpoint reveal riêng | MFA/re-auth + reason/ticket + `no-store` |
| Audit | `GET /admin/audit-logs` cursor pagination | permission nhạy cảm |

## Response migration

Success envelope thống nhất:

```json
{"success":true,"data":{},"meta":{"requestId":"req_...","nextCursor":null}}
```

Error envelope:

```json
{"success":false,"error":{"code":"INVENTORY_OUT_OF_STOCK","message":"Sản phẩm đã hết hàng","details":{},"requestId":"req_..."}}
```

Adapter phải đọc `data`; list lớn dùng cursor. Các field `allowedActions` do backend
tính. Frontend không tự suy trạng thái payment, inventory, warranty hoặc permission.

## Thứ tự tích hợp

1. Auth/session và public catalog.
2. Cart + preview/create order + payment status.
3. Order/delivery/reveal.
4. Seller listing/inventory/order.
5. Admin moderation/support/finance.
6. After-sales/chat/notification.

