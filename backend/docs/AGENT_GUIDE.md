# AGENT GUIDE — Nâng cấp WebTMDT thành sàn Thương mại điện tử chuyên nghiệp

> **Đối tượng đọc:** AI Agent (Claude Code, Cursor, v.v.) hoặc kỹ sư được giao nhiệm vụ cải thiện và deploy dự án `WebTMDT`.
> **Mục tiêu:** Đưa dự án hiện tại (monorepo NestJS + Prisma + 3 frontend React/Vite) từ trạng thái "MVP đã có kiến trúc tốt" lên trạng thái **production-grade**, an toàn để vận hành sàn TMĐT thật của công ty, có khả năng chịu tải và mở rộng.

---

## 0. Nguyên tắc bắt buộc trước khi Agent đụng vào code

Đây là hệ thống **xử lý tiền thật** (ví người bán, ledger, thanh toán SePay, tồn kho). Agent phải tuân thủ nghiêm ngặt các nguyên tắc sau trong MỌI thay đổi:

1. **Không bao giờ sửa logic transaction (`$transaction`) mà không hiểu rõ toàn bộ luồng.** Các file nhạy cảm nhất:
   - `apps/api/src/commerce/commerce.service.ts` (đặt hàng, tồn kho, thanh toán, settlement ví)
   - `backend/prisma/schema.prisma` (đặc biệt các model `Wallet`, `LedgerTransaction`, `LedgerEntry`, `InventoryReservation`, `PaymentIntent`, `IdempotencyRecord`)
2. **Viết test TRƯỚC khi refactor bất kỳ đoạn code nào liên quan đến tiền/tồn kho** (xem Giai đoạn 1). Không có test = không được merge thay đổi vào các module `commerce`, `auth`, `platform` (wallet/ledger).
3. **Không xoá cơ chế idempotency, optimistic locking (`version` field), hay raw SQL có điều kiện (`WHERE stock_on_hand - stock_reserved >= qty`)** — đây là cơ chế chống race condition, nhìn tưởng "code lạ" nhưng là chủ đích.
4. **Mọi thay đổi schema Prisma phải đi kèm migration** (`npx prisma migrate dev --name <mo_ta>`), không sửa tay database.
5. **Không commit secret thật vào `.env`**. File `.env` hiện tại chỉ chứa giá trị dev/placeholder — giữ nguyên tinh thần đó, secret thật chỉ đặt trong secret manager của môi trường deploy (xem Giai đoạn 5).
6. **Luôn chạy `npm run build` + toàn bộ test suite trước khi coi một task là "hoàn thành".**
7. Khi không chắc một thay đổi có ảnh hưởng đến business logic tài chính hay không → dừng lại, viết rõ giả định, và hỏi người phụ trách thay vì đoán.

---

## 1. Bối cảnh hiện trạng (tóm tắt để Agent không cần đọc lại từ đầu)

**Kiến trúc:** Monorepo npm workspaces — `apps/api` (NestJS + Prisma + PostgreSQL), `apps/worker` (BullMQ), `apps/buyer-web` / `apps/seller-web` / `apps/admin-web` (React + Vite, SPA), `packages/*` (types, ui, validation dùng chung).

**Điểm mạnh đã có (giữ nguyên, không viết lại):**
- Data model chuẩn cho sàn TMĐT thật: `Wallet`, `LedgerTransaction`/`LedgerEntry` (sổ cái ghi kép), `OutboxEvent`, `IdempotencyRecord`, `Dispute`, `Warranty`, `ReturnRequest`, `PayoutRequest`.
- Transaction mức `Serializable` cho tạo đơn hàng, khoá tồn kho bằng UPDATE có điều kiện + `SELECT ... FOR UPDATE SKIP LOCKED`.
- Refresh-token rotation có phát hiện reuse, argon2 hash mật khẩu, khoá tài khoản sau 5 lần sai, rate limiting toàn cục, `helmet`.
- Outbox pattern + worker riêng để xử lý sự kiện bất đồng bộ.

**Nợ kỹ thuật / rủi ro đã xác định (là input cho lộ trình bên dưới):**
- Không có test tự động, không có CI/CD.
- RBAC gọi thủ công (`this.ops.requireRole(...)`) trong từng handler thay vì Guard/Decorator tập trung.
- Search sản phẩm dùng Postgres `ILIKE` thô, chưa có search engine chuyên dụng.
- WebSocket (`messaging.gateway.ts`) chưa có Redis adapter → không chạy được đa instance.
- Phí vận chuyển hard-code 30.000đ, tích hợp vận chuyển (GHN/GHTK/ViettelPost) mới là khung generic.
- Frontend buyer là SPA thuần, không SSR/SSG → yếu SEO.
- Chưa có observability (error tracking, log tập trung, APM).
- Repo có lẫn thư mục rác (`.tmp-chrome-admin`, `.tmp-chrome-seller`) và `node_modules` bị đóng gói.

