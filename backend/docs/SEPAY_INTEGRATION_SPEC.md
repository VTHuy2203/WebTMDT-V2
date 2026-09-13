# SePay integration specification

## Configuration

Required production values: webhook authentication secret/API key, bank identifier,
account number/name, public API base URL and payment TTL. Startup fails when missing;
the development simulator is never registered in production.

## Intent

`POST /checkout/order-groups` creates a unique opaque payment code such as
`MP<random base32>`, exact `amount`, `VND`, expiry and provider metadata. QR URL/data is
constructed server-side from allowlisted configuration. A new attempt creates a new
intent version; an old expired code is never silently rebound.

## Webhook processing

1. Enforce body size/content type and capture raw body for signature verification.
2. Authenticate with SePay's configured mechanism before trusting any field.
3. Normalize external transaction ID, amount, currency, content and occurred time.
4. Persist event/dedup result quickly. Invalid auth returns 401/403; known duplicate returns 200.
5. In a DB transaction, insert unique `(provider, external_transaction_id)`, extract exact
   payment code, lock intent and compare amount/currency/expiry.
6. Exact active match posts payment/order/inventory/ledger/outbox atomically.
7. Missing code, mismatch or late payment creates reconciliation; never auto-delivers.
8. Return 200 after durable result. Notification/delivery run from outbox workers.

## Matching table

| Case | Intent | Transaction | Order/inventory |
|---|---|---|---|
| Exact amount/code before expiry | PAID | linked | PAID; reservation SOLD |
| Underpayment | REVIEW_REQUIRED | linked | unchanged/reserved until policy |
| Overpayment | REVIEW_REQUIRED by default | linked | unchanged until review |
| No unique code | unchanged | unlinked | reconciliation OPEN |
| Duplicate external ID | unchanged | existing | return prior success |
| Paid after expiry | REVIEW_REQUIRED | linked | never reclaim/reassign inventory |

## Reconciliation commands

`approve-match`, `reject`, `refund-unmatched` and `close` require finance permission,
reason, idempotency key and audit. Approval re-runs the same domain command used by an
automatic exact match; it does not patch statuses directly.

## Test vectors

- Valid exact payment, bad auth, changed raw-body signature, duplicate event ID,
  duplicate transaction under different event ID.
- Correct code under/over amount, mixed case/noisy transfer text, multiple code-like tokens.
- Webhook concurrent with expiry worker, repeated admin approval and payment already refunded.

Actual header names and signing canonicalization must be pinned to the contracted SePay
account documentation/sandbox before implementation; do not guess them in production.

