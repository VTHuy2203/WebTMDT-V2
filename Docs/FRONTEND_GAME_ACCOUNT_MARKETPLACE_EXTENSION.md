<!-- markdownlint-disable MD013 -->

# FRONTEND EXTENSION SPEC — MUA BÁN TÀI KHOẢN GAME

> Tài liệu bổ sung cho `FRONTEND MARKETPLACE DESIGN SPEC — PRODUCTION-READY V2`.
> Phạm vi của tài liệu này là **frontend và API contract giả lập**. Không triển khai database, webhook hoặc xử lý thanh toán trong frontend.

---

## 0. Mục tiêu

Bổ sung loại sản phẩm **tài khoản game** vào marketplace đang có mà không phá vỡ luồng bán sản phẩm vật lý.

Hệ thống mới phải cho phép:

- người bán tạo sản phẩm tài khoản game;
- người bán nhập từng tài khoản vào kho hàng số;
- người mua tìm kiếm, xem thông tin công khai và mua tài khoản;
- sau khi backend xác nhận thanh toán, người mua vào **Đơn hàng của tôi → Xem chi tiết** để nhận thông tin đăng nhập;
- người mua sao chép từng trường, xác nhận đã kiểm tra và báo lỗi;
- người bán theo dõi số tài khoản còn bán được, đang giữ chỗ và đã bán;
- admin duyệt sản phẩm, xử lý báo cáo và tranh chấp;
- frontend chạy hoàn chỉnh bằng mock API trước khi có backend thật.

Tham khảo UX của VNLike:

- danh sách đơn hàng có bộ lọc trạng thái, tìm kiếm, mã đơn, thời gian và nút **Xem chi tiết**;
- trang chi tiết có khu vực riêng tên **Nội dung giao hàng**;
- nội dung số có thao tác sao chép.

Không sao chép nguyên giao diện, logo, màu sắc hoặc nội dung của VNLike. Chỉ tham khảo cấu trúc luồng.

---

## 1. Quyết định kiến trúc bắt buộc

### 1.1. Thêm loại sản phẩm, không tạo hệ thống tách biệt

Mở rộng `Product` bằng trường:

```ts
export type ProductType =
  | "PHYSICAL"
  | "DIGITAL_GAME_ACCOUNT";
```

Mọi trang dùng chung như Home, Search, Wishlist, Shop và Order vẫn tái sử dụng component hiện có. Component chuyên biệt chỉ được render khi:

```ts
product.type === "DIGITAL_GAME_ACCOUNT"
```

### 1.2. Một tài khoản trong kho là một đơn vị hàng riêng

Không coi tồn kho chỉ là một con số. Mỗi credential là một `GameAccountInventoryItem` riêng với trạng thái riêng.

Frontend chỉ hiển thị số lượng do API trả về:

```ts
availableStock: number;
```

Frontend không tự chọn account, không tự trừ kho và không chuyển account sang `SOLD`.

### 1.3. Tách dữ liệu công khai và dữ liệu bí mật

Thông tin được xem trước khi mua:

- game, nền tảng, máy chủ;
- rank/cấp độ;
- số skin, tướng, vật phẩm;
- phương thức đăng nhập;
- loại liên kết và khả năng đổi thông tin;
- ảnh/video chứng minh đã che dữ liệu nhạy cảm;
- chính sách bảo hành;
- thông tin và đánh giá người bán.

Thông tin chỉ xem sau khi đơn đủ điều kiện:

- username/email/số điện thoại đăng nhập;
- password;
- recovery code;
- mã 2FA hoặc secret khác;
- hướng dẫn chuyển quyền sở hữu riêng của item.

### 1.4. Frontend không quyết định giao hàng

Luồng đúng:

```text
Người mua tạo đơn
→ backend giữ một inventory item
→ chờ thanh toán
→ backend xác nhận đã thanh toán
→ backend gắn item vào order
→ frontend nhận deliveryStatus = READY
→ người mua có thể mở nội dung giao hàng
```

Không được chuyển sang “Hoàn thành” chỉ vì countdown kết thúc hoặc frontend nhận được ảnh chuyển khoản.

---

## 2. Phạm vi MVP

### Có trong MVP

- đăng ký người bán theo flow hiện có;
- tạo/sửa sản phẩm tài khoản game;
- nhập một hoặc nhiều account vào kho;
- duyệt và tìm kiếm sản phẩm;
- trang chi tiết tài khoản game;
- mua ngay hoặc mua qua giỏ hàng;
- thanh toán SePay theo flow hiện có;
- danh sách đơn hàng và trang chi tiết đơn;
- hiển thị credential có kiểm soát;
- sao chép từng trường;
- báo account lỗi/mô tả sai;
- seller inventory và seller order;
- admin moderation và dispute cơ bản;
- mock API, loading, empty, error, responsive và test critical flow.

### Chưa làm trong MVP

- đấu giá;
- thương lượng giá realtime;
- giao dịch trực tiếp ngoài hệ thống;
- tự động đăng nhập vào nhà phát hành game;
- tự động đổi mật khẩu/email cho người mua;
- escrow phức tạp;
- bán vật phẩm hoặc tiền game qua bot;
- app mobile native.

---

## 3. Vai trò và quyền

| Vai trò | Quyền chính |
| --- | --- |
| Guest | Xem danh sách và thông tin công khai |
| Buyer | Mua, xem đơn của mình, mở credential khi được phép, tạo khiếu nại |
| Seller | Tạo listing, quản lý kho account và xem đơn thuộc shop |
| Admin/Moderator | Duyệt listing, ẩn sản phẩm, xử lý báo cáo/tranh chấp |

Frontend dùng quyền do backend trả về. Không hard-code rằng cứ có route seller/admin là có quyền.

```ts
export interface GameAccountPermissions {
  canBuy: boolean;
  canEditListing: boolean;
  canManageInventory: boolean;
  canRevealDelivery: boolean;
  canReportIssue: boolean;
  canConfirmReceived: boolean;
  canModerate: boolean;
}
```

---

## 4. Routes cần bổ sung

### 4.1. Buyer Web

