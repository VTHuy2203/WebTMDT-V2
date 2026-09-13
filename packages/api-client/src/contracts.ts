import type {
  Product,
  Category,
  Brand,
  Shop,
  ShopReview,
  Order,
  CartItem,
  ShopGroupedCart,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  PaymentTransaction,
  RegisteredWarranty,
  WarrantyClaim,
  ReturnRequest,
  SellerFinanceSummary,
  SellerApplication,
  CategoryAttributeSchema,
  User,
  AuthSession,
  TechFilterDefinition,
  ApiPaginatedResponse,
  GameSummary,
  GameAccountProduct,
  GamePlatform,
  GameAccountInventoryItemSummary,
  CreateGameAccountInventoryItemInput,
  DigitalOrderListItem,
  DigitalDeliverySummary,
  RevealedGameAccountDelivery,
  DigitalDispute,
  ApplicationSummary,
  AppAccountProduct,
  AppAccountPlan,
  AppAccountInventoryItemSummary,
  CreateAppAccountInventoryItemInput,
  AppPlanCapacity,
  AppDeliveryContent,
  AppAccountSearchParams,
  UserReport,
  AdminConversation,
  AdminMessageStatus,
  AdminManagedUser,
  UserSupportNote,
  Address,
} from '@marketplace/types';

export interface ProductSearchParams {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStockOnly?: boolean;
  sortBy?: 'RELEVANCE' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'BEST_SELLER' | 'RATING';
  techSpecs?: Record<string, string>;
  page?: number;
  pageSize?: number;
}

export interface IProductApi {
  search(params: ProductSearchParams): Promise<ApiPaginatedResponse<Product>>;
  getBySlug(slug: string): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  getCategories(): Promise<Category[]>;
  getBrands(): Promise<Brand[]>;
  getTechFilters(categorySlug: string): Promise<TechFilterDefinition[]>;
  getFeatured(): Promise<Product[]>;
  getCompareList(ids: string[]): Promise<Product[]>;
}

export interface ICartApi {
  getCart(): Promise<ShopGroupedCart[]>;
  addItem(productId: string, variantId: string, quantity: number): Promise<ShopGroupedCart[]>;
  updateQuantity(cartItemId: string, quantity: number): Promise<ShopGroupedCart[]>;
  removeItem(cartItemId: string): Promise<ShopGroupedCart[]>;
  toggleSelect(cartItemId: string): Promise<ShopGroupedCart[]>;
  selectAll(selected: boolean): Promise<ShopGroupedCart[]>;
}

export interface ICheckoutApi {
  preview(request: CheckoutPreviewRequest): Promise<CheckoutPreviewResponse>;
  createOrder(request: {
    selectedCartItemIds: string[];
    addressId: string;
    shippingAddress?: Address;
    shippingMethodId: string;
    paymentMethod: 'SEPAY_QR' | 'COD';
    voucherCode?: string;
    notes?: string;
  }): Promise<{ orderId: string; paymentId: string; totalAmount: number }>;
}

export interface IPaymentApi {
  getPayment(paymentId: string): Promise<PaymentTransaction>;
  checkStatus(paymentId: string): Promise<{ status: PaymentTransaction['status']; isPaid: boolean }>;
  simulatePaymentSuccess(paymentId: string): Promise<PaymentTransaction>; // Dev helper
}

