# Giai đoạn 2 — Runbook hạ tầng chịu tải

## Trạng thái triển khai (2026-09-14)

| Hạng mục | Code/local integration | Staging/production |
|---|---|---|
| Redis catalog cache | Đạt: cache-aside, TTL theo loại dữ liệu, single-flight trong tiến trình, versioned invalidation, fail-open | Cần đo hit ratio và memory policy trên staging |
| Socket.IO scale-out | Đạt: Redis adapter; test hai Socket.IO server truyền room event qua Redis; hai API container healthy sau Nginx `ip_hash` ở profile `phase2-ha` | Cần lặp lại sau load balancer staging thật |
| Meilisearch | Đạt: ranked search, typo tolerance, filter/sort, PostgreSQL fallback, outbox worker, rebuild command | Cần sizing, backup và alert task lỗi trên staging |
| GHN | Đạt: quote theo trọng lượng/địa chỉ và tạo vận đơn theo API GHN; không fallback phí giả khi GHN lỗi | Chờ token, shop ID, địa chỉ kho và test account GHN |
| CDN media | Đạt: immutable cache metadata và URL CDN chỉ cho PRODUCT/SHOP/REVIEW; tài liệu riêng vẫn qua signed URL | Chờ domain CDN và origin access policy |
| PostgreSQL | Đạt: PgBouncer transaction pool và hai index catalog đã migrate/test local | Cần tuning theo connection limit và slow-query data staging |
| Load test | Đạt local HA: 15.001 request/30 giây, 499,98 RPS, lỗi 0%, p95 7,57 ms qua Nginx và hai API healthy | Chưa chạy trên staging cô lập có dữ liệu gần production |

## Biến môi trường bắt buộc

- Runtime: `DATABASE_URL` trỏ PgBouncer, `REDIS_URL`, `MEILISEARCH_URL`, `MEILISEARCH_API_KEY`.
- Catalog: `CATALOG_RATE_LIMIT_MAX` (mặc định 750) và `CATALOG_RATE_LIMIT_WINDOW_MS` (mặc định 1000 ms).
- Migration: dùng kết nối PostgreSQL trực tiếp (`DIRECT_URL`) bằng cách gán nó thành `DATABASE_URL` cho lệnh `prisma migrate deploy`; không chạy migration qua transaction pool.
- GHN staging: `SHIPPING_PROVIDER=GHN`, `GHN_API_URL`, `GHN_TOKEN`, `GHN_SHOP_ID`, `GHN_FROM_DISTRICT_ID`. Nên lưu `districtId` và `wardCode`; nếu thiếu, backend đối chiếu tên tỉnh/quận/phường với GHN legacy master data. Tạo vận đơn còn cần tên, số điện thoại và dòng địa chỉ. Với danh mục hành chính hai cấp mới, bật `GHN_NEW_ADDRESS_MODEL=true` sau khi dữ liệu tên tỉnh/phường đã lấy từ GHN v3.
- CDN: `CDN_PUBLIC_BASE_URL=https://cdn.example.com`. Origin phải đọc được đúng prefix public của bucket; không mở public các purpose tài liệu/KYC.

Không dùng các secret local trong `docker-compose.yml` ở staging/production. Cấp chúng từ secret manager và xoay khóa theo môi trường.

## Khởi động và kiểm tra local

```powershell
docker compose up -d postgres pgbouncer redis meilisearch minio
$env:DATABASE_URL='postgresql://marketplace:marketplace@localhost:5433/marketplace?schema=public'
npx prisma migrate deploy --schema backend/prisma/schema.prisma
$env:DATABASE_URL='postgresql://marketplace:marketplace@localhost:6432/marketplace?schema=public&connection_limit=5'
$env:MEILISEARCH_URL='http://localhost:7700'
$env:MEILISEARCH_API_KEY='local-meilisearch-key-change-me'
npm run search:reindex --workspace=@marketplace/worker
$env:REDIS_INTEGRATION_URL='redis://localhost:6379'
npm run test:redis-adapter --workspace=@marketplace/api
docker compose --profile phase2-ha up -d api api-secondary load-balancer
docker run --rm --network webtmdt_default `
  -e BASE_URL=http://load-balancer/api/v1 -e TARGET_RPS=500 -e DURATION=30s `
  -v ${PWD}/tests/load:/scripts:ro grafana/k6:1.8.1 run /scripts/catalog.k6.js
