# State machine specification

Only domain services perform transitions. Every command takes aggregate version and
is atomic with history/outbox writes.

## Product

| From | Command | To | Guard |
|---|---|---|---|
| DRAFT | submit | PENDING_REVIEW | seller owns shop; listing complete |
| PENDING_REVIEW | approve | ACTIVE | reviewer has `PRODUCT_REVIEW` |
| PENDING_REVIEW | reject | REJECTED | non-empty reason |
| REJECTED | revise | DRAFT | seller owns shop |
| ACTIVE | hide | HIDDEN | owner policy or moderator reason |
| HIDDEN | restore | ACTIVE | no active sanction |
| ACTIVE/HIDDEN | archive | ARCHIVED | no mutation of historical snapshots |

## Payment

| From | Event/command | To | Side effect |
|---|---|---|---|
| CREATED | publish instructions | PENDING | schedule expiry |
| PENDING | exact verified transaction | PAID | sell reservations, ledger, outbox |
| PENDING | mismatch | REVIEW_REQUIRED | reconciliation ticket |
| PENDING | expiry | EXPIRED | release reservations |
| REVIEW_REQUIRED | approve match | PAID | same atomic paid workflow |
| REVIEW_REQUIRED | reject | REJECTED | preserve received transaction |
| PAID | partial refund posted | PARTIALLY_REFUNDED | balanced ledger |
| PAID/PARTIALLY_REFUNDED | full refund posted | REFUNDED | balanced ledger |

Duplicate provider transactions return existing result and do not transition again.
Payment received after expiry always enters reconciliation; it never auto-delivers.

## Order

| From | Command/event | To | Guard |
|---|---|---|---|
| PENDING_PAYMENT | payment confirmed | PAID | payment exact and reservation intact |
| PENDING_PAYMENT | expire/cancel | EXPIRED/CANCELLED | no captured payment |
| PAID | start fulfillment | PROCESSING | actor owns shop or worker |
| PROCESSING | fulfill all items | DELIVERED | shipping proof or digital delivery ready |
| DELIVERED | buyer confirm/SLA | COMPLETED | no blocking dispute |
| PAID/PROCESSING/DELIVERED | open dispute | DISPUTED | within policy window |
| DISPUTED | replace/continue | PROCESSING | resolution posted |
| DISPUTED | full refund | REFUNDED | refund ledger committed |

Seller order status is derived conservatively from item statuses. Order group payment
status is not overwritten by a single seller order.

## Inventory item

`DRAFT -> AVAILABLE -> RESERVED -> SOLD -> DELIVERED`.
`RESERVED -> AVAILABLE` only on valid expiry/cancel. `AVAILABLE <-> DISABLED` is a
manual stock command. `QUARANTINED` and `REVOKED` are terminal from the commerce
perspective. Transition to `RESERVED` requires a row lock and active-reservation
uniqueness; transition to `SOLD` requires matching order group/payment intent.

## Seller application and dispute

- Seller application: `DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED|REJECTED`;
  rejected hồ sơ có thể `REJECTED -> DRAFT` khi policy cho phép.
- Dispute: `OPEN -> SELLER_RESPONSE_PENDING -> ADMIN_REVIEW ->
  RESOLVED_REPLACED|RESOLVED_REFUNDED|DISMISSED`. Resolve là command idempotent,
  bắt buộc notes và audit.

## Concurrency rules

- Optimistic version trên product, plan và aggregate chỉnh sửa bởi người dùng.
- Pessimistic row lock cho stock, inventory allocation, payment posting và payout.
- Một idempotency key scope theo `actor_id + method + route`; lưu body hash.
- Consumer outbox có inbox/dedup key; delivery semantics là at-least-once.

