# Biên bản nghiệm thu kỹ thuật — Giai đoạn 1 và 2

Ngày kiểm chứng: 2026-09-14
Phạm vi: commit đang chuẩn bị đẩy lên `VTHuy2203/WebTMDT-V2`.

## Kết luận

Phần kỹ thuật có thể tự động kiểm chứng tại local đã hoàn tất. Hai giai đoạn
chưa được phép gắn nhãn production-approved vì còn các cổng phụ thuộc dịch vụ
bên ngoài: GitHub Actions/branch protection, bốn Sentry DSN thật, GHN staging và
CDN/domain staging. Không dùng mock hoặc localhost để thay thế các cổng đó.

## Giai đoạn 1

| Điều kiện | Kết quả | Bằng chứng |
|---|---:|---|
| Test API | Đạt | 60/60 test pass |
| Coverage commerce | Đạt | statements/lines 81,46%; branches 75,28%; functions 98% |
| Coverage auth | Đạt | statements/lines 94,25%; branches 81,39%; functions 94,44% |
| RBAC tập trung | Đạt | `@Roles()` + global `RolesGuard`; test toàn bộ endpoint đặc quyền |
| Logging/Sentry code | Đạt local | redaction, correlation ID, 5xx stack và capture test |
| Dependency security | Đạt | `npm audit` trả 0 vulnerability sau clean install |
| Repo hygiene | Đạt local | `.env`, output build/coverage, browser temp và runlog đều ignored/không track |
| CI + branch protection | Chờ external | GitHub Actions từng `startup_failure/jobs=0`; cần run xanh sau push và bật required check |
| Sentry dashboard 4 app | Chờ credential | cần DSN riêng cho API/buyer/seller/admin và event ID/dashboard thật |

## Giai đoạn 2

| Điều kiện | Kết quả | Bằng chứng |
|---|---:|---|
| Redis cache/invalidation | Đạt local | cache-aside, TTL, single-flight, versioned invalidation, fail-open |
| WebSocket scale-out | Đạt local | Redis adapter cross-node pass; hai API healthy sau Nginx sticky routing |
| Search | Đạt local | Meilisearch thật trả đúng kết quả cho typo `dien thoia`; PostgreSQL fallback và reindex có test |
| Database pooling/index | Đạt local | migration deploy; truy vấn Prisma qua PgBouncer transaction mode |
| Load 500 RPS | Đạt local | 15.001 request, 499,98 RPS, lỗi 0%, p95 7,57 ms |
| GHN | Đạt code/mock | fail-closed và payload/address mapping có test; chờ credential staging để đối chiếu phí thật |
| CDN | Đạt code/mock | public immutable/private signed access có test; chờ domain và origin policy thật |

## Cổng owner phải cung cấp để đóng nghiệm thu staging

1. GitHub Actions hoạt động và quyền bật branch protection/required check.
2. Bốn Sentry DSN staging (API, buyer, seller, admin).
3. GHN staging token, shop ID, district/ward kho và tài khoản dashboard đối chiếu.
4. Domain CDN staging cùng quyền cấu hình origin access.
5. Một staging cô lập có dữ liệu gần production để chạy k6 đủ 2 phút và lưu số
   liệu tài nguyên/Redis/PgBouncer; kết quả local 30 giây chỉ là preflight.

Không tạo thêm repo nếu GitHub tiếp tục lỗi giống hai repo hiện tại; tiếp tục
escalate Ticket #4753362 với run ID `34738824351` và `34740175721`.
