# FRONTEND MARKETPLACE DESIGN SPEC — PRODUCTION-READY V2

## 0. Mục tiêu

Tài liệu này dùng để hướng dẫn AI thiết kế **frontend hoàn chỉnh** cho một nền tảng thương mại điện tử dạng marketplace, tập trung vào sản phẩm điện tử và có khả năng mở rộng lâu dài.

Mục tiêu chính:

- Có website cho người mua.
- Có Seller Center cho người bán.
- Có Admin Portal cho quản trị hệ thống.
- Cho phép người dùng đăng ký gian hàng và bán sản phẩm.
- Hỗ trợ thanh toán qua SePay.
- Hỗ trợ quản lý đơn hàng, tồn kho, vận chuyển, hoàn tiền, bảo hành.
- Hỗ trợ sản phẩm điện tử có nhiều biến thể và thông số kỹ thuật.
- Frontend được thiết kế theo hướng API-first.
- Có thể làm frontend trước, sau đó kết nối backend mà không cần viết lại component.
- Mỗi app có thể deploy độc lập.
- Không hard-code business logic vào UI.
- Không phụ thuộc trực tiếp vào database.
- Sẵn sàng cho backend microservices.
- Dễ bảo trì, dễ test, dễ update phiên bản và dễ scale.

---

# 1. Kiến trúc tổng thể frontend

Frontend phải được chia thành 3 ứng dụng độc lập:

```text
apps/
├── buyer-web/
├── seller-web/
└── admin-web/
```

Các phần dùng chung:

```text
packages/
├── ui/
├── types/
├── api-client/
├── validation/
├── utils/
├── config/
├── analytics/
└── auth/
```

Nguyên tắc:

```text
UI
 ↓
Hooks / Query
 ↓
API Client
 ↓
API Contract
 ↓
Backend API
```

Không được thiết kế:

```text
UI
 ↓
Database logic
```

---

# 2. Stack frontend đề xuất

Sử dụng:

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- Zod
- React Hook Form
- Axios hoặc fetch wrapper riêng
- ESLint
- Prettier
- Vitest / Jest
- Playwright cho E2E

Khuyến nghị:

- TypeScript strict mode.
- Không dùng `any` tràn lan.
- Không nhúng business logic trực tiếp vào JSX.
- Không gọi API trực tiếp từ page/component.

---

# 3. Quy tắc frontend để backend dễ kết nối

Frontend chỉ chịu trách nhiệm:

1. Hiển thị dữ liệu.
2. Nhận input.
3. Gọi API.
4. Quản lý UI state.
5. Quản lý navigation.
6. Hiển thị quyền và trạng thái theo backend.

Frontend không được:

- xác nhận thanh toán;
- trừ tồn kho;
- tính commission cuối cùng;
- tự suy luận trạng thái order phức tạp;
- cấp quyền admin/seller;
- xác minh webhook;
- lưu secret;
- truy cập database;
- tự tạo ID nghiệp vụ;
- tự quyết định người dùng có được refund hay không.

Các quyết định nghiệp vụ cuối cùng luôn thuộc backend.

---

# 4. API-first Design

Trước khi thiết kế page, phải định nghĩa:

- request;
- response;
- query params;
- pagination;
- error code;
- permission;
- loading state;
- empty state;
- realtime event nếu có.

Ví dụ:

```ts
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;

  basePrice: number;
  compareAtPrice?: number;

  thumbnail: string;
  images: ProductImage[];

  category: CategorySummary;
  brand?: BrandSummary;
  shop: ShopSummary;

  rating: number;
  reviewCount: number;
  soldCount: number;

  variants: ProductVariant[];
  specifications: ProductSpecification[];

  warranty?: WarrantyInfo;

  status:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "ACTIVE"
    | "REJECTED"
    | "HIDDEN"
    | "OUT_OF_STOCK";

  createdAt: string;
  updatedAt: string;
}
```

---

# 5. API Client Layer

Không gọi API trực tiếp trong component.

Cấu trúc:

```text
packages/api-client/
├── http.ts
├── auth.api.ts
├── users.api.ts
├── shops.api.ts
├── products.api.ts
├── categories.api.ts
├── brands.api.ts
├── cart.api.ts
├── checkout.api.ts
├── orders.api.ts
├── payments.api.ts
├── shipping.api.ts
├── reviews.api.ts
├── vouchers.api.ts
├── warranty.api.ts
├── returns.api.ts
├── notifications.api.ts
├── chat.api.ts
└── admin.api.ts
```

