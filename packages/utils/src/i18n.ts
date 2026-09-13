import { create } from 'zustand';

export type Locale = 'vi' | 'en';
export type Currency = 'VND' | 'USD';

/**
 * Exchange rate requested by user: 26.250 VNĐ = 1 USD ($)
 */
export const EXCHANGE_RATE_VND_TO_USD = 26250;

interface I18nState {
  locale: Locale;
  currency: Currency;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const getInitialLocale = (): Locale => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('app_locale') as Locale;
    if (saved === 'vi' || saved === 'en') return saved;
  }
  return 'vi';
};

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: getInitialLocale(),
  currency: getInitialLocale() === 'en' ? 'USD' : 'VND',
  setLocale: (locale: Locale) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('app_locale', locale);
    }
    set({
      locale,
      currency: locale === 'en' ? 'USD' : 'VND',
    });
  },
  toggleLocale: () => {
    const next = get().locale === 'vi' ? 'en' : 'vi';
    get().setLocale(next);
  },
}));

/**
 * Convert VND amount to USD using the fixed rate 26,250 VND = $1 USD
 */
export function convertVndToUsd(amountInVnd: number): number {
  if (!amountInVnd || isNaN(amountInVnd)) return 0;
  return Number((amountInVnd / EXCHANGE_RATE_VND_TO_USD).toFixed(2));
}

/**
 * Convert USD amount back to VND
 */
export function convertUsdToVnd(amountInUsd: number): number {
  if (!amountInUsd || isNaN(amountInUsd)) return 0;
  return Math.round(amountInUsd * EXCHANGE_RATE_VND_TO_USD);
}

/**
 * Format price according to active locale or specified locale.
 * When locale is 'en', automatically converts VND to USD at rate 26,250 VND = $1 USD.
 * When locale is 'vi', formats standard Vietnamese Dong (e.g. 26.250.000 ₫).
 */
export function formatPrice(amountInVnd: number, overrideLocale?: Locale): string {
  if (isNaN(amountInVnd)) return overrideLocale === 'en' ? '$0.00' : '0 ₫';

  const currentLocale = overrideLocale || useI18nStore.getState().locale;

  if (currentLocale === 'en') {
    const usd = amountInVnd / EXCHANGE_RATE_VND_TO_USD;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usd);
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amountInVnd);
}

/**
 * Format revenue / large scale metrics (e.g. 1.250 tr -> $47.6K in English)
 */