```text
/game-accounts
/game-accounts/[gameSlug]
/products/[slug]                       # tái sử dụng, render layout digital
/orders                                # mở rộng filter DIGITAL
/orders/[id]                           # mở rộng delivery section
/orders/[id]/report                    # tạo yêu cầu hỗ trợ/tranh chấp
/account/digital-purchases             # lối tắt tới đơn hàng số
```

### 4.2. Seller Web

```text
/seller/products/new?type=game-account
/seller/products/[id]/edit
/seller/game-account-inventory
/seller/game-account-inventory/import
/seller/game-account-inventory/[id]
/seller/digital-orders
/seller/digital-orders/[id]
```

### 4.3. Admin Web

```text
/admin/game-account-products
/admin/game-account-products/[id]
/admin/digital-orders
/admin/digital-disputes
/admin/digital-disputes/[id]
/admin/game-catalog
```

Menu chỉ xuất hiện khi feature flag bật:

```env
NEXT_PUBLIC_GAME_ACCOUNT_MARKETPLACE_ENABLED=true
```

---

## 5. Điều hướng và nhãn giao diện

Buyer header/category:

```text
Tài khoản game
```

Buyer account sidebar:

```text
GIAO DỊCH
├── Đơn hàng của tôi
├── Tài khoản game đã mua
└── Yêu cầu hỗ trợ
```

Seller sidebar:

```text
TÀI KHOẢN GAME
├── Sản phẩm
├── Kho tài khoản
├── Đơn hàng số
└── Báo cáo tồn kho
```

Admin sidebar:

```text
KIỂM DUYỆT TÀI KHOẢN GAME
├── Sản phẩm chờ duyệt
├── Đơn hàng số
├── Tranh chấp
└── Danh mục game
```

---

## 6. Data model phía frontend

### 6.1. Game catalog

```ts
export interface GameSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  platforms: GamePlatform[];
  servers: string[];
  attributeSchema: GameAttributeDefinition[];
}

export type GamePlatform =
  | "PC"
  | "MOBILE"
  | "PLAYSTATION"
  | "XBOX"
  | "NINTENDO_SWITCH"
  | "CROSS_PLATFORM";

export interface GameAttributeDefinition {
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  unit?: string;
  isFilterable: boolean;
  isPublic: boolean;
}
```

Mục đích của `attributeSchema`: mỗi game có thuộc tính khác nhau nhưng không phải sửa frontend mỗi lần admin thêm game.

### 6.2. Public product

```ts
export interface GameAccountProduct extends Product {
  type: "DIGITAL_GAME_ACCOUNT";
  game: GameSummary;
  platform: GamePlatform;
  server: string;
  publicAttributes: Record<string, string | number | boolean | string[]>;
  loginMethod: "USERNAME" | "EMAIL" | "PHONE" | "SOCIAL" | "OTHER";
  linkedServices: string[];
  changeability: {
    canChangePassword: boolean;
    canChangeEmail: boolean;
    canChangePhone: boolean;
    canRemoveLinkedServices: boolean;
  };
  deliveryMode: "AUTO_AFTER_PAYMENT" | "SELLER_CONFIRMATION";
  deliveryEstimateMinutes?: number;
  warrantyHours: number;
  availableStock: number;
  sellerCommitments: string[];
  riskNotices: string[];
}
```

### 6.3. Seller inventory summary

```ts
export type GameAccountInventoryStatus =
  | "DRAFT"
  | "VALIDATING"
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "QUARANTINED"
  | "DISABLED";

export interface GameAccountInventoryItemSummary {
  id: string;
  productId: string;
  internalCode: string;
  maskedLogin: string;
  status: GameAccountInventoryStatus;
  addedAt: string;
  updatedAt: string;
  reservedUntil?: string;
  soldOrderCode?: string;
  validationMessage?: string;
}
```

Seller list chỉ nhận `maskedLogin`; không tải password cho toàn bộ bảng.

### 6.4. Dữ liệu nhập kho

```ts
export interface CreateGameAccountInventoryItemInput {
  productId: string;
  internalCode?: string;
  credentials: {
    login: string;
    password: string;
    recoveryEmail?: string;
    recoveryCode?: string;
    twoFactorSecret?: string;
    additionalFields?: Array<{ label: string; value: string; secret: boolean }>;
  };
  privateNote?: string;
}
```

Kiểu trên chỉ dùng cho form submit. Không đưa object này vào global store, URL, query string hoặc localStorage.

### 6.5. Order list item

```ts
export interface DigitalOrderListItem {
  id: string;
  code: string;
  productName: string;
  productThumbnail: string;
  productType: "DIGITAL_GAME_ACCOUNT";
  quantity: number;
  total: number;
  currency: "VND";
  paymentStatus: PaymentStatus;
  orderStatus: DigitalOrderStatus;
  deliveryStatus: DigitalDeliveryStatus;
  createdAt: string;
  allowedActions: DigitalOrderAllowedActions;
}

export type DigitalOrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "ALLOCATING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "REFUNDED";

export type DigitalDeliveryStatus =
  | "NOT_AVAILABLE"
  | "PREPARING"
  | "READY"
  | "REVEALED"
  | "REPORTED";

export interface DigitalOrderAllowedActions {
  viewDetail: boolean;
  pay: boolean;
  cancel: boolean;
  revealDelivery: boolean;
  confirmReceived: boolean;
  reportIssue: boolean;
  review: boolean;
}
```

### 6.6. Delivery metadata và secret response

```ts
export interface DigitalDeliverySummary {
  orderId: string;
  deliveryStatus: DigitalDeliveryStatus;
  itemCount: number;
  revealedAt?: string;
  warrantyEndsAt?: string;
  instructions: string[];
  requiresReauthentication: boolean;
}

export interface RevealedGameAccountDelivery {
  deliveryId: string;
  orderId: string;
  revealedAt: string;
  credentials: Array<{
    inventoryItemId: string;
    login: string;
    password: string;
    recoveryEmail?: string;
    recoveryCode?: string;
    twoFactorSecret?: string;
    additionalFields?: Array<{ label: string; value: string }>;
  }>;
  instructions: string[];
  warrantyEndsAt?: string;
}
```