```

Nếu Redis hoặc Meilisearch mất kết nối, catalog vẫn đọc PostgreSQL. Đây là degraded mode có chủ đích; phải alert để tránh vận hành lâu trong trạng thái này.

## Load test và bằng chứng nghiệm thu

Chạy `tests/load/catalog.k6.js` trên staging cô lập. Lưu cùng kết quả:

- commit SHA và cấu hình tài nguyên của từng service;
- số API replica, PgBouncer pool size, kích thước database/index;
- Redis hit ratio và eviction count;
- k6 summary với RPS, p50/p95/p99 và error rate;
- log một client chat duy trì kết nối qua load balancer trong khi scale/restart một API replica;
- request/response đã redaction của GHN staging và đối chiếu phí trên GHN dashboard.

Không dùng kết quả localhost để tick DoD staging.

### Bằng chứng local gần nhất

Ngày 2026-09-14, lần chạy đầu tiên bị 14.881 HTTP 429 vì giới hạn toàn cục
120 request/phút. Catalog sau đó được đặt giới hạn riêng 750 request/giây (vẫn
có throttling, không bypass guard) và thêm test metadata chống hồi quy. Lần chạy
lại qua `load-balancer:80` đạt 15.001/15.001 response HTTP 200, 0% lỗi và p95
7,57 ms. Cả `api` và `api-secondary` đều ở trạng thái healthy; readiness trả
`database`, `redis`, `objectStorage`, `search` đều `up`.

Meilisearch thật cũng được nạp một document tạm, truy vấn sai chính tả
`dien thoia` trả đúng `Dien thoai chuyen nghiep`, sau đó document đã được xoá.
Đây là bằng chứng integration local, không phải staging approval.

## CDN production

1. Dùng origin access riêng (CloudFront OAC hoặc cơ chế tương đương) thay vì public toàn bucket.
2. Chỉ route object public của PRODUCT/SHOP/REVIEW qua CDN; tài liệu nhạy cảm tiếp tục dùng API/signed URL.
3. Tôn trọng `Cache-Control: public, max-age=31536000, immutable`. Object key là UUID bất biến nên thay ảnh phải tạo key mới.
4. Bật TLS, giới hạn MIME, rate limit và log cache status. Purge chỉ dùng khi có sự cố pháp lý/bảo mật, không dùng trong luồng cập nhật thông thường.

## Lý do thiết kế

- PgBouncer chạy transaction mode theo yêu cầu tương thích Prisma; bản local là 1.24 nên không cần cờ legacy `pgbouncer=true`.
- Socket.IO Redis adapter dùng Pub/Sub. Nếu cho phép long-polling, load balancer vẫn cần sticky session; WebSocket-only không có yêu cầu affinity này.
- Search index được cập nhật từ `OutboxEvent`, không dual-write trực tiếp trong request. BullMQ retry xử lý lỗi tạm thời; `search:reindex` phục hồi toàn index.
- GHN lỗi trả 503 rõ ràng thay vì âm thầm tính 30.000đ, tránh ghi sai tổng tiền khi môi trường đã chọn nhà vận chuyển thật.

Tài liệu tham chiếu chính thức: [Prisma + PgBouncer](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/pgbouncer), [Socket.IO Redis adapter](https://socket.io/docs/v4/redis-adapter/), [Meilisearch typo tolerance](https://www.meilisearch.com/docs/resources/internals/typo_tolerance), [GHN fee API](https://api.ghn.vn/home/docs/detail?id=125), [GHN create order API](https://api.ghn.vn/en/docs/order/create), [Cloudflare Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/).
