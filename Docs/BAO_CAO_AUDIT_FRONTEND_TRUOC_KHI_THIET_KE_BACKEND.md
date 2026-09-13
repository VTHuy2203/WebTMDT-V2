# Báo cáo audit Frontend trước khi thiết kế Backend

## 1. Kết luận điều hành

Frontend hiện có nền tảng nghiệp vụ khá rộng, được chia thành ba ứng dụng `buyer-web`, `seller-web`, `admin-web` và các package dùng chung. Mô hình sản phẩm đã bao gồm đồng thời:

- Hàng vật lý (`PHYSICAL`)
- Tài khoản game (`DIGITAL_GAME_ACCOUNT`)
- Tài khoản ứng dụng (`DIGITAL_APP_ACCOUNT`)

Tài khoản ứng dụng là tính năng **được bổ sung song song**, không thay thế tài khoản game. Tuy vậy, FE chưa sẵn sàng để nối thẳng vào backend production. TypeScript kiểm tra thành công, nhưng một số luồng chính vẫn chỉ là giao diện/mock hoặc đang dùng mô hình dữ liệu chưa đủ chặt. Nếu thiết kế backend dựa nguyên trạng vào các contract hiện tại, backend sẽ phải mang theo nhiều sai lệch và lỗ hổng khó sửa về sau.

Khuyến nghị: sửa các mục P0 và chốt lại contract nghiệp vụ trước khi triển khai backend hoàn chỉnh.

## 2. Phạm vi đã kiểm tra

- Cấu trúc monorepo, cấu hình build và biến môi trường.
- Ba cổng Buyer, Seller, Admin.
- Đăng nhập, phân quyền và lưu phiên.
- Danh mục, chi tiết sản phẩm, giỏ hàng, checkout, SePay và đơn hàng.
- Luồng tài khoản game, giao thông tin số, bảo hành và tranh chấp.
- Luồng tài khoản ứng dụng, gói bán, thời hạn và bảo hành.
- Đăng bán, kho tài khoản, duyệt sản phẩm và quản trị shop.
- API contracts, HTTP repositories, mock repositories, type dùng chung và validation.
- Khả năng build, typecheck, lint và test.

## 3. Kết quả kiểm chứng kỹ thuật

| Hạng mục | Kết quả | Nhận xét |
|---|---|---|
| TypeScript buyer | Đạt | `tsc` không báo lỗi |
| TypeScript seller | Đạt | `tsc` không báo lỗi |
| TypeScript admin | Đạt | `tsc` không báo lỗi |
| Vite build | Chưa xác nhận được từ ZIP | `node_modules` trong ZIP được đóng từ hệ điều hành khác và thiếu native Rolldown binding cho Linux; cần clean install |
| Lint | Không thực sự chạy | Root gọi workspace lint với `--if-present`, nhưng cả ba app không có script lint |
| Unit/integration/E2E test | Không có | Chưa thấy test runner hoặc file test thực tế |
| Type safety | Trung bình | Strict mode có ích, nhưng còn khoảng 95 vị trí dùng `any` |

ZIP đang chứa cả `node_modules`, `dist` và file build cache. Nên loại khỏi gói nguồn, dùng lockfile và cài dependency sạch trong CI.

## 4. Ưu điểm

1. **Phân tách theo vai trò tốt:** Buyer, Seller và Admin là ba app riêng, phù hợp với việc triển khai, phân quyền và mở rộng độc lập.
2. **Phạm vi nghiệp vụ đầy đủ:** đã có catalog, giỏ hàng, checkout, thanh toán, đơn hàng, bảo hành, khiếu nại, shop, tài chính, kiểm duyệt và báo cáo.
3. **Không làm mất tính năng cũ:** tài khoản game và tài khoản ứng dụng cùng tồn tại trong menu, type và màn hình quản trị.
4. **Có lớp API abstraction:** Repository/contract là nền tảng tốt để thay mock bằng HTTP.
5. **Có package dùng chung:** types, config, validation, auth, utils và UI giúp tránh lặp giữa ba cổng.
6. **TypeScript strict đang hoạt động:** ba app đều typecheck thành công.
7. **Tài khoản ứng dụng đã có khái niệm plan:** thời lượng dịch vụ, bảo hành, tồn kho, cách giao hàng và trường người mua cung cấp đã được nghĩ tới.
8. **Có ý thức bảo vệ credential:** đã có giao diện che/hiện và sao chép bí mật; đây là điểm khởi đầu tốt, nhưng backend vẫn phải thực thi quyền xem và audit.

