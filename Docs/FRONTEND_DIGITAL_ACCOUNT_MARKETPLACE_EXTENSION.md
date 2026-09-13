<!-- markdownlint-disable MD013 -->

# FRONTEND EXTENSION SPEC — MUA BÁN TÀI KHOẢN GAME & ỨNG DỤNG

> Tài liệu bổ sung cho `FRONTEND MARKETPLACE DESIGN SPEC — PRODUCTION-READY V2`.
> Phạm vi của tài liệu này là **frontend và API contract giả lập**. Không triển khai database, webhook hoặc xử lý thanh toán trong frontend.

**LƯU Ý QUAN TRỌNG:** Tính năng tài khoản ứng dụng trong tài liệu này là phần
**THÊM MỚI**, không thay thế tính năng tài khoản game đã có. Khi triển khai,
phải giữ nguyên toàn bộ route, component, API contract, mock và test của
`DIGITAL_GAME_ACCOUNT`.

---

## 0. Mục tiêu

Tài liệu bao phủ cả **tài khoản game** và **tài khoản ứng dụng** trong marketplace.
Phạm vi thay đổi lần này là **bổ sung tài khoản ứng dụng** bên cạnh tài khoản game
đã có, đồng thời không phá vỡ luồng sản phẩm vật lý.

Hệ thống mới phải cho phép:

- người bán tạo sản phẩm tài khoản game;
- người bán tạo sản phẩm tài khoản ứng dụng với nhiều gói/thời hạn;
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

### 0.1. Phạm vi sau khi mở rộng

| Loại sản phẩm | Trạng thái | Hành động |
| --- | --- | --- |
| `PHYSICAL` | Đã có trong FE gốc | Giữ nguyên |
| `DIGITAL_GAME_ACCOUNT` | Đã bổ sung trước đó | Giữ nguyên, không thay thế |
| `DIGITAL_APP_ACCOUNT` | Tính năng mới của lần cập nhật này | Thêm song song |

Quan hệ đúng:

```text
Marketplace hiện có
├── Sản phẩm vật lý                  (giữ nguyên)
├── Tài khoản game                   (giữ nguyên tính năng đã thêm)
└── Tài khoản ứng dụng               (thêm mới)
```

Không được đổi tên `DIGITAL_GAME_ACCOUNT` thành `DIGITAL_APP_ACCOUNT`. Hai loại
sản phẩm tồn tại đồng thời và dùng chung hạ tầng digital delivery khi phù hợp.

---

## 1. Quyết định kiến trúc bắt buộc

### 1.1. Thêm loại sản phẩm, không tạo hệ thống tách biệt

Mở rộng `Product` bằng trường:

```ts
export type ProductType =
  | "PHYSICAL"
  | "DIGITAL_GAME_ACCOUNT"
  | "DIGITAL_APP_ACCOUNT";
```

Mọi trang dùng chung như Home, Search, Wishlist, Shop và Order vẫn tái sử dụng component hiện có. Component chuyên biệt chỉ được render khi:

```ts
if (product.type === "DIGITAL_GAME_ACCOUNT") {
  return <GameAccountProductDetail product={product} />;
}

if (product.type === "DIGITAL_APP_ACCOUNT") {
  return <AppAccountProductDetail product={product} />;
}

return <PhysicalProductDetail product={product} />;
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
- tạo/sửa sản phẩm tài khoản ứng dụng;
- ứng dụng có nhiều plan, thời hạn sử dụng và bảo hành nhập tay;
- giao tài khoản ứng dụng có sẵn, license key, nâng cấp email hoặc invitation;
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

### Buyer components cho game

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

### Seller components cho game

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
FRONTEND_DIGITAL_ACCOUNT_MARKETPLACE_EXTENSION.md trước khi sửa code.

Mục tiêu: giữ nguyên chức năng mua bán tài khoản game đã được bổ sung trước đó,
đồng thời THÊM chức năng mua bán tài khoản ứng dụng vào FE hiện có. Không tạo
lại dự án, không thay thế module tài khoản game và không làm hỏng luồng sản phẩm
vật lý.

Yêu cầu thực hiện:

1. Trước tiên hãy kiểm tra stack, monorepo structure, routes, design system,
   API client, auth, Product/Order types và mock strategy hiện tại.
2. Lập bảng mapping giữa yêu cầu trong tài liệu và file/component hiện có.
3. Tái sử dụng layout, component và design token hiện tại; chỉ tạo component mới
   khi hành vi dành riêng cho tài khoản game.
4. Giữ `PHYSICAL` và `DIGITAL_GAME_ACCOUNT`; bổ sung thêm
   `DIGITAL_APP_ACCOUNT`. Không đổi tên hoặc dùng loại mới thay loại game.
5. Xây types + service interfaces + mock adapters trước khi làm page.
6. Giữ nguyên buyer flow tài khoản game; bổ sung song song buyer flow tài khoản
   ứng dụng: listing, plan, filter, product detail, cart/checkout digital, orders,
   delivery theo fulfillment type, confirm received và report issue.
7. Giữ nguyên seller flow tài khoản game; bổ sung seller app product form,
   plan, inventory/account/key, capacity và app digital orders.
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
- Không thay component/route tài khoản game bằng component/route ứng dụng.
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
- kết quả regression test xác nhận tài khoản game vẫn hoạt động.
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

---

## 30. Mở rộng: Marketplace tài khoản ứng dụng

Phần này bổ sung loại sản phẩm `DIGITAL_APP_ACCOUNT`. Các nguyên tắc về kho hàng
số, giao credential, thanh toán, reveal, bảo mật và tranh chấp ở phần tài khoản
game tiếp tục được tái sử dụng.

### 30.1. Mô hình tham khảo từ VNLike

Qua luồng sản phẩm công khai của VNLike, một ứng dụng có thể có:

- nhiều gói với giá và thời hạn khác nhau;
- gói giao ngay;
- gói cần người mua nhập email để xử lý;
- tồn kho theo gói;
- mô tả quyền lợi và thời gian bảo hành riêng;
- đơn hàng có trạng thái `pending`, `processing`, `completed`, `cancelled`;
- nội dung giao hàng chỉ xuất hiện trong kết quả đơn hàng.

Tham khảo:

- `https://vnlike.vn/category/app-ban-quyen`
- `https://vnlike.vn/product/google-one-full-pro`
- `https://vnlike.vn/product/gemini`

Chỉ tham khảo logic. Không sao chép giao diện, nội dung, thương hiệu hoặc API
riêng của VNLike.

### 30.2. Các kiểu sản phẩm ứng dụng cần hỗ trợ

```ts
export type AppAccountFulfillmentType =
  | "PRE_CREATED_ACCOUNT"
  | "BUYER_EMAIL_ACTIVATION"
  | "FAMILY_OR_TEAM_INVITATION"
  | "LICENSE_KEY"
  | "MANUAL_SERVICE";
```

| Kiểu | Cách hoạt động |
| --- | --- |
| `PRE_CREATED_ACCOUNT` | Hệ thống giao username/password có sẵn |
| `BUYER_EMAIL_ACTIVATION` | Buyer nhập email, seller nâng cấp/kích hoạt |
| `FAMILY_OR_TEAM_INVITATION` | Seller gửi lời mời vào family/team/workspace |
| `LICENSE_KEY` | Hệ thống giao key/code bản quyền |
| `MANUAL_SERVICE` | Seller cần xử lý thủ công theo hướng dẫn của gói |

Không dùng một form giống nhau cho tất cả kiểu. `requiredBuyerFields` và nội dung
giao hàng phải được tạo động theo `fulfillmentType`.

---

## 31. Product, application và plan model

### 31.1. Application catalog

```ts
export interface ApplicationSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  publisher?: string;
  category:
    | "AI"
    | "CLOUD_STORAGE"
    | "DESIGN"
    | "OFFICE"
    | "ENTERTAINMENT"
    | "EDUCATION"
    | "SECURITY"
    | "DEVELOPER_TOOL"
    | "OTHER";
  supportedPlatforms: Array<"WEB" | "WINDOWS" | "MACOS" | "ANDROID" | "IOS">;
  accountAttributeSchema: AppAttributeDefinition[];
}

export interface AppAttributeDefinition {
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  isFilterable: boolean;
  isPublic: boolean;
}
```

### 31.2. Application product

Một product đại diện cho ứng dụng, ví dụ `Gemini`, `Canva`, `Netflix` hoặc
`Microsoft 365`. Giá, thời hạn, cách giao và bảo hành nằm ở từng plan.