Component chỉ gọi service/hook.

---

# 6. HTTP Client chuẩn

`http.ts` cần xử lý:

- base URL;
- timeout;
- auth token/cookie;
- request ID nếu backend hỗ trợ;
- refresh session;
- parse error;
- retry cho GET an toàn;
- không retry payment/order mutation;
- mapping HTTP code.

Ví dụ error:

```ts
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

---

# 7. Environment Variables

Frontend phải dùng:

```env
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_CDN_URL=
NEXT_PUBLIC_APP_ENV=
NEXT_PUBLIC_SEPAY_DISPLAY_NAME=
```

Tách:

```text
.env.local
.env.staging
.env.production
```

Không hard-code:

```text
http://localhost:3000
```

trong component.

---

# 8. Design System

Cần thiết kế ngay từ đầu:

```text
colors
typography
spacing
radius
shadow
breakpoints
z-index
animations
icons
```

Component dùng chung:

```text
Button
Input
Textarea
Select
Combobox
Checkbox
Radio
Switch
Tabs
Badge
Avatar
Card
Modal
Drawer
Tooltip
Dropdown
Breadcrumb
Pagination
Table
DataTable
Skeleton
EmptyState
ErrorState
Toast
ConfirmDialog
Upload
ImageViewer
Price
Rating
StatusBadge
```

Không để mỗi page tự tạo style riêng.

---

# 9. Responsive Strategy

Buyer:

- mobile-first;
- tablet;
- desktop.

Seller/Admin:

- desktop-first;
- tablet usable;
- mobile hỗ trợ các action cơ bản.

Cần test tối thiểu:

```text
375px
768px
1024px
1440px
```

---

# 10. Accessibility

Bắt buộc:

- semantic HTML;
- aria-label;
- keyboard navigation;
- focus visible;
- form label đầy đủ;
- alt cho ảnh;
- contrast đủ;
- modal focus trap;
- accessible table.

---

# 11. Authentication

Routes:

```text
/login
/register
/forgot-password
/reset-password
/verify-email
```

Luồng:

```text
Register
 ↓
Verify
 ↓
Login
 ↓
Session
 ↓
Load profile + role
 ↓
Redirect
```

Role dự kiến:

```text
BUYER
SELLER_OWNER
SELLER_MANAGER
SELLER_STAFF
WAREHOUSE_STAFF
ADMIN
MODERATOR
SUPER_ADMIN
```

Frontend route guard chỉ phục vụ UX.

Backend vẫn phải kiểm tra quyền thật.

---

# 12. Buyer Web — Routes

```text
/
├── search
├── products/[slug]
├── categories/[slug]
├── brands/[slug]
├── shops/[slug]
├── compare
├── cart
├── checkout
├── payment/[id]
├── orders
│   └── [id]
├── returns
│   └── [id]
├── warranties
│   └── [id]
├── wishlist
├── notifications
├── chat
├── vouchers
├── account
│   ├── profile
│   ├── addresses
│   ├── security
│   └── settings
└── support
```

---

# 13. Buyer Home Page

Các section:

1. Header.
2. Search bar.
3. Category navigation.
4. Banner.
5. Flash sale.
6. Featured products.
7. Recommended products.
8. Best sellers.
9. Top brands.
10. Featured shops.
11. Recently viewed.
12. Promotions.
13. Footer.

Không dùng một API khổng lồ nếu không cần.

---

# 14. Search & Filtering

Search page phải hỗ trợ:

- keyword;
- category;
- subcategory;
- brand;
- price;
- rating;
- seller/shop;
- stock;
- promotion;
- shipping;
- warranty;
- technical attributes;
- sort;
- pagination.

Sort:

```text
RELEVANCE
NEWEST
PRICE_ASC
PRICE_DESC
BEST_SELLER
RATING
```

URL phải giữ filter:

```text
/search?q=asus&category=laptop&ram=16GB&minPrice=15000000
```

---

# 15. Technical Specification Filters

Vì website bán điện tử, đây là phần bắt buộc.

## Laptop

```text
CPU
GPU
RAM
Storage
Screen size
Resolution
Refresh rate
Panel type
Battery
Weight
Operating system
```

## Smartphone

```text
Chipset
RAM
Storage
Screen
Refresh rate
Camera
Battery
Charging
Network
Operating system
```

## Monitor

```text
Size
Resolution
Panel
Refresh rate
Response time
Ports
HDR
```

## Headphone

```text
Connection
Battery
ANC
Microphone
Codec
Weight
```

UI filter phải build từ metadata backend.

Không hard-code mọi filter vào page.

---

# 16. Product Comparison

Route:

```text
/compare
```

Cho phép so sánh 2–4 sản phẩm.

So sánh:

- giá;
- brand;
- CPU;
- RAM;
- storage;
- GPU;
- display;
- battery;
- camera;
- warranty;
- rating;
- seller.

Frontend cần hỗ trợ:

- add to comparison;
- remove;
- highlight differences;
- sticky header;
- mobile horizontal scroll.

Backend chỉ cần trả product specifications có schema chuẩn.

---

# 17. Product Detail Page

Cần:

- gallery;
- name;
- brand;
- rating;
- reviews;
- sold count;
- price;
- compare price;
- promotion;
- variant selector;
- stock;
- quantity;
- add cart;
- buy now;
- wishlist;
- compare;
- shipping;
- warranty;
- technical specifications;
- description;
- shop card;
- reviews;
- Q&A;
- related products;
- recommended products.

---

# 18. Product Variants

Ví dụ:

```text
Color: Black
Storage: 256GB
RAM: 8GB
```

Frontend gửi:

```json
{
  "variantId": "variant_123",
  "quantity": 1
}
```

Không dùng product ID duy nhất nếu variant tồn tại.

---

# 19. Product Availability States

Frontend phải hỗ trợ:

```text
IN_STOCK
LOW_STOCK
OUT_OF_STOCK
PRE_ORDER
DISCONTINUED
COMING_SOON
```

Button thay đổi theo state.

Ví dụ:

```text
OUT_OF_STOCK → Notify me
PRE_ORDER → Pre-order
COMING_SOON → Coming soon
```

---

# 20. Back-in-stock

Người dùng có thể đăng ký nhận thông báo khi có hàng.

Flow:

```text
Out of stock
 ↓
