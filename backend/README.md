# Marketplace Backend

Backend chạy được cho ba client Buyer, Seller và Admin. Nguồn yêu cầu là
`../THIET_KE_BACKEND_WEBSITE_THUONG_MAI_DIEN_TU.md`; contract frontend hiện tại
được đối chiếu từ `../packages/api-client/src/httpRepository.ts`.

## Kiến trúc được chốt

- Modular monolith NestJS, tách process `api` và `worker` nhưng dùng chung domain.
- PostgreSQL + Prisma; SQL trực tiếp trong transaction cho `FOR UPDATE SKIP LOCKED`.
- Redis cho cache, rate limit và BullMQ. S3/MinIO cho media private/public.
- REST `/api/v1`, OpenAPI là contract nguồn; WebSocket chỉ cho notification/chat/status.
- Transactional outbox cho mọi side effect sau commit.
- Access token ngắn hạn, refresh-token rotation bằng cookie; RBAC + resource policy.
- Tiền là `BigInt` theo đơn vị nhỏ nhất; thời gian UTC; public ID là UUID.

## Mã triển khai

- API NestJS: `../apps/api/src`
- Worker BullMQ: `../apps/worker/src`
- Schema và migration: `prisma/schema.prisma`, `prisma/migrations`
- Container API/worker/PostgreSQL/Redis/MinIO: `../docker-compose.yml`
- Upload presigned URL và media streaming, chat Socket.IO, notification/email,
  shipment adapter, eKYC adapter, after-sales và payout đã được triển khai.
- Provider bên ngoài dùng biến môi trường; ở local có adapter `LOCAL` để chạy
  end-to-end mà không cần credential thật.

## Tài liệu bàn giao

1. [Domain glossary](docs/DOMAIN_GLOSSARY.md)
2. [Database ERD chi tiết](docs/DATABASE_ERD_DETAIL.md)
3. [Prisma schema](prisma/schema.prisma)
4. [RBAC matrix](docs/RBAC_MATRIX.md)
5. [State machines](docs/STATE_MACHINE_SPEC.md)
6. [OpenAPI v1](openapi/openapi.yaml)
7. [Security threat model](docs/SECURITY_THREAT_MODEL.md)
8. [SePay integration](docs/SEPAY_INTEGRATION_SPEC.md)
9. [Frontend API mapping](docs/FE_API_MAPPING.md)
10. [Implementation backlog](docs/BACKEND_IMPLEMENTATION_BACKLOG.md)

## Boundary module

```text
Identity -> Seller -> Catalog -> Product -> Inventory
                                      |         |
                                      v         v
Engagement <- AfterSales <- Fulfillment <- Commerce <- Payment
                                  |            |
                                  +-> Finance <-+
Governance and Audit observe every boundary
```

Không module nào truy cập repository của module khác trực tiếp. Giao tiếp đồng bộ
qua application service công khai; side effect bất đồng bộ qua outbox. `Commerce`
là transaction owner của checkout; `Payment` là transaction owner của webhook;
`Finance` là nguồn sự thật duy nhất cho số dư.

## Quyết định còn cần chủ sản phẩm phê duyệt

- Không triển khai kho mật khẩu đăng nhập có thể giải mã mặc định. Admin chỉ phát
  reset link/mật khẩu tạm. Nếu bật password vault phải có KMS, MFA, ticket và dual approval.
- Chốt biểu phí, thời gian giữ tiền, refund/payout và trường hợp SePay thừa/thiếu.
- Chốt retention theo tư vấn pháp lý cho KYC, tài chính, chat và credential.
- Nhận SePay sandbox credential và bí mật webhook trước integration test.
