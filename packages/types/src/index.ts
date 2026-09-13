// ==========================================
// 1. COMMON & API PROTOCOL TYPES (Section 84)
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==========================================
// 2. USER & AUTH TYPES (Section 11)
// ==========================================

export type UserRole =
  | 'BUYER'
  | 'SELLER_OWNER'
  | 'SELLER_MANAGER'
  | 'SELLER_STAFF'
  | 'WAREHOUSE_STAFF'
  | 'ADMIN'
  | 'MODERATOR'
  | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: UserRole;
  isEmailVerified: boolean;
  shopId?: string; // If seller
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

// ==========================================
// 3. CATEGORY & BRAND TYPES
// ==========================================

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
  level?: number;
}

export interface Category extends CategorySummary {
  description?: string;
  image?: string;
  attributeSchemaId?: string;
  children?: Category[];
  productCount?: number;
}

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Brand extends BrandSummary {
  description?: string;
  website?: string;
  originCountry?: string;
}

// ==========================================
// 4. SHOP TYPES (Section 40, 41)
// ==========================================

export type SellerShopStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type ShopOperationalStatus = 'ACTIVE' | 'WARNING' | 'TEMPORARILY_SUSPENDED' | 'PERMANENTLY_BANNED';

export interface ShopSanctionHistory {
  id: string;
  action: 'WARN' | 'SUSPEND' | 'BAN' | 'REACTIVATE';
  reason: string;
  issuedAt: string;
  suspendedUntil?: string;
  adminName: string;
  penaltyPoints?: number;
}

export interface ShopSummary {
  id: string;
  name: string;
  slug: string;
  logo: string;
  rating: number;
  isOfficial?: boolean;
}

// ==========================================
// 4. SHOP & SELLER DTOS (P0.8: Separation of Public vs Sensitive PII)
// ==========================================

export interface PublicShopDto extends ShopSummary {
  coverImage?: string;
  description: string;
  address: string; // Public general location (e.g. "Quận 1, TP. Hồ Chí Minh")
  phone?: string; // Public customer support hotline
  email?: string;
  responseRate: number; // percentage, e.g. 98%
  joinedDate: string;
  productCount: number;
  followerCount: number;
  likeCount?: number;
  isFollowing?: boolean;
  isLiked?: boolean;
  status: SellerShopStatus;
  operationalStatus?: ShopOperationalStatus;
}

export interface SellerOwnShopDto extends PublicShopDto {
  pickupAddress: string;
  warehouseAddress?: string;
  shippingSettings?: Record<string, any>;
  walletBalance?: number;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
  };
  taxCode?: string;
}

export interface AdminShopSensitiveDto extends SellerOwnShopDto {
  ownerFullName: string;
  idCardNumber: string;
  householdName?: string;
  businessLicenseNumber?: string;
  businessLicenseImage?: string;
  idCardImages?: string[];
  totalRevenue?: number;
  totalOrdersCount?: number;
  disputeCount?: number;
  warningCount?: number;
  penaltyPoints?: number;
  suspendedUntil?: string;
  suspensionReason?: string;
  banReason?: string;
  sanctionHistory?: ShopSanctionHistory[];
}

/**
 * @deprecated Use PublicShopDto for buyer API, SellerOwnShopDto for seller management, AdminShopSensitiveDto for admin audits
 */
export interface Shop extends PublicShopDto {
  rejectionReason?: string;
  warningCount?: number;
  penaltyPoints?: number;
  suspendedUntil?: string;
  suspensionReason?: string;
  banReason?: string;
  ownerFullName?: string;
  idCardNumber?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
  };
  totalRevenue?: number;
  totalOrdersCount?: number;
  disputeCount?: number;
  sanctionHistory?: ShopSanctionHistory[];
}

