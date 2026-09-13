import { httpClient } from './http';
import { getAppConfig } from '@marketplace/config';
import type {
  IProductApi,
  ICartApi,
  ICheckoutApi,
  IPaymentApi,
  IOrderApi,
  IWarrantyApi,
  ISellerApi,
  IShopApi,
  IAdminApi,
  IAuthApi,
  IGameAccountApi,
  IGameAccountInventoryApi,
  IDigitalDeliveryApi,
  IDigitalDisputeApi,
  IAppAccountApi,
  IAppAccountInventoryApi,
  IAppOrderApi,
  ProductSearchParams,
  GameAccountSearchParams,
} from './contracts';
import type {
  Product,
  Category,
  Brand,
  Shop,
  ShopReview,
  Order,
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
  ApiResponse,
  GameAccountProduct,
  DigitalOrderListItem,
  GameSummary,
  DigitalDispute,
  CreateGameAccountInventoryItemInput,
  GameAccountInventoryItemSummary,
  DigitalDeliverySummary,
  RevealedGameAccountDelivery,
  AppAccountProduct,
  ApplicationSummary,
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
} from '@marketplace/types';

export class HttpProductRepository implements IProductApi {
  async search(params: ProductSearchParams): Promise<ApiPaginatedResponse<Product>> {
    const res = await httpClient.get<ApiPaginatedResponse<Product>>('/products/search', { params });
    return res.data;
  }
  async getBySlug(slug: string): Promise<Product | null> {
    const res = await httpClient.get<ApiResponse<Product>>(`/products/slug/${slug}`);
    return res.data.data;
  }
  async getById(id: string): Promise<Product | null> {
    const res = await httpClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  }
  async getCategories(): Promise<Category[]> {
    const res = await httpClient.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  }
  async getBrands(): Promise<Brand[]> {
    const res = await httpClient.get<ApiResponse<Brand[]>>('/brands');
    return res.data.data;
  }
  async getTechFilters(categorySlug: string): Promise<TechFilterDefinition[]> {
    const res = await httpClient.get<ApiResponse<TechFilterDefinition[]>>(`/categories/${categorySlug}/tech-filters`);
    return res.data.data;
  }
  async getFeatured(): Promise<Product[]> {
    const res = await httpClient.get<ApiResponse<Product[]>>('/products/featured');
    return res.data.data;
  }
  async getCompareList(ids: string[]): Promise<Product[]> {
    const res = await httpClient.get<ApiResponse<Product[]>>('/products/compare', { params: { ids: ids.join(',') } });
    return res.data.data;
  }
}

export class HttpCartRepository implements ICartApi {
  async getCart(): Promise<ShopGroupedCart[]> {
    const res = await httpClient.get<ApiResponse<ShopGroupedCart[]>>('/cart');
    return res.data.data;
  }
  async addItem(productId: string, variantId: string, quantity: number): Promise<ShopGroupedCart[]> {
    const res = await httpClient.post<ApiResponse<ShopGroupedCart[]>>('/cart/items', { productId, variantId, quantity });
    return res.data.data;
  }
  async updateQuantity(cartItemId: string, quantity: number): Promise<ShopGroupedCart[]> {
    const res = await httpClient.patch<ApiResponse<ShopGroupedCart[]>>(`/cart/items/${cartItemId}`, { quantity });
    return res.data.data;
  }
  async removeItem(cartItemId: string): Promise<ShopGroupedCart[]> {
    const res = await httpClient.delete<ApiResponse<ShopGroupedCart[]>>(`/cart/items/${cartItemId}`);
    return res.data.data;
  }
  async toggleSelect(cartItemId: string): Promise<ShopGroupedCart[]> {
    const res = await httpClient.patch<ApiResponse<ShopGroupedCart[]>>(`/cart/items/${cartItemId}/select`);
    return res.data.data;
  }
  async selectAll(selected: boolean): Promise<ShopGroupedCart[]> {
    const res = await httpClient.patch<ApiResponse<ShopGroupedCart[]>>('/cart/select-all', { selected });
    return res.data.data;
  }
}

