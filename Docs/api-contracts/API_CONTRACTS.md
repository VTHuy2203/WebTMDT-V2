# TÀI LIỆU API CONTRACTS — HỆ THỐNG MARKETPLACE ĐIỆN TỬ V2

Tài liệu này chuẩn hóa toàn bộ các giao thức API giữa Frontend và Backend Microservices theo Section 83 của thiết kế.

---

## 1. Chuẩn Phản Hồi (Standard Response Envelope)

### 1.1 Phản Hồi Thành Công
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 12,
    "total": 120,
    "totalPages": 10
  }
}
```

### 1.2 Phản Hồi Lỗi
```json
{
  "success": false,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "Sản phẩm hoặc biến thể này đã hết hàng trong kho.",
    "details": {
      "variantId": "var_asus_16gb_512gb",
      "availableStock": 0
    }
  }
}
```

---

## 2. Danh Sách Endpoint Chi Tiết

### 2.1 Catalog & Tìm Kiếm Phần Cứng (Catalog Service)
- **Endpoint:** `GET /api/v1/products/search`
- **Auth:** Không yêu cầu (Public)
- **Query Parameters:**
  - `query` (string): Từ khóa tìm kiếm.
  - `category` (string): Slug danh mục (e.g. `laptop`, `smartphone`).
  - `brand` (string): Slug thương hiệu (`asus`, `apple`, `samsung`...).
  - `minPrice`, `maxPrice` (number): Khoảng giá.
  - `techSpecs[cpu]`, `techSpecs[ram]`, `techSpecs[gpu]` (string): Lọc thông số phần cứng động.
  - `sortBy`: `RELEVANCE` | `NEWEST` | `PRICE_ASC` | `PRICE_DESC` | `BEST_SELLER` | `RATING`.
- **Response:** `ApiPaginatedResponse<Product>`

- **Endpoint:** `GET /api/v1/products/slug/{slug}`
- **Auth:** Không yêu cầu
- **Response:** `ApiResponse<Product>` (kèm đầy đủ biến thể, thông số kỹ thuật nhóm, thông tin bảo hành Serial/IMEI, đánh giá).

---

### 2.2 Giỏ Hàng & Checkout (Cart & Checkout Service)
- **Endpoint:** `POST /api/v1/checkout/preview`
- **Auth:** Bắt buộc (`BUYER`)
- **Request Body:**
  ```json
  {
    "selectedCartItemIds": ["cart_1", "cart_2"],
    "addressId": "addr_1",
    "voucherCodes": ["SEPAYTECH"],
    "shippingMethodId": "ship_express"
  }
  ```
- **Response:**
  ```json
  {
    "subtotal": 38990000,
    "shippingFee": 50000,
    "platformDiscount": 500000,
    "sellerDiscount": 0,
    "totalVoucherDiscount": 200000,
    "tax": 0,
    "finalTotal": 38340000,
    "shopBreakdown": [...]
  }
  ```

- **Endpoint:** `POST /api/v1/checkout/create-order`
- **Auth:** Bắt buộc (`BUYER`)
- **Request Body:**
  ```json
  {
    "selectedCartItemIds": ["cart_1"],
    "addressId": "addr_1",
    "shippingMethodId": "ship_express",
    "paymentMethod": "SEPAY_QR",
    "voucherCode": "SEPAYTECH"
  }
  ```
- **Response:** `{ "orderId": "ord_...", "paymentId": "pay_...", "totalAmount": 38340000 }`

---

### 2.3 Thanh Toán SePay VietQR (Payment Service)
- **Endpoint:** `GET /api/v1/payments/{paymentId}`
- **Auth:** Bắt buộc (`BUYER` | `ADMIN`)
- **Response:**
  ```json
  {
    "id": "pay_100294",
    "orderId": "ord_100294",
    "amount": 38340000,
    "method": "SEPAY_QR",
    "status": "PENDING",
    "sepayInfo": {
      "qrUrl": "https://qr.sepay.vn/img?acc=09876543210&bank=MBBank&amount=38340000&des=SEPAY100294",
      "paymentCode": "SEPAY100294",
      "bankName": "MBBank",
      "accountNumber": "09876543210",
      "accountHolder": "CONG TY CO PHAN CONG NGHE MARKETPLACE",
      "amount": 38340000,
      "content": "SEPAY100294",
      "expiresAt": "2026-09-11T09:00:00Z"
    }
  }
  ```

- **Endpoint:** `GET /api/v1/payments/{paymentId}/status`
- **Auth:** Bắt buộc
- **Response:** `{ "status": "PENDING" | "PAID" | "EXPIRED", "isPaid": boolean }`
- **Realtime Events:** `PAYMENT_UPDATED` (khi webhook SePay gọi vào backend).

---

### 2.4 Quản Lý Đơn Hàng & Bảo Hành Serial/IMEI (Order & Warranty Service)
- **Endpoint:** `GET /api/v1/orders`
- **Auth:** Bắt buộc (`BUYER` | `SELLER` | `ADMIN`)
- **Response:** `Order[]` chứa `allowedActions: ["PAY", "CANCEL", "REQUEST_RETURN", "REVIEW", "TRACK_SHIPPING"]`

- **Endpoint:** `GET /api/v1/warranties`
- **Auth:** Bắt buộc (`BUYER`)
- **Response:** `RegisteredWarranty[]` (Số Serial/IMEI, thời gian hiệu lực, trung tâm bảo hành).

- **Endpoint:** `POST /api/v1/warranties/claims`
- **Auth:** Bắt buộc (`BUYER`)
- **Request Body:** `{ "warrantyId": "...", "issueDescription": "...", "evidenceImages": [...] }`
- **Response:** `WarrantyClaim`

---

### 2.5 Kênh Người Bán & Rút Tiền (Seller Service)
- **Endpoint:** `POST /api/v1/seller/products`
- **Auth:** Bắt buộc (`SELLER_OWNER` | `SELLER_MANAGER`)
- **Status khi tạo mới:** `PENDING_REVIEW` (chờ Admin kiểm duyệt).

- **Endpoint:** `POST /api/v1/seller/payouts`
- **Auth:** Bắt buộc (`SELLER_OWNER`)
- **Request Body:**
  ```json
  {
    "amount": 20000000,
    "bankInfo": {
      "bankName": "Vietcombank",
      "accountNumber": "9988776655",
      "accountHolder": "CONG TY CO PHAN GEARVN"
    }
  }
  ```

---

### 2.6 Kiểm Duyệt & Quản Trị Hệ Thống (Admin Service)
- **Endpoint:** `POST /api/v1/admin/seller-applications/{id}/review`
- **Auth:** Bắt buộc (`ADMIN`)
- **Body:** `{ "action": "APPROVE" | "REJECT", "reason": "..." }`

- **Endpoint:** `POST /api/v1/admin/products/{id}/review`
- **Auth:** Bắt buộc (`ADMIN`)
- **Body:** `{ "action": "APPROVE" | "REJECT", "reason": "..." }`