export interface ShopReview {
  id: string;
  shopId: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  buyerName: string;
  buyerAvatar?: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export type BusinessEntityType = 'INDIVIDUAL' | 'HOUSEHOLD' | 'ENTERPRISE';

export interface SellerApplication {
  id: string;
  userId: string;
  shopName: string;
  shopSlug?: string;
  ownerFullName: string;
  businessType?: BusinessEntityType;
  taxCode?: string;
  idCardNumber: string;
  idCardIssueDate?: string;
  idCardIssuePlace?: string;
  idCardImages: string[];
  idCardFrontImage?: string;
  idCardBackImage?: string;
  selfieWithIdImage?: string;
  businessLicenseNumber?: string;
  businessLicenseImage?: string;
  householdName?: string;
  businessRegistrationDate?: string;
  businessRegistrationPlace?: string;
  headquarterAddress?: string;
  businessSectorCode?: string;
  businessCategories?: string[];
  contactEmail?: string;
  contactPhone?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
  };
  shopDescription: string;
  pickupAddress: string;
  status: SellerShopStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

// ==========================================
// 5. PRODUCT & VARIANT TYPES (Section 4, 15, 18, 19)
// ==========================================

export type AvailabilityState =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'PRE_ORDER'
  | 'DISCONTINUED'
  | 'COMING_SOON';

export type ProductStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN'
  | 'OUT_OF_STOCK';

export interface ProductImage {
  id: string;
  url: string;
  isThumbnail: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string; // e.g., "Space Black / 16GB RAM / 512GB SSD"
  options: Record<string, string>; // e.g. { color: "Space Black", ram: "16GB", storage: "512GB" }
  price: number;
  compareAtPrice?: number;
  stock: number;
  availability: AvailabilityState;
  image?: string;
}

export interface ProductSpecification {
  group: string; // e.g. "Performance", "Display", "Connectivity"
  key: string;   // e.g. "cpu", "ram", "gpu", "screen_size", "refresh_rate"
  label: string; // e.g. "Bộ vi xử lý (CPU)", "Bộ nhớ RAM"
  value: string; // e.g. "Intel Core i7-14700HX", "16GB DDR5 5600MHz"
}

export interface WarrantyInfo {
  durationMonths: number;
  type: 'CHINH_HANH' | 'CUA_HANG' | 'QUOC_TE';
  provider: string; // e.g. "Trung tâm bảo hành Asus Việt Nam"
  policy: string;
  requiresSerial: boolean;
}

export type ProductType = 'PHYSICAL' | 'DIGITAL_GAME_ACCOUNT' | 'DIGITAL_APP_ACCOUNT';

export interface Product {
  id: string;
  type?: ProductType;
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

  status: ProductStatus;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}

// Technical spec filters schema
export interface TechFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface TechFilterDefinition {
  key: string;
  label: string;
  options: TechFilterOption[];
}

// ==========================================
// 6. CART & CHECKOUT TYPES (Section 21, 23, P0.4, P0.5)
// ==========================================

export type CartItemProductType = 'PHYSICAL' | 'DIGITAL_GAME_ACCOUNT' | 'DIGITAL_APP_ACCOUNT';

export interface BaseCartItem {
  id: string;
  productId: string;
  productType?: CartItemProductType; // Discriminated union key
  productName: string;
  productSlug: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  stock: number;
  availability: AvailabilityState;
  shopId: string;
  shopName: string;
  selected: boolean;
  // Optional convenience fields for backward compatibility
  variantId?: string;
  variantName?: string;
  shippingRequired?: boolean;
}

export interface PhysicalCartItem extends BaseCartItem {
  productType?: 'PHYSICAL';
  variantId: string;
  variantName: string;
  shippingRequired?: true;
  weightGrams?: number;
}

export interface GameAccountCartItem extends BaseCartItem {
  productType: 'DIGITAL_GAME_ACCOUNT';
  gameId?: string;
  gameName?: string;
  loginMethod?: string;
  deliveryMode?: string;
  shippingRequired?: false;
}

export interface AppAccountCartItem extends BaseCartItem {
  productType: 'DIGITAL_APP_ACCOUNT';
  planId?: string;
  planName?: string;
  fulfillmentType?: string;
  serviceDuration?: { value: number; unit: 'DAY' | 'MONTH' | 'YEAR' | 'LIFETIME' };
  warrantyDuration?: { value: number; unit: 'DAY' | 'MONTH' | 'YEAR' | 'LIFETIME' };
  buyerProvidedDetails?: Record<string, string>;
  shippingRequired?: false;
}

export type CartItem = PhysicalCartItem | GameAccountCartItem | AppAccountCartItem;

export interface SellerOrderDraft {
  shopId: string;
  shopName: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  voucherCode?: string;
  notes?: string;
}

export interface OrderGroup {
  id: string;
  groupCode: string;
  buyerId: string;
  paymentIntentId: string;
  totalAmount: number;
  sellerOrders: Order[];
  createdAt: string;
}

export interface ShopGroupedCart {
  shopId: string;
  shopName: string;
  items: CartItem[];
  shopSubtotal: number;
  appliedVoucher?: Voucher;
}

export interface Address {
  id: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  /** GHN legacy address IDs used by the fee endpoint. Names remain authoritative for display. */
  districtId?: number;
  wardCode?: string;
  streetAddress: string;
  detail?: string;
  label: 'HOME' | 'OFFICE' | 'OTHER';
  isDefault: boolean;
}

export type ShippingAddress = Address;

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  carrier: string;
  estimatedDeliveryDays: string;
  fee: number;
}