export class HttpCheckoutRepository implements ICheckoutApi {
  async preview(request: CheckoutPreviewRequest): Promise<CheckoutPreviewResponse> {
    const res = await httpClient.post<ApiResponse<CheckoutPreviewResponse>>('/checkout/preview', request);
    return res.data.data;
  }
  async createOrder(request: {
    selectedCartItemIds: string[];
    addressId: string;
    shippingAddress?: import('@marketplace/types').Address;
    shippingMethodId: string;
    paymentMethod: 'SEPAY_QR' | 'COD';
    voucherCode?: string;
    notes?: string;
  }): Promise<{ orderId: string; paymentId: string; totalAmount: number }> {
    const res = await httpClient.post<ApiResponse<{ orderId: string; paymentId: string; totalAmount: number }>>('/checkout/create-order', request);
    return res.data.data;
  }
}

export class HttpPaymentRepository implements IPaymentApi {
  async getPayment(paymentId: string): Promise<PaymentTransaction> {
    const res = await httpClient.get<ApiResponse<PaymentTransaction>>(`/payments/${paymentId}`);
    return res.data.data;
  }
  async checkStatus(paymentId: string): Promise<{ status: PaymentTransaction['status']; isPaid: boolean }> {
    const res = await httpClient.get<ApiResponse<{ status: PaymentTransaction['status']; isPaid: boolean }>>(`/payments/${paymentId}/status`);
    return res.data.data;
  }
  async simulatePaymentSuccess(paymentId: string): Promise<PaymentTransaction> {
    const config = getAppConfig();
    if (config.appEnv === 'production') {
      throw new Error('[SECURITY ERROR] simulatePaymentSuccess is strictly forbidden in production environment.');
    }
    const res = await httpClient.post<ApiResponse<PaymentTransaction>>(`/payments/${paymentId}/simulate-success`);
    return res.data.data;
  }
}

export class HttpOrderRepository implements IOrderApi {
  async getOrders(status?: string): Promise<Order[]> {
    const res = await httpClient.get<ApiResponse<Order[]>>('/orders', { params: { status } });
    return res.data.data;
  }
  async getOrderById(id: string): Promise<Order | null> {
    const res = await httpClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data.data;
  }
  async cancelOrder(id: string, reason: string): Promise<Order> {
    const res = await httpClient.post<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason });
    return res.data.data;
  }
  async confirmReceived(id: string): Promise<Order> {
    const res = await httpClient.post<ApiResponse<Order>>(`/orders/${id}/confirm-received`);
    return res.data.data;
  }
  async requestReturn(data: { orderId: string; orderItemId: string; reason: string; description: string; evidenceImages: string[] }): Promise<ReturnRequest> {
    const res = await httpClient.post<ApiResponse<ReturnRequest>>('/returns', data);
    return res.data.data;
  }
  async getDigitalOrders(): Promise<DigitalOrderListItem[]> {
    const res = await httpClient.get<ApiResponse<DigitalOrderListItem[]>>('/orders/digital');
    return res.data.data;
  }
}

export class HttpWarrantyRepository implements IWarrantyApi {
  async getWarranties(): Promise<RegisteredWarranty[]> {
    const res = await httpClient.get<ApiResponse<RegisteredWarranty[]>>('/warranties');
    return res.data.data;
  }
  async submitClaim(data: { warrantyId: string; serialNumber?: string; issueDescription: string; evidenceImages: string[] }): Promise<WarrantyClaim> {
    const res = await httpClient.post<ApiResponse<WarrantyClaim>>('/warranties/claims', data);
    return res.data.data;
  }
}