export function formatLargePrice(amountInVnd: number, overrideLocale?: Locale): string {
  if (isNaN(amountInVnd) || amountInVnd === 0) return overrideLocale === 'en' ? '$0' : '0 đ';

  const currentLocale = overrideLocale || useI18nStore.getState().locale;

  if (currentLocale === 'en') {
    const usd = amountInVnd / EXCHANGE_RATE_VND_TO_USD;
    if (usd >= 1_000_000) {
      return `$${(usd / 1_000_000).toFixed(2)}M`;
    }
    if (usd >= 1_000) {
      return `$${(usd / 1_000).toFixed(1)}K`;
    }
    return `$${usd.toFixed(2)}`;
  }

  if (amountInVnd >= 1_000_000_000) {
    return `${(amountInVnd / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (amountInVnd >= 1_000_000) {
    return `${(amountInVnd / 1_000_000).toLocaleString('vi-VN')} tr`;
  }
  return `${amountInVnd.toLocaleString('vi-VN')} đ`;
}

/**
 * Dictionary of Vietnamese <-> English translations
 */
export const dictionary: Record<Locale, Record<string, string>> = {
  vi: {
    // Topbar & Nav
    'nav.home': 'Trang chủ',
    'nav.games': 'Kho Nick Game',
    'nav.apps': 'Tài Khoản App / AI',
    'nav.orders': 'Đơn hàng của tôi',
    'nav.warranties': 'Bảo hành Serial/IMEI',
    'nav.returns': 'Đổi trả & Tranh chấp',
    'nav.sellerCenter': 'Kênh Người Bán',
    'nav.adminPortal': 'Admin Portal',
    'nav.login': 'Đăng nhập',
    'nav.register': 'Đăng ký',
    'nav.logout': 'Đăng xuất',
    'nav.compare': 'So sánh',
    'nav.cart': 'Giỏ hàng',
    'nav.searchPlaceholder': 'Tìm kiếm laptop, điện thoại, nick game, account ChatGPT Plus...',
    'nav.searchButton': 'Tìm kiếm',
    'nav.exchangeRate': 'Tỉ giá: 1$ = 26.250đ',
    'nav.hotline': 'Hotline: 1800 6868',
    'nav.officialCommitment': '100% Đồ công nghệ chính hãng - Bảo hành Serial/IMEI',
    'nav.sepayNotice': 'Thanh toán tự động 24/7 qua SePay VietQR',

    // Product & Actions
    'product.buyNow': 'Mua ngay',
    'product.addToCart': 'Thêm vào giỏ',
    'product.viewDetail': 'Xem chi tiết',
    'product.outOfStock': 'Hết hàng',
    'product.inStock': 'Còn hàng',
    'product.official': 'CHÍNH HÃNG',
    'product.warrantyMonths': 'tháng bảo hành',
    'product.variants': 'Phiên bản / Cấu hình',
    'product.quantity': 'Số lượng',
    'product.price': 'Giá bán',
    'product.originalPrice': 'Giá gốc',
    'product.total': 'Tổng tiền',
    'product.discount': 'Giảm giá',
    'product.specifications': 'Thông số kỹ thuật',
    'product.reviews': 'Đánh giá người mua',
    'product.deliveryInstant': 'Giao tài khoản tự động tức thì',
    'product.warrantyPolicy': 'Chính sách bảo hành',
    'product.reportViolation': 'Tố cáo vi phạm',

    // Cart & Checkout
    'cart.title': 'Giỏ Hàng Của Bạn',
    'cart.empty': 'Giỏ hàng của bạn đang trống',
    'cart.selectAll': 'Chọn tất cả',
    'cart.unitPrice': 'Đơn giá',
    'cart.subtotal': 'Tạm tính',
    'cart.proceedCheckout': 'Tiến hành đặt hàng',
    'cart.continueShopping': 'Tiếp tục mua sắm',
    'checkout.title': 'Thanh Toán Đơn Hàng',
    'checkout.shippingInfo': 'Thông tin nhận hàng',
    'checkout.fullName': 'Họ và tên người nhận',
    'checkout.phone': 'Số điện thoại',
    'checkout.address': 'Địa chỉ giao hàng',
    'checkout.paymentMethod': 'Phương thức thanh toán',
    'checkout.sepayQr': 'Chuyển khoản SePay VietQR (Tự động 24/7)',
    'checkout.cod': 'Thanh toán khi nhận hàng (COD)',
    'checkout.placeOrder': 'Xác nhận đặt hàng',

    // Admin & Seller
    'admin.dashboard': 'Bảng Quản Trị Hệ Thống',
    'admin.shops': 'Tất cả gian hàng & Chế tài',
    'admin.sellerApproval': 'Duyệt hồ sơ mở Shop',
    'admin.productModeration': 'Duyệt SP công nghệ',
    'admin.gameModeration': 'Duyệt Nick Game',
    'admin.appModeration': 'Duyệt Tài khoản App / AI',
    'admin.reportsInbox': 'Hòm Thư Báo Cáo & Tố Cáo',
    'admin.digitalDisputes': 'Tranh chấp tài khoản số',
    'admin.payments': 'Nhật ký SePay VietQR',
    'admin.orders': 'Quản trị đơn hàng toàn sàn',
    'admin.warnAction': 'Cảnh báo ngay',
    'admin.suspendAction': 'Tạm khóa',
    'admin.banAction': 'Cấm vĩnh viễn',
    'admin.reactivateAction': 'Mở khóa',
    'admin.detailsAction': 'Soi hồ sơ',
    'admin.proactiveAudit': 'Quyền Quản Lý & Chế Tài Trực Tiếp Của Admin',
    'admin.penaltyPoints': 'Điểm phạt',

    // Statuses
    'status.active': 'Hoạt động tốt',
    'status.warning': 'Bị cảnh cáo',
    'status.suspended': 'Đang tạm khóa',
    'status.banned': 'Cấm vĩnh viễn',
    'status.pending': 'Chờ xử lý / Chờ duyệt',
    'status.completed': 'Thành công / Đã giao',
    'status.resolved': 'Đã giải quyết',
  },
  en: {
    // Topbar & Nav
    'nav.home': 'Home',
    'nav.games': 'Game Accounts Hub',
    'nav.apps': 'App / AI Accounts',
    'nav.orders': 'My Orders',
    'nav.warranties': 'Serial/IMEI Warranty',
    'nav.returns': 'Returns & Disputes',
    'nav.sellerCenter': 'Seller Center',
    'nav.adminPortal': 'Admin Portal',
    'nav.login': 'Sign In',
    'nav.register': 'Sign Up',
    'nav.logout': 'Sign Out',
    'nav.compare': 'Compare',
    'nav.cart': 'Cart',
    'nav.searchPlaceholder': 'Search laptops, phones, game accounts, ChatGPT Plus...',
    'nav.searchButton': 'Search',
    'nav.exchangeRate': 'Rate: $1 = 26,250 VND',
    'nav.hotline': 'Hotline: 1800 6868',
    'nav.officialCommitment': '100% Genuine Tech Gear - Serial/IMEI Warranty',
    'nav.sepayNotice': 'Automated 24/7 VietQR Payment via SePay',

    // Product & Actions
    'product.buyNow': 'Buy Now',
    'product.addToCart': 'Add to Cart',
    'product.viewDetail': 'View Details',
    'product.outOfStock': 'Out of Stock',
    'product.inStock': 'In Stock',
    'product.official': 'OFFICIAL',
    'product.warrantyMonths': 'months warranty',
    'product.variants': 'Variants / Configurations',
    'product.quantity': 'Quantity',
    'product.price': 'Price',
    'product.originalPrice': 'Original Price',
    'product.total': 'Total',
    'product.discount': 'Discount',
    'product.specifications': 'Specifications',
    'product.reviews': 'Buyer Reviews',
    'product.deliveryInstant': 'Instant Automated Account Delivery',
    'product.warrantyPolicy': 'Warranty Policy',
    'product.reportViolation': 'Report Violation',

    // Cart & Checkout
    'cart.title': 'Your Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.selectAll': 'Select All',
    'cart.unitPrice': 'Unit Price',
    'cart.subtotal': 'Subtotal',
    'cart.proceedCheckout': 'Proceed to Checkout',
    'cart.continueShopping': 'Continue Shopping',
    'checkout.title': 'Order Checkout',
    'checkout.shippingInfo': 'Shipping Information',
    'checkout.fullName': 'Recipient Full Name',
    'checkout.phone': 'Phone Number',
    'checkout.address': 'Shipping Address',
    'checkout.paymentMethod': 'Payment Method',
    'checkout.sepayQr': 'SePay VietQR Transfer (Automated 24/7)',
    'checkout.cod': 'Cash On Delivery (COD)',
    'checkout.placeOrder': 'Confirm Order',

    // Admin & Seller
    'admin.dashboard': 'Admin Dashboard',
    'admin.shops': 'All Shops & Sanctions',
    'admin.sellerApproval': 'Seller Approvals',
    'admin.productModeration': 'Tech Product Moderation',
    'admin.gameModeration': 'Game Account Moderation',
    'admin.appModeration': 'App & AI Moderation',
    'admin.reportsInbox': 'Reports & Violations Inbox',
    'admin.digitalDisputes': 'Digital Account Disputes',
    'admin.payments': 'SePay VietQR Logs',
    'admin.orders': 'All Marketplace Orders',
    'admin.warnAction': 'Issue Warning',
    'admin.suspendAction': 'Suspend',
    'admin.banAction': 'Permanent Ban',
    'admin.reactivateAction': 'Reactivate',
    'admin.detailsAction': 'Inspect Shop',
    'admin.proactiveAudit': 'Admin Direct Supervision & Proactive Sanctions',
    'admin.penaltyPoints': 'Penalty Points',

    // Statuses
    'status.active': 'Active / Good Standing',
    'status.warning': 'Warned',
    'status.suspended': 'Temporarily Suspended',
    'status.banned': 'Permanently Banned',
    'status.pending': 'Pending Review',
    'status.completed': 'Completed / Delivered',
    'status.resolved': 'Resolved',
  },
};

/**
 * Translate a key into current locale text
 */
export function t(key: string, fallback?: string): string {
  const locale = useI18nStore.getState().locale;
  const translation = dictionary[locale]?.[key];
  if (translation) return translation;
  if (fallback !== undefined) return fallback;
  return key;
}

/**
 * React Hook to access i18n store and helpers
 */
export function useI18n() {
  const { locale, currency, setLocale, toggleLocale } = useI18nStore();

  return {
    locale,
    currency,
    setLocale,
    toggleLocale,
    rate: EXCHANGE_RATE_VND_TO_USD,
    t: (key: string, fallback?: string) => t(key, fallback),
    formatPrice: (amountInVnd: number) => formatPrice(amountInVnd, locale),
    formatLargePrice: (amountInVnd: number) => formatLargePrice(amountInVnd, locale),
  };
}