Notify me
 ↓
API subscription
 ↓
Email/In-app notification khi có stock
```

---

# 21. Cart

Cart group theo shop:

```text
Shop A
├ Product 1
└ Product 2

Shop B
└ Product 3
```

Hiển thị:

- variant;
- stock;
- quantity;
- price;
- voucher;
- subtotal;
- estimated shipping;
- disabled item;
- out-of-stock state.

---

# 22. Guest Cart

Guest cart có thể lưu local.

Khi login:

```text
Guest Cart
 ↓
Merge Cart API
 ↓
Server Cart
```

Backend quyết định conflict cuối cùng.

---

# 23. Checkout

Pipeline:

```text
Cart
 ↓
Address
 ↓
Shipping
 ↓
Voucher
 ↓
Review Order
 ↓
Payment Method
 ↓
Create Order
 ↓
Payment
```

Frontend phải gọi:

```text
POST /api/v1/checkout/preview
```

Backend trả:

- subtotal;
- platform discount;
- seller discount;
- shipping;
- voucher;
- tax nếu có;
- total.

Client không tự tính final total.

---

# 24. Address Management

Buyer cần:

```text
/account/addresses
```

Fields:

- recipient;
- phone;
- province/city;
- district;
- ward;
- street;
- detail;
- label;
- default.

UI:

- create;
- edit;
- delete;
- set default;
- validate phone;
- location selector.

---

# 25. Shipping UI

Checkout cần hiển thị:

- shipping provider;
- fee;
- estimated delivery;
- shipping method;
- insurance nếu có.

Order Detail cần:

- tracking code;
- timeline;
- carrier;
- last update.

---

# 26. SePay Payment UI

Hiển thị:

- QR;
- amount;
- transaction reference;
- bank information;
- countdown;
- pending;
- success;
- failed;
- timeout.

Flow:

```text
Order Created
 ↓
Create Payment
 ↓
Display QR
 ↓
Waiting
 ↓
SePay webhook → Backend
 ↓
Frontend Poll/WebSocket
 ↓