---

## 2. Lộ trình 5 giai đoạn

### Cổng nghiệm thu áp dụng cho mọi giai đoạn

Để không đánh đồng "đã viết code" với "đã vận hành thật", mỗi hạng mục phải được báo cáo theo bốn mức độc lập:

1. **Implemented:** code, migration, cấu hình mẫu và unit test đã hoàn tất.
2. **Integrated:** đã chạy với dependency thật ở local/integration environment.
3. **Staging verified:** đã chạy bằng credential/domain/load balancer staging và lưu bằng chứng.
4. **Production approved:** owner nghiệp vụ/bảo mật đã duyệt; monitoring và rollback sẵn sàng.

Một blocker bên ngoài (ví dụ GitHub Actions `startup_failure` cấp tài khoản) phải được ghi nhận, nhưng không ngăn làm code của giai đoạn sau nếu thay đổi độc lập và toàn bộ kiểm chứng local vẫn xanh. Tuyệt đối không tick staging/production chỉ dựa trên mock hoặc localhost.

### Báo cáo hiện trạng — 2026-09-14

**Giai đoạn 1:** coverage commerce/auth đều trên 70%; 61 test API xanh; RBAC đã chuyển sang `@Roles()` + global `RolesGuard`; Sentry và structured logging/correlation/redaction/Loki-Alloy-Grafana đã tích hợp; dependency audit sạch; repo không track `.env`, coverage, build output hay thư mục browser tạm. Code đã được commit/push lên repo V2. Run `34780049794` đã tạo workflow/job thật nhưng GitHub từ chối khởi động step với annotation tài khoản bị khoá do billing; vì vậy CI/branch protection vẫn là external blocker. Ngoài ra chưa có bốn DSN thật để xác nhận event trên dashboard Sentry.

**Giai đoạn 2:** toàn bộ code và integration local đã đạt, gồm hai API sau Nginx, Redis adapter, Meilisearch thật và preflight k6 500 RPS (0% lỗi, p95 7,57 ms). Chi tiết và các external gate còn lại ở `backend/docs/PHASE1_PHASE2_ACCEPTANCE.md` và `backend/docs/PHASE2_RUNBOOK.md`. Các DoD cần credential/domain/staging không được coi là hoàn tất cho tới khi có bằng chứng thật.

Agent thực hiện **tuần tự**, mỗi giai đoạn có Definition of Done (DoD) rõ ràng. Không chuyển giai đoạn khi DoD chưa đạt.

### Giai đoạn 1 — Nền móng chất lượng (ưu tiên cao nhất, làm trước mọi tính năng mới)

**Nhiệm vụ:**
1. Dọn repo:
   - Xoá `.tmp-chrome-admin/`, `.tmp-chrome-seller/` khỏi source control.
   - Đảm bảo `.gitignore` chặn `node_modules`, `dist`, `.env`, các thư mục cache trình duyệt/test tạm.
   - Khởi tạo `git init` + commit đầu tiên sạch nếu repo chưa có `.git`.
2. Viết test tự động, ưu tiên theo thứ tự:
   - Unit test cho `commerce.service.ts`: `addCart`, `createOrder` (race condition hết hàng), `confirmReceived`/`confirmDigitalReceived` (settlement ví — kiểm tra không âm/dương sai số dư), `cancel` (giải phóng tồn kho đúng).
   - Unit test cho `auth.service.ts`: login sai 5 lần bị khoá, refresh token reuse bị revoke cả family, reset password vô hiệu hoá session cũ.
   - Integration test cho webhook SePay (`commerce.controller.ts` → `processWebhook`): sai chữ ký bị từ chối, đúng mã đơn + đúng số tiền mới set `PAID`.
   - Test cho `operations.service.ts` phần `requireRole` — đảm bảo mọi endpoint admin có role check tương ứng với mức độ nhạy cảm.
3. Thiết lập CI (GitHub Actions hoặc tương đương): lint → type-check → test → build, chạy trên mọi PR, bắt buộc pass mới merge.
4. Chuyển RBAC từ gọi thủ công sang `@Roles()` decorator + `RolesGuard` tập trung (dùng `APP_GUARD` như cách `ThrottlerGuard` đang được đăng ký trong `app.module.ts`), để không thể "quên" check quyền khi thêm endpoint mới.
5. Thêm error tracking (Sentry hoặc self-host tương đương) ở cả `apps/api` và 3 frontend, cấu hình qua biến môi trường.
6. Thêm structured logging tập trung (request id, user id nếu có, không log secret/PII) — mở rộng `request-logging.interceptor.ts` hiện có.