export class HttpSellerRepository implements ISellerApi {
  async getDashboard() {
    const res = await httpClient.get<ApiResponse<any>>('/seller/dashboard');
    return res.data.data;
  }
  async getProducts(): Promise<Product[]> {
    const res = await httpClient.get<ApiResponse<Product[]>>('/seller/products');
    return res.data.data;
  }
  async saveProduct(productData: Partial<Product>): Promise<Product> {
    const res = await httpClient.post<ApiResponse<Product>>('/seller/products', productData);
    return res.data.data;
  }
  async updateStock(variantId: string, newStock: number): Promise<void> {
    await httpClient.patch(`/seller/inventory/${variantId}`, { stock: newStock });
  }
  async getOrders(status?: string): Promise<Order[]> {
    const res = await httpClient.get<ApiResponse<Order[]>>('/seller/orders', { params: { status } });
    return res.data.data;
  }
  async updateOrderStatus(orderId: string, newStatus: Order['status']): Promise<Order> {
    const res = await httpClient.patch<ApiResponse<Order>>(`/seller/orders/${orderId}/status`, { status: newStatus });
    return res.data.data;
  }
  async getFinance(): Promise<SellerFinanceSummary> {
    const res = await httpClient.get<ApiResponse<SellerFinanceSummary>>('/seller/finance');
    return res.data.data;
  }
  async requestPayout(amount: number, bankInfo: { bankName: string; accountNumber: string; accountHolder: string }): Promise<void> {
    await httpClient.post('/seller/payouts', { amount, bankInfo });
  }
  async applyAsSeller(data: Partial<SellerApplication>): Promise<SellerApplication> {
    const res = await httpClient.post<ApiResponse<SellerApplication>>('/seller/apply', data);
    return res.data.data;
  }
  async getMyApplication(): Promise<SellerApplication | null> {
    const res = await httpClient.get<ApiResponse<SellerApplication>>('/seller/my-application');
    return res.data.data;
  }
  async getSellerGameAccounts(): Promise<GameAccountProduct[]> {
    const res = await httpClient.get<ApiResponse<GameAccountProduct[]>>('/seller/game-account-products');
    return res.data.data;
  }
  async saveSellerGameAccount(data: Partial<GameAccountProduct>): Promise<GameAccountProduct> {
    const res = await httpClient.post<ApiResponse<GameAccountProduct>>('/seller/game-account-products', data);
    return res.data.data;
  }
  async getDigitalOrders(): Promise<DigitalOrderListItem[]> {
    const res = await httpClient.get<ApiResponse<DigitalOrderListItem[]>>('/seller/digital-orders');
    return res.data.data;
  }
  async getSellerAppAccounts(): Promise<AppAccountProduct[]> {
    const res = await httpClient.get<ApiResponse<AppAccountProduct[]>>('/seller/app-account-products');
    return res.data.data;
  }
  async saveSellerAppAccount(data: Partial<AppAccountProduct>): Promise<AppAccountProduct> {
    const res = await httpClient.post<ApiResponse<AppAccountProduct>>('/seller/app-account-products', data);
    return res.data.data;
  }
  async getSellerAppOrders(): Promise<DigitalOrderListItem[]> {
    const res = await httpClient.get<ApiResponse<DigitalOrderListItem[]>>('/seller/app-orders');
    return res.data.data;
  }
}