Paid
```

Không có nút frontend tự `mark paid`.

---

# 27. Payment Failure States

Hỗ trợ:

```text
PENDING
PAID
FAILED
EXPIRED
CANCELLED
REFUNDED
PARTIALLY_REFUNDED
```

UI phải hiển thị action phù hợp do backend cung cấp.

---

# 28. Order History

Filters:

```text
ALL
PENDING_PAYMENT
PAID
PROCESSING
READY_TO_SHIP
SHIPPING
DELIVERED
COMPLETED
CANCELLED
RETURN_REQUESTED
RETURNED
REFUNDED
```

Mỗi order hiển thị:

- order code;
- shop;
- item;
- total;
- status;
- created time;
- actions.

---

# 29. Allowed Actions

Backend nên trả:

```json
{
  "allowedActions": [
    "PAY",
    "CANCEL",
    "CONTACT_SELLER",
    "REQUEST_RETURN",
    "REVIEW"
  ]
}
```

Frontend render theo response.

Không tự viết hàng chục if/else dựa trên status nếu tránh được.

---

# 30. Return & Refund UI

Buyer cần route:

```text
/returns
/returns/[id]
```

Flow:

```text
Completed/Delivered Order
 ↓
Request Return
 ↓
Select Item
 ↓
Reason
 ↓
Upload Evidence
 ↓
Submit
 ↓
Seller/Admin Review
 ↓
Return Shipping
 ↓
Refund
```

Các trạng thái:

```text
REQUESTED
UNDER_REVIEW
APPROVED
REJECTED
WAITING_RETURN
RETURNED
REFUND_PROCESSING
REFUNDED
CLOSED
```

---

# 31. Complaint / Dispute UI

Buyer có thể tạo complaint:

- wrong product;
- damaged product;
- missing item;
- seller dispute;
- payment issue;
- refund issue.

UI cần:

- description;
- images;
- order;
- conversation;
- status;
- admin response.

---

# 32. Warranty Management

Điện tử cần module bảo hành.

Buyer:

```text
/warranties
/warranties/[id]
```

Hiển thị:

- product;
- serial/IMEI nếu có;
- warranty duration;
- warranty provider;
- start date;
- end date;
- remaining duration;
- warranty status.

Action:

- request warranty;
- upload evidence;
- track warranty case.

---

# 33. Serial / IMEI Readiness

Không bắt buộc V1 nhưng UI cần sẵn sàng hiển thị:

```text
serialNumber
imei
warrantyCode
```

cho sản phẩm điện tử.

---

# 34. Review System

Chỉ hiện review nếu backend cho phép.

Form:

- rating;
- title;
- content;
- image/video;
- variant;
- anonymous option nếu có.

Support:

- seller reply;
- helpful vote;
- filter rating;
- sort.

---

# 35. Product Q&A

Buyer có thể:

- hỏi câu hỏi sản phẩm;
- seller trả lời;
- admin moderation.

UI tách khỏi review.

---

# 36. Wishlist

Functions:

- add/remove;
- move to cart;
- notify price drop;
- notify back in stock.

---

# 37. Notification Center

Route:

```text
/notifications
```

Các loại:

```text
ORDER
PAYMENT
PROMOTION
SELLER
SYSTEM
CHAT
RETURN
WARRANTY
```

UI:

- unread count;
- mark read;
- mark all read;
- deep link.

---

# 38. Chat Buyer–Seller

Route:

```text
/chat
```

UI:

- conversation list;
- messages;
- product attachment;
- order attachment;
- image;
- typing indicator;
- unread count;
- delivery status.

Không hard-code WebSocket implementation vào component.

Tạo abstraction:

```text
chatService
realtimeClient
```

---

# 39. Buyer Support Center

Route:

```text
/support
```

Có:

- FAQ;
- order issue;
- payment issue;
- return/refund;
- warranty;
- seller report;
- contact support.

---

# 40. Public Shop Page

Route:

```text
/shops/[slug]
```

Hiển thị:

- shop logo;
- cover;
- rating;
- followers;
- response rate;
- joined date;
- product count;
- categories;
- product listing;
- reviews;
- shop policies.

---

# 41. Seller Registration

Flow:

```text
Buyer
 ↓
Register Seller
 ↓
Seller Profile
 ↓
Shop Info
 ↓
Identity / Business Info
 ↓
Bank Information
 ↓
Submit
 ↓