## 5. Vấn đề P0 — phải sửa trước khi nối backend thật

### P0.1. Chế độ HTTP vẫn trộn dữ liệu mock

Trong `packages/api-client/src/index.ts`, các repository vật lý chuyển theo `apiMode`, nhưng shop luôn dùng mock; game account, kho game, giao hàng số và tranh chấp số cũng luôn dùng mock. Chỉ nhóm app account có HTTP adapter.

Hậu quả:

- Đổi biến môi trường sang HTTP không tạo ra một hệ thống HTTP hoàn chỉnh.
- Buyer có thể lấy sản phẩm thật nhưng nhận giao hàng/tranh chấp giả.
- Không thể kiểm thử tích hợp backend một cách đáng tin cậy.

Khắc phục:

- Mỗi domain phải có cặp `Mock...Repository` và `Http...Repository` đầy đủ.
- Khởi tạo toàn bộ repository từ một composition root duy nhất.
- Cấm import fixture/mock trực tiếp từ view.
- Thêm kiểm thử chạy toàn app ở cả hai mode.

### P0.2. Biến môi trường không đúng chuẩn Vite

`packages/config/src/index.ts` và `.env.example` dùng tiền tố `NEXT_PUBLIC_*`. Vite mặc định chỉ expose biến có tiền tố `VITE_*`. Vì vậy build production có nguy cơ âm thầm dùng URL mặc định `api.marketplace.local` và tiếp tục ở mock mode.

Khắc phục:

- Đổi sang `VITE_API_BASE_URL`, `VITE_API_MODE`, `VITE_APP_ENV`, `VITE_CDN_URL`.
- Validate cấu hình ngay lúc khởi động; thiếu biến production phải fail build/start, không fallback sang mock.
- Không đưa tài khoản ngân hàng thanh toán vào bundle FE; lấy từ payment intent của backend.

### P0.3. Phiên đăng nhập và phân quyền chưa an toàn

`packages/auth/src/index.ts` persist token vào `localStorage`; `packages/api-client/src/http.ts` đọc token từ đó để gắn Bearer. Seller và Admin không có route guard/role guard thực sự, nên mở trực tiếp app vẫn thấy portal. Không thấy refresh-token flow, kiểm tra hết hạn, xử lý 401 tập trung hay logout toàn phiên.

Khắc phục:

- Access token ngắn hạn giữ trong memory; refresh token để trong cookie `HttpOnly`, `Secure`, `SameSite`.
- Có `/auth/me`, `/auth/refresh`, `/auth/logout`, thu hồi session và xoay refresh token.
- Route guard ở FE chỉ để UX; backend phải kiểm tra RBAC và quyền sở hữu tài nguyên ở mọi endpoint.
- Bỏ nút đăng nhập nhanh buyer/seller/admin khỏi production bundle.

### P0.4. Luồng mua sản phẩm số chưa xuyên suốt

`apps/buyer-web/src/App.tsx` đưa sản phẩm số vào `cartApi.addItem`, nhưng `MockCartRepository.addItem` chỉ tìm trong danh sách hàng vật lý. `CartItem` không có discriminator bắt buộc cho loại sản phẩm, `planId`, loại giao hàng hoặc dữ liệu buyer cung cấp. `CheckoutView.tsx` đoán hàng số bằng tiền tố ID/slug như `ga_`, `acc-`, `game`; cách này không tin cậy cho tài khoản ứng dụng.

Checkout vẫn yêu cầu địa chỉ và phương thức vận chuyển, sau đó dùng giá trị giả cho đơn số. Preview tổng tiền còn bị FE tự sửa thay vì coi backend là nguồn sự thật.

Khắc phục dữ liệu:

