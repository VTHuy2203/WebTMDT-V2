# HỆ THỐNG MARKETPLACE TMĐT ĐIỆN TỬ V2 (PRODUCTION-READY)

Hệ sinh thái Frontend hoàn chỉnh cho nền tảng thương mại điện tử chuyên ngành thiết bị công nghệ & điện tử, tuân thủ 100% tiêu chuẩn trong tài liệu [`FRONTEND_MARKETPLACE_AI_DESIGN_GUIDE_V2_COMPLETE.md`](./Docs/FRONTEND_MARKETPLACE_AI_DESIGN_GUIDE_V2_COMPLETE.md).

---

## 1. Kiến Trúc Monorepo

```text
D:/WebTMDT/
├── packages/
│   ├── types/           # 100% Domain Entity, DTOs & Enums (TechSpecs, Order, SePay, Roles)
│   ├── config/          # Feature flags & Cấu hình môi trường
│   ├── utils/           # formatCurrency (VND), date, slugify, cn helpers
│   ├── validation/      # Zod validation schemas (Auth, Product, Checkout, Payout)
│   ├── ui/              # Hệ thống Design System (Button, Price, Rating, StatusBadge, Modal, ...)
│   ├── auth/            # Zustand session store & kiểm tra phân quyền RBAC
│   ├── analytics/       # Abstraction theo dõi sự kiện (analytics.track)
│   └── api-client/      # HTTP Client & Adapter Pattern (MockRepository ↔ HttpRepository)
│
├── apps/
│   ├── buyer-web/       # Website Người Mua (Port 3000)
│   ├── seller-web/      # Kênh Quản Trị Người Bán - Seller Center (Port 3001)
│   ├── admin-web/       # Cổng Quản Trị Hệ Thống - Admin Portal (Port 3002)
│   ├── api/             # NestJS REST API + Socket.IO (Port 4000)
│   └── worker/          # BullMQ outbox, delivery, warranty, email jobs
│
└── docs/
    └── api-contracts/   # Tài liệu API Contracts chuẩn hóa kết nối Microservices
```

---

## 2. Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### 2.1 Cài đặt dependencies (Workspaces)
```bash
npm install
```

### 2.2 Khởi chạy Backend API

Backend NestJS thật nằm tại `apps/api`, dùng schema `backend/prisma/schema.prisma`.

```powershell
docker compose up -d postgres redis minio
Copy-Item apps/api/.env.example apps/api/.env
$env:DATABASE_URL='postgresql://marketplace:marketplace@localhost:5432/marketplace?schema=public'
npm run db:generate
npm run db:push
npm run prisma:seed --workspace=@marketplace/api
npm run dev:api
npm run dev:worker
```

- API: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/docs`
- Health: `http://localhost:4000/api/v1/health/live` và `/health/ready`
- MinIO console: `http://localhost:9001`
- Socket.IO chat namespace: `http://localhost:4000/chat`
- Seed chỉ tạo `admin@marketplace.local`; mật khẩu local `Marketplace@123`.
- Buyer phải tự đăng ký; Seller phải gửi hồ sơ và được Admin duyệt.
- Không sử dụng tài khoản/mật khẩu mặc định ở staging hoặc production.

Để nối frontend local:

```env
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

### 2.3 Khởi chạy ứng dụng

- **Website Người Mua (Buyer Web):**
  ```bash
  npm run dev:buyer
  # Truy cập: http://localhost:3000
  ```

- **Kênh Người Bán (Seller Center):**
  ```bash
  npm run dev:seller
  # Truy cập: http://localhost:3001
  ```

- **Cổng Quản Trị (Admin Portal):**
  ```bash
  npm run dev:admin
  # Truy cập: http://localhost:3002
  ```

### 2.4 Kiểm tra Build toàn bộ dự án
```bash
npm run build
npm run test:api
npm run test:smoke # chạy khi API đang hoạt động
```

Khởi chạy toàn bộ backend bằng container:

```powershell
docker compose up -d --build
docker compose exec api npm run prisma:migrate --workspace=@marketplace/api
docker compose exec api npm run prisma:seed --workspace=@marketplace/api
```

Khi chạy production phải thay toàn bộ secret mặc định, cấu hình SMTP, SePay,
shipping/eKYC provider và không bật `ALLOW_DEV_PAYMENT_SIMULATOR`.

---

## 3. Chuyển Đổi Mock API Sang Real Backend (Adapter Pattern)

Frontend được xây dựng với nguyên tắc **API-First** và **Adapter Pattern** (Sections 81, 82, 98).
- **Mặc định trong `.env.example`:** ứng dụng dùng backend HTTP thật. Có thể đặt `VITE_API_MODE=mock` để chạy fixtures độc lập.
- **Khi Backend Microservices sẵn sàng:**
  Chỉ cần thay đổi biến môi trường trong `.env`:
  ```env
  NEXT_PUBLIC_API_MODE=http
  NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/v1
  ```
  Tất cả các trang và UI component **hoàn toàn giữ nguyên** mà không cần viết lại một dòng code nào.

---

## 4. Các Tính Năng Nổi Bật Đã Hoàn Thiện

1. **Bộ Lọc Thông Số Phần Cứng Chuyên Sâu (Technical Filters):**
   - Lọc theo CPU (Intel Core i5/i7/i9, AMD Ryzen, Apple M-Series).
   - Lọc RAM (8GB, 16GB, 32GB), Card đồ họa (NVIDIA RTX 4060, RTX 4070, Iris Xe).
   - Lọc màn hình (Tấm nền OLED/IPS, Tần số quét 144Hz/240Hz).
2. **So Sánh Sản Phẩm Đồ Họa (Product Comparison):**
   - Bảng ma trận so sánh 2-4 sản phẩm cùng lúc.
   - Nút **"Làm nổi bật điểm khác biệt"** (Highlight differences) trực quan.
3. **Thanh Toán Tự Động SePay VietQR (SePay Payment Modal):**
   - Tạo mã VietQR động chứa số tiền và mã giao dịch đơn hàng.
   - Đồng hồ đếm ngược 15 phút, tự động poll trạng thái thanh toán.
   - Nút mô phỏng webhook dành cho dev & kiểm thử viên để chuyển trạng thái tức thì.
4. **Bảo Hành Điện Tử Serial / IMEI (Warranty Management):**
   - Tự động kích hoạt bảo hành điện tử theo Serial/IMEI của sản phẩm khi thanh toán thành công.
   - Form tạo yêu cầu bảo hành online trực tiếp tới trung tâm bảo hành của hãng.
5. **Kênh Người Bán & Quản Lý Đơn Hàng (Seller Center):**
   - Form đăng sản phẩm theo **Schema thông số động** (Dynamic Schema driven by Category).
   - Quản lý tồn kho theo từng mã SKU biến thể.
   - Theo dõi doanh thu, số dư khả dụng và tạo lệnh rút tiền (Payout) về tài khoản ngân hàng.
6. **Kiểm Duyệt Sản Phẩm & Duyệt Shop (Admin Portal):**
   - Xem và duyệt hồ sơ đăng ký mở gian hàng (thẩm định CCCD, ngân hàng).
   - Hàng đợi kiểm duyệt thông số kỹ thuật sản phẩm mới đăng trước khi cho phép hiển thị.
   - Giám sát đối soát giao dịch SePay 24/7.