Pending Approval
```

Statuses:

```text
DRAFT
PENDING
APPROVED
REJECTED
SUSPENDED
```

Nếu reject phải hiển thị reason.

---

# 42. Seller Center Routes

```text
seller/
├── dashboard
├── products
│   ├── new
│   └── [id]
├── inventory
├── orders
├── returns
├── warranties
├── vouchers
├── reviews
├── finance
├── payouts
├── analytics
├── shop
├── staff
├── notifications
├── audit-log
└── settings
```

---

# 43. Seller Dashboard

Hiển thị:

- revenue;
- orders;
- pending shipment;
- low stock;
- best products;
- rating;
- recent review;
- return rate;
- available balance;
- pending balance;
- payout history.

Backend trả aggregate.

---

# 44. Seller Product Management

Statuses:

```text
DRAFT
PENDING_REVIEW
ACTIVE
REJECTED
HIDDEN
OUT_OF_STOCK
```

Features:

- create;
- edit;
- duplicate;
- submit;
- hide;
- delete draft;
- bulk action;
- variant management;
- image management;
- specification editor;
- warranty setup.

---

# 45. Product Form

Chia component:

```text
GeneralInfo
Images
Category
Brand
Variants
Specifications
Pricing
Inventory
Shipping
Warranty
Description
SEO
```

Không để một file component quá lớn.

---

# 46. Dynamic Specification Form

Category quyết định technical fields.

Ví dụ:

```text
Laptop → CPU, RAM, SSD, GPU...
Phone → Chipset, Battery, Camera...
```

Frontend nhận schema từ backend:

```json
{
  "fields": [
    {
      "key": "ram",
      "label": "RAM",
      "type": "select",
      "options": ["8GB", "16GB", "32GB"]
    }
  ]
}
```

Nhờ vậy không phải sửa frontend mỗi lần thêm category.

---

# 47. Seller Inventory

Hiển thị:

- SKU;
- variant;
- available;
- reserved;
- sold;
- incoming;
- low stock.

Bulk update stock.

Validation client + server.

---

# 48. Seller Orders

Statuses:

```text
NEW
PAID
PROCESSING
READY_TO_SHIP
SHIPPING
COMPLETED
CANCELLED
RETURN
```

Seller chỉ thấy order thuộc shop.

---

# 49. Seller Return Management

Seller cần:

- return queue;
- evidence;
- reason;
- approve/reject;
- return shipping;
- refund status.

---

# 50. Seller Warranty Management

Seller cần:

- warranty request;
- product;
- serial;
- customer issue;
- status;
- note;
- repair / replacement / reject.

---

# 51. Seller Finance

Hiển thị:

- gross sales;
- platform fee;
- voucher cost;
- refund;
- available balance;
- pending balance;
- payout.

---

# 52. Seller Payout

Route:

```text
seller/payouts
```

Features:

- available balance;
- bank account;
- create payout request;
- payout history;
- pending;
- completed;
- rejected.

Không để frontend tự tính available balance.

---

# 53. Seller Staff

Owner có thể:

- invite;
- assign role;
- revoke;
- custom permission nếu backend hỗ trợ.

Roles:

```text
SELLER_MANAGER
SELLER_STAFF
WAREHOUSE_STAFF
FINANCE_STAFF
```

---

# 54. Seller Audit Log

Hiển thị:

- who;
- action;
- time;
- object;
- result.

Ví dụ:

```text
User A changed stock
Manager B edited price
Owner C removed staff
```

---

# 55. Admin Portal Routes

```text
admin/
├── dashboard
├── users
├── sellers
├── shops
├── products
├── categories
├── brands
├── orders
├── payments
├── refunds
├── returns
├── warranties
├── complaints
├── vouchers
├── moderation
├── notifications
├── reports
├── audit-logs
├── feature-flags
└── settings
```

---

# 56. Admin Dashboard

Hiển thị:

- GMV;
- revenue;
- total orders;
- active users;
- active shops;
- pending sellers;
- pending products;
- payment failures;
- refund requests;
- return requests;
- top categories;
- top sellers.

---

# 57. Seller Approval

Admin xem:

- profile;
- identity;
- business;
- bank;
- documents;
- shop info.

Actions:

```text
APPROVE
REJECT
REQUEST_MORE_INFO
SUSPEND
```

---

# 58. Product Moderation

Admin:

- pending queue;
- preview;
- seller;
- category;
- images;
- specs;
- price;
- rejection reason.

Actions:

```text
APPROVE
REJECT
HIDE
```

---

# 59. Payment Monitoring

Admin chỉ:

- view transaction;
- reconciliation;
- manual review;
- refund request;
- audit history.

Không có action "Set PAID" trực tiếp nếu không có flow kiểm soát đặc biệt.

---

# 60. Refund Admin

Admin cần:

- refund queue;
- source order;
- payment;
- requested amount;
- reason;
- evidence;
- decision;
- timeline.

---

# 61. Complaint Management

Admin:

- complaint queue;
- buyer;
- seller;
- order;
- evidence;
- chat history;
- resolution;
- sanction nếu có.

---

# 62. Warranty Admin

Admin dùng cho dispute hoặc platform-managed warranty.

---

# 63. Category & Brand Management

Admin:

- CRUD categories;
- category tree;
- attribute schema;
- brand;
- logo;
- status.

Category schema ảnh hưởng trực tiếp product form.

---

# 64. Voucher UI

Buyer:

- available vouchers;
- shop vouchers;
- platform vouchers;
- apply voucher.

Seller:

- create voucher;
- configure:
  - min order;
  - discount;
  - max discount;
  - quantity;
  - start/end;
  - usage limit.

Admin:

- platform campaign;
- promotion management.

---

# 65. Promotion / Flash Sale

Buyer:

- flash sale section;
- countdown;
- limited quantity.

Seller:

- join campaign;
- campaign product selection.

Admin:

- create campaign;
- schedule;
- approve products.

---

# 66. Feature Flags

Frontend phải sẵn sàng cho:

```text
ENABLE_CHAT
ENABLE_AI_SEARCH
ENABLE_COMPARE
ENABLE_NEW_CHECKOUT
ENABLE_WARRANTY
```

Không hard-code feature flag ở component.

Tạo:

```text
packages/config/featureFlags.ts
```

hoặc lấy từ backend.

---

# 67. Multi-language Readiness

Dù V1 chỉ tiếng Việt, phải tránh hard-code text khắp component.

Khuyến nghị i18n structure:

```text
locales/
├── vi.json
└── en.json
```

---

# 68. Currency Readiness

V1:

```text
VND
```

Nhưng format qua helper:

```ts
formatCurrency()
```

Không dùng:

```ts
price + " đ"
```

mọi nơi.

---

# 69. Error States

Mọi page cần:

```text
Loading
Empty
Error
Unauthorized
Forbidden
Not Found
Offline
Service unavailable
```

---

# 70. Error Boundary

Cần:

- global error boundary;
- route error boundary;
- component fallback cho widget;
- retry button.

---

# 71. Backend Service Unavailable

Ví dụ Payment service down:

UI phải hiển thị:

```text
Payment service is temporarily unavailable.
Please retry later.
```

Không crash toàn app.

---

# 72. Form UX

Mỗi form:

- label;
- help;
- validation;
- submit loading;
- server error;
- success;
- unsaved warning;
- reset;
- disabled state.

---

# 73. Upload UX

Product/Warranty/Return upload:

- preview;
- reorder;
- remove;
- progress;
- retry;
- size validation;
- type validation.

Không lưu base64 lâu dài.

---

# 74. Realtime Readiness

Các event:

```text
PAYMENT_UPDATED
ORDER_UPDATED
STOCK_UPDATED
NOTIFICATION_CREATED
CHAT_MESSAGE
RETURN_UPDATED
WARRANTY_UPDATED
```

Frontend:

```text
event
 ↓