```ts
type CartItem = PhysicalCartItem | GameAccountCartItem | AppAccountCartItem;
```

- Physical: `variantId`, số lượng, shipping requirement.
- Game account: `listingId` hoặc `skuId`, quantity thường bằng 1, delivery policy.
- App account: `planId`, fulfillment type, warranty snapshot, buyer-field submission reference.
- Backend tính toàn bộ giá, phí, giảm giá và quyền thao tác; FE chỉ render kết quả.
- Checkout phải tách shipping group và digital group.

### P0.5. Checkout nhiều shop đang sai mô hình

Mock checkout tạo một `Order` có một shop nhưng có thể nhận nhiều item từ nhiều shop. Marketplace thực tế phải tạo nhóm thanh toán và một seller order cho mỗi shop.

Khắc phục:

- `CheckoutSession` chứa các `SellerOrderDraft`.
- Một `PaymentIntent` có thể thanh toán cho `OrderGroup`.
- Mỗi seller chỉ xem và xử lý order thuộc shop của mình.
- Hoàn tiền/tranh chấp/tất toán phải theo seller order hoặc order item, không mặc định theo toàn giỏ.

### P0.6. FE yêu cầu người mua cung cấp mật khẩu tạm thời

`SellerAppAccountProductFormView.tsx` tạo mặc định trường `buyer_temp_password` và mô tả người mua gửi mật khẩu để shop đăng nhập nâng cấp. `AppAccountProductDetailView.tsx` cũng hướng dẫn tương tự. Điều này mâu thuẫn với chính schema validation đang cấm password/OTP và tạo rủi ro chiếm tài khoản, rò rỉ credential, khiếu nại và trách nhiệm pháp lý.

Khắc phục bắt buộc:

- Không thu mật khẩu, OTP, cookie, session token, recovery code hoặc 2FA secret của người mua.
- Chỉ cho phép cơ chế chính thức: invitation, family/team seat, license key, redeem code, OAuth/delegated authorization hoặc tài khoản mới do shop bàn giao.
- Schema backend phải chặn từ khóa/loại trường nhạy cảm; admin không thể cấu hình vượt qua.
- Xóa password mẫu/fallback như `MatKhauVip@2026`; dòng kho thiếu credential phải bị reject, không tự sinh giá trị mặc định.

### P0.7. Endpoint giả lập thanh toán nằm trong HTTP production path

`IPaymentApi` có `simulatePaymentSuccess`; `HttpPaymentRepository` gọi `/payments/:id/simulate-success` và `SePayModal` có thể kích hoạt nó. Đây phải là công cụ test, không phải contract production.

Khắc phục:

- Loại endpoint khỏi production API và production bundle.
- FE chỉ poll/subcribe trạng thái payment intent.
- Backend xác minh webhook SePay, chữ ký, số tiền, nội dung chuyển khoản và chống xử lý lặp.
- Tất cả create order/payment/refund cần `Idempotency-Key`.

### P0.8. Dữ liệu định danh và ngân hàng bị gộp vào DTO công khai

Type `Shop` chứa cả dữ liệu public lẫn tên chủ shop, CCCD, email, điện thoại, ngân hàng, doanh thu và tranh chấp. Nếu tái sử dụng type này cho API buyer, dữ liệu nhạy cảm rất dễ bị trả thừa.

Khắc phục:

- Tách `PublicShopDto`, `SellerOwnShopDto`, `AdminShopSummaryDto`, `AdminShopSensitiveDto`.
- CCCD và tài khoản ngân hàng phải mã hóa ở rest, mask mặc định, chỉ mở qua endpoint riêng có quyền, lý do và audit log.
- Không dựa vào việc FE ẩn field để bảo vệ dữ liệu.

## 6. Vấn đề P1 — cần xử lý trong giai đoạn chốt contract

### P1.1. Điều hướng chỉ là state nội bộ

Cả ba app dùng `currentView/currentTab` thay cho router. Refresh mất màn hình hiện tại; deep link, back/forward, bookmark và route guard không hoạt động.

Nên dùng React Router với URL thật, route params, protected layouts và lazy loading theo route.