```ts
export interface AppAccountProduct extends Product {
  type: "DIGITAL_APP_ACCOUNT";
  application: ApplicationSummary;
  plans: AppAccountPlan[];
  description: string;
  usageInstructions: string[];
  generalWarnings: string[];
  sellerCommitments: string[];
}
```

### 31.3. Plan/biến thể của ứng dụng

```ts
export interface AppAccountPlan {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  benefits: string[];
  platforms: Array<"WEB" | "WINDOWS" | "MACOS" | "ANDROID" | "IOS">;
  duration: ServiceDuration;
  warranty: WarrantyDuration;
  fulfillmentType: AppAccountFulfillmentType;
  deliveryEstimateMinutes?: number;
  availableStock: number;
  purchaseLimit?: number;
  requiredBuyerFields: BuyerFieldDefinition[];
  publicAttributes: Record<string, string | number | boolean | string[]>;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
}
```

Ví dụ các plan:

```text
Gemini Enterprise — 1 tháng
Gemini Pro — 12 tháng
Google One 1 TB — 12 tháng
Google One 5 TB — 18 tháng
Canva Pro — 6 tháng
Microsoft 365 — 24 tháng
```

---

## 32. Thời hạn sử dụng và thời gian bảo hành nhập tay

### 32.1. Quy tắc chung cho mọi loại sản phẩm

Mọi form tạo/sửa sản phẩm hoặc plan phải có trường bảo hành. Người bán phải nhập
giá trị cụ thể; frontend không tự đặt cố định theo loại hàng.

Áp dụng cho:

- sản phẩm vật lý;
- tài khoản game;
- tài khoản ứng dụng;
- từng plan/variant nếu sản phẩm có nhiều plan.

Nếu product có nhiều plan, mỗi plan có thể có thời gian bảo hành khác nhau.
Không lấy bảo hành của plan A áp dụng tự động cho plan B.

### 32.2. Data type dùng chung

```ts
export type DurationUnit = "DAY" | "MONTH" | "YEAR";

export interface WarrantyDuration {
  value: number;
  unit: DurationUnit;
}

export interface ServiceDuration {
  value: number;
  unit: DurationUnit;
}
```

`duration` là thời hạn người mua được sử dụng sản phẩm. `warranty` là khoảng thời
gian được hỗ trợ theo chính sách. Hai giá trị độc lập và không được frontend tự
đồng bộ.

Ví dụ:

```text
Thời hạn sử dụng: 12 tháng
Bảo hành: 3 tháng
```

hoặc:

```text
Thời hạn sử dụng: 14 tháng
Bảo hành: 14 tháng
```

### 32.3. Component `WarrantyDurationInput`

UI gồm:

```text
Thời gian bảo hành *

[ 12                         ] [ Tháng ▼ ]

Gợi ý nhanh:
[1 tháng] [3 tháng] [6 tháng] [12 tháng]
[14 tháng] [18 tháng] [24 tháng]
```

Danh sách gợi ý bắt buộc:

```ts
export const WARRANTY_MONTH_PRESETS = [1, 3, 6, 12, 14, 18, 24] as const;
```

Hành vi:

- click chip sẽ điền số vào input và chọn đơn vị `MONTH`;
- người bán vẫn được xóa và nhập một số khác;
- hỗ trợ đơn vị ngày, tháng hoặc năm;
- giá trị gợi ý không phải danh sách giới hạn;
- không dùng select chỉ có các preset;
- hiển thị preview dạng `Bảo hành 14 tháng`;
- lưu object `{ value, unit }`, không lưu chuỗi đã format;
- định dạng tiếng Việt ở presentation layer;
- khi sửa sản phẩm phải hiển thị đúng dữ liệu backend, kể cả không thuộc preset.

Validation:

```text
value là số nguyên
value >= 1
DAY   <= 3650
MONTH <= 120
YEAR  <= 10
```

Giới hạn thực tế phải lấy từ config/API nếu backend cung cấp. Nếu backend cho
phép sản phẩm không bảo hành, dùng checkbox riêng `Không bảo hành`; không dùng
`0 tháng` để biểu diễn vì dễ gây nhầm lẫn.

### 32.4. Component `ServiceDurationInput`

Dùng cùng kiểu UX và các preset:

```text
[1 tháng] [3 tháng] [6 tháng] [12 tháng]
[14 tháng] [18 tháng] [24 tháng]
```

Người bán có thể nhập tay thời hạn khác. Không buộc thời hạn sử dụng và thời gian
bảo hành phải bằng nhau.