invalidate query
 ↓
refresh UI
```

---

# 75. State Management

Server state:

```text
TanStack Query
```

Client state:

```text
Zustand
```

Zustand chỉ dành cho:

- drawer;
- modal;
- UI selection;
- theme;
- temporary state.

Không dùng Zustand làm cache server chính.

---

# 76. Cache Strategy

Cache dài hơn:

- category;
- brand;
- static config.

Cache ngắn:

- product;
- shop.

Không cache lâu:

- stock;
- payment;
- finance;
- order status.

---

# 77. SEO Buyer Web

Cần:

- metadata;
- canonical URL;
- product structured data;
- shop structured data;
- sitemap;
- robots;
- OG tags;
- SSR/SSG phù hợp.

Seller/Admin không index search engine.

---

# 78. Performance

Buyer:

- image optimization;
- lazy load;
- pagination;
- virtual list khi cần;
- code splitting;
- debounce search;
- dynamic import;
- avoid overfetching.

---

# 79. Analytics Readiness

Chuẩn bị event:

```text
PAGE_VIEW
PRODUCT_VIEW
SEARCH
FILTER_USED
ADD_TO_CART
CHECKOUT_STARTED
ORDER_CREATED
PAYMENT_SUCCESS
REVIEW_CREATED
COMPARE_PRODUCT
WARRANTY_REQUEST
RETURN_REQUEST
```

Tạo abstraction:

```ts
analytics.track()
```

Không gọi vendor analytics trực tiếp trong page.

---

# 80. Security Frontend

Không:

- lưu password;
- lưu API secret;
- expose webhook secret;
- trust URL params;
- inject HTML không sanitize;
- store sensitive payment data localStorage.

Ưu tiên HttpOnly cookie nếu backend dùng session/JWT cookie.

---

# 81. Mock API Strategy

Khi chưa có backend:

```text
mocks/
├── users.ts
├── products.ts
├── shops.ts
├── carts.ts
├── orders.ts
├── payments.ts
├── returns.ts
├── warranties.ts
└── notifications.ts
```

Mock phải đúng contract thật.

Component không được biết nó đang dùng mock hay real API.

---

# 82. Adapter Pattern

Ví dụ:

```text
ProductRepository
├── MockProductRepository
└── HttpProductRepository
```

Development đổi bằng config.

UI giữ nguyên.

---

# 83. API Contract Documentation

Tạo:

```text
docs/api-contracts/
```

Mỗi feature phải ghi:

```text
Endpoint
Method
Auth
Role
Query
Request
Response
Errors
Realtime Events
```

---

# 84. Standard Response

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_OUT_OF_STOCK",
    "message": "Product is out of stock",
    "details": {}
  }
}
```