export class HttpAdminRepository implements IAdminApi {
  async getDashboard() {
    const res = await httpClient.get<ApiResponse<any>>('/admin/dashboard');
    return res.data.data;
  }
  async getSellerApplications(): Promise<SellerApplication[]> {
    const res = await httpClient.get<ApiResponse<SellerApplication[]>>('/admin/seller-applications');
    return res.data.data;
  }
  async reviewSeller(applicationId: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<void> {
    await httpClient.post(`/admin/seller-applications/${applicationId}/review`, { action, reason });
  }
  async getPendingProducts(): Promise<Product[]> {
    const res = await httpClient.get<ApiResponse<Product[]>>('/admin/products/pending');
    return res.data.data;
  }
  async reviewProduct(productId: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<void> {
    await httpClient.post(`/admin/products/${productId}/review`, { action, reason });
  }
  async getCategorySchemas(): Promise<CategoryAttributeSchema[]> {
    const res = await httpClient.get<ApiResponse<CategoryAttributeSchema[]>>('/admin/categories/schemas');
    return res.data.data;
  }
  async saveCategorySchema(schema: CategoryAttributeSchema): Promise<void> {
    await httpClient.post('/admin/categories/schemas', schema);
  }
  async getAllOrders(): Promise<Order[]> {
    const res = await httpClient.get<ApiResponse<Order[]>>('/admin/orders');
    return res.data.data;
  }
  async getGameAccountProducts(): Promise<GameAccountProduct[]> {
    const res = await httpClient.get<ApiResponse<GameAccountProduct[]>>('/admin/game-account-products');
    return res.data.data;
  }
  async reviewGameAccountProduct(productId: string, action: 'APPROVE' | 'REJECT' | 'HIDE', reason?: string): Promise<void> {
    await httpClient.post(`/admin/game-account-products/${productId}/${action.toLowerCase()}`, { reason });
  }
  async getGameCatalog(): Promise<GameSummary[]> {
    const res = await httpClient.get<ApiResponse<GameSummary[]>>('/admin/game-catalog');
    return res.data.data;
  }
  async saveGame(game: GameSummary): Promise<GameSummary> {
    const res = await httpClient.post<ApiResponse<GameSummary>>('/admin/game-catalog', game);
    return res.data.data;
  }
  async getAppAccountProducts(): Promise<AppAccountProduct[]> {
    const res = await httpClient.get<ApiResponse<AppAccountProduct[]>>('/admin/app-account-products');
    return res.data.data;
  }
  async reviewAppAccountProduct(productId: string, action: 'APPROVE' | 'REJECT' | 'HIDE', reason?: string): Promise<void> {
    await httpClient.post(`/admin/app-account-products/${productId}/${action.toLowerCase()}`, { reason });
  }
  async getApplicationCatalog(): Promise<ApplicationSummary[]> {
    const res = await httpClient.get<ApiResponse<ApplicationSummary[]>>('/admin/application-catalog');
    return res.data.data;
  }
  async saveApplication(app: ApplicationSummary): Promise<ApplicationSummary> {
    const res = await httpClient.post<ApiResponse<ApplicationSummary>>('/admin/application-catalog', app);
    return res.data.data;
  }
  async getDigitalDisputes(): Promise<DigitalDispute[]> {
    const res = await httpClient.get<ApiResponse<DigitalDispute[]>>('/admin/digital-disputes');
    return res.data.data;
  }
  async resolveDigitalDispute(disputeId: string, resolution: 'REFUND' | 'REPLACE' | 'DISMISS', notes: string): Promise<void> {
    await httpClient.post(`/admin/digital-disputes/${disputeId}/resolve`, { resolution, notes });
  }
  async getAllShops(): Promise<Shop[]> {
    const res = await httpClient.get<ApiResponse<Shop[]>>('/admin/shops');
    return res.data.data;
  }
  async warnShop(shopId: string, reason: string, penaltyPoints?: number, notes?: string): Promise<void> {
    await httpClient.post(`/admin/shops/${shopId}/warn`, { reason, penaltyPoints, notes });
  }
  async suspendShop(shopId: string, days: number, reason: string): Promise<void> {
    await httpClient.post(`/admin/shops/${shopId}/suspend`, { days, reason });
  }
  async banShop(shopId: string, reason: string): Promise<void> {
    await httpClient.post(`/admin/shops/${shopId}/ban`, { reason });
  }
  async reactivateShop(shopId: string): Promise<void> {
    await httpClient.post(`/admin/shops/${shopId}/reactivate`);
  }
  async getUserReports(): Promise<UserReport[]> {
    const res = await httpClient.get<ApiResponse<UserReport[]>>('/admin/reports');
    return res.data.data;
  }
  async submitUserReport(input: Omit<UserReport, 'id' | 'ticketCode' | 'createdAt' | 'status'>): Promise<UserReport> {
    const res = await httpClient.post<ApiResponse<UserReport>>('/reports', input);
    return res.data.data;
  }
  async resolveUserReport(
    reportId: string,
    action: 'WARN_SHOP' | 'SUSPEND_SHOP_TEMP' | 'BAN_SHOP_PERM' | 'HIDE_PRODUCT' | 'REFUND_ORDER' | 'DISMISS',
    notes: string,
    options?: { suspendDays?: number; penaltyPoints?: number }
  ): Promise<void> {
    await httpClient.post(`/admin/reports/${reportId}/resolve`, { action, notes, options });
  }
  async getAdminConversations(): Promise<AdminConversation[]> {
    const res = await httpClient.get<ApiResponse<AdminConversation[]>>('/admin/conversations');
    return res.data.data;
  }
  async replyAdminMessage(conversationId: string, text: string): Promise<void> {
    await httpClient.post(`/admin/conversations/${conversationId}/reply`, { text });
  }
  async updateConversationStatus(conversationId: string, status: AdminMessageStatus): Promise<void> {
    await httpClient.patch(`/admin/conversations/${conversationId}/status`, { status });
  }
  async setConversationAutomation(conversationId: string, enabled: boolean): Promise<void> {
    await httpClient.patch(`/admin/conversations/${conversationId}/automation`, { enabled });
  }
  async getUsers(filters?: { query?: string; role?: string; status?: string }): Promise<AdminManagedUser[]> {
    const res = await httpClient.get<ApiResponse<AdminManagedUser[]>>('/admin/users', { params: filters });
    return res.data.data;
  }
  async getUserDetail(userId: string): Promise<AdminManagedUser | null> {
    const res = await httpClient.get<ApiResponse<AdminManagedUser>>(`/admin/users/${userId}`);
    return res.data.data;
  }
  async updateUser(userId: string, data: Partial<AdminManagedUser>): Promise<AdminManagedUser> {
    const res = await httpClient.put<ApiResponse<AdminManagedUser>>(`/admin/users/${userId}`, data);
    return res.data.data;
  }
  async banUserPermanently(userId: string, reason: string): Promise<void> {
    await httpClient.post(`/admin/users/${userId}/ban`, { reason });
  }
  async unbanUser(userId: string): Promise<void> {
    await httpClient.post(`/admin/users/${userId}/unban`);
  }
  async deleteUser(userId: string): Promise<void> {
    await httpClient.delete(`/admin/users/${userId}`);
  }
  async addUserSupportNote(userId: string, note: string, adminName?: string): Promise<UserSupportNote> {
    const res = await httpClient.post<ApiResponse<UserSupportNote>>(`/admin/users/${userId}/notes`, { note, adminName });
    return res.data.data;
  }
  async adjustUserBalance(userId: string, amount: number, reason: string): Promise<number> {
    const res = await httpClient.post<ApiResponse<{ newBalance: number }>>(`/admin/users/${userId}/adjust-balance`, { amount, reason });
    return res.data.data.newBalance;
  }
}

export class HttpAppAccountRepository implements IAppAccountApi {
  async getApplications(): Promise<ApplicationSummary[]> {
    const res = await httpClient.get<ApiResponse<ApplicationSummary[]>>('/app-accounts/applications');
    return res.data.data;
  }
  async getApplicationBySlug(slug: string): Promise<ApplicationSummary | null> {
    const res = await httpClient.get<ApiResponse<ApplicationSummary>>(`/app-accounts/applications/${slug}`);
    return res.data.data;
  }
  async createApplication(input: Partial<ApplicationSummary>): Promise<ApplicationSummary> {
    const res = await httpClient.post<ApiResponse<ApplicationSummary>>('/app-accounts/applications', input);
    return res.data.data;
  }
  async updateApplication(id: string, input: Partial<ApplicationSummary>): Promise<ApplicationSummary> {
    const res = await httpClient.put<ApiResponse<ApplicationSummary>>(`/app-accounts/applications/${id}`, input);
    return res.data.data;
  }
  async deleteApplication(id: string): Promise<void> {
    await httpClient.delete(`/app-accounts/applications/${id}`);
  }
  async resetApplications(): Promise<ApplicationSummary[]> {
    const res = await httpClient.post<ApiResponse<ApplicationSummary[]>>('/app-accounts/applications/reset');
    return res.data.data;
  }
  async searchAppAccounts(params: AppAccountSearchParams): Promise<ApiPaginatedResponse<AppAccountProduct>> {
    const res = await httpClient.get<ApiPaginatedResponse<AppAccountProduct>>('/app-accounts/search', { params });
    return res.data;
  }
  async getAppAccountBySlug(slug: string): Promise<AppAccountProduct | null> {
    const res = await httpClient.get<ApiResponse<AppAccountProduct>>(`/app-accounts/slug/${slug}`);
    return res.data.data;
  }
  async getAppAccountById(id: string): Promise<AppAccountProduct | null> {
    const res = await httpClient.get<ApiResponse<AppAccountProduct>>(`/app-accounts/${id}`);
    return res.data.data;
  }
  async getFeaturedAppAccounts(): Promise<AppAccountProduct[]> {
    const res = await httpClient.get<ApiResponse<AppAccountProduct[]>>('/app-accounts/featured');
    return res.data.data;
  }
}

export class HttpAppAccountInventoryRepository implements IAppAccountInventoryApi {
  async getInventory(params?: { productId?: string; planId?: string; status?: string; search?: string }): Promise<AppAccountInventoryItemSummary[]> {
    const res = await httpClient.get<ApiResponse<AppAccountInventoryItemSummary[]>>('/seller/app-inventory', { params });
    return res.data.data;
  }
  async addItem(input: CreateAppAccountInventoryItemInput): Promise<AppAccountInventoryItemSummary> {
    const res = await httpClient.post<ApiResponse<AppAccountInventoryItemSummary>>('/seller/app-inventory/item', input);
    return res.data.data;
  }
  async importBulk(productId: string, planId: string, rawText: string): Promise<{ importedCount: number; errorCount: number; errors?: Array<{ line: number; reason: string }> }> {
    const res = await httpClient.post<ApiResponse<any>>('/seller/app-inventory/bulk', { productId, planId, rawText });
    return res.data.data;
  }
  async disableItem(id: string): Promise<void> {
    await httpClient.post(`/seller/app-inventory/${id}/disable`);
  }
  async enableItem(id: string): Promise<void> {
    await httpClient.post(`/seller/app-inventory/${id}/enable`);
  }
  async deleteDraft(id: string): Promise<void> {
    await httpClient.delete(`/seller/app-inventory/${id}`);
  }
  async getPlanCapacities(productId: string): Promise<AppPlanCapacity[]> {
    const res = await httpClient.get<ApiResponse<AppPlanCapacity[]>>(`/seller/app-products/${productId}/capacities`);
    return res.data.data;
  }
  async updatePlanCapacity(productId: string, planId: string, totalSlots: number): Promise<AppPlanCapacity> {
    const res = await httpClient.put<ApiResponse<AppPlanCapacity>>(`/seller/app-products/${productId}/plans/${planId}/capacity`, { totalSlots });
    return res.data.data;
  }
}

export class HttpAppOrderRepository implements IAppOrderApi {
  async getAppDeliveryContent(orderId: string): Promise<AppDeliveryContent> {
    const res = await httpClient.get<ApiResponse<AppDeliveryContent>>(`/app-orders/${orderId}/delivery`);
    return res.data.data;
  }
  async submitBuyerFields(orderId: string, buyerProvidedValues: Record<string, string>): Promise<void> {
    await httpClient.post(`/app-orders/${orderId}/buyer-fields`, { buyerProvidedValues });
  }
  async sellerMarkActivationCompleted(orderId: string, deliveryContent: Partial<AppDeliveryContent>): Promise<void> {
    await httpClient.post(`/seller/app-orders/${orderId}/complete`, deliveryContent);
  }
  async sellerResendInvite(orderId: string): Promise<void> {
    await httpClient.post(`/seller/app-orders/${orderId}/resend-invite`);
  }
}

export class HttpAuthRepository implements IAuthApi {
  async login(email: string, password: string): Promise<AuthSession> {
    const res = await httpClient.post<ApiResponse<AuthSession>>('/auth/login', { email, password });
    return res.data.data;
  }
  async register(fullName: string, email: string, phoneNumber: string, password: string): Promise<AuthSession> {
    const res = await httpClient.post<ApiResponse<AuthSession>>('/auth/register', { fullName, email, phoneNumber, password });
    return res.data.data;
  }
  async getMe(): Promise<User | null> {
    const res = await httpClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  }
  async logout(): Promise<void> {
    await httpClient.post('/auth/logout');
  }
}

export class HttpShopRepository implements IShopApi {
  async getShop(shopIdOrSlug: string): Promise<Shop | null> {
    const res = await httpClient.get<ApiResponse<Shop | null>>(`/shops/${shopIdOrSlug}`);
    return res.data.data;
  }
  async getShopProducts(shopId: string): Promise<Product[]> {
    const res = await httpClient.get<ApiResponse<Product[]>>(`/shops/${shopId}/products`);
    return res.data.data;
  }
  async toggleFollow(shopId: string, isFollowing: boolean): Promise<{ followerCount: number; isFollowing: boolean }> {
    const res = await httpClient.post<ApiResponse<{ followerCount: number; isFollowing: boolean }>>(`/shops/${shopId}/follow`, { isFollowing });
    return res.data.data;
  }
  async toggleLike(shopId: string, isLiked: boolean): Promise<{ likeCount: number; isLiked: boolean }> {
    const res = await httpClient.post<ApiResponse<{ likeCount: number; isLiked: boolean }>>(`/shops/${shopId}/like`, { isLiked });
    return res.data.data;
  }
  async getReviews(shopId: string, productId?: string): Promise<ShopReview[]> {
    const res = await httpClient.get<ApiResponse<ShopReview[]>>(`/shops/${shopId}/reviews`, { params: { productId } });
    return res.data.data;
  }
  async addReview(review: { shopId: string; productId?: string; productName?: string; rating: number; comment: string; orderId?: string; buyerName?: string }): Promise<ShopReview> {
    const res = await httpClient.post<ApiResponse<ShopReview>>(`/shops/${review.shopId}/reviews`, review);
    return res.data.data;
  }
  async checkPurchaseEligibility(shopId: string, productId?: string): Promise<{ hasPurchased: boolean; orderId?: string; orderCode?: string }> {
    const res = await httpClient.get<ApiResponse<{ hasPurchased: boolean; orderId?: string; orderCode?: string }>>(`/shops/${shopId}/purchase-eligibility`, { params: { productId } });
    return res.data.data;
  }
}

export class HttpGameAccountRepository implements IGameAccountApi {
  async getGames(): Promise<GameSummary[]> {
    const res = await httpClient.get<ApiResponse<GameSummary[]>>('/game-accounts/games');
    return res.data.data;
  }
  async getGameBySlug(slug: string): Promise<GameSummary | null> {
    const res = await httpClient.get<ApiResponse<GameSummary | null>>(`/game-accounts/games/${slug}`);
    return res.data.data;
  }
  async searchGameAccounts(params: GameAccountSearchParams): Promise<ApiPaginatedResponse<GameAccountProduct>> {
    const res = await httpClient.get<ApiPaginatedResponse<GameAccountProduct>>('/game-accounts/search', { params });
    return res.data;
  }
  async getGameAccountBySlug(slug: string): Promise<GameAccountProduct | null> {
    const res = await httpClient.get<ApiResponse<GameAccountProduct | null>>(`/game-accounts/slug/${slug}`);
    return res.data.data;
  }
  async getGameAccountById(id: string): Promise<GameAccountProduct | null> {
    const res = await httpClient.get<ApiResponse<GameAccountProduct | null>>(`/game-accounts/${id}`);
    return res.data.data;
  }
  async getFeaturedGameAccounts(): Promise<GameAccountProduct[]> {
    const res = await httpClient.get<ApiResponse<GameAccountProduct[]>>('/game-accounts/featured');
    return res.data.data;
  }
}

export class HttpGameAccountInventoryRepository implements IGameAccountInventoryApi {
  async getInventory(params?: { productId?: string; status?: string; search?: string }): Promise<GameAccountInventoryItemSummary[]> {
    const res = await httpClient.get<ApiResponse<GameAccountInventoryItemSummary[]>>('/seller/game-inventory', { params });
    return res.data.data;
  }
  async addItem(input: CreateGameAccountInventoryItemInput): Promise<GameAccountInventoryItemSummary> {
    const res = await httpClient.post<ApiResponse<GameAccountInventoryItemSummary>>('/seller/game-inventory', input);
    return res.data.data;
  }
  async importBulk(productId: string, rawText: string): Promise<{ importedCount: number; errorCount: number; errors?: Array<{ line: number; reason: string }> }> {
    const res = await httpClient.post<ApiResponse<{ importedCount: number; errorCount: number; errors?: Array<{ line: number; reason: string }> }>>('/seller/game-inventory/bulk', { productId, rawText });
    return res.data.data;
  }
  async disableItem(id: string): Promise<void> {
    await httpClient.post(`/seller/game-inventory/${id}/disable`);
  }
  async enableItem(id: string): Promise<void> {
    await httpClient.post(`/seller/game-inventory/${id}/enable`);
  }
  async deleteDraft(id: string): Promise<void> {
    await httpClient.delete(`/seller/game-inventory/${id}`);
  }
}

export class HttpDigitalDeliveryRepository implements IDigitalDeliveryApi {
  async getDeliverySummary(orderId: string): Promise<DigitalDeliverySummary> {
    const res = await httpClient.get<ApiResponse<DigitalDeliverySummary>>(`/digital-delivery/${orderId}/summary`);
    return res.data.data;
  }
  async revealDelivery(orderId: string, authPass?: string): Promise<RevealedGameAccountDelivery> {
    const res = await httpClient.post<ApiResponse<RevealedGameAccountDelivery>>(`/digital-delivery/${orderId}/reveal`, { authPass });
    return res.data.data;
  }
  async confirmReceived(orderId: string): Promise<{ success: boolean; completedAt: string }> {
    const res = await httpClient.post<ApiResponse<{ success: boolean; completedAt: string }>>(`/digital-delivery/${orderId}/confirm`);
    return res.data.data;
  }
  async reportIssue(input: { orderId: string; issueType: string; description: string; evidenceImages: string[]; desiredSolution: string }): Promise<DigitalDispute> {
    const res = await httpClient.post<ApiResponse<DigitalDispute>>(`/digital-delivery/${input.orderId}/dispute`, input);
    return res.data.data;
  }
}

export class HttpDigitalDisputeRepository implements IDigitalDisputeApi {
  async getDisputes(role?: 'BUYER' | 'SELLER' | 'ADMIN'): Promise<DigitalDispute[]> {
    const res = await httpClient.get<ApiResponse<DigitalDispute[]>>('/digital-disputes', { params: { role } });
    return res.data.data;
  }
  async getDisputeById(id: string): Promise<DigitalDispute | null> {
    const res = await httpClient.get<ApiResponse<DigitalDispute | null>>(`/digital-disputes/${id}`);
    return res.data.data;
  }
  async sellerRespond(disputeId: string, message: string): Promise<DigitalDispute> {
    const res = await httpClient.post<ApiResponse<DigitalDispute>>(`/digital-disputes/${disputeId}/respond`, { message });
    return res.data.data;
  }
  async adminResolve(disputeId: string, resolution: 'REFUND' | 'REPLACE' | 'DISMISS', notes: string): Promise<DigitalDispute> {
    const res = await httpClient.post<ApiResponse<DigitalDispute>>(`/digital-disputes/${disputeId}/resolve`, { resolution, notes });
    return res.data.data;
  }
}