### 32.5. Hiển thị cho buyer

Product card:

```text
12 tháng · Bảo hành 3 tháng
```

Plan selector:

```text
Gemini Pro 1 TB
Thời hạn: 12 tháng
Bảo hành: 12 tháng
Giao ngay
120.000đ
```

Order detail:

- thời hạn plan đã mua;
- chính sách bảo hành snapshot tại thời điểm đặt đơn;
- ngày bắt đầu bảo hành;
- ngày hết bảo hành do backend trả về;
- badge `Còn bảo hành` hoặc `Hết bảo hành`.

Frontend không tự cộng tháng từ `createdAt` để tính ngày hết hạn. Backend phải
trả `warrantyStartsAt` và `warrantyEndsAt`, vì thời điểm bắt đầu có thể là lúc
giao hàng, lúc kích hoạt hoặc thời điểm seller hoàn tất.

---

## 33. Routes cho tài khoản ứng dụng

### Buyer routes cho ứng dụng

```text
/app-accounts
/app-accounts/[applicationSlug]
/products/[slug]                       # render AppAccountProductDetail
/account/digital-purchases             # gồm cả game và ứng dụng
/orders/[id]                           # render delivery theo fulfillment type
```

### Seller routes cho ứng dụng

```text
/seller/products/new?type=app-account
/seller/app-account-products
/seller/app-account-inventory
/seller/app-account-inventory/import
/seller/app-orders
```

### Admin routes cho ứng dụng

```text
/admin/app-account-products
/admin/app-account-products/[id]
/admin/application-catalog
/admin/app-orders
```

Feature flag:

```env
NEXT_PUBLIC_APP_ACCOUNT_MARKETPLACE_ENABLED=true
```

---

## 34. Luồng seller đăng bán tài khoản ứng dụng

### 34.1. Luồng tổng quát

```text
Seller Center
→ Sản phẩm
→ Thêm sản phẩm
→ Chọn “Tài khoản ứng dụng”
→ Chọn ứng dụng hoặc yêu cầu thêm ứng dụng
→ Nhập thông tin công khai
→ Tạo một hoặc nhiều plan
→ Nhập thời hạn sử dụng
→ Nhập thời gian bảo hành
→ Chọn cách giao
→ Khai báo dữ liệu buyer cần nhập
→ Xem trước
→ Gửi duyệt
→ Được duyệt
→ Nhập kho nếu là hàng giao sẵn
→ Mở bán
```

### 34.2. Stepper tạo sản phẩm

1. **Loại sản phẩm**
   - Chọn `Tài khoản ứng dụng`.
2. **Ứng dụng**
   - Tên ứng dụng.
   - Danh mục.
   - Nền tảng hỗ trợ.
   - Logo lấy từ catalog.
3. **Thông tin chung**
   - Tên sản phẩm.
   - Mô tả.
   - Hướng dẫn.
   - Ảnh minh họa.
4. **Gói sản phẩm**
   - Tạo, sửa, xóa, sắp xếp plan.
   - Giá, thời hạn, bảo hành, quyền lợi.
5. **Cách giao**
   - Chọn fulfillment type.
   - Cấu hình buyer fields.
   - Thời gian giao dự kiến.
6. **Chính sách**
   - Điều kiện sử dụng.
   - Hạn chế thiết bị/khu vực.
   - Điều kiện bảo hành.
7. **Xem trước và gửi duyệt**
   - Preview product detail.
   - Cam kết quyền sở hữu/quyền phân phối.

### 34.3. Form plan

Fields bắt buộc:

- tên plan;
- SKU;
- giá;
- thời hạn sử dụng;
- thời gian bảo hành;
- cách giao;
- quyền lợi;
- nền tảng hỗ trợ;
- giới hạn mua;
- buyer fields nếu cần;
- trạng thái.

Ví dụ:

```text
Tên gói: Gemini Enterprise 1 tháng
Giá: 30.000đ
Thời hạn sử dụng: 1 tháng
Bảo hành: 1 tháng
Cách giao: Tài khoản có sẵn
Giao dự kiến: Ngay sau khi thanh toán
```

### 34.4. Required buyer fields động

```ts
export interface BuyerFieldDefinition {
  key: string;
  label: string;
  type: "TEXT" | "EMAIL" | "SELECT" | "BOOLEAN";
  placeholder?: string;
  helpText?: string;
  required: boolean;
  sensitive: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}
```