export interface CheckoutPreviewRequest {
  selectedCartItemIds: string[];
  addressId: string;
  shippingAddress?: Address;
  voucherCodes?: string[];
  shippingMethodId?: string;
}

export interface CheckoutPreviewResponse {
  subtotal: number;
  shippingFee: number;
  platformDiscount: number;
  sellerDiscount: number;
  totalVoucherDiscount: number;
  tax: number;
  finalTotal: number;
  shopBreakdown: {
    shopId: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
  }[];
}

// ==========================================
// 7. PAYMENT & SEPAY TYPES (Section 26, 27)
// ==========================================

export type PaymentMethod = 'SEPAY_QR' | 'COD' | 'BANK_TRANSFER';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface SePayPaymentInfo {
  qrUrl: string;
  paymentCode: string; // mã giao dịch ví dụ SEPAY10294
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  content: string; // Nội dung chuyển khoản bắt buộc
  expiresAt: string; // ISO time string
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  sepayInfo?: SePayPaymentInfo;
  paidAt?: string;
  createdAt: string;
}

// ==========================================
// 8. ORDER & ACTIONS (Section 28, 29)
// ==========================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export type AllowedOrderAction =
  | 'PAY'
  | 'CANCEL'
  | 'CONTACT_SELLER'
  | 'TRACK_SHIPPING'
  | 'CONFIRM_DELIVERED'
  | 'REQUEST_RETURN'
  | 'REQUEST_WARRANTY'
  | 'REVIEW';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  thumbnail: string;
  price: number;
  quantity: number;
  serialNumber?: string;
  imei?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderCode: string;
  buyerId: string;
  shop: ShopSummary;
  items: OrderItem[];
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  trackingCode?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  allowedActions: AllowedOrderAction[];
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 9. RETURN & REFUND TYPES (Section 30, 60)
// ==========================================