Pagination:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

---

# 85. Testing Strategy

## Unit

- utils;
- validation;
- components.

## Integration

- forms;
- API hooks;
- route guard.

## E2E

Buyer:

```text
login
search
cart
checkout
payment
order
review
return
```

Seller:

```text
seller register
create product
inventory
process order
payout
```

Admin:

```text
approve seller
moderate product
monitor refund
```

---

# 86. Visual Regression

Khuyến nghị dùng Storybook hoặc screenshot test cho component quan trọng.

---

# 87. Folder Structure Buyer

```text
apps/buyer-web/
├── app/
├── components/
│   ├── common/
│   ├── product/
│   ├── compare/
│   ├── cart/
│   ├── checkout/
│   ├── payment/
│   ├── order/
│   ├── return/
│   ├── warranty/
│   ├── review/
│   ├── shop/
│   └── chat/
├── hooks/
├── services/
├── stores/
├── lib/
└── styles/
```

---

# 88. Folder Structure Seller

```text
apps/seller-web/
├── app/
├── components/
│   ├── dashboard/
│   ├── product/
│   ├── inventory/
│   ├── order/
│   ├── return/
│   ├── warranty/
│   ├── finance/
│   ├── payout/
│   ├── staff/
│   └── shop/
├── hooks/
├── services/
└── lib/
```

---

# 89. Folder Structure Admin

```text
apps/admin-web/
├── app/
├── components/
│   ├── dashboard/
│   ├── seller/
│   ├── moderation/
│   ├── payment/
│   ├── order/
│   ├── refund/
│   ├── complaint/
│   ├── warranty/
│   └── system/
├── hooks/
├── services/
└── lib/
```

---

# 90. Các trang ưu tiên thiết kế

Thứ tự:

```text
1. Design System
2. Auth
3. Buyer Layout
4. Home
5. Search
6. Product Detail
7. Compare
8. Cart
9. Checkout
10. Payment
11. Orders
12. Return/Refund
13. Warranty
14. Buyer Account
15. Seller Layout
16. Seller Registration
17. Seller Dashboard
18. Seller Product
19. Seller Inventory
20. Seller Orders
21. Seller Finance/Payout
22. Admin Layout
23. Seller Approval
24. Product Moderation
25. Payment/Refund Monitoring
26. Complaints
27. Category/Attribute Management
28. Notifications
29. Chat
```

---

# 91. AI Design Workflow

AI phải làm theo thứ tự:

```text
Requirements
 ↓
Routes
 ↓
Data Contract
 ↓
Types
 ↓
Design System
 ↓
Layout
 ↓
Mock API
 ↓
Pages
 ↓
States
 ↓
Responsive
 ↓
Validation
 ↓
Tests
```

Không được code page trước khi rõ dữ liệu cần dùng.

---

# 92. UI Flow Buyer

```text
Register
→ Login
→ Home
→ Search
→ Product Detail
→ Compare
→ Cart
→ Checkout
→ SePay Payment
→ Order Tracking
→ Delivery
→ Review
→ Warranty / Return
```

---

# 93. UI Flow Seller