`RevealedGameAccountDelivery` chỉ tồn tại trong state cục bộ của màn hình chi tiết. Khi unmount, logout hoặc tab chuyển sang hidden quá lâu, xóa state bí mật.

---

## 7. Luồng người bán đăng tài khoản game

### 7.1. Luồng chính

```text
Seller Center
→ Sản phẩm
→ Thêm sản phẩm
→ Chọn “Tài khoản game”
→ Chọn game/nền tảng/server
→ Nhập thông tin công khai
→ Tải ảnh bằng chứng đã che dữ liệu nhạy cảm
→ Khai báo khả năng đổi thông tin + bảo hành
→ Lưu nháp/Xem trước
→ Gửi duyệt
→ Sản phẩm được duyệt
→ Nhập credential vào Kho tài khoản
→ Có item AVAILABLE
→ Listing có thể bán
```

Không cho listing hiển thị `IN_STOCK` nếu `availableStock = 0`.

### 7.2. Form tạo sản phẩm

Chia thành stepper 6 bước:

1. **Loại sản phẩm**
   - Sản phẩm vật lý.
   - Tài khoản game.
2. **Thông tin game**
   - Game.
   - Nền tảng.
   - Máy chủ/khu vực.
   - Phương thức đăng nhập.
3. **Chi tiết tài khoản**
   - Tên listing.
   - Mô tả.
   - Thuộc tính động theo game.
   - Dịch vụ đang liên kết.
   - Khả năng đổi password/email/phone.
4. **Hình ảnh và bằng chứng**
   - Ảnh đại diện.
   - Gallery.
   - Cảnh báo che UID, email, số điện thoại, QR và recovery code.
5. **Giá và chính sách**
   - Giá bán.
   - Giá so sánh nếu có.
   - Kiểu giao hàng.
   - Thời gian giao dự kiến.
   - Thời hạn bảo hành.
6. **Xem trước và cam kết**
   - Preview theo giao diện buyer.
   - Checkbox quyền sở hữu hợp pháp.
   - Checkbox không vi phạm quy định nền tảng/game.
   - Gửi duyệt.

Credential không nhập trong form sản phẩm. Sau khi tạo listing, seller nhập credential tại **Kho tài khoản**.

### 7.3. Validation form sản phẩm

- game, platform, server, title, price và ảnh đại diện là bắt buộc;
- title từ 10–120 ký tự;
- description từ 50–5.000 ký tự;
- price là số nguyên VND lớn hơn 0;
- warrantyHours theo lựa chọn backend cho phép;
- attribute bắt buộc lấy từ schema game;
- `deliveryMode = SELLER_CONFIRMATION` phải có `deliveryEstimateMinutes`;
- không cho nhập password/credential vào mô tả công khai;
- hiển thị cảnh báo nếu ảnh có vẻ chứa email, số điện thoại hoặc QR; backend vẫn phải kiểm duyệt.

### 7.4. Kho tài khoản game

Desktop dùng DataTable:

| Mã nội bộ | Sản phẩm | Login đã che | Trạng thái | Giữ chỗ đến | Đơn đã bán | Cập nhật | Thao tác |
| --- | --- | --- | --- | --- | --- | --- | --- |

Mobile dùng card list, không ép bảng tràn ngang.

Filter:

- product;
- status;
- ngày thêm;
- keyword theo internalCode hoặc maskedLogin;
- có/không có lỗi validation.

Action theo trạng thái:

| Trạng thái | Action frontend được hiển thị |
| --- | --- |
| DRAFT | Sửa, xóa |
| VALIDATING | Xem trạng thái |
| AVAILABLE | Xem tóm tắt, vô hiệu hóa |
| RESERVED | Xem thời gian giữ; không sửa credential |
| SOLD | Xem mã đơn; không sửa/xóa |
| QUARANTINED | Xem lý do, cập nhật theo quyền backend |
| DISABLED | Kích hoạt lại nếu `allowedActions` cho phép |

### 7.5. Modal nhập một account

Fields:

- sản phẩm;
- mã quản lý nội bộ;
- tài khoản/email đăng nhập;
- mật khẩu;
- email khôi phục;
- recovery code;
- 2FA secret;
- trường bổ sung;
- ghi chú riêng.

UX bắt buộc:

- password field mặc định ẩn;
- có nút hiện/ẩn riêng cho từng field;
- nút **Lưu tài khoản** disable khi đang submit;
- submit thành công phải reset toàn bộ secret form state;
- không toast lại credential;
- toast chỉ ghi “Đã thêm tài khoản vào kho”.

### 7.6. Nhập hàng loạt

MVP hỗ trợ textarea có định dạng được backend cung cấp, ví dụ:

```text
login|password|recoveryEmail|recoveryCode
```

Preview chỉ hiển thị:

- số dòng hợp lệ;
- số dòng lỗi;
- login đã che;
- vị trí dòng và lý do lỗi.

Không hiển thị toàn bộ password trong bảng preview. Có nút xóa dữ liệu form ngay lập tức.

---

## 8. Duyệt và tìm kiếm tài khoản game

### 8.1. Landing `/game-accounts`

Sections:

- banner ngắn;
- game phổ biến;
- tài khoản mới đăng;
- tài khoản bán chạy;
- seller uy tín;
- hướng dẫn mua an toàn;
- cảnh báo kiểm tra điều khoản của nhà phát hành.

### 8.2. Search/filter

URL giữ filter:

```text
/game-accounts?game=lien-quan&platform=MOBILE&server=VN&rank=cao-thu&minPrice=100000&maxPrice=1000000&sort=NEWEST
```

Filter chung:

- game;
- platform;
- server/region;
- khoảng giá;
- rating seller;
- còn hàng;
- giao tự động;
- có bảo hành;
- có thể đổi email/password;
- thuộc tính riêng theo game;
- sort.

Sort:

```text
RELEVANCE
NEWEST
PRICE_ASC
PRICE_DESC
BEST_SELLER
SELLER_RATING
```

### 8.3. Product card

Hiển thị:

- ảnh;
- game + platform;
- tên listing;
- 3–4 thuộc tính nổi bật;
- giá;
- badge `Giao tự động` hoặc `Giao trong X phút`;
- badge bảo hành;
- stock dạng “Còn X tài khoản”, không hiển thị credential;
- shop, rating, số đã bán;
- wishlist;
- nút **Xem chi tiết**.

Không hiển thị “Add to compare” cho tài khoản game ở MVP trừ khi hệ thống đã có schema so sánh phù hợp.

---

## 9. Trang chi tiết sản phẩm tài khoản game

Route tái sử dụng:

```text
/products/[slug]
```

### 9.1. Bố cục desktop

```text
Breadcrumb
┌──────────────────────────┬─────────────────────────────────┐
│ Gallery                  │ Tên sản phẩm                    │
│ Ảnh đã che thông tin     │ Giá + trạng thái kho            │
│ nhạy cảm                 │ Game / server / platform        │
│                          │ Thuộc tính nổi bật              │
│                          │ Chính sách + cảnh báo           │
│                          │ Số lượng                        │
│                          │ [Thêm giỏ] [Mua ngay]           │
└──────────────────────────┴─────────────────────────────────┘
Thông tin chi tiết
Khả năng đổi thông tin
Cách giao tài khoản
Bảo hành và xử lý sự cố
Thông tin shop
Đánh giá
Sản phẩm tương tự
```

Mobile:

- gallery trên cùng;
- nội dung một cột;
- sticky bottom action chứa giá và **Mua ngay**;
- modal xác nhận mua dùng bottom sheet.

### 9.2. Các block bắt buộc

`GameAccountOverview`

- game;
- platform;
- server;
- login method;
- rank/level;
- các chỉ số theo schema game.

`AccountChangeabilityCard`

- đổi mật khẩu: Có/Không;
- đổi email: Có/Không;
- đổi số điện thoại: Có/Không;
- gỡ liên kết: Có/Không/Phụ thuộc nhà phát hành.

`DigitalDeliveryCard`

- giao tự động sau thanh toán hoặc seller xác nhận;
- thời gian dự kiến;
- nội dung người mua sẽ nhận nhưng không hiển thị giá trị;
- thời gian bảo hành;
- link chính sách tranh chấp.

`RiskNotice`

- điều khoản game có thể hạn chế chuyển nhượng tài khoản;
- người mua phải tự kiểm tra quy định của nhà phát hành;
- chỉ giao dịch và trao đổi trong hệ thống;
- không yêu cầu người mua liên hệ hoặc chuyển tiền ngoài nền tảng.

### 9.3. Trạng thái CTA

| Điều kiện | CTA |
| --- | --- |
| Guest | `Đăng nhập để mua` |
| ACTIVE + còn hàng | `Thêm vào giỏ`, `Mua ngay` |
| LOW_STOCK | CTA như bình thường + “Sắp hết” |
| hết hàng | `Hết hàng`, `Thông báo khi có hàng` |
| listing bị ẩn | không render dữ liệu bán hàng |
| seller xem sản phẩm của chính mình | `Xem trong Seller Center` |
| buyer không đủ quyền | render reason từ API |

### 9.4. Chọn số lượng

- mặc định 1;
- max theo `purchaseLimit` API trả về;
- mỗi đơn vị sẽ nhận một credential riêng;
- trước khi checkout phải gọi preview; frontend không tin stock cũ trên product page.

---

## 10. Cart và checkout

### 10.1. Cart

Digital item hiển thị badge `Sản phẩm số — không vận chuyển`.

Nếu cart có cả vật lý và tài khoản game:

- group theo shop như hệ thống hiện tại;
- digital group không hiển thị địa chỉ/phí ship;
- checkout preview do backend chia fulfillment group;
- không tự tính tổng tiền hoặc phí.

### 10.2. Checkout tài khoản game

Ẩn:

- địa chỉ nhận hàng;
- đơn vị vận chuyển;
- tracking;
- bảo hiểm vận chuyển.

Hiển thị:

- tài khoản đăng nhập của buyer;
- sản phẩm và số lượng;
- shop;
- giá, voucher, tổng tiền từ preview API;
- phương thức thanh toán;
- cách và thời gian giao;
- thời hạn bảo hành;
- checkbox đồng ý chính sách sản phẩm số.

### 10.3. Sau khi tạo đơn

```text
Create order thành công
→ /payment/[paymentId]
→ hiển thị QR SePay + mã giao dịch + countdown
→ poll/subscription trạng thái do backend trả về
→ PAID: chuyển /orders/[orderId]
→ EXPIRED: cho tạo payment attempt mới nếu allowedActions cho phép
```

Không dùng ảnh upload biên lai làm căn cứ giao credential.

---

## 11. Danh sách “Đơn hàng của tôi”

Mở rộng trang `/orders`, tham khảo cách trình bày rõ ràng của VNLike nhưng dùng design system hiện tại.

### 11.1. Header và filter

- tiêu đề **Đơn hàng của tôi**;
- tổng số đơn;
- search theo mã đơn hoặc tên sản phẩm;
- filter loại: `Tất cả | Hàng vật lý | Tài khoản game`;
- filter trạng thái: `Tất cả | Chờ thanh toán | Đang chuẩn bị | Đã giao | Hoàn thành | Tranh chấp | Đã hủy`.

### 11.2. Desktop table

| Chi tiết | Sản phẩm | Loại | Giá | Trạng thái | Mã đơn | Thời gian |
| --- | --- | --- | --- | --- | --- | --- |
| Xem chi tiết | Liên Quân Rank Cao Thủ ×1 | Tài khoản game | 500.000đ | Đã giao | ORD-001 | 10/09/2026 |

### 11.3. Mobile card

Mỗi card có:

- thumbnail + tên;
- mã đơn;
- số lượng + tổng tiền;
- badge trạng thái;
- thời gian;
- CTA chính từ `allowedActions`;
- nút **Xem chi tiết**.

### 11.4. Quy tắc dữ liệu

API danh sách đơn tuyệt đối không cần trả password hoặc full credential. Frontend không fetch delivery secret trong list, prefetch hoặc hover.

---