**DoD Giai đoạn 1:**
- [x] Coverage test ≥ 70% cho `commerce/`, `auth/` module.
- [ ] CI xanh trên nhánh chính, chặn merge khi test fail.
- [x] Không còn `requireRole` gọi tay trong controller — thay bằng decorator.
- [ ] Sentry (hoặc tương đương) nhận được lỗi giả lập từ cả 4 app.
- [x] Repo không còn file rác, `.env` không bị commit.

---

### Giai đoạn 2 — Hạ tầng sẵn sàng chịu tải

**Nhiệm vụ:**
1. [x] **Cache:** Redis cache-aside cho catalog, TTL theo endpoint, versioned invalidation và degraded mode khi Redis lỗi.
2. [x] **WebSocket scale-out:** `@socket.io/redis-adapter` và integration test truyền room event qua hai server.
3. [x] **Search engine:** Meilisearch có relevance/typo/filter/sort, PostgreSQL fallback, outbox sync và full reindex command.
4. [x] **Vận chuyển:** provider GHN cho quote/tạo vận đơn; `LOCAL_SHIPPING_FEE` chỉ còn là local mode. Việc xác minh GHN staging vẫn chờ credential thật.
5. [x] **CDN:** immutable object metadata, CDN public URL cho media công khai và signed access cho media riêng. Việc gắn domain/origin policy vẫn chờ hạ tầng thật.
6. [x] **Database:** PgBouncer transaction pool; migration bổ sung index brand/status-price và status/published-at.

**DoD Giai đoạn 2:**
- [ ] Load test (k6/Artillery) đạt mục tiêu (ví dụ: 500 request/giây trang catalog, p95 < 300ms) trên staging.
- [ ] Chat hoạt động đúng khi chạy ≥ 2 instance API sau load balancer.
- [ ] Tìm kiếm trả kết quả có xếp hạng liên quan, hỗ trợ gõ sai chính tả cơ bản.
- [ ] Phí vận chuyển hiển thị đúng theo API nhà vận chuyển thật ở môi trường staging.

---

### Giai đoạn 3 — SEO & trải nghiệm mua sắm (có thể làm song song Giai đoạn 2)

**Nhiệm vụ:**
1. Đánh giá và (khuyến nghị) migrate `apps/buyer-web` từ Vite SPA sang framework hỗ trợ SSR/SSG (Next.js) — chỉ cho buyer-web, giữ nguyên `seller-web`/`admin-web` dạng SPA vì không cần SEO.
2. Thêm structured data (schema.org `Product`, `Offer`, `BreadcrumbList`) cho trang sản phẩm/danh mục.
3. Tối ưu Core Web Vitals: lazy-load ảnh, responsive image (srcset), code-splitting theo route.
4. Sitemap.xml + robots.txt tự động sinh theo danh mục/sản phẩm active.

**DoD Giai đoạn 3:**
- [ ] Google Search Console index được trang sản phẩm mẫu trên staging/production.
- [ ] Lighthouse SEO score ≥ 90, Performance ≥ 80 trên trang sản phẩm và trang chủ.

---

### Giai đoạn 4 — Vận hành & tính năng mở rộng kinh doanh

**Nhiệm vụ:**
1. Tự động hoá đối soát và rút tiền người bán (`PayoutRequest` model đã có sẵn — cần luồng xử lý + phê duyệt + tích hợp chuyển khoản thật).
2. Hoàn thiện luồng `Dispute`/`ReturnRequest` end-to-end (hiện đã có model, cần UI + quy trình xử lý cho seller/admin).
3. Thêm cơ chế chống gian lận cơ bản: giới hạn số đơn/tài khoản/IP trong khung thời gian, cảnh báo đơn giá trị bất thường, kiểm tra trùng thiết bị khi đăng ký hàng loạt.
4. Đánh giá tách service theo domain (order, payment, catalog) **chỉ khi** có số liệu tải thực tế cho thấy cần thiết — không tách sớm khi chưa cần.
5. Cân nhắc app di động (React Native, tái sử dụng `packages/types`, `packages/api-client`) sau khi web ổn định.

**DoD Giai đoạn 4:**
- [ ] Seller có thể yêu cầu rút tiền và nhận tiền qua luồng tự động, có log audit đầy đủ (`AuditLog` model).
- [ ] Admin xử lý được khiếu nại từ giao diện, có thông báo cho cả hai bên.

---

### Giai đoạn 5 — Deploy sàn production của công ty