```text
Buyer Account
→ Seller Registration
→ Pending Approval
→ Create Shop
→ Create Product
→ Product Approval
→ Inventory
→ Receive Order
→ Process
→ Shipping
→ Completed
→ Finance
→ Payout
```

---

# 94. UI Flow Admin

```text
Login
→ Dashboard
→ Approve Seller
→ Moderate Product
→ Monitor Orders
→ Monitor Payments
→ Returns/Refunds
→ Complaints
→ Category/Brand
→ Audit
```

---

# 95. Không được làm

Không:

- một `App.tsx` chứa toàn hệ thống;
- một `api.ts` hàng nghìn dòng;
- duplicate component;
- hard-code localhost;
- hard-code user/shop id;
- fake payment success;
- fake order status;
- business logic trong JSX;
- `any` tràn lan;
- giant component 1000+ dòng;
- gọi database trực tiếp;
- để admin/seller logic trộn với buyer page;
- để mock data trực tiếp trong UI.

---

# 96. Backend-ready Checklist cho mỗi page

- [ ] Có TypeScript types.
- [ ] Có API service.
- [ ] Có mock adapter.
- [ ] Có loading.
- [ ] Có error.
- [ ] Có empty.
- [ ] Có forbidden.
- [ ] Có validation.
- [ ] Có permission handling.
- [ ] Có responsive.
- [ ] Không hard-code API.
- [ ] Không chứa secret.
- [ ] Không chứa backend business logic.
- [ ] Có retry/fallback hợp lý.
- [ ] Có tests cho critical flow.

---

# 97. Definition of Done

Frontend được xem là hoàn thành khi:

- Buyer flow chạy bằng mock API.
- Seller flow chạy bằng mock API.
- Admin flow chạy bằng mock API.
- Product comparison hoạt động.
- Technical filters hoạt động.
- Checkout flow hoàn chỉnh.
- SePay payment UI hoàn chỉnh.
- Order tracking hoàn chỉnh.
- Return/refund flow hoàn chỉnh.
- Warranty flow hoàn chỉnh.
- Seller payout UI hoàn chỉnh.
- Product moderation hoàn chỉnh.
- Notification center hoàn chỉnh.
- Chat skeleton/realtime readiness hoàn chỉnh.
- Mọi dữ liệu đi qua service layer.
- API contracts được định nghĩa.
- Không hard-code URL.
- Không business logic backend trong UI.
- Có responsive.
- Có accessibility cơ bản.
- Có TypeScript strict.
- Build không lỗi.
- Lint không lỗi.
- Critical tests pass.
- Có `.env.example`.
- Có README.
- Có docs.
- Có thể đổi từ mock API sang real backend mà không viết lại page/component.

---

# 98. Mục tiêu cuối cùng

Frontend phải được thiết kế sao cho khi backend microservices hoàn thành, việc tích hợp chủ yếu là:

```text
Mock Adapter
    ↓
HTTP API Adapter
```

Component không cần viết lại.

Kiến trúc cuối cùng:

```text
Buyer Web
Seller Web
Admin Web
     │
     ▼
API Gateway
     │
     ├ Auth
     ├ Catalog
     ├ Inventory
     ├ Order
     ├ Payment
     ├ Seller
     ├ Search
     ├ Notification
     └ Recommendation
```

Frontend không phụ thuộc trực tiếp service nào bên dưới gateway.

---

# 99. Prompt cuối cho AI triển khai

AI phải coi đây là một marketplace production-oriented, không phải website bán hàng demo.

AI phải:

- thiết kế 3 app độc lập;
- ưu tiên reusable component;
- dùng TypeScript;
- API-first;
- dùng shared contracts;
- dùng mock API đúng contract;
- chuẩn bị role/permission;
- chuẩn bị order/payment/return/warranty states;
- chuẩn bị technical specs cho sản phẩm điện tử;
- chuẩn bị product comparison;
- chuẩn bị seller payout;
- chuẩn bị admin moderation;
- chuẩn bị notification/chat/realtime;
- chuẩn bị responsive;
- chuẩn bị error boundaries;
- chuẩn bị tests;
- không viết backend trong frontend;
- không tạo kiến trúc khó tách hoặc khó deploy.

Mục tiêu cuối cùng:

> Frontend phải có thể phát triển độc lập, deploy độc lập, kết nối backend microservices dễ dàng, và không phải viết lại giao diện khi backend thật được triển khai.