export type ReturnStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITING_RETURN'
  | 'RETURNED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'CLOSED';

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderCode: string;
  shopId: string;
  buyerId: string;
  items: {
    orderItemId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  reason: string;
  description: string;
  evidenceImages: string[];
  status: ReturnStatus;
  requestedRefundAmount: number;
  actualRefundAmount?: number;
  sellerNotes?: string;
  adminNotes?: string;
  returnTrackingCode?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 10. WARRANTY MANAGEMENT (Section 32, 33, 50)
// ==========================================

export type WarrantyStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CLAIM_PENDING'
  | 'CLAIM_APPROVED'
  | 'IN_REPAIR'
  | 'RESOLVED_REPAIRED'
  | 'RESOLVED_REPLACED'
  | 'CLAIM_REJECTED';

export interface RegisteredWarranty {
  id: string;
  orderId: string;
  orderCode: string;
  productId: string;
  productName: string;
  productImage: string;
  serialNumber?: string;
  imei?: string;
  warrantyCode: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  provider: string;
  status: WarrantyStatus;
}

export interface WarrantyClaim {
  id: string;
  warrantyId: string;
  productName: string;
  serialNumber?: string;
  issueDescription: string;
  evidenceImages: string[];
  status: WarrantyStatus;
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ==========================================
// 11. VOUCHERS & PROMOTIONS (Section 64, 65)
// ==========================================

export type VoucherScope = 'PLATFORM' | 'SHOP';
export type VoucherType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  scope: VoucherScope;
  shopId?: string;
  type: VoucherType;
  discountValue: number; // e.g. 10% or 100,000 VND
  minOrderValue: number;
  maxDiscount?: number;
  quantity: number;
  usedCount: number;
  startDate: string;
  endDate: string;
}

// ==========================================
// 12. NOTIFICATIONS & CHAT (Section 37, 38)
// ==========================================

export type NotificationType =
  | 'ORDER'
  | 'PAYMENT'
  | 'PROMOTION'
  | 'SELLER'
  | 'SYSTEM'
  | 'CHAT'
  | 'RETURN'
  | 'WARRANTY';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: UserRole;
  content: string;
  productAttachment?: {
    id: string;
    name: string;
    price: number;
    thumbnail: string;
    slug: string;
  };
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

// ==========================================
// 13. SELLER FINANCE & AUDIT (Section 51, 52, 54)
// ==========================================

export interface SellerFinanceSummary {
  grossSales: number;
  platformFee: number;
  voucherDeduction: number;
  refundDeduction: number;
  availableBalance: number;
  pendingBalance: number;
  totalPaidOut: number;
}

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export interface PayoutRequest {
  id: string;
  shopId: string;
  amount: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetObject: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

// ==========================================
// 14. ADMIN DYNAMIC SPECIFICATION SCHEMA (Section 46, 63)
// ==========================================

export type AttributeFieldType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean';

export interface AttributeFieldDefinition {
  key: string;
  label: string;
  group: string;
  type: AttributeFieldType;
  options?: string[];
  unit?: string;
  required: boolean;
}

export interface CategoryAttributeSchema {
  categoryId: string;
  categoryName: string;
  fields: AttributeFieldDefinition[];
}

// ==========================================
// 15. DIGITAL GAME ACCOUNT MARKETPLACE TYPES (EXTENSION SPEC)
// ==========================================

export type GamePlatform =
  | 'PC'
  | 'MOBILE'
  | 'PLAYSTATION'
  | 'XBOX'
  | 'NINTENDO_SWITCH'
  | 'CROSS_PLATFORM';

export interface GameAttributeDefinition {
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN';
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  unit?: string;
  isFilterable: boolean;
  isPublic: boolean;
}

export interface GameSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  bannerUrl?: string;
  icon?: string;
  coverImage?: string;
  publisher?: string;
  platforms: GamePlatform[];
  supportedPlatforms?: GamePlatform[];
  servers: string[];
  supportedServers?: string[];
  attributeSchema: GameAttributeDefinition[];
  isActive?: boolean;
}

export type GameAccountLoginMethod = 'USERNAME' | 'EMAIL' | 'PHONE' | 'SOCIAL' | 'OTHER';

export interface GameAccountChangeability {
  canChangePassword: boolean;
  canChangeEmail: boolean;
  canChangePhone: boolean;
  canRemoveLinkedServices: boolean;
}

export type GameAccountDeliveryMode = 'AUTO_AFTER_PAYMENT' | 'SELLER_CONFIRMATION';
export type DeliveryMode = GameAccountDeliveryMode | 'AUTOMATIC' | 'MANUAL';

export interface GameAccountProduct extends Product {
  type: 'DIGITAL_GAME_ACCOUNT';
  game: GameSummary;
  gameId?: string;
  gameName?: string;
  platform: GamePlatform;
  server: string;
  publicAttributes: Record<string, string | number | boolean | string[]>;
  loginMethod: GameAccountLoginMethod;
  linkedServices: string[];
  changeability: GameAccountChangeability;
  deliveryMode: GameAccountDeliveryMode;
  deliveryEstimateMinutes?: number;
  warrantyHours: number;
  warrantyPeriodHours?: number;
  warrantyDescription?: string;
  availableStock: number;
  inStock?: number;
  stockCount?: number;
  price?: number;
  originalPrice?: number;
  moderationStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  accountDetails?: any;
  sellerCommitments: string[];
  riskNotices: string[];
}

// Seller Inventory
export type GameAccountInventoryStatus =
  | 'DRAFT'
  | 'VALIDATING'
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'QUARANTINED'
  | 'DISABLED'
  | 'REVOKED'
  | 'DELIVERED';

export interface GameAccountInventoryItemSummary {
  id: string;
  productId: string;
  productName?: string;
  internalCode: string;
  maskedLogin: string;
  loginIdentifier?: string;
  recoveryEmail?: string;
  createdAt?: string;
  status: GameAccountInventoryStatus;
  addedAt: string;
  updatedAt: string;
  reservedUntil?: string;
  soldOrderCode?: string;
  validationMessage?: string;
}

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

// Digital Order & Delivery
export type DigitalOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'ALLOCATING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'REFUNDED';

export type DigitalDeliveryStatus =
  | 'NOT_AVAILABLE'
  | 'PREPARING'
  | 'READY'
  | 'REVEALED'
  | 'REPORTED';

export interface DigitalOrderAllowedActions {
  viewDetail: boolean;
  pay: boolean;
  cancel: boolean;
  revealDelivery: boolean;
  confirmReceived: boolean;
  reportIssue: boolean;
  review: boolean;
}

export interface DigitalOrderListItem {
  id: string;
  code: string;
  buyerName?: string;
  productName: string;
  productThumbnail: string;
  productType: 'DIGITAL_GAME_ACCOUNT' | 'DIGITAL_APP_ACCOUNT';
  gameName?: string;
  planName?: string;
  fulfillmentType?: AppAccountFulfillmentType;
  quantity: number;
  total: number;
  totalAmount?: number;
  currency: 'VND';
  paymentStatus: PaymentStatus;
  orderStatus: DigitalOrderStatus;
  deliveryStatus: DigitalDeliveryStatus;
  disputeStatus?: string;
  createdAt: string;
  allowedActions: DigitalOrderAllowedActions;
}

export interface DigitalDeliverySummary {
  orderId: string;
  deliveryStatus: DigitalDeliveryStatus;
  itemCount: number;
  revealedAt?: string;
  warrantyEndsAt?: string;
  instructions: string[];
  requiresReauthentication: boolean;
}

export interface RevealedGameAccountItem {
  inventoryItemId: string;
  login: string;
  password: string;
  recoveryEmail?: string;
  recoveryCode?: string;
  twoFactorSecret?: string;
  additionalFields?: Array<{ label: string; value: string }>;
}

export interface RevealedGameAccountDelivery {
  deliveryId: string;
  orderId: string;
  revealedAt: string;
  credentials: RevealedGameAccountItem[];
  instructions: string[];
  warrantyEndsAt?: string;
}

export interface GameAccountPermissions {
  canBuy: boolean;
  canEditListing: boolean;
  canManageInventory: boolean;
  canRevealDelivery: boolean;
  canReportIssue: boolean;
  canConfirmReceived: boolean;
  canModerate: boolean;
}

// Digital Issues & Disputes
export type DigitalIssueType =
  | 'CANNOT_LOGIN'
  | 'WRONG_CREDENTIALS'
  | 'ACCOUNT_NOT_AS_DESCRIBED'
  | 'ACCOUNT_RECOVERED_BY_PREVIOUS_OWNER'
  | 'MISSING_RECOVERY_INFORMATION'
  | 'ACCOUNT_BANNED_OR_RESTRICTED'
  | 'OTHER';

export type DigitalDisputeStatus =
  | 'PENDING_SELLER_RESPONSE'
  | 'ESCALATED_TO_ADMIN'
  | 'RESOLVED_REPLACED'
  | 'RESOLVED_REFUNDED'
  | 'REJECTED';

export interface DigitalDispute {
  id: string;
  orderId: string;
  orderCode: string;
  buyerId: string;
  buyerName: string;
  shopId: string;
  shopName: string;
  productTitle: string;
  issueType: DigitalIssueType;
  description: string;
  evidenceImages: string[];
  desiredSolution: 'SUPPORT' | 'REPLACEMENT' | 'REFUND';
  status: DigitalDisputeStatus;
  createdAt: string;
  updatedAt: string;
  sellerResponse?: {
    message: string;
    respondedAt: string;
  };
  adminResolution?: {
    resolution: 'REFUND' | 'REPLACE' | 'DISMISS';
    notes: string;
    resolvedAt: string;
  };
}

export interface GameAccountSearchParams {
  query?: string;
  gameSlug?: string;
  platform?: GamePlatform;
  server?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  deliveryMode?: string;
  hasWarranty?: boolean;
  canChangeEmail?: boolean;
  sortBy?: 'RELEVANCE' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'BEST_SELLER' | 'SELLER_RATING';
  attributes?: Record<string, string>;
  page?: number;
  pageSize?: number;
}

// ==========================================
// 16. DIGITAL APP ACCOUNT MARKETPLACE TYPES (EXTENSION SPEC SECTION 30-44)
// ==========================================

export type DurationUnit = 'DAY' | 'MONTH' | 'YEAR';

export interface WarrantyDuration {
  value: number;
  unit: DurationUnit;
}

export interface ServiceDuration {
  value: number;
  unit: DurationUnit;
}

export const WARRANTY_MONTH_PRESETS = [1, 3, 6, 12, 14, 18, 24] as const;

export type AppAccountFulfillmentType =
  | 'PRE_CREATED_ACCOUNT'
  | 'BUYER_EMAIL_ACTIVATION'
  | 'FAMILY_OR_TEAM_INVITATION'
  | 'LICENSE_KEY'
  | 'MANUAL_SERVICE';

export type ApplicationCategory =
  | 'AI'
  | 'CLOUD_STORAGE'
  | 'DESIGN'
  | 'OFFICE'
  | 'ENTERTAINMENT'
  | 'EDUCATION'
  | 'SECURITY'
  | 'DEVELOPER_TOOL'
  | 'DEV_TOOLS'
  | 'OTHER';

export type ApplicationPlatform = 'WEB' | 'WINDOWS' | 'MACOS' | 'MAC' | 'ANDROID' | 'IOS' | 'LINUX';

export interface AppAttributeDefinition {
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN';
  required: boolean;
  options?: Array<string | { label: string; value: string }>;
  isFilterable?: boolean;
  isPublic?: boolean;
}

export interface ApplicationSummary {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  logoUrl?: string;
  coverImage?: string;
  publisher?: string;
  category: ApplicationCategory;
  supportedPlatforms: ApplicationPlatform[];
  supportedFulfillments?: AppAccountFulfillmentType[];
  accountAttributeSchema?: AppAttributeDefinition[];
  attributeDefinitions?: AppAttributeDefinition[];
  activeListingsCount?: number;
  minPrice?: number;
  officialWebsiteUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface BuyerFieldDefinition {
  key: string;
  label: string;
  type: 'TEXT' | 'EMAIL' | 'SELECT' | 'BOOLEAN';
  placeholder?: string;
  helpText?: string;
  required: boolean;
  sensitive?: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface AppAccountPlan {
  id: string;
  name: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  benefits?: string[];
  features?: string[];
  platforms?: ApplicationPlatform[];
  duration?: ServiceDuration;
  serviceDuration?: ServiceDuration;
  warranty?: WarrantyDuration;
  warrantyDuration?: WarrantyDuration;
  fulfillmentType: AppAccountFulfillmentType;
  deliveryEstimateMinutes?: number;
  availableStock?: number;
  stock?: number;
  totalSlots?: number;
  availableSlots?: number;
  purchaseLimit?: number;
  requiredBuyerFields?: BuyerFieldDefinition[];
  buyerFieldDefinitions?: BuyerFieldDefinition[];
  publicAttributes?: Record<string, string | number | boolean | string[]>;
  inventoryText?: string;
  inventoryFormat?: 'TEXT_LIST' | 'FILE' | 'MARKDOWN' | 'LICENSE_KEYS';
  inventoryFileName?: string;
  deliveryGuideMarkdown?: string;
  activationUrl?: string;
  tempPasswordRequired?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}

export interface AppAccountProduct extends Omit<Product, 'variants' | 'specifications' | 'images' | 'warranty' | 'category'> {
  type: 'DIGITAL_APP_ACCOUNT';
  category?: CategorySummary | any;
  images?: any[];
  variants?: ProductVariant[];
  specifications?: ProductSpecification[];
  warranty?: any;
  warrantyPolicy?: string;
  application?: ApplicationSummary;
  applicationId?: string;
  applicationName?: string;
  applicationSlug?: string;
  appCategory?: ApplicationCategory;
  platforms?: ApplicationPlatform[];
  plans: AppAccountPlan[];
  setupGuide?: string[];
  usageInstructions?: string[];
  generalWarnings?: string[];
  sellerCommitments?: string[];
  appAttributes?: Record<string, any>;
  selectedPlanId?: string;
  originalPrice?: number;
  discountPercent?: number;
  tags?: string[];
  stock?: number;
  features?: string[];
}

export interface AppAccountInventoryItemSummary {
  id: string;
  productId: string;
  productName?: string;
  planId: string;
  planName?: string;
  internalCode: string;
  fulfillmentType?: AppAccountFulfillmentType;
  itemType?: 'ACCOUNT' | 'LICENSE_KEY';
  maskedIdentifier?: string;
  maskedLogin?: string;
  maskedSecret?: string;
  status: GameAccountInventoryStatus;
  serviceExpiresAt?: string;
  notes?: string;
  addedAt: string;
  updatedAt?: string;
  reservedUntil?: string;
  soldOrderCode?: string;
}

export interface CreateAppAccountInventoryItemInput {
  productId: string;
  planId: string;
  internalCode?: string;
  itemType?: 'ACCOUNT' | 'LICENSE_KEY';
  credentials?: {
    login: string;
    password: string;
    recoveryEmail?: string;
    recoveryCode?: string;
    twoFactorSecret?: string;
    licenseKey?: string;
    additionalFields?: Array<{ label: string; value: string; secret: boolean }>;
  };
  licenseKey?: string;
  serviceExpiresAt?: string;
  notes?: string;
  privateNote?: string;
}

export interface AppPlanCapacity {
  productId?: string;
  planId: string;
  planName?: string;
  fulfillmentType?: AppAccountFulfillmentType;
  totalSlots?: number;
  assignedSlots?: number;
  availableSlots?: number;
  available?: number;
  reserved?: number;
  completed?: number;
  dailyLimit?: number;
  nextAvailableAt?: string;
  updatedAt?: string;
}

export interface AppPlanOrderSnapshot {
  applicationName: string;
  planName: string;
  duration: ServiceDuration;
  warranty: WarrantyDuration;
  benefits: string[];
  fulfillmentType: AppAccountFulfillmentType;
  unitPrice: number;
}

export type AppDeliveryContent =
  | {
      orderId?: string;
      fulfillmentType?: AppAccountFulfillmentType;
      type: 'ACCOUNT_CREDENTIAL';
      login: string;
      password: string;
      recoveryEmail?: string;
      recoveryCode?: string;
      twoFactorSecret?: string;
      instructions?: string[];
    }
  | {
      orderId?: string;
      fulfillmentType?: AppAccountFulfillmentType;
      type: 'LICENSE_KEY';
      licenseKey: string;
      activationUrl?: string;
      instructions?: string[];
    }
  | {
      orderId?: string;
      fulfillmentType?: AppAccountFulfillmentType;
      type: 'ACTIVATION_RESULT';
      targetEmailMasked: string;
      activatedAt: string;
      verificationInstructions: string[];
      instructions?: string[];
    }
  | {
      orderId?: string;
      fulfillmentType?: AppAccountFulfillmentType;
      type: 'INVITATION_RESULT';
      targetEmailMasked: string;
      invitationStatus: 'SENT' | 'ACCEPTED';
      instructions: string[];
    }
  | {
      orderId?: string;
      fulfillmentType?: AppAccountFulfillmentType;
      type?: string;
      targetEmail?: string;
      buyerProvidedValues?: Record<string, string>;
      activationStatus?: 'ACTIVATION_PENDING' | 'INVITATION_SENT' | 'ACTIVATED' | 'FAILED';
      activatedAt?: string;
      instructions?: string[];
    };

export interface SellerAppOrderAllowedActions {
  acceptProcessing: boolean;
  markActivationCompleted: boolean;
  resendInvitation: boolean;
  submitDeliveryContent: boolean;
  requestBuyerCorrection: boolean;
  respondToIssue: boolean;
}

export interface AppAccountSearchParams {
  query?: string;
  applicationSlug?: string;
  category?: ApplicationCategory;
  platform?: ApplicationPlatform;
  minPrice?: number;
  maxPrice?: number;
  durationMonths?: number;
  hasWarranty?: boolean;
  fulfillmentType?: AppAccountFulfillmentType;
  inStockOnly?: boolean;
  sortBy?: 'RELEVANCE' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'BEST_SELLER' | 'SELLER_RATING';
  page?: number;
  pageSize?: number;
}

// ==========================================
// 19. USER REPORT & TRUST & SAFETY TYPES
// ==========================================

export type UserReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
export type UserReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type UserReportTargetType = 'SHOP' | 'PRODUCT' | 'ORDER';
export type UserReportReason =
  | 'FRAUD'
  | 'INVALID_ACCOUNT'
  | 'FAKE_PRODUCT'
  | 'NO_WARRANTY'
  | 'ABUSIVE_BEHAVIOR'
  | 'SCAM_LINK'
  | 'OTHER';

export interface UserReport {
  id: string;
  ticketCode: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  targetType: UserReportTargetType;
  targetId: string;
  targetName: string;
  shopId?: string;
  shopName?: string;
  reason: UserReportReason;
  reasonTitle: string;
  description: string;
  evidenceImages: string[];
  status: UserReportStatus;
  priority: UserReportPriority;
  createdAt: string;
  resolvedAt?: string;
  adminActionTaken?: string;
  adminNotes?: string;
}

// ==========================================
// ADMIN INBOX / USER MESSAGES
// ==========================================

export type AdminMessageStatus = 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';

export interface AdminMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'admin';
  senderName: string;
  senderEmail?: string;
  senderAvatar?: string;
  text: string;
  productCard?: {
    id?: string;
    name: string;
    price: number;
    image?: string;
  };
  createdAt: string;
}

export interface AdminConversation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  subject?: string;
  lastMessage: string;
  lastMessageAt: string;
  status: AdminMessageStatus;
  automationEnabled?: boolean;
  handoffAt?: string | null;
  unreadCount: number;
  messages: AdminMessage[];
  createdAt: string;
}

// ==========================================
// ADMIN USER MANAGEMENT & SUPPORT TYPES
// ==========================================

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';

export interface UserSupportNote {
  id: string;
  adminName: string;
  content: string;
  createdAt: string;
}

export interface AdminUserOrderSummary {
  orderId: string;
  orderCode: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemsCount: number;
  paymentMethod?: string;
}

export interface AdminManagedUser extends User {
  password?: string;
  status: UserStatus;
  walletBalance: number;
  totalOrders: number;
  totalSpent: number;
  lastLoginAt?: string;
  adminNotes?: UserSupportNote[];
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
  identityVerified?: boolean;
  accountFlags?: string[];
  recentOrders?: AdminUserOrderSummary[];
}