**Nhiệm vụ:**
1. **Containerize:** Viết Dockerfile cho `apps/api`, `apps/worker`, và build static cho 3 frontend (nginx serve hoặc CDN + object storage).
2. **Môi trường:** Tách rõ 3 môi trường `development` → `staging` → `production`, mỗi môi trường có database, Redis, secret riêng.
3. **Secret management:** Dùng secret manager của nhà cung cấp hạ tầng (AWS Secrets Manager / GCP Secret Manager / Doppler / Vault) — **không đặt secret thật trong file `.env` commit vào repo**, kể cả staging.
4. **Database production checklist:**
   - Bật backup tự động hàng ngày + point-in-time recovery.
   - `validateEnvironment()` trong `main.ts` đã bắt buộc các secret ≥ 32 ký tự khi `NODE_ENV=production` — đảm bảo pipeline deploy set đúng biến này.
   - Chạy `prisma migrate deploy` (không dùng `migrate dev`) trong pipeline CI/CD khi lên production.
5. **CI/CD deploy:** Mở rộng CI ở Giai đoạn 1 thành CD — build image, chạy migration, deploy, health check (`health.controller.ts` đã có sẵn endpoint), rollback tự động nếu health check fail.
6. **Domain, TLS, WAF:** Cấu hình HTTPS bắt buộc, WAF/Cloudflare chặn traffic bất thường trước khi tới API.
7. **Checklist bảo mật trước khi go-live:**
   - [ ] Đổi toàn bộ secret mặc định trong code (`local-access-secret-change-me-32chars` và tương tự) bằng giá trị ngẫu nhiên thật.
   - [ ] Xác nhận webhook SePay dùng `SEPAY_WEBHOOK_SECRET` thật, không phải giá trị dev.
   - [ ] Tắt các endpoint dev-only (`payments/:id/simulate-success` đã tự chặn khi `NODE_ENV=production`, kiểm tra lại double-check).
   - [ ] Chạy penetration test hoặc security scan (OWASP ZAP) cho `apps/api` trước khi mở public.
   - [ ] Rà soát CORS `CORS_ORIGINS` chỉ cho phép domain thật của công ty.
8. **Giám sát production:** Uptime monitoring, alert khi tỉ lệ lỗi thanh toán/webhook tăng bất thường, dashboard theo dõi ví/ledger (đối soát số dư `Wallet` với tổng `LedgerEntry` định kỳ để phát hiện lệch sổ sớm).

**DoD Giai đoạn 5:**
- [ ] Deploy production thành công qua pipeline tự động, có rollback.
- [ ] Toàn bộ checklist bảo mật ở trên đã tick.
- [ ] Có dashboard/alert cho các chỉ số kinh doanh cốt lõi: đơn hàng thành công/thất bại, thời gian phản hồi API, lỗi webhook.

---

## 3. Quy ước làm việc cho Agent trong suốt quá trình

- **Mỗi task = 1 nhánh git riêng + 1 PR nhỏ**, không gộp nhiều thay đổi không liên quan.
- **Luôn viết/migrate test trước, code sau** đối với module `commerce`, `auth`, `platform` (wallet).
- **Cập nhật `Docs/API_CONTRACTS.md`** (đã có sẵn trong `Docs/api-contracts/`) mỗi khi thay đổi hợp đồng API.
- **Không tự ý đổi giá trị mặc định về tiền/phí/thời gian hết hạn** (ví dụ: thời gian giữ tồn kho 15 phút, thời hạn checkout session 10 phút) mà không có yêu cầu rõ ràng — đây là quyết định nghiệp vụ, không phải kỹ thuật thuần.
- Khi hoàn thành mỗi giai đoạn, Agent viết báo cáo ngắn (what changed, what tested, what risk remains) trước khi chuyển sang giai đoạn kế tiếp.

---

## 4. Thứ tự thực thi khuyến nghị (tóm tắt 1 dòng mỗi bước)

1. Dọn repo + `.gitignore`.
2. Viết test cho luồng tiền/tồn kho.
3. Thiết lập CI bắt buộc pass test.
4. Chuyển RBAC sang Guard/Decorator tập trung.
5. Thêm error tracking + logging tập trung.
6. Thêm Redis cache + Redis adapter WebSocket.
7. Tích hợp search engine chuyên dụng.
8. Nối API vận chuyển thật.
9. CDN cho ảnh/tài sản tĩnh.
10. SSR/SSG cho buyer-web + SEO.
11. Tự động hoá payout + hoàn thiện dispute/return.
12. Chống gian lận cơ bản.
13. Containerize + CI/CD deploy + secret management.
14. Checklist bảo mật + penetration test.
15. Go-live + giám sát production.