## 12. Trang chi tiết đơn và “Nội dung giao hàng”

Đây là chức năng trung tâm.

### 12.1. Thứ tự các section

1. Breadcrumb và nút quay lại.
2. Mã đơn + trạng thái.
3. Timeline đơn hàng số.
4. Thông tin sản phẩm và shop.
5. Thanh toán.
6. **Nội dung giao hàng**.
7. Hướng dẫn nhận và bảo vệ tài khoản.
8. Bảo hành/hỗ trợ/tranh chấp.
9. Lịch sử thao tác an toàn dạng tóm tắt.

### 12.2. Timeline

```text
Đã tạo đơn
→ Đã thanh toán
→ Đang phân bổ tài khoản
→ Đã sẵn sàng
→ Đã xem thông tin
→ Hoàn thành
```

Chỉ hiển thị bước dựa trên dữ liệu API, không tự suy luận.

### 12.3. Các state của DeliveryPanel

#### `NOT_AVAILABLE`

- thông báo “Nội dung giao hàng chưa khả dụng”;
- giải thích theo trạng thái payment/order;
- CTA thanh toán lại/hủy chỉ khi backend cho phép.

#### `PREPARING`

- skeleton/spinner;
- “Hệ thống đang chuẩn bị tài khoản”;
- ETA nếu API có;
- tự refresh an toàn;
- link hỗ trợ nếu quá thời gian.

#### `READY` nhưng chưa reveal

- card khóa;
- mô tả số account sẽ nhận;
- cảnh báo không chia sẻ credential;
- nút **Hiển thị thông tin tài khoản**;
- nếu `requiresReauthentication`, mở re-auth modal trước.

#### `REVEALED`

- render từng account thành card `#1`, `#2`...;
- field mặc định có thể che lại khi người dùng bấm nút;
- copy từng field;
- `Sao chép thông tin tài khoản` chỉ copy account đang mở;
- hiển thị thời điểm đã mở và thời hạn báo lỗi;
- CTA **Tôi đã kiểm tra, tài khoản hoạt động**;
- CTA phụ **Tài khoản có vấn đề**.

#### `REPORTED`

- badge đang xử lý;
- mã yêu cầu hỗ trợ;
- timeline và nút xem tranh chấp;
- không cho gửi nhiều report trùng nếu backend không cho phép.

### 12.4. Wireframe nội dung giao hàng

```text
NỘI DUNG GIAO HÀNG                         [1 tài khoản]

Thông tin chỉ dành cho chủ đơn hàng. Không chia sẻ cho người khác.

┌──────────────────────────────────────────────────────┐
│ Tài khoản #1                          [Sao chép mục] │
│ Tên đăng nhập     huy***@gmail.com          [Copy]   │
│ Mật khẩu          ••••••••••••       [Hiện] [Copy]   │
│ Email khôi phục   ••••••••••••       [Hiện] [Copy]   │
│ Recovery code     ••••••••••••       [Hiện] [Copy]   │
└──────────────────────────────────────────────────────┘

[Tôi đã kiểm tra, tài khoản hoạt động]
[Tài khoản có vấn đề]
```

Đây chỉ là wireframe nội dung; màu sắc và component phải theo design system FE hiện tại.

### 12.5. Reveal flow

```text
Buyer bấm “Hiển thị thông tin tài khoản”
→ kiểm tra session còn hiệu lực
→ nếu cần: modal nhập lại mật khẩu/OTP
→ POST reveal endpoint
→ loading không cho bấm lặp
→ API trả credential
→ giữ credential trong component state
→ render field đã che
→ buyer chủ động hiện/copy từng field
```

Không gọi reveal endpoint bằng GET vì thao tác reveal có side effect audit.

### 12.6. Bảo vệ dữ liệu nhạy cảm ở frontend

- không ghi credential vào URL/query/hash;
- không lưu Redux/Zustand persist, localStorage, sessionStorage hoặc IndexedDB;
- không đưa credential vào TanStack Query cache dài hạn; dùng `gcTime: 0` hoặc request cục bộ phù hợp;
- không prefetch delivery;
- không log response, analytics payload, error-report breadcrumb hoặc console;
- không render secret bằng `value` của hidden input trước reveal;
- copy qua Clipboard API chỉ sau thao tác của user;
- toast copy không chứa giá trị đã copy;
- clear clipboard tự động không đáng tin cậy, chỉ hiển thị nhắc nhở;
- xóa local state khi logout, đổi order, unmount và session hết hạn;
- dùng `Cache-Control: no-store` từ backend; frontend request với cấu hình không cache;
- ẩn toàn bộ section khi chụp preview/analytics session replay nếu SDK hỗ trợ masking;
- không đưa nút xuất CSV/TXT toàn bộ credential vào MVP.

Frontend chỉ giảm nguy cơ lộ dữ liệu; bảo mật thực sự vẫn cần authorization, encryption, audit và response policy từ backend.

### 12.7. Xác nhận đã nhận

Modal xác nhận:

```text
Bạn xác nhận đã đăng nhập và kiểm tra tài khoản?

Sau khi xác nhận, đơn có thể chuyển sang Hoàn thành theo chính sách.

[Quay lại] [Xác nhận tài khoản hoạt động]
```

Frontend gọi API và render trạng thái backend trả về; không tự đổi order thành `COMPLETED` trước response.

---

## 13. Báo lỗi và tranh chấp

### 13.1. Entry point

Từ `/orders/[id]`, nút **Tài khoản có vấn đề** chỉ hiển thị khi `allowedActions.reportIssue = true`.

### 13.2. Form báo lỗi

Fields:

- loại lỗi;
- account item bị lỗi nếu đơn mua nhiều;
- mô tả;
- ảnh/video bằng chứng;
- thời điểm phát hiện;
- phương án mong muốn: hỗ trợ, thay thế hoặc hoàn tiền;
- checkbox xác nhận không công khai credential trong ảnh/mô tả.

Loại lỗi:

```text
CANNOT_LOGIN
WRONG_CREDENTIALS
ACCOUNT_NOT_AS_DESCRIBED
ACCOUNT_RECOVERED_BY_PREVIOUS_OWNER
MISSING_RECOVERY_INFORMATION
ACCOUNT_BANNED_OR_RESTRICTED
OTHER
```