### P1.2. Đơn hàng số bypass API

`OrdersView.tsx` import `mockDigitalOrders` trực tiếp và tự chuyển trạng thái hoàn tất trong local state. Khi backend có thật, màn hình này vẫn không phản ánh trạng thái server.

Mọi query/mutation phải đi qua repository; trạng thái và `allowedActions` phải do backend trả về.

### P1.3. Validation được khai báo nhưng không được dùng ở form/API boundary

Package Zod có nhiều schema nhưng các app gần như không gọi `parse/safeParse`. Vì vậy validation thủ công đang không đồng nhất, thể hiện rõ ở việc schema cấm password trong khi form vẫn tạo password field.

Nên tích hợp schema trực tiếp vào submit, đồng thời parse response từ backend ở adapter. Có thể dùng React Hook Form + Zod resolver.

### P1.4. Type app account có nhiều alias và `any`

`AppAccountPlan` có các cặp trùng nghĩa như `duration/serviceDuration`, `warranty/warrantyDuration`, `benefits/features`, `stock/availableStock`, `requiredBuyerFields/buyerFieldDefinitions`. `AppAccountProduct` còn nhiều trường `any`.

Nên chọn một schema canonical duy nhất, giữ adapter migration riêng nếu cần đọc dữ liệu cũ. `Product.type` phải là bắt buộc.

### P1.5. Upload ảnh đang dùng base64/URL thay vì media pipeline

Seller form dùng `FileReader.readAsDataURL`, đưa base64 vào state/DTO. Chưa có upload service, signed URL, kiểm tra MIME thực, virus scan, resize/re-encode hoặc dọn file rác.

Backend nên cấp presigned upload, xác nhận asset sau khi scan, rồi product chỉ lưu `mediaAssetId`.

### P1.6. Bộ đếm và polling SePay có lỗi vòng đời

Countdown khởi tạo cục bộ, không reset chắc chắn theo payment mới, không lấy `expiresAt` làm nguồn sự thật và polling có thể tiếp tục sau trạng thái hết hạn.

Nên derive thời gian từ server, dừng ở mọi terminal status, hủy request khi đóng modal/đổi payment và xử lý retry có backoff.

### P1.7. Component quá lớn

`SellerAppAccountProductFormView.tsx` hơn 3.000 dòng; nhiều màn hình khác 800–1.100 dòng. Điều này làm sửa nghiệp vụ, test và review rất rủi ro.

Tách theo feature: product basics, plan editor, fulfillment, buyer fields, warranty, inventory import, media và publish review. Đưa state phức tạp vào reducer/hook chuyên biệt.

### P1.8. Contract backend hiện chưa đủ phạm vi

Tài liệu API hiện chủ yếu mô tả hàng vật lý. Còn thiếu hoặc chưa đủ chi tiết: auth/session, game account, app account, inventory, secure delivery, dispute, webhook, media upload, notification/chat, pagination, idempotency, error catalog, audit và optimistic concurrency.

Không nên sinh backend trực tiếp từ contract hiện tại.

## 7. Vấn đề P2 — chất lượng và khả năng vận hành

- Chưa có ESLint thực sự, formatter policy và CI gate.
- Chưa có unit, integration, contract hoặc E2E tests.
- Root dùng Vite 8/plugin React 6 trong khi workspace khai báo Vite 5/plugin React 4; cần đồng bộ version.
- Chưa có query cache chuẩn; nhiều `useEffect/useState`, fixture và mutation cục bộ dễ race/stale data.
- Feature flags được khai báo nhưng chưa điều khiển route/menu thực tế.
- Nhiều chuỗi tiếng Việt hard-code dù đã có i18n helper.
- Chưa có pagination/filter contract có cursor cho danh sách lớn.
- Accessibility mới ở mức một phần; cần kiểm tra keyboard, focus, dialog, form error và screen reader.
- Có tài liệu extension cũ và mới song song; cần đánh dấu tài liệu canonical để tránh đội BE triển khai nhầm.

## 8. Mô hình nghiệp vụ nên chốt trước khi thiết kế backend