Ví dụ `BUYER_EMAIL_ACTIVATION`:

```json
[
  {
    "key": "activationEmail",
    "label": "Email cần nâng cấp",
    "type": "EMAIL",
    "placeholder": "name@example.com",
    "helpText": "Không nhập mật khẩu email",
    "required": true,
    "sensitive": true
  }
]
```

Seller không được tạo field yêu cầu buyer nhập:

- mật khẩu email;
- OTP;
- mã khôi phục email cá nhân;
- thông tin thẻ ngân hàng;
- giấy tờ tùy thân nếu quy trình chưa được admin cho phép.

Frontend chặn các label rõ ràng nguy hiểm và hiển thị cảnh báo; backend vẫn phải
validate và moderation.

---

## 35. Kho tài khoản ứng dụng

### 35.1. Khi nào cần inventory item

| Fulfillment type | Cần kho item riêng? |
| --- | --- |
| `PRE_CREATED_ACCOUNT` | Có |
| `LICENSE_KEY` | Có |
| `BUYER_EMAIL_ACTIVATION` | Không bắt buộc; có thể dùng capacity |
| `FAMILY_OR_TEAM_INVITATION` | Dùng slot/capacity |
| `MANUAL_SERVICE` | Tùy cấu hình |

### 35.2. Inventory model

```ts
export interface AppAccountInventoryItemSummary {
  id: string;
  productId: string;
  planId: string;
  internalCode: string;
  itemType: "ACCOUNT" | "LICENSE_KEY";
  maskedIdentifier: string;
  status: GameAccountInventoryStatus;
  serviceExpiresAt?: string;
  addedAt: string;
  reservedUntil?: string;
  soldOrderCode?: string;
}
```

Raw credential input:

```ts
export interface CreateAppAccountInventoryItemInput {
  productId: string;
  planId: string;
  internalCode?: string;
  itemType: "ACCOUNT" | "LICENSE_KEY";
  credentials?: {
    login: string;
    password: string;
    recoveryEmail?: string;
    recoveryCode?: string;
    twoFactorSecret?: string;
    additionalFields?: Array<{ label: string; value: string; secret: boolean }>;
  };
  licenseKey?: string;
  serviceExpiresAt?: string;
  privateNote?: string;
}
```

Mọi quy tắc không lưu secret ở browser storage/log/cache từ tài khoản game cũng
áp dụng cho tài khoản ứng dụng và license key.

### 35.3. Capacity cho gói xử lý theo email

```ts
export interface AppPlanCapacity {
  planId: string;
  available: number;
  reserved: number;
  completed: number;
  dailyLimit?: number;
  nextAvailableAt?: string;
}
```

Frontend chỉ hiển thị/cập nhật capacity theo API; backend quyết định reservation
và chống bán vượt số slot.

---

## 36. Trang danh sách và chi tiết tài khoản ứng dụng

### 36.1. Landing `/app-accounts`

Sections:

- ứng dụng phổ biến;
- AI và năng suất;
- lưu trữ đám mây;
- thiết kế;
- giải trí;
- sản phẩm giao ngay;
- sản phẩm mới;
- seller uy tín;
- hướng dẫn mua tài khoản ứng dụng an toàn.

Filter:

- ứng dụng;
- danh mục;
- thời hạn sử dụng;
- khoảng giá;
- giao ngay/giao thủ công;
- loại cấp tài khoản/nâng cấp email/invite/key;
- thời gian bảo hành;
- nền tảng hỗ trợ;
- rating seller;
- còn hàng.

### 36.2. Product card

Hiển thị:

- logo/ảnh ứng dụng;
- tên sản phẩm;
- giá thấp nhất từ plan;
- danh sách thời hạn nổi bật;
- badge `Giao ngay` hoặc `Xử lý trong X phút`;
- bảo hành của plan mặc định hoặc khoảng bảo hành;
- tồn kho;
- shop và rating;
- nút **Xem chi tiết**.

### 36.3. Product detail

Các section:

1. Gallery/logo và tên ứng dụng.
2. Plan selector dạng card/radio.
3. Giá và khuyến mãi của plan đang chọn.
4. Thời hạn sử dụng.
5. Thời gian bảo hành.
6. Cách giao.
7. Quyền lợi plan.
8. Số lượng.
9. Buyer fields động nếu plan cần dữ liệu trước checkout.
10. CTA thêm giỏ/mua ngay.
11. Mô tả và hướng dẫn.
12. Giới hạn thiết bị/khu vực.
13. Điều kiện bảo hành.
14. Seller card, đánh giá và sản phẩm liên quan.