### 13.3. UI dispute timeline

```text
Đã gửi yêu cầu
→ Người bán phản hồi
→ Admin xem xét (nếu escalated)
→ Đã giải quyết
```

Không hiển thị quyết định refund/replace chỉ dựa vào lựa chọn của buyer. Backend trả `resolution` và `allowedActions`.

---

## 14. Seller Digital Orders

List columns:

| Mã đơn | Sản phẩm | SL | Tổng tiền | Thanh toán | Giao hàng số | Thời gian | Thao tác |
| --- | --- | --- | --- | --- | --- | --- | --- |

Seller được xem:

- mã order;
- product và số lượng;
- trạng thái payment/delivery;
- item code đã gắn sau khi backend cho phép;
- trạng thái report/dispute;
- mốc thời gian.

Seller không cần tải password ra danh sách. Với auto-delivery, seller không có nút tự đánh dấu đã thanh toán hoặc đã giao.

Với `SELLER_CONFIRMATION`, API trả đúng action cần thực hiện; credential vẫn phải được giao qua endpoint hệ thống, không chat plaintext.

---

## 15. Admin moderation

### 15.1. Product review page

Hiển thị:

- listing preview;
- seller profile và lịch sử vi phạm;
- ảnh bằng chứng;
- game/platform/server;
- public attributes;
- changeability;
- delivery mode và warranty;
- các cảnh báo do hệ thống phát hiện;
- approve/reject/request changes/hide;
- lý do bắt buộc khi reject/hide.

Admin moderation UI không cần hiển thị raw password. Nếu có quy trình kiểm tra credential, dùng endpoint và permission riêng, có audit rõ ràng.

### 15.2. Game catalog

Admin có thể quản lý:

- tên, slug, logo;
- platform;
- server;
- attribute schema;
- trạng thái cho phép marketplace;
- nội dung cảnh báo riêng cho game.

### 15.3. Compliance tối thiểu

UI phải có:

- checkbox seller xác nhận quyền sở hữu;
- cảnh báo điều khoản chuyển nhượng của game;
- nút report listing;
- cấm để thông tin liên hệ/chuyển khoản ngoài hệ thống trong mô tả;
- trạng thái `REJECTED`, `HIDDEN`, `SUSPENDED` kèm lý do;
- trang chính sách cho sản phẩm số.

---

## 16. API contract đề xuất

Tên endpoint có thể đổi theo backend, nhưng frontend service phải giữ interface ổn định.

### 16.1. Catalog và product

```http
GET  /api/v1/games
GET  /api/v1/games/:slug
GET  /api/v1/game-account-products
GET  /api/v1/game-account-products/:slug
POST /api/v1/seller/game-account-products
PATCH /api/v1/seller/game-account-products/:id
POST /api/v1/seller/game-account-products/:id/submit
```

### 16.2. Seller inventory

```http
GET    /api/v1/seller/game-account-inventory
POST   /api/v1/seller/game-account-inventory
POST   /api/v1/seller/game-account-inventory/import
GET    /api/v1/seller/game-account-inventory/:id
PATCH  /api/v1/seller/game-account-inventory/:id
DELETE /api/v1/seller/game-account-inventory/:id
POST   /api/v1/seller/game-account-inventory/:id/disable
```

### 16.3. Checkout và order

```http
POST /api/v1/checkout/preview
POST /api/v1/orders
GET  /api/v1/orders?productType=DIGITAL_GAME_ACCOUNT
GET  /api/v1/orders/:id
GET  /api/v1/orders/:id/digital-delivery/summary
POST /api/v1/orders/:id/digital-delivery/reveal
POST /api/v1/orders/:id/confirm-received
POST /api/v1/orders/:id/issues
```

### 16.4. Admin

```http
GET  /api/v1/admin/game-account-products
GET  /api/v1/admin/game-account-products/:id
POST /api/v1/admin/game-account-products/:id/approve
POST /api/v1/admin/game-account-products/:id/reject
POST /api/v1/admin/game-account-products/:id/hide
GET  /api/v1/admin/digital-disputes
GET  /api/v1/admin/digital-disputes/:id
POST /api/v1/admin/digital-disputes/:id/resolve
```

### 16.5. Service layer

```text
packages/api-client/
├── games.api.ts
├── game-account-products.api.ts
├── game-account-inventory.api.ts
├── digital-delivery.api.ts
└── digital-disputes.api.ts
```

Không gọi endpoint trực tiếp trong page/component.

---

## 17. Error codes frontend cần hỗ trợ

| Code | UI mong đợi |
| --- | --- |
| `OUT_OF_STOCK` | Toast + refresh product/cart |
| `PURCHASE_LIMIT_EXCEEDED` | Hiển thị giới hạn hợp lệ |
| `PRICE_CHANGED` | Modal giá mới và yêu cầu xác nhận lại |
| `RESERVATION_EXPIRED` | Chuyển order/payment sang hết hạn |
| `PAYMENT_NOT_CONFIRMED` | Không mở delivery; quay lại payment |
| `DELIVERY_NOT_READY` | Giữ state PREPARING |
| `REAUTHENTICATION_REQUIRED` | Mở modal xác thực lại |
| `DELIVERY_ALREADY_REVEALED` | Tải lại summary/detail theo response |
| `REPORT_WINDOW_EXPIRED` | Ẩn submit, hiển thị link hỗ trợ chung |
| `DUPLICATE_REPORT` | Dẫn tới report hiện có |
| `FORBIDDEN` | Forbidden state, không rò rỉ order tồn tại hay không |

Error message hiển thị cho user ưu tiên `message` an toàn từ API. Không render stack trace hoặc response raw.

---

## 18. Mock API và mock data

Tạo mock adapter đúng contract, không đặt mock trực tiếp trong JSX.

```text
packages/api-client/src/adapters/
├── game-account-products.mock.ts
├── game-account-inventory.mock.ts
├── digital-orders.mock.ts
└── digital-delivery.mock.ts
```

Mock ít nhất các scenario:

1. product còn hàng;
2. product hết hàng;
3. order chờ thanh toán;
4. payment thành công, delivery đang chuẩn bị;
5. delivery sẵn sàng nhưng chưa reveal;
6. reveal thành công;
7. đơn mua 3 account;
8. re-authentication required;
9. report window expired;
10. order đang tranh chấp;
11. seller inventory có đủ mọi status;
12. admin product pending review.

Mock credential chỉ dùng dữ liệu giả rõ ràng:

```ts
const mockCredential = {
  login: "demo-buyer@example.invalid",
  password: "DEMO_ONLY_NOT_REAL",
};
```

---

## 19. Component cần tạo hoặc mở rộng

### Shared UI

```text
ProductTypeBadge
DigitalDeliveryBadge
GamePlatformBadge
MaskedSecretField
CopyFieldButton
ReauthenticationDialog
RiskNotice
OrderStatusTimeline
```

### Buyer

```text
GameAccountFilters
GameAccountProductCard
GameAccountOverview
AccountChangeabilityCard
DigitalDeliveryCard
DigitalDeliveryPanel
DeliveredAccountCard
ConfirmReceivedDialog
ReportAccountIssueForm
```

### Seller

```text
GameAccountProductForm
GameAttributeFields
GameAccountInventoryTable
AddInventoryItemDialog
BulkInventoryImport
InventoryStatusBadge
DigitalOrderTable
```

### Admin components

```text
GameAccountModerationQueue
GameAccountReviewPanel
GameSchemaEditor
DigitalDisputePanel
```

Mỗi component phải có loading/disabled/error state phù hợp và không chứa business rule cuối cùng.

---

## 20. State management và cache

### Dùng TanStack Query cho

- game catalog;
- product list/detail;
- order list/detail;
- delivery summary;
- seller inventory;
- admin queues.

### Dùng local component state cho

- password visibility;
- raw revealed credential;
- copy feedback;
- re-auth modal;
- form stepper tạm thời.

### Không đưa raw credential vào

- Zustand persist;
- devtools log;
- query key;
- URL;
- analytics;
- form autosave;
- browser storage.

Sau mutation, invalidate đúng scope:

```text
add inventory → seller inventory + product stock summary
payment paid → payment + order detail + order list
reveal → delivery summary + order detail
confirm received → order detail + order list
create issue → issue detail + order detail + order list
```

---

## 21. Accessibility và responsive

- mọi nút icon có accessible name;
- secret field thông báo trạng thái “đang ẩn/đang hiển thị” cho screen reader;
- copy action có `aria-live` message nhưng không đọc secret;
- modal giữ focus, Escape đóng khi an toàn;
- keyboard dùng được toàn bộ form/table action;
- màu badge không phải dấu hiệu trạng thái duy nhất;
- mobile không dùng bảng order/inventory rộng;
- sticky CTA không che nội dung hoặc bàn phím;
- touch target tối thiểu theo design system;
- ảnh có alt text, ảnh bằng chứng nhạy cảm không đưa dữ liệu vào alt.

---

## 22. Analytics được phép

Có thể track:

```text
game_account_list_viewed
game_account_product_viewed
game_account_checkout_started
digital_order_detail_viewed
delivery_reveal_clicked
delivery_reveal_succeeded
digital_issue_started
digital_issue_submitted
seller_inventory_item_created
```

Payload chỉ gồm ID không nhạy cảm và enum. Không track login, password, recovery info, clipboard content hoặc ảnh bằng chứng.

---

## 23. Test cases bắt buộc

### Unit

- mapping trạng thái sang badge/CTA;
- dynamic game attribute form;
- masking secret;
- form validation;
- error mapping;
- filter URL serialization.

### Integration

- product detail thay layout theo `ProductType`;
- digital checkout ẩn shipping;
- order list không gọi delivery endpoint;
- reveal cần user action;
- reveal error không để secret cũ từ order trước;
- logout xóa credential khỏi UI state;
- report form chỉ hiện khi allowed action cho phép.

### E2E critical flow

```text
Seller tạo listing
→ thêm inventory
→ listing có stock
→ Buyer mở product
→ mua và thanh toán mock
→ order PREPARING
→ order READY
→ re-auth
→ reveal
→ copy field
→ confirm received
```

E2E bổ sung:

- hai buyer cùng checkout, một buyer nhận `OUT_OF_STOCK` đúng cách;
- payment expired không reveal được;
- buyer A không mở được delivery của buyer B;
- mua quantity = 3 hiển thị đúng 3 delivery cards;
- report một item trong đơn nhiều item;
- responsive buyer/seller/admin;
- credential không xuất hiện trong order-list response fixture hoặc analytics mock.

---

## 24. Acceptance criteria theo page

### Product detail

- [ ] Render đúng layout game account.
- [ ] Chỉ có thông tin công khai.
- [ ] Có delivery, warranty và risk notice.
- [ ] CTA theo stock/quyền từ API.
- [ ] Responsive hoàn chỉnh.

### Seller product form

- [ ] Có lựa chọn product type.
- [ ] Game attributes lấy từ schema.
- [ ] Có preview trước submit.
- [ ] Có cam kết seller.
- [ ] Không nhập credential trong public product form.

### Seller inventory

- [ ] Nhập đơn và nhập hàng loạt.
- [ ] List chỉ hiển thị login đã che.
- [ ] Action đúng theo status/allowedActions.
- [ ] Secret form reset sau submit/unmount.

### Buyer orders

- [ ] Search và filter theo loại/trạng thái.
- [ ] Desktop table + mobile cards.
- [ ] Không prefetch credential.
- [ ] Nút Xem chi tiết hoạt động.

### Order detail/delivery

- [ ] Có đủ NOT_AVAILABLE/PREPARING/READY/REVEALED/REPORTED.
- [ ] Reveal chỉ sau click và re-auth khi được yêu cầu.
- [ ] Copy từng field hoạt động.
- [ ] Không lưu secret vào cache bền vững/log/analytics.
- [ ] Có confirm received và report issue.

### Admin acceptance