export interface IOrderApi {
  getOrders(status?: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  cancelOrder(id: string, reason: string): Promise<Order>;
  confirmReceived(id: string): Promise<Order>;
  requestReturn(data: { orderId: string; orderItemId: string; reason: string; description: string; evidenceImages: string[] }): Promise<ReturnRequest>;
  getDigitalOrders(): Promise<DigitalOrderListItem[]>;
}

export interface IWarrantyApi {
  getWarranties(): Promise<RegisteredWarranty[]>;
  submitClaim(data: { warrantyId: string; serialNumber?: string; issueDescription: string; evidenceImages: string[] }): Promise<WarrantyClaim>;
}

export interface ISellerApi {
  getDashboard(): Promise<{
    revenue: number;
    ordersCount: number;
    pendingShipmentCount: number;
    lowStockCount: number;
    rating: number;
    recentReviewsCount: number;
  }>;
  getProducts(): Promise<Product[]>;
  saveProduct(productData: Partial<Product>): Promise<Product>;
  updateStock(variantId: string, newStock: number): Promise<void>;
  getOrders(status?: string): Promise<Order[]>;
  updateOrderStatus(orderId: string, newStatus: Order['status']): Promise<Order>;
  getFinance(): Promise<SellerFinanceSummary>;
  requestPayout(amount: number, bankInfo: { bankName: string; accountNumber: string; accountHolder: string }): Promise<void>;
  applyAsSeller(data: Partial<SellerApplication>): Promise<SellerApplication>;
  getMyApplication(): Promise<SellerApplication | null>;
  getSellerGameAccounts(): Promise<GameAccountProduct[]>;
  saveSellerGameAccount(data: Partial<GameAccountProduct>): Promise<GameAccountProduct>;
  getSellerAppAccounts(): Promise<AppAccountProduct[]>;
  saveSellerAppAccount(data: Partial<AppAccountProduct>): Promise<AppAccountProduct>;
  getDigitalOrders(): Promise<DigitalOrderListItem[]>;
  getSellerAppOrders(): Promise<DigitalOrderListItem[]>;
}

export interface IShopApi {
  getShop(shopIdOrSlug: string): Promise<Shop | null>;
  getShopProducts(shopId: string): Promise<Product[]>;
  toggleFollow(shopId: string, isFollowing: boolean): Promise<{ followerCount: number; isFollowing: boolean }>;
  toggleLike(shopId: string, isLiked: boolean): Promise<{ likeCount: number; isLiked: boolean }>;
  getReviews(shopId: string, productId?: string): Promise<ShopReview[]>;
  addReview(review: { shopId: string; productId?: string; productName?: string; rating: number; comment: string; orderId?: string; buyerName?: string }): Promise<ShopReview>;
  checkPurchaseEligibility(shopId: string, productId?: string): Promise<{ hasPurchased: boolean; orderId?: string; orderCode?: string }>;
}

export interface IAdminApi {
  getDashboard(): Promise<{
    gmv: number;
    revenue: number;
    totalOrders: number;
    activeUsers: number;
    activeShops: number;
    pendingSellersCount: number;
    pendingProductsCount: number;
  }>;
  getSellerApplications(): Promise<SellerApplication[]>;
  reviewSeller(applicationId: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<void>;
  getPendingProducts(): Promise<Product[]>;
  reviewProduct(productId: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<void>;
  getCategorySchemas(): Promise<CategoryAttributeSchema[]>;
  saveCategorySchema(schema: CategoryAttributeSchema): Promise<void>;
  getAllOrders(): Promise<Order[]>;
  getGameAccountProducts(): Promise<GameAccountProduct[]>;
  reviewGameAccountProduct(productId: string, action: 'APPROVE' | 'REJECT' | 'HIDE', reason?: string): Promise<void>;
  getGameCatalog(): Promise<GameSummary[]>;
  saveGame(game: GameSummary): Promise<GameSummary>;
  getAppAccountProducts(): Promise<AppAccountProduct[]>;
  reviewAppAccountProduct(productId: string, action: 'APPROVE' | 'REJECT' | 'HIDE', reason?: string): Promise<void>;
  getApplicationCatalog(): Promise<ApplicationSummary[]>;
  saveApplication(app: ApplicationSummary): Promise<ApplicationSummary>;
  getDigitalDisputes(): Promise<DigitalDispute[]>;
  resolveDigitalDispute(disputeId: string, resolution: 'REFUND' | 'REPLACE' | 'DISMISS', notes: string): Promise<void>;
  // Shop Operations & Sanctions
  getAllShops(): Promise<Shop[]>;
  warnShop(shopId: string, reason: string, penaltyPoints?: number, notes?: string): Promise<void>;
  suspendShop(shopId: string, days: number, reason: string): Promise<void>;
  banShop(shopId: string, reason: string): Promise<void>;
  reactivateShop(shopId: string): Promise<void>;
  // User Reports & Violation Moderation
  getUserReports(): Promise<UserReport[]>;
  submitUserReport(input: Omit<UserReport, 'id' | 'ticketCode' | 'createdAt' | 'status'>): Promise<UserReport>;
  resolveUserReport(
    reportId: string,
    action: 'WARN_SHOP' | 'SUSPEND_SHOP_TEMP' | 'BAN_SHOP_PERM' | 'HIDE_PRODUCT' | 'REFUND_ORDER' | 'DISMISS',
    notes: string,
    options?: { suspendDays?: number; penaltyPoints?: number }
  ): Promise<void>;
  // Admin Inbox — User Messages
  getAdminConversations(): Promise<AdminConversation[]>;
  replyAdminMessage(conversationId: string, text: string): Promise<void>;
  updateConversationStatus(conversationId: string, status: AdminMessageStatus): Promise<void>;
  setConversationAutomation(conversationId: string, enabled: boolean): Promise<void>;
  // User Management & Support Center
  getUsers(filters?: { query?: string; role?: string; status?: string }): Promise<AdminManagedUser[]>;
  getUserDetail(userId: string): Promise<AdminManagedUser | null>;
  updateUser(userId: string, data: Partial<AdminManagedUser>): Promise<AdminManagedUser>;
  banUserPermanently(userId: string, reason: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  addUserSupportNote(userId: string, note: string, adminName?: string): Promise<UserSupportNote>;
  adjustUserBalance(userId: string, amount: number, reason: string): Promise<number>;
}

export interface IAuthApi {
  login(email: string, password: string): Promise<AuthSession>;
  register(fullName: string, email: string, phoneNumber: string, password: string): Promise<AuthSession>;
  getMe(): Promise<User | null>;
  logout(): Promise<void>;
}

// ==========================================
// GAME ACCOUNT MARKETPLACE API CONTRACTS
// ==========================================

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

export interface IGameAccountApi {
  getGames(): Promise<GameSummary[]>;
  getGameBySlug(slug: string): Promise<GameSummary | null>;
  searchGameAccounts(params: GameAccountSearchParams): Promise<ApiPaginatedResponse<GameAccountProduct>>;
  getGameAccountBySlug(slug: string): Promise<GameAccountProduct | null>;
  getGameAccountById(id: string): Promise<GameAccountProduct | null>;
  getFeaturedGameAccounts(): Promise<GameAccountProduct[]>;
}

export interface IGameAccountInventoryApi {
  getInventory(params?: { productId?: string; status?: string; search?: string }): Promise<GameAccountInventoryItemSummary[]>;
  addItem(input: CreateGameAccountInventoryItemInput): Promise<GameAccountInventoryItemSummary>;
  importBulk(productId: string, rawText: string): Promise<{ importedCount: number; errorCount: number; errors?: Array<{ line: number; reason: string }> }>;
  disableItem(id: string): Promise<void>;
  enableItem(id: string): Promise<void>;
  deleteDraft(id: string): Promise<void>;
}

export interface IDigitalDeliveryApi {
  getDeliverySummary(orderId: string): Promise<DigitalDeliverySummary>;
  revealDelivery(orderId: string, authPass?: string): Promise<RevealedGameAccountDelivery>;
  confirmReceived(orderId: string): Promise<{ success: boolean; completedAt: string }>;
  reportIssue(input: { orderId: string; issueType: string; description: string; evidenceImages: string[]; desiredSolution: string }): Promise<DigitalDispute>;
}

export interface IDigitalDisputeApi {
  getDisputes(role?: 'BUYER' | 'SELLER' | 'ADMIN'): Promise<DigitalDispute[]>;
  getDisputeById(id: string): Promise<DigitalDispute | null>;
  sellerRespond(disputeId: string, message: string): Promise<DigitalDispute>;
  adminResolve(disputeId: string, resolution: 'REFUND' | 'REPLACE' | 'DISMISS', notes: string): Promise<DigitalDispute>;
}

// ==========================================
// DIGITAL APP ACCOUNT MARKETPLACE CONTRACTS
// ==========================================

export interface IAppAccountApi {
  getApplications(): Promise<ApplicationSummary[]>;
  getApplicationBySlug(slug: string): Promise<ApplicationSummary | null>;
  searchAppAccounts(params: AppAccountSearchParams): Promise<ApiPaginatedResponse<AppAccountProduct>>;
  getAppAccountBySlug(slug: string): Promise<AppAccountProduct | null>;
  getAppAccountById(id: string): Promise<AppAccountProduct | null>;
  getFeaturedAppAccounts(): Promise<AppAccountProduct[]>;
  createApplication(input: Partial<ApplicationSummary>): Promise<ApplicationSummary>;
  updateApplication(id: string, input: Partial<ApplicationSummary>): Promise<ApplicationSummary>;
  deleteApplication(id: string): Promise<void>;
  resetApplications(): Promise<ApplicationSummary[]>;
}

export interface IAppAccountInventoryApi {
  getInventory(params?: { productId?: string; planId?: string; status?: string; search?: string }): Promise<AppAccountInventoryItemSummary[]>;
  addItem(input: CreateAppAccountInventoryItemInput): Promise<AppAccountInventoryItemSummary>;
  importBulk(productId: string, planId: string, rawText: string): Promise<{ importedCount: number; errorCount: number; errors?: Array<{ line: number; reason: string }> }>;
  disableItem(id: string): Promise<void>;
  enableItem(id: string): Promise<void>;
  deleteDraft(id: string): Promise<void>;
  getPlanCapacities(productId: string): Promise<AppPlanCapacity[]>;
  updatePlanCapacity(productId: string, planId: string, totalSlots: number): Promise<AppPlanCapacity>;
}

export interface IAppOrderApi {
  getAppDeliveryContent(orderId: string): Promise<AppDeliveryContent>;
  submitBuyerFields(orderId: string, buyerProvidedValues: Record<string, string>): Promise<void>;
  sellerMarkActivationCompleted(orderId: string, deliveryContent: Partial<AppDeliveryContent>): Promise<void>;
  sellerResendInvite(orderId: string): Promise<void>;
}