Khi user đổi plan, phải cập nhật đồng thời:

- giá;
- sale price;
- stock;
- duration;
- warranty;
- benefits;
- fulfillment type;
- delivery estimate;
- buyer fields;
- purchase limit.

Không giữ dữ liệu buyer field không còn phù hợp sau khi đổi plan.

---

## 37. Cart, checkout và giao tài khoản ứng dụng

### 37.1. Cart line

```text
Gemini
Plan: Enterprise 1 tháng
Thời hạn: 1 tháng
Bảo hành: 1 tháng
Giao: Tài khoản có sẵn
Số lượng: 1
```

Cart phải lưu `planId`, không chỉ `productId`.

### 37.2. Checkout theo fulfillment type

#### `PRE_CREATED_ACCOUNT`

- không hỏi địa chỉ;
- không yêu cầu email buyer trừ khi plan định nghĩa;
- sau payment, backend phân bổ credential;
- order chuyển `ALLOCATING → DELIVERED`.

#### `LICENSE_KEY`

- tương tự giao account có sẵn;
- DeliveryPanel render `License key` và hướng dẫn kích hoạt;
- key mặc định che trước reveal.

#### `BUYER_EMAIL_ACTIVATION`

- render email field theo plan;
- nhắc rõ **không nhập mật khẩu email**;
- sau payment, order chuyển sang `PROCESSING`;
- seller/admin xử lý;
- hoàn tất khi backend xác nhận quyền lợi đã cấp.

#### `FAMILY_OR_TEAM_INVITATION`

- buyer nhập email nhận lời mời;
- UI hiển thị hướng dẫn kiểm tra inbox/spam;
- không yêu cầu mật khẩu;
- có action gửi lại lời mời nếu backend cho phép.

#### `MANUAL_SERVICE`

- hiển thị ETA và các field do plan định nghĩa;
- trạng thái `PAID → PROCESSING → DELIVERED`;
- quá ETA hiển thị link hỗ trợ.

### 37.3. Snapshot dữ liệu plan trong order

Order detail phải dùng snapshot tại thời điểm mua:

```ts
export interface AppPlanOrderSnapshot {
  applicationName: string;
  planName: string;
  duration: ServiceDuration;
  warranty: WarrantyDuration;
  benefits: string[];
  fulfillmentType: AppAccountFulfillmentType;
  unitPrice: number;
}
```

Không lấy plan hiện tại để hiển thị đơn cũ vì seller có thể đã sửa giá, quyền lợi
hoặc bảo hành.

---

## 38. Nội dung giao hàng theo loại ứng dụng

Tái sử dụng `DigitalDeliveryPanel`, thêm renderer theo `deliveryContent.type`.

```ts
export type AppDeliveryContent =
  | {
      type: "ACCOUNT_CREDENTIAL";
      login: string;
      password: string;
      recoveryEmail?: string;
      recoveryCode?: string;
      twoFactorSecret?: string;
    }
  | {
      type: "LICENSE_KEY";
      licenseKey: string;
      activationUrl?: string;
    }
  | {
      type: "ACTIVATION_RESULT";
      targetEmailMasked: string;
      activatedAt: string;
      verificationInstructions: string[];
    }
  | {
      type: "INVITATION_RESULT";
      targetEmailMasked: string;
      invitationStatus: "SENT" | "ACCEPTED";
      instructions: string[];
    };
```

### Trường hợp giao tài khoản

Hiển thị:

- username/email đăng nhập;
- password;
- recovery info;
- hướng dẫn đổi mật khẩu;
- thời hạn sử dụng;
- bảo hành bắt đầu/kết thúc.

### Trường hợp giao key

Hiển thị:

- key đã che;
- nút hiện/copy;
- nền tảng áp dụng;
- activation URL an toàn;
- hướng dẫn kích hoạt;
- thời hạn bảo hành.

### Trường hợp nâng cấp email/invitation

Không có password để reveal. Hiển thị:

- email buyer đã che;
- trạng thái xử lý;
- quyền lợi đã cấp;
- thời điểm hoàn tất;
- hướng dẫn kiểm tra;
- ngày bắt đầu/kết thúc bảo hành;
- nút báo chưa nhận được quyền lợi/lời mời.