| Domain | Quyết định cần chốt |
|---|---|
| Product | Ba loại sản phẩm tồn tại song song; type là bắt buộc và bất biến sau khi có đơn |
| App plan | Duration và warranty là hai value object riêng; hỗ trợ preset 1, 3, 6, 12, 14, 18, 24 tháng và nhập tay có giới hạn |
| Inventory | Credential mã hóa; không log plaintext; reserve atomically; mỗi item chỉ bán/giao một lần |
| Checkout | Tách theo shop và fulfillment; giá do server tính |
| Payment | Payment intent có expiry; webhook idempotent; không có nút giả lập ở production |
| Order | Order group cho người mua; seller order cho từng shop; order item lưu snapshot sản phẩm/plan/bảo hành |
| Delivery | Chỉ buyer sở hữu đơn đã thanh toán mới reveal; reveal có audit, rate limit và hạn chế cache |
| Warranty | `warrantyEndsAt` tính từ rule đã snapshot; không phụ thuộc sản phẩm bị sửa sau đó |
| Dispute | Có state machine, evidence asset, SLA, quyết định admin và ledger bồi hoàn |
| Shop/Admin | RBAC + tenant ownership + audit log; DTO nhạy cảm tách riêng |

## 9. Thứ tự khắc phục đề xuất

### Giai đoạn 1 — khóa rủi ro

1. Xóa luồng thu password/OTP/cookie/session của người mua.
2. Sửa auth/session và bổ sung guard cho seller/admin.
3. Tách mock khỏi HTTP; loại simulate payment khỏi production.
4. Sửa cấu hình Vite/env và không fallback mock trong production.

### Giai đoạn 2 — chuẩn hóa domain và contract

1. Chốt discriminated union cho ba loại sản phẩm và cart item.
2. Thiết kế checkout nhiều shop, order group và seller order.
3. Chuẩn hóa app plan, duration, warranty và fulfillment.
4. Tách public/private/admin DTO; thêm pagination, idempotency, error model và state machine.

### Giai đoạn 3 — tái cấu trúc FE để tích hợp BE

1. Thêm router và protected routes.
2. Dùng query/mutation layer, bỏ import fixture trong view.
3. Gắn Zod vào form và HTTP boundary.
4. Tách component lớn và xây media upload pipeline.

### Giai đoạn 4 — quality gate

1. ESLint + format + no-floating-promises/security rules.
2. Unit test cho pricing/state machine/validation.
3. Integration test với MSW hoặc test backend.
4. Playwright E2E cho đăng nhập, mua vật lý, mua tài khoản game, mua tài khoản ứng dụng, thanh toán, giao hàng, bảo hành và tranh chấp.
5. CI chạy clean install, typecheck, lint, test và build cho cả ba app.

## 10. Điều kiện để bắt đầu triển khai backend

Backend có thể bắt đầu phần nền tảng ngay (identity, RBAC, database migration, audit, outbox, object storage), nhưng chưa nên đóng cứng API commerce cho đến khi hoàn thành các quyết định ở Giai đoạn 1 và 2.

Definition of Ready tối thiểu:

- Có state machine chính thức cho product, inventory, order, payment, delivery, warranty, dispute và payout.
- Có OpenAPI canonical, error catalog và auth matrix.
- Có ERD và quy tắc ownership/multi-tenant.
- Có quy tắc bảo vệ credential/PII và retention.
- Có contract checkout nhiều shop và ba loại sản phẩm.
- FE không còn phụ thuộc fixture trong HTTP mode.

## 11. Kết luận

FE có giá trị lớn về mặt mô phỏng nghiệp vụ và phạm vi màn hình, nhưng hiện là prototype chức năng hơn là một client production-ready. Điểm mạnh nhất là bao phủ domain rộng và đã giữ đồng thời tài khoản game với tài khoản ứng dụng. Điểm yếu lớn nhất là ranh giới mock/HTTP, mô hình cart-checkout-order cho hàng số, bảo mật credential và sự thiếu nhất quán giữa validation với UI.

Nên dùng bản FE này làm nguồn xác định yêu cầu giao diện, không dùng nguyên contract hiện tại làm nguồn duy nhất để sinh backend.