- [ ] Duyệt/reject/hide có reason.
- [ ] Có game schema editor.
- [ ] Có dispute queue/detail.
- [ ] Không tải raw password trong queue/list.

---

## 25. Thứ tự triển khai đề xuất

```text
1. ProductType + shared types
2. Game catalog mock + dynamic attribute schema
3. Product card/search/product detail
4. Seller product form
5. Seller inventory + bulk import
6. Cart/checkout digital rules
7. Order list mở rộng
8. Order detail + DeliveryPanel + reveal mock
9. Confirm received + issue/dispute flow
10. Admin moderation
11. Responsive/accessibility
12. Unit + integration + E2E
13. Chạy build/lint/test và sửa toàn bộ lỗi
```

Không bắt đầu bằng cách viết một page lớn. Hoàn thiện types, service interface và mock contract trước.

---

## 26. Những điều tuyệt đối không làm

- không nhúng password trong HTML khi page vừa load;
- không trả credential trong API danh sách đơn;
- không dùng localStorage/sessionStorage cho credential;
- không để mock secret trực tiếp trong component;
- không gọi API trực tiếp từ JSX;
- không tự xác nhận payment;
- không tự trừ stock;
- không cho seller sửa/xóa item `RESERVED` hoặc `SOLD` nếu backend không cho phép;
- không cho buyer mở order của người khác;
- không đưa credential vào export CSV/TXT ở MVP;
- không gửi credential qua chat;
- không hiển thị thông tin liên hệ hoặc hướng dẫn thanh toán ngoài hệ thống;
- không trộn shipping UI vào digital-only checkout;
- không hard-code thuộc tính cho từng game trong page;
- không thay đổi luồng sản phẩm vật lý hiện có;
- không sao chép nhận diện thương hiệu hoặc giao diện VNLike.

---

## 27. Definition of Done

Chức năng được xem là hoàn thành khi:

- buyer, seller và admin flow chạy được bằng mock API;
- sản phẩm vật lý cũ không bị regression;
- seller có thể tạo listing và nhập inventory;
- buyer có thể tìm, xem, checkout và nhận account qua order detail;
- nút **Xem chi tiết** mở đúng đơn và chỉ sau đó mới có khả năng reveal;
- mọi delivery state và error state đã được thiết kế;
- raw credential chỉ tồn tại tạm thời trong local component state;
- không có secret trong URL, browser storage, query cache bền vững, log hoặc analytics;
- có responsive desktop/tablet/mobile;
- có accessibility cơ bản;
- critical tests pass;
- build và lint không lỗi;
- chuyển mock adapter sang HTTP adapter không yêu cầu viết lại component.

---

## 28. Prompt giao cho Codex/AI triển khai vào FE hiện có

```text
Hãy đọc toàn bộ codebase frontend hiện tại và tài liệu
FRONTEND_GAME_ACCOUNT_MARKETPLACE_EXTENSION.md trước khi sửa code.

Mục tiêu: bổ sung chức năng marketplace mua bán tài khoản game vào FE hiện có,
không tạo lại dự án và không làm hỏng luồng sản phẩm vật lý.

Yêu cầu thực hiện:

1. Trước tiên hãy kiểm tra stack, monorepo structure, routes, design system,
   API client, auth, Product/Order types và mock strategy hiện tại.
2. Lập bảng mapping giữa yêu cầu trong tài liệu và file/component hiện có.
3. Tái sử dụng layout, component và design token hiện tại; chỉ tạo component mới
   khi hành vi dành riêng cho tài khoản game.
4. Mở rộng Product bằng ProductType = DIGITAL_GAME_ACCOUNT và giữ backward
   compatibility với PHYSICAL.
5. Xây types + service interfaces + mock adapters trước khi làm page.
6. Triển khai buyer flow: listing, filter, product detail, cart/checkout digital,
   orders, order detail, delivery reveal, confirm received và report issue.
7. Triển khai seller flow: product form, dynamic attributes, inventory đơn/hàng
   loạt và digital orders.
8. Triển khai admin flow: moderation, game catalog/schema và dispute UI.
9. Raw credential chỉ được fetch sau thao tác reveal, giữ trong local component
   state và không lưu vào URL, localStorage, persisted store, analytics hoặc log.
10. Không tự xác nhận payment, tự trừ stock, tự phân bổ account hay tự quyết định
    refund/replace. Render trạng thái và allowedActions từ API/mock contract.
11. Thêm loading, empty, error, forbidden, responsive và accessibility cho mỗi page.
12. Viết unit/integration/E2E cho critical flow trong tài liệu.
13. Chạy formatter, typecheck, lint, test và production build. Sửa lỗi thuộc phạm
    vi thay đổi trước khi kết thúc.

Quy trình làm việc:

- Không đoán tên file hay framework nếu codebase khác tài liệu.
- Không xóa hoặc ghi đè code đang có nếu chưa hiểu mục đích.
- Không tạo giant component hoặc nhét mock data vào JSX.
- Nếu API thật chưa có, hoàn thiện bằng mock adapter đúng contract.
- Sau mỗi nhóm thay đổi, báo file đã sửa, lý do và kết quả kiểm tra.

Kết quả cuối cần có:

- danh sách file tạo/sửa;
- routes đã bổ sung;
- contracts/types đã bổ sung;
- các scenario mock hỗ trợ;
- test/build/lint result;
- phần còn chờ backend và endpoint tương ứng.
```

---

## 29. Ghi chú tích hợp backend sau này

Frontend spec này giả định backend sẽ đảm nhiệm:

- mã hóa credential khi lưu;
- authorization theo chủ đơn/chủ shop/admin;
- reservation chống bán trùng;
- xác minh webhook SePay;
- phân bổ inventory item trong transaction;
- audit lần reveal/copy quan trọng nếu chính sách yêu cầu;
- giới hạn tốc độ và re-authentication;
- ẩn dữ liệu nhạy cảm trong log;
- refund/replacement/dispute;
- response headers chống cache cho secret;
- kiểm duyệt listing và bằng chứng.

Nếu backend chưa có các khả năng trên, frontend vẫn chỉ mô phỏng state bằng mock API; không đưa nghiệp vụ đó xuống client.