---

## 39. Seller order processing cho tài khoản ứng dụng

### 39.1. Queue

Filter:

```text
Tất cả
Chờ thanh toán
Cần xử lý
Đang xử lý
Đã giao
Đã hoàn thành
Có khiếu nại
Đã hủy
```

Columns:

| Mã đơn | Ứng dụng/plan | Cách giao | Buyer info đã che | SLA | Trạng thái | Action |
| --- | --- | --- | --- | --- | --- | --- |

### 39.2. Allowed actions

Backend trả:

```ts
export interface SellerAppOrderAllowedActions {
  acceptProcessing: boolean;
  markActivationCompleted: boolean;
  resendInvitation: boolean;
  submitDeliveryContent: boolean;
  requestBuyerCorrection: boolean;
  respondToIssue: boolean;
}
```

Seller không được tự đánh dấu payment paid, tự refund hoặc thay order state bằng
dropdown tùy ý.

### 39.3. Buyer information

- chỉ hiển thị field cần để hoàn thành đúng order;
- mask ở bảng danh sách;
- chỉ tải full value trong detail khi seller có quyền;
- không cho export hàng loạt;
- không hiển thị buyer password vì hệ thống không được phép yêu cầu trường này.

---

## 40. Admin moderation cho tài khoản ứng dụng

Admin review phải kiểm tra:

- ứng dụng và publisher;
- loại fulfillment;
- từng plan, giá, duration và warranty;
- mô tả quyền lợi có rõ ràng không;
- seller có yêu cầu buyer gửi mật khẩu/OTP không;
- hình ảnh có lộ credential không;
- điều kiện bảo hành;
- giới hạn khu vực/thiết bị;
- dấu hiệu giả mạo “chính hãng”, “trọn đời”, “không bao giờ khóa”;
- quyền phân phối và điều khoản ứng dụng nếu cần.

Moderation state:

```text
DRAFT
PENDING_REVIEW
CHANGES_REQUESTED
APPROVED
REJECTED
HIDDEN
SUSPENDED
```

Nếu một plan vi phạm, backend có thể khóa riêng plan thay vì bắt buộc ẩn toàn bộ
product. Frontend phải render `plan.status` và lý do.

---

## 41. API contract bổ sung

### Application catalog và products

```http
GET   /api/v1/applications
GET   /api/v1/applications/:slug
GET   /api/v1/app-account-products
GET   /api/v1/app-account-products/:slug
POST  /api/v1/seller/app-account-products
PATCH /api/v1/seller/app-account-products/:id
POST  /api/v1/seller/app-account-products/:id/submit
```

### Plans và inventory

```http
POST   /api/v1/seller/app-account-products/:id/plans
PATCH  /api/v1/seller/app-account-plans/:planId
DELETE /api/v1/seller/app-account-plans/:planId
GET    /api/v1/seller/app-account-inventory
POST   /api/v1/seller/app-account-inventory
POST   /api/v1/seller/app-account-inventory/import
PATCH  /api/v1/seller/app-account-plans/:planId/capacity
```

### Orders

```http
GET  /api/v1/seller/app-orders
GET  /api/v1/seller/app-orders/:id
POST /api/v1/seller/app-orders/:id/accept
POST /api/v1/seller/app-orders/:id/complete-activation
POST /api/v1/seller/app-orders/:id/resend-invitation
POST /api/v1/seller/app-orders/:id/delivery-content
POST /api/v1/seller/app-orders/:id/request-buyer-correction
```

Endpoint cụ thể có thể đổi theo backend. UI chỉ dùng service interface và adapter.

---

## 42. Mock scenarios bổ sung

Tạo thêm mock cho:

1. ứng dụng có 3 plan với duration/warranty khác nhau;
2. warranty tùy chỉnh `14 tháng`;
3. warranty tùy chỉnh `45 ngày` không thuộc preset;
4. account giao ngay còn hàng;
5. license key giao ngay;
6. buyer email activation đang xử lý;
7. family invitation đã gửi nhưng chưa nhận;
8. seller yêu cầu buyer sửa email sai;
9. gói hết slot;
10. order vượt SLA;
11. plan bị admin khóa nhưng product vẫn còn plan khác;
12. warranty còn hiệu lực và đã hết hiệu lực.

---

## 43. Component bổ sung

### Shared

