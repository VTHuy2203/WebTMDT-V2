# Backend implementation backlog

Mỗi story chỉ Done khi có migration/contract, authorization, audit (nếu cần), test và
observability tương ứng. P0 là launch blocker.

## Phase 1 — Foundation

- [ ] P0 Scaffold NestJS workspace `apps/api`, `apps/worker`, module boundaries và config fail-fast.
- [ ] P0 Docker Compose PostgreSQL/Redis/MinIO; health/readiness; graceful shutdown.
- [ ] P0 Prisma migration đầu gồm check constraint, pg_trgm và ledger balance enforcement.
- [ ] P0 Error envelope, request/trace ID, structured redacted logging, validation pipe.
- [ ] P0 OpenAPI CI validation và generated client compatibility check.
- [ ] P0 Transactional outbox publisher + deterministic BullMQ job IDs + dead-letter policy.

## Phase 2 — Identity, seller, governance

- [ ] P0 Register/login/logout/refresh rotation/reuse detection; Argon2id; rate limits.
- [ ] P0 RBAC seed, permission guard, shop membership policy and cross-tenant tests.
- [ ] P0 Seller application/review/shop creation; encrypted KYC metadata separation.
- [ ] P0 Audit service append-only and security-event alerts.
- [ ] P1 Admin MFA/re-auth framework; break-glass procedure.
- [ ] P0 Reset-password support flow; password reveal remains disabled by default.

## Phase 3 — Catalog, product, inventory

- [ ] P0 Category/brand/game/application catalog and versioned attribute validation.
- [ ] P0 Command DTOs for physical, game and app products; moderation state machine.
- [ ] P0 Variant/app plan pricing and immutable product type guard.
- [ ] P0 Envelope encryption service backed by KMS abstraction; no plaintext logs.
- [ ] P0 Physical stock and digital item import with per-line validation.
- [ ] P0 Reservation using row locks/`SKIP LOCKED`, expiry worker and contention tests.
- [ ] P1 Quarantine media upload, scan/re-encode pipeline and orphan cleanup.
- [ ] P1 PostgreSQL full-text/trigram search with cursor pagination.

## Phase 4 — Commerce, payment, delivery

- [ ] P0 Cart discriminated reference validation and server-side purchasability checks.
- [ ] P0 Signed/versioned checkout preview grouped by shop.
- [ ] P0 Idempotent create order-group transaction with snapshots/reservations/intent/outbox.
- [ ] P0 SePay adapter, authenticated webhook, durable dedup and reconciliation queue.
- [ ] P0 Payment/order/inventory atomic transition and balanced payment ledger.
- [ ] P0 Digital delivery worker and owner-only audited reveal with `no-store`.
- [ ] P0 Mandatory concurrency tests: last credential, five retries, webhook vs expiry.
- [ ] P1 WebSocket/SSE payment update; polling remains supported.

## Phase 5 — After-sales and finance

- [ ] P0 Warranty from immutable duration snapshot; return/dispute evidence authorization.
- [ ] P0 Partial/full refund ledger and aggregate-state derivation.
- [ ] P0 Seller pending-to-available settlement and idempotent payout workflow.
- [ ] P0 Admin wallet adjustment with approval, reason and compensating entries.
- [ ] P1 Verified-purchase review and Bayesian rating read model.
- [ ] P1 Notification/chat modules with sensitive-data filters.

## Phase 6 — Launch hardening

- [ ] P0 Switch three clients to HTTP adapter; remove production mock fallback.
- [ ] P0 E2E buyer/seller/admin paths and OpenAPI breaking-change gate.
- [ ] P0 Load tests for search, checkout, webhook and reveal; tune pool/indexes from traces.
- [ ] P0 IDOR/mass-assignment/CSRF/upload/replay security suite.
- [ ] P0 Encrypted backup + restore drill; RPO/RTO evidence.
- [ ] P0 Dashboards/alerts for latency, error, mismatch, expiry, delivery and ledger failures.
- [ ] P0 Incident/payment reconciliation/key rotation/rollback runbooks.

## Acceptance scenarios

1. Hai buyer tranh credential cuối: một order thành công, một `OUT_OF_STOCK`.
2. Năm request cùng idempotency key/body trả cùng order; body khác trả 409.
3. Webhook trùng chỉ có một transaction và một ledger transaction.
4. Payment sau expiry không nhận inventory đã tái cấp và tạo reconciliation.
5. Seller khác shop nhận 404; buyer khác không reveal được delivery.
6. Sửa app plan không đổi duration/warranty của order cũ.
7. Refund một item giữ cân bằng ledger và cập nhật đúng read model.

