# Security threat model

## Tài sản ưu tiên

Restricted: password/session token, credential hàng số, KYC, bank data và encryption
keys. Confidential: PII, address, chat/evidence và payment payload. Financial ledger,
order/payment state và audit cần cả confidentiality lẫn integrity.

## Threats và controls

| Threat | Boundary | Controls bắt buộc | Test |
|---|---|---|---|
| Credential stuffing | Auth | Argon2id, account+IP limit, progressive lock, MFA admin | repeated login |
| Refresh replay | Session | hashed rotating token, family reuse detection, revoke all | replay old token |
| IDOR/cross-shop | API/repository | ownership policy from DB, scoped repository, 404 cross-tenant | seller A/order B |
| Mass assignment | DTO | command DTO allowlist; forbid unknown fields | inject role/status/balance |
| Oversell/race | DB | row lock, constraints, short transaction, idempotency | parallel last-unit buy |
| Fake/replayed webhook | Payment | provider auth/HMAC, unique event and transaction IDs, payload hash | duplicate/tamper |
| Secret leakage | Logs/API | redaction, separate summary/reveal DTO, `no-store`, analytics denylist | snapshot/log scan |
| Insider reveal abuse | Admin | explicit permission, MFA/re-auth, ticket/reason, rate/alert, immutable audit | unauthorized reveal |
| Upload malware | Media | quarantine, magic-byte/size validation, scan, re-encode, signed URL | polyglot/upload bomb |
| SSRF | Media/integration | no arbitrary server fetch; egress allowlist; URL parser | metadata/callback URL |
| XSS/CSRF | Browser edge | CSP, output encoding; refresh cookie Secure/HttpOnly/SameSite + origin/CSRF check | cross-origin request |
| Ledger tampering | Finance | append-only roles, balanced deferred check, approval and reconciliation | unbalanced posting |

## Encryption

- TLS everywhere; database/storage backups encrypted.
- Credential: random DEK per record, AEAD AES-256-GCM, DEK wrapped by KMS master key;
  store ciphertext, wrapped DEK, nonce, auth tag and key version separately.
- Do not implement reversible user-password vault by default. Password verification uses
  Argon2id. Admin support uses one-time reset flow.
- Key rotation re-wraps DEK asynchronously; plaintext never enters job payload.

## HTTP baseline

CORS exact allowlist, Helmet/CSP, body limit, validated content type, request ID,
parameterized queries, whitelist sort/filter, rate limits per IP/user/device and secure
cookie path. Reveal responses add `Cache-Control: no-store, private`, `Pragma: no-cache`,
`Referrer-Policy: no-referrer` and never return through GraphQL/cache/proxy storage.

## Security gates

SAST/dependency/container scan, secret scan, migration review, authorization integration
tests and restore drill gate production. Break-glass activity pages on-call immediately;
audit export is write-once/retention-locked where infrastructure supports it.