```text
DurationInput
WarrantyDurationInput
WarrantyBadge
WarrantyTimeline
FulfillmentTypeBadge
DynamicBuyerFields
```

### Buyer components cho ứng dụng

```text
AppAccountProductCard
AppAccountFilters
AppPlanSelector
AppPlanBenefits
AppFulfillmentCard
AppDeliveryContentRenderer
ActivationStatusCard
InvitationStatusCard
LicenseKeyCard
```

### Seller components cho ứng dụng

```text
AppAccountProductForm
AppPlanEditor
BuyerFieldBuilder
AppAccountInventoryTable
AppPlanCapacityEditor
AppOrderProcessingPanel
```

### Admin components cho ứng dụng

```text
ApplicationCatalogManager
AppAccountModerationQueue
AppPlanModerationPanel
RestrictedBuyerFieldWarning
```

---

## 44. Acceptance criteria bổ sung

### Warranty dùng chung

- [ ] Mọi product/plan form có trường thời gian bảo hành.
- [ ] Có gợi ý 1, 3, 6, 12, 14, 18 và 24 tháng.
- [ ] Có thể nhập tay giá trị khác preset.
- [ ] Có thể chọn ngày, tháng hoặc năm.
- [ ] Duration và warranty là hai field độc lập.
- [ ] Khi edit giữ nguyên giá trị tùy chỉnh từ backend.
- [ ] Product, checkout và order hiển thị warranty đúng plan.
- [ ] Ngày hết bảo hành lấy từ backend, không tự tính ở frontend.

### Seller app account

- [ ] Seller tạo được app product có nhiều plan.
- [ ] Mỗi plan có giá, duration, warranty và fulfillment riêng.
- [ ] Có kho account/key cho gói giao sẵn.
- [ ] Có capacity cho gói nâng cấp email/invitation.
- [ ] Seller không thể yêu cầu buyer nhập password/OTP.
- [ ] Có preview trước khi gửi duyệt.

### Buyer app account

- [ ] Có landing, filter, card và product detail.
- [ ] Chọn plan cập nhật toàn bộ giá/quyền lợi/thời hạn/bảo hành.
- [ ] Buyer fields thay đổi đúng theo plan.
- [ ] Checkout không hiển thị shipping.
- [ ] Order detail render đúng từng fulfillment type.
- [ ] Credential/key chỉ tải sau reveal.
- [ ] Email activation/invitation không yêu cầu reveal password.

### Admin acceptance cho ứng dụng

- [ ] Duyệt được product và từng plan.
- [ ] Phát hiện/cảnh báo field yêu cầu password hoặc OTP.
- [ ] Có trạng thái, reason và audit UI.
- [ ] Khóa một plan không làm hỏng các plan hợp lệ khác.

---

## 45. Bổ sung vào prompt triển khai

Khi giao tài liệu này cho Codex/AI, bổ sung yêu cầu:

```text
Ngoài tài khoản game, hãy triển khai ProductType = DIGITAL_APP_ACCOUNT.

Tài khoản ứng dụng phải hỗ trợ nhiều plan. Mỗi plan có giá, thời hạn sử dụng,
thời gian bảo hành, quyền lợi, tồn kho/capacity, cách giao và buyer fields riêng.

Tạo shared WarrantyDurationInput cho mọi loại sản phẩm. Trường này bắt buộc cho
mọi product/plan theo business rule hiện tại. Hiển thị preset 1, 3, 6, 12, 14,
18 và 24 tháng nhưng vẫn cho seller nhập số khác và chọn ngày/tháng/năm.

Hỗ trợ năm fulfillment type:
PRE_CREATED_ACCOUNT, BUYER_EMAIL_ACTIVATION, FAMILY_OR_TEAM_INVITATION,
LICENSE_KEY và MANUAL_SERVICE.

Không yêu cầu buyer cung cấp password email, OTP hoặc recovery code cá nhân.
Không dùng chung một delivery renderer cho mọi fulfillment type.

Tái sử dụng cart, checkout, orders và DigitalDeliveryPanel hiện có. Không tạo
một hệ thống order thứ hai. Order phải lưu snapshot plan tại thời điểm mua.

Thêm mock scenarios, tests và acceptance criteria từ phần 30–44. Sau khi hoàn
tất, chạy typecheck, lint, test và production build, đồng thời xác nhận luồng
sản phẩm vật lý và tài khoản game cũ không bị regression.
```
