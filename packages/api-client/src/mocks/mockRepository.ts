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
} from '../contracts';
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
  AdminMessage,
  AdminMessageStatus,
  AdminManagedUser,
  UserSupportNote,
} from '@marketplace/types';

import {
  mockProducts,
  mockCategories,
  mockBrands,
  mockShops,
  mockShopReviews,
  mockOrders,
  mockWarranties,
  mockSellerApplications,
  mockCategoryAttributeSchemas,
  mockGames,
  mockGameAccountProducts,
  mockGameAccountInventory,
  mockDigitalOrders,
  mockRevealedDeliveries,
  mockDigitalDisputes,
  mockApplications,
  mockAppAccountProducts,
  mockAppInventoryItems,
  mockAppPlanCapacities,
  mockAppDeliveryContents,
  mockUserReports,
} from './fixtures';

// In-memory state
let products: Product[] = [...mockProducts];
let categories: Category[] = [...mockCategories];
let brands: Brand[] = [...mockBrands];
let shops: Shop[] = [...mockShops];
let shopReviews: ShopReview[] = [...mockShopReviews];
let userReports: UserReport[] = [...mockUserReports];
let orders: Order[] = [...mockOrders];
let warranties: RegisteredWarranty[] = [...mockWarranties];
let sellerApplications: SellerApplication[] = [...mockSellerApplications];
let categorySchemas: CategoryAttributeSchema[] = [...mockCategoryAttributeSchemas];
let returnRequests: ReturnRequest[] = [];
let warrantyClaims: WarrantyClaim[] = [];

// Game account marketplace state
let gameCatalog: GameSummary[] = [...mockGames];
let gameAccountProducts: GameAccountProduct[] = [...mockGameAccountProducts];
let gameInventory: GameAccountInventoryItemSummary[] = [...mockGameAccountInventory];
let digitalOrders: DigitalOrderListItem[] = [...mockDigitalOrders];
let revealedDeliveries: Record<string, RevealedGameAccountDelivery> = { ...mockRevealedDeliveries };
let digitalDisputes: DigitalDispute[] = [...mockDigitalDisputes];

// App account marketplace state
let applicationCatalog: ApplicationSummary[] = [...mockApplications];
let appAccountProducts: AppAccountProduct[] = [...mockAppAccountProducts];
let appInventory: AppAccountInventoryItemSummary[] = [...mockAppInventoryItems];
let appPlanCapacities: Record<string, AppPlanCapacity[]> = { ...mockAppPlanCapacities };
let appDeliveryContents: Record<string, any> = { ...mockAppDeliveryContents };

// Admin inbox conversations state
let adminConversations: AdminConversation[] = [
  {
    id: 'conv_001',
    userId: 'usr_buyer_1',
    userName: 'Nguyễn Văn An',
    userEmail: 'nguyenvan.an@gmail.com',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    subject: 'Hỏi về đơn hàng #ORD-20240911',
    lastMessage: 'Cho mình hỏi đơn hàng #ORD-20240911 khi nào ship vậy admin?',
    lastMessageAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'UNREAD',
    unreadCount: 2,
    messages: [
      {
        id: 'msg_001_1',
        conversationId: 'conv_001',
        sender: 'user',
        senderName: 'Nguyễn Văn An',
        senderEmail: 'nguyenvan.an@gmail.com',
        text: 'Xin chào admin! Mình muốn hỏi về đơn hàng #ORD-20240911.',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
      {
        id: 'msg_001_2',
        conversationId: 'conv_001',
        sender: 'user',
        senderName: 'Nguyễn Văn An',
        senderEmail: 'nguyenvan.an@gmail.com',
        text: 'Cho mình hỏi đơn hàng #ORD-20240911 khi nào ship vậy admin?',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'conv_002',
    userId: 'usr_buyer_2',
    userName: 'Trần Thị Bích',
    userEmail: 'bich.tran@yahoo.com',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    subject: 'Khiếu nại sản phẩm lỗi',
    lastMessage: 'Admin ơi sản phẩm mình nhận được bị lỗi, hỗ trợ đổi trả giúp mình với ạ!',
    lastMessageAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: 'UNREAD',
    unreadCount: 1,
    messages: [
      {
        id: 'msg_002_1',
        conversationId: 'conv_002',
        sender: 'user',
        senderName: 'Trần Thị Bích',
        senderEmail: 'bich.tran@yahoo.com',
        text: 'Admin ơi sản phẩm mình nhận được bị lỗi, hỗ trợ đổi trả giúp mình với ạ!',
        productCard: { id: 'p001', name: 'Laptop Gaming ASUS ROG', price: 28990000, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=200' },
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'conv_003',
    userId: 'usr_buyer_3',
    userName: 'Lê Hoàng Dũng',
    userEmail: 'le.dung@outlook.com',
    subject: 'Hướng dẫn thanh toán QR',
    lastMessage: 'Dạ cảm ơn admin đã hướng dẫn, mình đã thanh toán thành công rồi ạ!',
    lastMessageAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    status: 'REPLIED',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_003_1',
        conversationId: 'conv_003',
        sender: 'user',
        senderName: 'Lê Hoàng Dũng',
        text: 'Admin ơi cho mình hỏi cách quét mã QR để thanh toán với ạ?',
        createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
      {
        id: 'msg_003_2',
        conversationId: 'conv_003',
        sender: 'admin',
        senderName: 'Admin Hỗ Trợ',
        text: 'Dạ chào bạn! Để thanh toán bằng QR, bạn vào trang Thanh toán → chọn "QR SePay" → mở app ngân hàng quét mã. Hệ thống tự động xác nhận trong vài giây ạ!',
        createdAt: new Date(Date.now() - 7 * 3600000).toISOString(),
      },
      {
        id: 'msg_003_3',
        conversationId: 'conv_003',
        sender: 'user',
        senderName: 'Lê Hoàng Dũng',
        text: 'Dạ cảm ơn admin đã hướng dẫn, mình đã thanh toán thành công rồi ạ!',
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'conv_004',
    userId: 'usr_buyer_4',
    userName: 'Phạm Minh Tuấn',
    userEmail: 'tuanpm@gmail.com',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    subject: 'Tài khoản bị khoá',
    lastMessage: 'Admin giúp mình mở khoá tài khoản với, mình không đăng nhập được nữa!',
    lastMessageAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    status: 'READ',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_004_1',
        conversationId: 'conv_004',
        sender: 'user',
        senderName: 'Phạm Minh Tuấn',
        text: 'Admin giúp mình mở khoá tài khoản với, mình không đăng nhập được nữa!',
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'conv_005',
    userId: 'usr_buyer_5',
    userName: 'Võ Thị Hương',
    userEmail: 'huong.vo@live.com',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    subject: 'Hỏi chính sách bảo hành',
    lastMessage: 'Dạ admin đã giải đáp, mình hiểu rồi ạ. Cảm ơn admin nhiều!',
    lastMessageAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: 'ARCHIVED',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_005_1',
        conversationId: 'conv_005',
        sender: 'user',
        senderName: 'Võ Thị Hương',
        text: 'Bảo hành máy tính mua trên sàn được bao lâu vậy admin?',
        createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
      },
      {
        id: 'msg_005_2',
        conversationId: 'conv_005',
        sender: 'admin',
        senderName: 'Admin Hỗ Trợ',
        text: 'Dạ chào bạn! Bảo hành phụ thuộc vào từng shop và sản phẩm, thường từ 12-24 tháng. Bạn có thể kiểm tra trong mục "Bảo hành của tôi" ạ!',
        createdAt: new Date(Date.now() - 25 * 3600000).toISOString(),
      },
      {
        id: 'msg_005_3',
        conversationId: 'conv_005',
        sender: 'user',
        senderName: 'Võ Thị Hương',
        text: 'Dạ admin đã giải đáp, mình hiểu rồi ạ. Cảm ơn admin nhiều!',
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
];

// Admin Managed Users state
let adminUsers: AdminManagedUser[] = [
  {
    id: 'usr_buyer_1',
    fullName: 'Nguyễn Văn An',
    email: 'nguyen.van.an@gmail.com',
    phoneNumber: '0901234567',
    password: 'AnNguyen@2026',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
    role: 'BUYER',
    status: 'ACTIVE',
    isEmailVerified: true,
    identityVerified: true,
    walletBalance: 1250000,
    totalOrders: 14,
    totalSpent: 18500000,
    lastLoginAt: new Date(Date.now() - 15 * 60000).toISOString(),
    createdAt: '2026-01-15T08:30:00Z',
    accountFlags: ['VIP', 'KHACH_QUEN'],
    adminNotes: [
      {
        id: 'note_1',
        adminName: 'Admin Duy',
        content: 'Khách hàng VIP, mua nhiều tài khoản Steam và bản quyền Canva. Nhiệt tình, uy tín.',
        createdAt: '2026-06-10T14:20:00Z',
      },
    ],
    recentOrders: [
      {
        orderId: 'ord_101',
        orderCode: 'ORD-2026-8801',
        totalAmount: 1450000,
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        itemsCount: 1,
        paymentMethod: 'SEPAY_QR',
      },
      {
        orderId: 'ord_102',
        orderCode: 'ORD-2026-8204',
        totalAmount: 350000,
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        itemsCount: 2,
        paymentMethod: 'WALLET',
      },
    ],
  },
  {
    id: 'usr_buyer_2',
    fullName: 'Trần Minh Quân',
    email: 'quan.tran@outlook.com',
    phoneNumber: '0918765432',
    password: 'QuanTran#88',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120',
    role: 'BUYER',
    status: 'ACTIVE',
    isEmailVerified: true,
    identityVerified: true,
    walletBalance: 250000,
    totalOrders: 6,
    totalSpent: 3800000,
    lastLoginAt: new Date(Date.now() - 45 * 60000).toISOString(),
    createdAt: '2026-02-20T10:00:00Z',
    accountFlags: ['GAMER'],
    adminNotes: [
      {
        id: 'note_2',
        adminName: 'Admin Duy',
        content: 'Hỗ trợ reset mật khẩu tài khoản Liên Quân lúc 11h đêm ngày 10/09, khách đã nhận nick thành công.',
        createdAt: '2026-09-10T23:15:00Z',
      },
    ],
    recentOrders: [
      {
        orderId: 'ord_201',
        orderCode: 'ORD-2026-9112',
        totalAmount: 450000,
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        itemsCount: 1,
        paymentMethod: 'WALLET',
      },
    ],
  },
  {
    id: 'usr_buyer_3',
    fullName: 'Lê Hoàng Long',
    email: 'long.le99@gmail.com',
    phoneNumber: '0987654321',
    password: 'LongLe!999',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    role: 'BUYER',
    status: 'ACTIVE',
    isEmailVerified: true,
    identityVerified: false,
    walletBalance: 0,
    totalOrders: 3,
    totalSpent: 980000,
    lastLoginAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    createdAt: '2026-03-05T15:45:00Z',
    adminNotes: [],
    recentOrders: [
      {
        orderId: 'ord_301',
        orderCode: 'ORD-2026-7731',
        totalAmount: 250000,
        status: 'PROCESSING',
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        itemsCount: 1,
        paymentMethod: 'SEPAY_QR',
      },
    ],
  },
  {
    id: 'usr_buyer_4',
    fullName: 'Phạm Thị Thảo',
    email: 'thao.pham@icloud.com',
    phoneNumber: '0978112233',
    password: 'ThaoPham$123',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    role: 'BUYER',
    status: 'ACTIVE',
    isEmailVerified: true,
    identityVerified: false,
    walletBalance: 85000,
    totalOrders: 2,
    totalSpent: 420000,
    lastLoginAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    createdAt: '2026-04-12T09:10:00Z',
    accountFlags: ['NEW_MEMBER'],
    adminNotes: [],
    recentOrders: [],
  },
  {
    id: 'usr_buyer_5',
    fullName: 'Võ Thị Hương',
    email: 'huong.vo@live.com',
    phoneNumber: '0933445566',
    password: 'HuongVo*456',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
    role: 'BUYER',
    status: 'ACTIVE',
    isEmailVerified: true,
    identityVerified: true,
    walletBalance: 450000,
    totalOrders: 9,
    totalSpent: 7600000,
    lastLoginAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    createdAt: '2026-01-28T11:20:00Z',
    accountFlags: ['VIP'],
    adminNotes: [],
    recentOrders: [],
  },
  {
    id: 'usr_seller_gearvn',
    fullName: 'Nguyễn Thanh Sơn (Chủ GearVN)',
    email: 'son.gearvn@gmail.com',
    phoneNumber: '0909999888',
    password: 'Gearvn#Seller2026',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120',
    role: 'SELLER_OWNER',
    shopId: 'shop_gearvn',
    status: 'ACTIVE',
    isEmailVerified: true,
    identityVerified: true,
    walletBalance: 15600000,
    totalOrders: 54,
    totalSpent: 92000000,
    lastLoginAt: new Date(Date.now() - 5 * 60000).toISOString(),
    createdAt: '2025-11-10T08:00:00Z',
    accountFlags: ['TOP_SELLER', 'VERIFIED_PARTNER'],
    adminNotes: [
      {
        id: 'note_seller_1',
        adminName: 'Super Admin',
        content: 'Đối tác chiến lược phân phối linh kiện phần cứng và key phần mềm bản quyền chính hãng.',
        createdAt: '2026-01-05T09:00:00Z',
      },
    ],
    recentOrders: [],
  },
  {
    id: 'usr_scam_banned',
    fullName: 'Đỗ Văn Toàn (Gian lận)',
    email: 'toan.scam@tempmail.com',
    phoneNumber: '0944001122',
    password: 'ToanScam123456',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    role: 'BUYER',
    status: 'BANNED',
    isEmailVerified: false,
    identityVerified: false,
    walletBalance: 0,
    totalOrders: 3,
    totalSpent: 1200000,
    lastLoginAt: '2026-08-25T14:10:00Z',
    createdAt: '2026-08-20T16:00:00Z',
    accountFlags: ['BANNED_PERM', 'FRAUD'],
    banReason: 'Chiếm đoạt nick game Valorant sau khi mua và cố tình gửi khiếu nại sai để đòi hoàn tiền.',
    bannedAt: '2026-08-25T14:30:00Z',
    bannedBy: 'Admin Vũ Duy',
    adminNotes: [
      {
        id: 'note_ban_1',
        adminName: 'Admin Vũ Duy',
        content: 'Đã xác minh qua log đăng nhập và đối chiếu với người bán: đối tượng đổi mật khẩu & mail khôi phục xong bấm khiếu nại tài khoản sai pass. Khóa vĩnh viễn không mở lại.',
        createdAt: '2026-08-25T14:30:00Z',
      },
    ],
    recentOrders: [],
  },
  {
    id: 'usr_temp_suspended',
    fullName: 'Vũ Đình Trọng',
    email: 'trong.vu92@gmail.com',
    phoneNumber: '0965332211',
    password: 'TrongVu@321',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120',
    role: 'BUYER',
    status: 'SUSPENDED',
    isEmailVerified: true,
    identityVerified: true,
    walletBalance: 120000,
    totalOrders: 4,
    totalSpent: 1650000,
    lastLoginAt: '2026-09-02T09:40:00Z',
    createdAt: '2026-05-18T14:20:00Z',
    accountFlags: ['UNDER_INVESTIGATION'],
    banReason: 'Tạm khóa để điều tra tranh chấp bản quyền Canva Pro nghi ngờ bán lại cho bên thứ ba.',
    bannedAt: '2026-09-02T10:15:00Z',
    bannedBy: 'Admin Tuấn Kiệt',
    adminNotes: [
      {
        id: 'note_sus_1',
        adminName: 'Admin Tuấn Kiệt',
        content: 'Đang liên hệ khách hàng cung cấp biên lai thanh toán và giải trình vi phạm.',
        createdAt: '2026-09-02T10:15:00Z',
      },
    ],
    recentOrders: [],
  },
  {
    id: 'usr_admin_root',
    fullName: 'Quản Trị Viên Sàn',
    email: 'admin@techmarket.vn',
    phoneNumber: '0900000001',
    password: 'AdminSuperPass!2026',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    role: 'ADMIN',
    status: 'ACTIVE',
    isEmailVerified: true,
    identityVerified: true,
    walletBalance: 50000000,
    totalOrders: 0,
    totalSpent: 0,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
    accountFlags: ['SUPER_ADMIN'],
    adminNotes: [],
    recentOrders: [],
  },
];

// Cart state
let cartItems: CartItem[] = [
  {
    id: 'cart_1',
    productId: 'prod_asus_rog_g16',
    variantId: 'var_asus_16gb_512gb',
    productName: 'Laptop Gaming ASUS ROG Strix G16 G614JVR',
    productSlug: 'laptop-gaming-asus-rog-strix-g16',
    variantName: '16GB RAM / 512GB SSD',
    thumbnail: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80',
    price: 38990000,
    originalPrice: 42990000,
    quantity: 1,
    stock: 15,
    availability: 'IN_STOCK',
    shopId: 'shop_gearvn',
    shopName: 'GEARVN Official Store',
    selected: true,
  },
];

// Payments map
const paymentsMap = new Map<string, PaymentTransaction>();

function groupCartByShop(items: CartItem[]): ShopGroupedCart[] {
  const groups = new Map<string, ShopGroupedCart>();
  for (const item of items) {
    if (!groups.has(item.shopId)) {
      groups.set(item.shopId, {
        shopId: item.shopId,
        shopName: item.shopName,
        items: [],
        shopSubtotal: 0,
      });
    }
    const group = groups.get(item.shopId)!;
    group.items.push(item);
    if (item.selected) {
      group.shopSubtotal += item.price * item.quantity;
    }
  }
  return Array.from(groups.values());
}

// 1. MOCK PRODUCT API
export class MockProductRepository implements IProductApi {
  async search(params: ProductSearchParams): Promise<ApiPaginatedResponse<Product>> {
    await new Promise((r) => setTimeout(r, 150));
    let filtered = products.filter((p) => p.status === 'ACTIVE');

    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    if (params.category) {
      filtered = filtered.filter((p) => p.category.slug === params.category);
    }

    if (params.brand) {
      filtered = filtered.filter((p) => p.brand?.slug === params.brand);
    }

    if (params.minPrice) {
      filtered = filtered.filter((p) => p.basePrice >= params.minPrice!);
    }

    if (params.maxPrice) {
      filtered = filtered.filter((p) => p.basePrice <= params.maxPrice!);
    }

    if (params.techSpecs) {
      for (const [key, val] of Object.entries(params.techSpecs)) {
        if (val) {
          filtered = filtered.filter((p) =>
            p.specifications.some(
              (spec) => spec.key === key && spec.value.toLowerCase().includes(val.toLowerCase())
            )
          );
        }
      }
    }

    // Sort
    if (params.sortBy === 'PRICE_ASC') {
      filtered.sort((a, b) => a.basePrice - b.basePrice);
    } else if (params.sortBy === 'PRICE_DESC') {
      filtered.sort((a, b) => b.basePrice - a.basePrice);
    } else if (params.sortBy === 'RATING') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (params.sortBy === 'BEST_SELLER') {
      filtered.sort((a, b) => b.soldCount - a.soldCount);
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 12;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      success: true,
      data: paginated,
      meta: { page, pageSize, total, totalPages },
    };
  }

  async getBySlug(slug: string): Promise<Product | null> {
    await new Promise((r) => setTimeout(r, 100));
    return products.find((p) => p.slug === slug) || null;
  }

  async getById(id: string): Promise<Product | null> {
    await new Promise((r) => setTimeout(r, 100));
    return products.find((p) => p.id === id) || null;
  }

  async getCategories(): Promise<Category[]> {
    return categories;
  }

  async getBrands(): Promise<Brand[]> {
    return brands;
  }

  async getTechFilters(categorySlug: string): Promise<TechFilterDefinition[]> {
    if (categorySlug === 'laptop') {
      return [
        {
          key: 'cpu',
          label: 'Vi xử lý (CPU)',
          options: [
            { value: 'Intel', label: 'Intel Core (i5/i7/i9)', count: 42 },
            { value: 'AMD', label: 'AMD Ryzen (R5/R7/R9)', count: 28 },
            { value: 'Apple', label: 'Apple M-Series (M2/M3)', count: 18 },
          ],
        },
        {
          key: 'ram',
          label: 'Bộ nhớ RAM',
          options: [
            { value: '8GB', label: '8GB', count: 15 },
            { value: '16GB', label: '16GB (Khuyên dùng)', count: 68 },
            { value: '32GB', label: '32GB Đồ họa/Gaming', count: 24 },
          ],
        },
        {
          key: 'gpu',
          label: 'Card đồ họa (GPU)',
          options: [
            { value: 'RTX 4060', label: 'NVIDIA RTX 4060', count: 25 },
            { value: 'RTX 4070', label: 'NVIDIA RTX 4070', count: 14 },
            { value: 'Iris', label: 'Card Onboard', count: 30 },
          ],
        },
      ];
    }
    return [];
  }

  async getFeatured(): Promise<Product[]> {
    return products.filter((p) => p.status === 'ACTIVE').slice(0, 6);
  }

  async getCompareList(ids: string[]): Promise<Product[]> {
    return products.filter((p) => ids.includes(p.id));
  }
}

// 2. MOCK CART API
export class MockCartRepository implements ICartApi {
  async getCart(): Promise<ShopGroupedCart[]> {
    return groupCartByShop(cartItems);
  }

  async addItem(productId: string, variantId: string, quantity: number): Promise<ShopGroupedCart[]> {
    // 1. Check physical products
    const product = products.find((p) => p.id === productId);
    if (product) {
      const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
      const existingIndex = cartItems.findIndex(
        (item) => item.productId === productId && item.variantId === variant.id
      );

      if (existingIndex > -1) {
        cartItems[existingIndex].quantity += quantity;
      } else {
        cartItems.push({
          id: `cart_${Date.now()}`,
          productId: product.id,
          productType: 'PHYSICAL',
          variantId: variant.id,
          productName: product.name,
          productSlug: product.slug,
          variantName: variant.name,
          thumbnail: variant.image || product.thumbnail,
          price: variant.price,
          originalPrice: variant.compareAtPrice,
          quantity,
          stock: variant.stock,
          availability: variant.availability,
          shopId: product.shop.id,
          shopName: product.shop.name,
          selected: true,
          shippingRequired: true,
        });
      }
      return groupCartByShop(cartItems);
    }

    // 2. Check game account products
    const gameAcc = gameAccountProducts.find((g) => g.id === productId);
    if (gameAcc) {
      const existingIndex = cartItems.findIndex((item) => item.productId === productId);
      if (existingIndex > -1) {
        cartItems[existingIndex].quantity += 1;
      } else {
        cartItems.push({
          id: `cart_${Date.now()}`,
          productId: gameAcc.id,
          productType: 'DIGITAL_GAME_ACCOUNT',
          variantId: 'default_game',
          variantName: gameAcc.game?.name || 'Tài khoản Game',
          productName: gameAcc.name,
          productSlug: gameAcc.slug,
          thumbnail: gameAcc.thumbnail || (typeof gameAcc.images?.[0] === 'string' ? gameAcc.images[0] : (gameAcc.images?.[0] as any)?.url) || '',
          price: gameAcc.basePrice,
          originalPrice: gameAcc.basePrice,
          quantity: 1,
          stock: typeof gameAcc.inStock === 'number' ? gameAcc.inStock : 1,
          availability: 'IN_STOCK',
          shopId: gameAcc.shop.id,
          shopName: gameAcc.shop.name,
          selected: true,
          gameId: gameAcc.game?.id,
          gameName: gameAcc.game?.name,
          deliveryMode: gameAcc.deliveryMode,
          shippingRequired: false,
        });
      }
      return groupCartByShop(cartItems);
    }

    // 3. Check digital app accounts
    const appAcc = appAccountProducts.find((a) => a.id === productId);
    if (appAcc) {
      const plan = appAcc.plans.find((p) => p.id === variantId) || appAcc.plans[0];
      const existingIndex = cartItems.findIndex(
        (item) => item.productId === productId && item.variantId === (plan?.id || 'default_plan')
      );
      if (existingIndex > -1) {
        cartItems[existingIndex].quantity += quantity;
      } else {
        cartItems.push({
          id: `cart_${Date.now()}`,
          productId: appAcc.id,
          productType: 'DIGITAL_APP_ACCOUNT',
          variantId: plan?.id || 'default_plan',
          variantName: plan?.name || 'Gói bản quyền',
          planId: plan?.id,
          planName: plan?.name,
          fulfillmentType: plan?.fulfillmentType,
          serviceDuration: plan?.serviceDuration,
          warrantyDuration: plan?.warrantyDuration,
          productName: appAcc.name,
          productSlug: appAcc.slug,
          thumbnail: appAcc.thumbnail || (appAcc.images && appAcc.images[0]) || '',
          price: plan ? plan.price : 100000,
          originalPrice: plan ? plan.originalPrice : undefined,
          quantity,
          stock: 99,
          availability: 'IN_STOCK',
          shopId: appAcc.shop.id,
          shopName: appAcc.shop.name,
          selected: true,
          shippingRequired: false,
        });
      }
      return groupCartByShop(cartItems);
    }

    throw new Error('Không tìm thấy sản phẩm');
  }

  async updateQuantity(cartItemId: string, quantity: number): Promise<ShopGroupedCart[]> {
    const item = cartItems.find((i) => i.id === cartItemId);
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
    return groupCartByShop(cartItems);
  }

  async removeItem(cartItemId: string): Promise<ShopGroupedCart[]> {
    cartItems = cartItems.filter((i) => i.id !== cartItemId);
    return groupCartByShop(cartItems);
  }

  async toggleSelect(cartItemId: string): Promise<ShopGroupedCart[]> {
    const item = cartItems.find((i) => i.id === cartItemId);
    if (item) {
      item.selected = !item.selected;
    }
    return groupCartByShop(cartItems);
  }

  async selectAll(selected: boolean): Promise<ShopGroupedCart[]> {
    cartItems = cartItems.map((i) => ({ ...i, selected }));
    return groupCartByShop(cartItems);
  }
}

// 3. MOCK CHECKOUT API
export class MockCheckoutRepository implements ICheckoutApi {
  async preview(request: CheckoutPreviewRequest): Promise<CheckoutPreviewResponse> {
    const selectedItems = cartItems.filter((i) => request.selectedCartItemIds.includes(i.id));
    const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal > 0 ? 50000 : 0;
    const platformDiscount = subtotal > 30000000 ? 500000 : 0;
    const sellerDiscount = 0;
    const totalVoucherDiscount = request.voucherCodes?.length ? 200000 : 0;
    const finalTotal = Math.max(0, subtotal + shippingFee - platformDiscount - totalVoucherDiscount);

    return {
      subtotal,
      shippingFee,
      platformDiscount,
      sellerDiscount,
      totalVoucherDiscount,
      tax: 0,
      finalTotal,
      shopBreakdown: [
        {
          shopId: selectedItems[0]?.shopId || 'shop_gearvn',
          subtotal,
          shippingFee,
          discount: platformDiscount + totalVoucherDiscount,
        },
      ],
    };
  }

  async createOrder(request: {
    selectedCartItemIds: string[];
    addressId: string;
    shippingMethodId: string;
    paymentMethod: 'SEPAY_QR' | 'COD';
    voucherCode?: string;
    notes?: string;
  }): Promise<{ orderId: string; paymentId: string; totalAmount: number }> {
    const selectedItems = cartItems.filter((i) => request.selectedCartItemIds.includes(i.id));
    if (selectedItems.length === 0) throw new Error('Không có sản phẩm nào được chọn');

    const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const hasPhysical = selectedItems.some((i) => i.shippingRequired !== false);
    const shippingFee = hasPhysical ? 50000 : 0;
    const discount = subtotal > 1000000 ? 100000 : 0;
    const total = subtotal + shippingFee - discount;

    const orderId = `ord_${Date.now()}`;
    const paymentId = `pay_${Date.now()}`;
    const orderCode = `VN${Date.now().toString().slice(-8)}`;

    const firstShopId = selectedItems[0].shopId;
    const firstShopName = selectedItems[0].shopName;

    const newOrder: Order = {
      id: orderId,
      orderCode,
      buyerId: 'usr_buyer_demo',
      shop: { id: firstShopId, name: firstShopName, slug: 'shop', logo: '', rating: 5 },
      items: selectedItems.map((item, idx) => ({
        id: `oi_${idx}`,
        productId: item.productId,
        variantId: item.variantId || 'default_variant',
        productName: item.productName,
        productSlug: item.productSlug,
        variantName: item.variantName || 'Bản quyền số',
        thumbnail: item.thumbnail,
        price: item.price,
        quantity: item.quantity,
        serialNumber: `SN-${item.variantId || 'DIGITAL'}-${Date.now()}`,
      })),
      shippingAddress: {
        id: request.addressId || 'addr_default',
        recipientName: 'Nguyễn Văn An',
        phoneNumber: '0901234567',
        province: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Bến Nghé',
        streetAddress: '12 Lê Duẩn',
        label: 'HOME',
        isDefault: true,
      },
      shippingMethod: {
        id: request.shippingMethodId,
        code: hasPhysical ? 'EXPRESS' : 'DIGITAL_DELIVERY',
        name: hasPhysical ? 'Giao hàng nhanh công nghệ' : 'Giao hàng kỹ thuật số tức thì',
        carrier: hasPhysical ? 'AhaMove / GHTK Tech' : 'Hệ Thống Tự Động TechMarket Vault',
        estimatedDeliveryDays: hasPhysical ? '1-2 ngày' : 'Giao ngay (1-5 phút)',
        fee: shippingFee,
      },
      status: request.paymentMethod === 'SEPAY_QR' ? 'PENDING_PAYMENT' : 'PROCESSING',
      paymentStatus: request.paymentMethod === 'SEPAY_QR' ? 'PENDING' : 'PENDING',
      paymentMethod: request.paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total,
      allowedActions: request.paymentMethod === 'SEPAY_QR' ? ['PAY', 'CANCEL'] : ['CANCEL', 'CONTACT_SELLER'],
      timeline: [
        {
          status: 'PENDING_PAYMENT',
          title: 'Khởi tạo đơn hàng',
          description: `Đơn hàng #${orderCode} được tạo thành công`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);

    // Remove ordered items from cart
    cartItems = cartItems.filter((i) => !request.selectedCartItemIds.includes(i.id));

    // Create SePay Payment record
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const sepayInfo = {
      qrUrl: `https://qr.sepay.vn/img?acc=09876543210&bank=MBBank&amount=${total}&des=${orderCode}`,
      paymentCode: orderCode,
      bankName: 'MBBank (Ngân hàng TMCP Quân Đội)',
      accountNumber: '09876543210',
      accountHolder: 'CONG TY CO PHAN CONG NGHE MARKETPLACE',
      amount: total,
      content: orderCode,
      expiresAt,
    };

    paymentsMap.set(paymentId, {
      id: paymentId,
      orderId,
      amount: total,
      method: request.paymentMethod,
      status: 'PENDING',
      sepayInfo,
      createdAt: new Date().toISOString(),
    });

    return { orderId, paymentId, totalAmount: total };
  }
}

// 4. MOCK PAYMENT API (SePay QR Simulation)
export class MockPaymentRepository implements IPaymentApi {
  async getPayment(paymentId: string): Promise<PaymentTransaction> {
    const payment = paymentsMap.get(paymentId);
    if (!payment) {
      // Return a fallback payment fixture
      return {
        id: paymentId,
        orderId: 'ord_100294',
        amount: 38540000,
        method: 'SEPAY_QR',
        status: 'PENDING',
        sepayInfo: {
          qrUrl: 'https://qr.sepay.vn/img?acc=09876543210&bank=MBBank&amount=38540000&des=SEPAY100294',
          paymentCode: 'SEPAY100294',
          bankName: 'MBBank (Ngân hàng Quân Đội)',
          accountNumber: '09876543210',
          accountHolder: 'CONG TY CO PHAN CONG NGHE MARKETPLACE',
          amount: 38540000,
          content: 'SEPAY100294',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
        createdAt: new Date().toISOString(),
      };
    }
    return payment;
  }

  async checkStatus(paymentId: string): Promise<{ status: PaymentTransaction['status']; isPaid: boolean }> {
    const payment = paymentsMap.get(paymentId);
    if (payment && payment.status === 'PAID') {
      return { status: 'PAID', isPaid: true };
    }
    return { status: payment?.status || 'PENDING', isPaid: false };
  }

  async simulatePaymentSuccess(paymentId: string): Promise<PaymentTransaction> {
    const payment = paymentsMap.get(paymentId);
    if (payment) {
      payment.status = 'PAID';
      payment.paidAt = new Date().toISOString();

      // Update related order
      const order = orders.find((o) => o.id === payment.orderId);
      if (order) {
        order.status = 'PAID';
        order.paymentStatus = 'PAID';
        order.allowedActions = ['CONTACT_SELLER', 'TRACK_SHIPPING'];
        order.timeline.push({
          status: 'PAID',
          title: 'Thanh toán thành công qua SePay',
          description: `Giao dịch ${payment.sepayInfo?.paymentCode || ''} đã được đối soát tự động.`,
          timestamp: new Date().toISOString(),
        });

        // Register warranty
        warranties.push({
          id: `war_${Date.now()}`,
          orderId: order.id,
          orderCode: order.orderCode,
          productId: order.items[0].productId,
          productName: order.items[0].productName,
          productImage: order.items[0].thumbnail,
          serialNumber: order.items[0].serialNumber || `SN-${Date.now()}`,
          warrantyCode: `WAR-${Date.now().toString().slice(-6)}`,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
          durationMonths: 24,
          provider: 'Hãng sản xuất & Trung tâm bảo hành ủy quyền',
          status: 'ACTIVE',
        });
      }
      return payment;
    }
    throw new Error('Không tìm thấy giao dịch');
  }
}

// 5. MOCK ORDER API
export class MockOrderRepository implements IOrderApi {
  async getOrders(status?: string): Promise<Order[]> {
    if (status && status !== 'ALL') {
      return orders.filter((o) => o.status === status);
    }
    return orders;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return orders.find((o) => o.id === id || o.orderCode === id) || null;
  }

  async cancelOrder(id: string, reason: string): Promise<Order> {
    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    order.status = 'CANCELLED';
    order.allowedActions = [];
    order.timeline.push({
      status: 'CANCELLED',
      title: 'Đơn hàng đã bị hủy',
      description: `Lý do: ${reason}`,
      timestamp: new Date().toISOString(),
    });
    return order;
  }

  async requestReturn(data: {
    orderId: string;
    orderItemId: string;
    reason: string;
    description: string;
    evidenceImages: string[];
  }): Promise<ReturnRequest> {
    const order = orders.find((o) => o.id === data.orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    const newReturn: ReturnRequest = {
      id: `ret_${Date.now()}`,
      orderId: order.id,
      orderCode: order.orderCode,
      shopId: order.shop.id,
      buyerId: order.buyerId,
      items: order.items.map((i) => ({
        orderItemId: i.id,
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
      })),
      reason: data.reason,
      description: data.description,
      evidenceImages: data.evidenceImages,
      status: 'REQUESTED',
      requestedRefundAmount: order.total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    returnRequests.unshift(newReturn);
    order.status = 'RETURN_REQUESTED';
    return newReturn;
  }

  async confirmReceived(id: string): Promise<Order> {
    const order = orders.find((item) => item.id === id);
    if (!order) throw new Error("Order not found");
    order.status = "COMPLETED";
    order.allowedActions = ["REQUEST_RETURN", "REQUEST_WARRANTY", "REVIEW"];
    return order;
  }

  async getDigitalOrders(): Promise<DigitalOrderListItem[]> {
    return [...mockDigitalOrders];
  }
}

// 6. MOCK WARRANTY API
export class MockWarrantyRepository implements IWarrantyApi {
  async getWarranties(): Promise<RegisteredWarranty[]> {
    return warranties;
  }

  async submitClaim(data: {
    warrantyId: string;
    serialNumber?: string;
    issueDescription: string;
    evidenceImages: string[];
  }): Promise<WarrantyClaim> {
    const war = warranties.find((w) => w.id === data.warrantyId);
    const claim: WarrantyClaim = {
      id: `wclaim_${Date.now()}`,
      warrantyId: data.warrantyId,
      productName: war?.productName || 'Sản phẩm điện tử',
      serialNumber: data.serialNumber || war?.serialNumber,
      issueDescription: data.issueDescription,
      evidenceImages: data.evidenceImages,
      status: 'CLAIM_PENDING',
      createdAt: new Date().toISOString(),
    };
    warrantyClaims.unshift(claim);
    if (war) war.status = 'CLAIM_PENDING';
    return claim;
  }
}

// 7. MOCK SELLER API
export class MockSellerRepository implements ISellerApi {
  async getDashboard() {
    return {
      revenue: 145800000,
      ordersCount: 48,
      pendingShipmentCount: 5,
      lowStockCount: 2,
      rating: 4.9,
      recentReviewsCount: 12,
    };
  }

  async getProducts(): Promise<Product[]> {
    return products;
  }

  async saveProduct(productData: Partial<Product>): Promise<Product> {
    if (productData.id) {
      const idx = products.findIndex((p) => p.id === productData.id);
      if (idx > -1) {
        products[idx] = { ...products[idx], ...productData, updatedAt: new Date().toISOString() };
        return products[idx];
      }
    }
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: productData.name || 'Sản phẩm mới',
      slug: productData.slug || `san-pham-${Date.now()}`,
      description: productData.description || '',
      basePrice: productData.basePrice || 1000000,
      compareAtPrice: productData.compareAtPrice,
      thumbnail: productData.thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
      images: productData.images || [],
      category: productData.category || { id: 'cat_laptop', name: 'Laptop', slug: 'laptop' },
      shop: mockShops[0],
      rating: 5,
      reviewCount: 0,
      soldCount: 0,
      variants: productData.variants || [],
      specifications: productData.specifications || [],
      warranty: productData.warranty,
      status: 'PENDING_REVIEW', // New products require admin review (Section 44, 58)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    return newProduct;
  }

  async updateStock(variantId: string, newStock: number): Promise<void> {
    for (const p of products) {
      const v = p.variants.find((v) => v.id === variantId);
      if (v) {
        v.stock = newStock;
        v.availability = newStock > 0 ? (newStock < 5 ? 'LOW_STOCK' : 'IN_STOCK') : 'OUT_OF_STOCK';
        break;
      }
    }
  }

  async getOrders(status?: string): Promise<Order[]> {
    if (status && status !== 'ALL') {
      return orders.filter((o) => o.status === status);
    }
    return orders;
  }

  async updateOrderStatus(orderId: string, newStatus: Order['status']): Promise<Order> {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    order.status = newStatus;
    order.timeline.push({
      status: newStatus,
      title: `Trạng thái cập nhật: ${newStatus}`,
      description: 'Cập nhật từ người bán',
      timestamp: new Date().toISOString(),
    });
    return order;
  }

  async getFinance(): Promise<SellerFinanceSummary> {
    return {
      grossSales: 154000000,
      platformFee: 7700000,
      voucherDeduction: 1200000,
      refundDeduction: 0,
      availableBalance: 82500000,
      pendingBalance: 62600000,
      totalPaidOut: 45000000,
    };
  }

  async requestPayout(amount: number, bankInfo: { bankName: string; accountNumber: string; accountHolder: string }): Promise<void> {
    // simulated payout
  }

  async applyAsSeller(data: Partial<SellerApplication>): Promise<SellerApplication> {
    const newApp: SellerApplication = {
      id: `app_${Date.now()}`,
      userId: 'usr_buyer_demo',
      shopName: data.shopName || '',
      shopSlug: data.shopSlug || '',
      ownerFullName: data.ownerFullName || '',
      businessType: data.businessType || 'INDIVIDUAL',
      taxCode: data.taxCode || '',
      idCardNumber: data.idCardNumber || '',
      idCardIssueDate: data.idCardIssueDate || '',
      idCardIssuePlace: data.idCardIssuePlace || '',
      idCardImages: data.idCardImages || [],
      idCardFrontImage: data.idCardFrontImage,
      idCardBackImage: data.idCardBackImage,
      selfieWithIdImage: data.selfieWithIdImage,
      businessLicenseNumber: data.businessLicenseNumber,
      businessLicenseImage: data.businessLicenseImage,
      householdName: data.householdName,
      businessRegistrationDate: data.businessRegistrationDate,
      businessRegistrationPlace: data.businessRegistrationPlace,
      headquarterAddress: data.headquarterAddress,
      businessSectorCode: data.businessSectorCode,
      businessCategories: data.businessCategories || [],
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      bankAccount: data.bankAccount || { bankName: '', accountNumber: '', accountHolder: '' },
      shopDescription: data.shopDescription || '',
      pickupAddress: data.pickupAddress || '',
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    sellerApplications.unshift(newApp);
    return newApp;
  }

  async getMyApplication(): Promise<SellerApplication | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('marketplace-auth-storage');
        if (raw) {
          const parsed = JSON.parse(raw);
          const currentUserId = parsed?.state?.user?.id;
          if (currentUserId) {
            const found = sellerApplications.find((a) => a.userId === currentUserId);
            return found || null;
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  async getSellerGameAccounts(): Promise<GameAccountProduct[]> {
    return gameAccountProducts;
  }

  async saveSellerGameAccount(data: Partial<GameAccountProduct>): Promise<GameAccountProduct> {
    if (data.id) {
      const idx = gameAccountProducts.findIndex((p) => p.id === data.id);
      if (idx > -1) {
        gameAccountProducts[idx] = { ...gameAccountProducts[idx], ...data, updatedAt: new Date().toISOString() };
        return gameAccountProducts[idx];
      }
    }
    const defaultGame = gameCatalog[0];
    const newAcc: GameAccountProduct = {
      id: `ga_prod_${Date.now()}`,
      type: 'DIGITAL_GAME_ACCOUNT',
      name: data.name || 'Tài khoản game mới',
      slug: data.slug || `acc-game-${Date.now()}`,
      description: data.description || '',
      basePrice: data.basePrice || 100000,
      compareAtPrice: data.compareAtPrice,
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      images: data.images || [],
      category: { id: 'cat_game_acc', name: 'Tài khoản game', slug: 'game-accounts' },
      shop: mockShops[0],
      rating: 5,
      reviewCount: 0,
      soldCount: 0,
      variants: [
        {
          id: `var_ga_${Date.now()}`,
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          name: 'Tiêu chuẩn',
          options: {},
          price: data.basePrice || 100000,
          stock: 0, // initially 0, until items are added to inventory
          availability: 'OUT_OF_STOCK',
        },
      ],
      specifications: [],
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      game: data.game || defaultGame,
      platform: data.platform || 'MOBILE',
      server: data.server || 'Việt Nam',
      publicAttributes: data.publicAttributes || {},
      loginMethod: data.loginMethod || 'USERNAME',
      linkedServices: data.linkedServices || [],
      changeability: data.changeability || {
        canChangePassword: true,
        canChangeEmail: false,
        canChangePhone: false,
        canRemoveLinkedServices: false,
      },
      deliveryMode: data.deliveryMode || 'AUTO_AFTER_PAYMENT',
      deliveryEstimateMinutes: data.deliveryEstimateMinutes || 1,
      warrantyHours: data.warrantyHours || 72,
      availableStock: 0,
      sellerCommitments: data.sellerCommitments || [],
      riskNotices: data.riskNotices || [],
    };
    gameAccountProducts.unshift(newAcc);
    return newAcc;
  }

  async getDigitalOrders(): Promise<DigitalOrderListItem[]> {
    return digitalOrders;
  }

  async getSellerAppAccounts(): Promise<AppAccountProduct[]> {
    return appAccountProducts;
  }

  async saveSellerAppAccount(data: Partial<AppAccountProduct>): Promise<AppAccountProduct> {
    if (data.id) {
      const idx = appAccountProducts.findIndex((p) => p.id === data.id);
      if (idx > -1) {
        appAccountProducts[idx] = { ...appAccountProducts[idx], ...data, updatedAt: new Date().toISOString() };
        return appAccountProducts[idx];
      }
    }
    const defaultApp = applicationCatalog[0];
    const newAppProduct: AppAccountProduct = {
      id: `app_prod_${Date.now()}`,
      type: 'DIGITAL_APP_ACCOUNT',
      name: data.name || 'Sản phẩm tài khoản ứng dụng mới',
      slug: data.slug || `tai-khoan-app-${Date.now()}`,
      description: data.description || '',
      basePrice: data.basePrice || (data.plans && data.plans.length > 0 ? Math.min(...data.plans.map(p => p.price)) : 99000),
      compareAtPrice: data.compareAtPrice,
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      images: data.images || [],
      category: { id: 'cat_software', name: 'Phần mềm & Tài khoản Số', slug: 'phan-mem-tai-khoan-so' },
      shop: mockShops[0],
      rating: 5,
      reviewCount: 0,
      soldCount: 0,
      variants: [],
      specifications: [],
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicationId: data.applicationId || defaultApp.id,
      applicationName: data.applicationName || defaultApp.name,
      applicationSlug: data.applicationSlug || defaultApp.slug,
      appCategory: data.appCategory || defaultApp.category,
      platforms: data.platforms || defaultApp.supportedPlatforms,
      plans: data.plans || [
        {
          id: `plan_${Date.now()}`,
          name: 'Gói tiêu chuẩn 1 tháng',
          price: 99000,
          serviceDuration: { value: 1, unit: 'MONTH' },
          warrantyDuration: { value: 1, unit: 'MONTH' },
          fulfillmentType: 'PRE_CREATED_ACCOUNT',
          stock: 0,
        },
      ],
      features: data.features || [],
      setupGuide: data.setupGuide || [],
      warranty: data.warranty || 'Bảo hành 1 đổi 1 suốt thời gian gói',
      warrantyPolicy: data.warrantyPolicy || 'Bảo hành uy tín theo cam kết của shop.',
      appAttributes: data.appAttributes || {},
    };
    appAccountProducts.unshift(newAppProduct);
    return newAppProduct;
  }

  async getSellerAppOrders(): Promise<DigitalOrderListItem[]> {
    return digitalOrders.filter((o) => o.productType === 'DIGITAL_APP_ACCOUNT');
  }
}

// 8. MOCK ADMIN API
export class MockAdminRepository implements IAdminApi {
  async getDashboard() {
    return {
      gmv: 489000000,
      revenue: 24450000,
      totalOrders: 142,
      activeUsers: 1250,
      activeShops: 18,
      pendingSellersCount: sellerApplications.filter((a) => a.status === 'PENDING').length,
      pendingProductsCount: products.filter((p) => p.status === 'PENDING_REVIEW').length + gameAccountProducts.filter((p) => p.status === 'PENDING_REVIEW').length,
    };
  }

  async getSellerApplications(): Promise<SellerApplication[]> {
    return sellerApplications;
  }

  async reviewSeller(applicationId: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<void> {
    const app = sellerApplications.find((a) => a.id === applicationId);
    if (app) {
      app.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      app.rejectionReason = reason;
      app.reviewedAt = new Date().toISOString();
      if (action === 'APPROVE') {
        const shopId = `shop_${app.id}`;
        (app as any).shopId = shopId;
        const existing = shops.find((s) => s.id === shopId || s.name === app.shopName);
        if (!existing) {
          shops.push({
            id: shopId,
            name: app.shopName,
            slug: app.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200',
            coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
            rating: 5.0,
            isOfficial: true,
            description: app.shopDescription || 'Gian hàng mới đăng ký chính thức trên sàn TechMarket.',
            address: app.pickupAddress || 'Hồ Chí Minh, Việt Nam',
            phone: '0901234567',
            email: 'contact@shop.com',
            responseRate: 100,
            joinedDate: new Date().toISOString(),
            productCount: 0,
            followerCount: 0,
            likeCount: 0,
            isFollowing: false,
            isLiked: false,
            status: 'APPROVED',
            operationalStatus: 'ACTIVE',
            ownerFullName: app.ownerFullName,
            idCardNumber: app.idCardNumber,
          });
        }
      }
    }
  }

  async getPendingProducts(): Promise<Product[]> {
    return products.filter((p) => p.status === 'PENDING_REVIEW');
  }

  async reviewProduct(productId: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<void> {
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      p.status = action === 'APPROVE' ? 'ACTIVE' : 'REJECTED';
      p.rejectionReason = reason;
    }
  }

  async getCategorySchemas(): Promise<CategoryAttributeSchema[]> {
    return categorySchemas;
  }

  async saveCategorySchema(schema: CategoryAttributeSchema): Promise<void> {
    const idx = categorySchemas.findIndex((s) => s.categoryId === schema.categoryId);
    if (idx > -1) {
      categorySchemas[idx] = schema;
    } else {
      categorySchemas.push(schema);
    }
  }

  async getAllOrders(): Promise<Order[]> {
    return orders;
  }

  async getGameAccountProducts(): Promise<GameAccountProduct[]> {
    return gameAccountProducts;
  }

  async reviewGameAccountProduct(productId: string, action: 'APPROVE' | 'REJECT' | 'HIDE', reason?: string): Promise<void> {
    const item = gameAccountProducts.find((p) => p.id === productId);
    if (item) {
      if (action === 'APPROVE') item.status = 'ACTIVE';
      else if (action === 'REJECT') {
        item.status = 'REJECTED';
        item.rejectionReason = reason;
      } else if (action === 'HIDE') {
        item.status = 'HIDDEN';
        item.rejectionReason = reason;
      }
    }
  }

  async getGameCatalog(): Promise<GameSummary[]> {
    return gameCatalog;
  }

  async saveGame(game: GameSummary): Promise<GameSummary> {
    const idx = gameCatalog.findIndex((g) => g.id === game.id);
    if (idx > -1) {
      gameCatalog[idx] = game;
      return gameCatalog[idx];
    }
    const newGame = { ...game, id: game.id || `game_${Date.now()}` };
    gameCatalog.push(newGame);
    return newGame;
  }

  async getDigitalDisputes(): Promise<DigitalDispute[]> {
    return digitalDisputes;
  }

  async resolveDigitalDispute(disputeId: string, resolution: 'REFUND' | 'REPLACE' | 'DISMISS', notes: string): Promise<void> {
    const disp = digitalDisputes.find((d) => d.id === disputeId);
    if (disp) {
      disp.status = resolution === 'DISMISS' ? 'REJECTED' : resolution === 'REFUND' ? 'RESOLVED_REFUNDED' : 'RESOLVED_REPLACED';
      disp.adminResolution = {
        resolution,
        notes,
        resolvedAt: new Date().toISOString(),
      };
      // If refunded or replaced, also update digital order status
      const ord = digitalOrders.find((o) => o.id === disp.orderId);
      if (ord) {
        ord.orderStatus = resolution === 'REFUND' ? 'REFUNDED' : 'COMPLETED';
        ord.deliveryStatus = 'REVEALED';
      }
    }
  }

  async getAppAccountProducts(): Promise<AppAccountProduct[]> {
    return appAccountProducts;
  }

  async reviewAppAccountProduct(productId: string, action: 'APPROVE' | 'REJECT' | 'HIDE', reason?: string): Promise<void> {
    const item = appAccountProducts.find((p) => p.id === productId);
    if (item) {
      if (action === 'APPROVE') item.status = 'ACTIVE';
      else if (action === 'REJECT') {
        item.status = 'REJECTED';
        item.rejectionReason = reason;
      } else if (action === 'HIDE') {
        item.status = 'HIDDEN';
        item.rejectionReason = reason;
      }
    }
  }

  async getApplicationCatalog(): Promise<ApplicationSummary[]> {
    return applicationCatalog;
  }

  async saveApplication(app: ApplicationSummary): Promise<ApplicationSummary> {
    const idx = applicationCatalog.findIndex((a) => a.id === app.id);
    if (idx > -1) {
      applicationCatalog[idx] = app;
      return applicationCatalog[idx];
    }
    const newApp = { ...app, id: app.id || `app_${Date.now()}` };
    applicationCatalog.push(newApp);
    return newApp;
  }

  async getAllShops(): Promise<Shop[]> {
    return shops;
  }

  async warnShop(shopId: string, reason: string, penaltyPoints: number = 2, _notes?: string): Promise<void> {
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    shop.warningCount = (shop.warningCount || 0) + 1;
    shop.penaltyPoints = (shop.penaltyPoints || 0) + penaltyPoints;
    shop.operationalStatus = 'WARNING';
    if (!shop.sanctionHistory) shop.sanctionHistory = [];
    shop.sanctionHistory.unshift({
      id: `sanc_${Date.now()}`,
      action: 'WARN',
      reason,
      issuedAt: new Date().toISOString(),
      adminName: 'Admin Hệ Thống',
      penaltyPoints,
    });
  }

  async suspendShop(shopId: string, days: number, reason: string): Promise<void> {
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    shop.operationalStatus = 'TEMPORARILY_SUSPENDED';
    shop.status = 'SUSPENDED';
    shop.suspendedUntil = until;
    shop.suspensionReason = reason;
    shop.penaltyPoints = (shop.penaltyPoints || 0) + (days >= 14 ? 5 : 3);
    if (!shop.sanctionHistory) shop.sanctionHistory = [];
    shop.sanctionHistory.unshift({
      id: `sanc_${Date.now()}`,
      action: 'SUSPEND',
      reason: `Tạm khóa ${days} ngày: ${reason}`,
      issuedAt: new Date().toISOString(),
      suspendedUntil: until,
      adminName: 'Admin Hệ Thống',
      penaltyPoints: days >= 14 ? 5 : 3,
    });
  }

  async banShop(shopId: string, reason: string): Promise<void> {
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    shop.operationalStatus = 'PERMANENTLY_BANNED';
    shop.status = 'SUSPENDED';
    shop.banReason = reason;
    shop.penaltyPoints = (shop.penaltyPoints || 0) + 15;
    if (!shop.sanctionHistory) shop.sanctionHistory = [];
    shop.sanctionHistory.unshift({
      id: `sanc_${Date.now()}`,
      action: 'BAN',
      reason: `Khóa vĩnh viễn: ${reason}`,
      issuedAt: new Date().toISOString(),
      adminName: 'Admin Trưởng Sàn',
      penaltyPoints: 15,
    });
  }

  async reactivateShop(shopId: string): Promise<void> {
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    shop.operationalStatus = 'ACTIVE';
    shop.status = 'APPROVED';
    shop.suspendedUntil = undefined;
    shop.suspensionReason = undefined;
    shop.banReason = undefined;
    if (!shop.sanctionHistory) shop.sanctionHistory = [];
    shop.sanctionHistory.unshift({
      id: `sanc_${Date.now()}`,
      action: 'REACTIVATE',
      reason: 'Gỡ bỏ chế tài, mở khóa hoạt động trở lại cho gian hàng.',
      issuedAt: new Date().toISOString(),
      adminName: 'Admin Hệ Thống',
    });
  }

  async getUserReports(): Promise<UserReport[]> {
    return userReports;
  }

  async submitUserReport(input: Omit<UserReport, 'id' | 'ticketCode' | 'createdAt' | 'status'>): Promise<UserReport> {
    const newReport: UserReport = {
      ...input,
      id: `rep_${Date.now()}`,
      ticketCode: `TC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };
    userReports.unshift(newReport);
    return newReport;
  }

  async resolveUserReport(
    reportId: string,
    action: 'WARN_SHOP' | 'SUSPEND_SHOP_TEMP' | 'BAN_SHOP_PERM' | 'HIDE_PRODUCT' | 'REFUND_ORDER' | 'DISMISS',
    notes: string,
    options?: { suspendDays?: number; penaltyPoints?: number }
  ): Promise<void> {
    const rep = userReports.find((r) => r.id === reportId);
    if (!rep) return;
    rep.status = action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
    rep.resolvedAt = new Date().toISOString();
    rep.adminActionTaken = action;
    rep.adminNotes = notes;

    const targetShopId = rep.shopId || (rep.targetType === 'SHOP' ? rep.targetId : undefined);
    if (targetShopId) {
      if (action === 'WARN_SHOP') {
        await this.warnShop(targetShopId, notes, options?.penaltyPoints || 2);
      } else if (action === 'SUSPEND_SHOP_TEMP') {
        await this.suspendShop(targetShopId, options?.suspendDays || 7, notes);
      } else if (action === 'BAN_SHOP_PERM') {
        await this.banShop(targetShopId, notes);
      }
    }

    if (action === 'HIDE_PRODUCT' && rep.targetType === 'PRODUCT') {
      const gProd = gameAccountProducts.find((p) => p.id === rep.targetId);
      if (gProd) gProd.status = 'HIDDEN';
      const aProd = appAccountProducts.find((p) => p.id === rep.targetId);
      if (aProd) aProd.status = 'HIDDEN';
      const prod = products.find((p) => p.id === rep.targetId);
      if (prod) prod.status = 'HIDDEN';
    }
  }

  // ==========================================
  // ADMIN INBOX — User Messages
  // ==========================================

  async getAdminConversations(): Promise<AdminConversation[]> {
    return [...adminConversations].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  async replyAdminMessage(conversationId: string, text: string): Promise<void> {
    const conv = adminConversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const now = new Date();
    const newMsg: AdminMessage = {
      id: `admin_msg_${Date.now()}`,
      conversationId,
      sender: 'admin',
      senderName: 'Admin Hỗ Trợ',
      text,
      createdAt: now.toISOString(),
    };
    conv.messages.push(newMsg);
    conv.lastMessage = text;
    conv.lastMessageAt = now.toISOString();
    conv.status = 'REPLIED';
    conv.unreadCount = 0;
  }

  async updateConversationStatus(conversationId: string, status: AdminMessageStatus): Promise<void> {
    const conv = adminConversations.find((c) => c.id === conversationId);
    if (!conv) return;
    conv.status = status;
    if (status === 'READ' || status === 'REPLIED' || status === 'ARCHIVED') {
      conv.unreadCount = 0;
    }
  }

  async setConversationAutomation(conversationId: string, enabled: boolean): Promise<void> {
    const conv = adminConversations.find((c) => c.id === conversationId);
    if (conv) conv.automationEnabled = enabled;
  }

  // User Management & Customer Support
  async getUsers(filters?: { query?: string; role?: string; status?: string }): Promise<AdminManagedUser[]> {
    let result = [...adminUsers].filter((u) => u.status !== 'DELETED');
    if (filters) {
      if (filters.query) {
        const q = filters.query.toLowerCase().trim();
        result = result.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phoneNumber && u.phoneNumber.includes(q)) ||
            u.id.toLowerCase().includes(q)
        );
      }
      if (filters.role && filters.role !== 'ALL') {
        result = result.filter((u) => u.role === filters.role);
      }
      if (filters.status && filters.status !== 'ALL') {
        result = result.filter((u) => u.status === filters.status);
      }
    }
    return result;
  }

  async getUserDetail(userId: string): Promise<AdminManagedUser | null> {
    const user = adminUsers.find((u) => u.id === userId);
    return user ? { ...user } : null;
  }

  async updateUser(userId: string, data: Partial<AdminManagedUser>): Promise<AdminManagedUser> {
    const index = adminUsers.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error(`User with ID ${userId} not found`);
    adminUsers[index] = { ...adminUsers[index], ...data };
    return adminUsers[index];
  }

  async banUserPermanently(userId: string, reason: string): Promise<void> {
    const user = adminUsers.find((u) => u.id === userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    user.status = 'BANNED';
    user.banReason = reason;
    user.bannedAt = new Date().toISOString();
    user.bannedBy = 'Admin Quản Trị';
    if (!user.accountFlags) user.accountFlags = [];
    if (!user.accountFlags.includes('BANNED_PERM')) user.accountFlags.push('BANNED_PERM');
    if (!user.adminNotes) user.adminNotes = [];
    user.adminNotes.unshift({
      id: `ban_note_${Date.now()}`,
      adminName: 'Admin Quản Trị',
      content: `[KHÓA VĨNH VIỄN] Lý do: ${reason}`,
      createdAt: new Date().toISOString(),
    });
  }

  async unbanUser(userId: string): Promise<void> {
    const user = adminUsers.find((u) => u.id === userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    user.status = 'ACTIVE';
    user.banReason = undefined;
    user.bannedAt = undefined;
    user.bannedBy = undefined;
    if (user.accountFlags) {
      user.accountFlags = user.accountFlags.filter((f) => f !== 'BANNED_PERM' && f !== 'FRAUD');
    }
    if (!user.adminNotes) user.adminNotes = [];
    user.adminNotes.unshift({
      id: `unban_note_${Date.now()}`,
      adminName: 'Admin Quản Trị',
      content: `[MỞ KHÓA TÀI KHOẢN] Đã gỡ lệnh khóa và khôi phục hoạt động bình thường.`,
      createdAt: new Date().toISOString(),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const index = adminUsers.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error(`User with ID ${userId} not found`);
    adminUsers.splice(index, 1);
  }

  async addUserSupportNote(userId: string, note: string, adminName = 'Admin Hỗ Trợ'): Promise<UserSupportNote> {
    const user = adminUsers.find((u) => u.id === userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    if (!user.adminNotes) user.adminNotes = [];
    const newNote: UserSupportNote = {
      id: `note_${Date.now()}`,
      adminName,
      content: note,
      createdAt: new Date().toISOString(),
    };
    user.adminNotes.unshift(newNote);
    return newNote;
  }

  async adjustUserBalance(userId: string, amount: number, reason: string): Promise<number> {
    const user = adminUsers.find((u) => u.id === userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    user.walletBalance = Math.max(0, (user.walletBalance || 0) + amount);
    if (!user.adminNotes) user.adminNotes = [];
    user.adminNotes.unshift({
      id: `adj_${Date.now()}`,
      adminName: 'Admin Tài Chính',
      content: `[ĐIỀU CHỈNH SỐ DƯ VÍ] ${amount >= 0 ? '+' : ''}${amount.toLocaleString('vi-VN')} đ. Lý do: ${reason}`,
      createdAt: new Date().toISOString(),
    });
    return user.walletBalance;
  }
}

// 9. MOCK AUTH API
export class MockAuthRepository implements IAuthApi {
  async login(email: string): Promise<AuthSession> {
    let role: User['role'] = 'BUYER';
    if (email.includes('seller')) role = 'SELLER_OWNER';
    if (email.includes('admin')) role = 'ADMIN';

    return {
      user: {
        id: `usr_${Date.now()}`,
        email,
        fullName: role === 'ADMIN' ? 'Quản Trị Viên' : role === 'SELLER_OWNER' ? 'Chủ Shop GEARVN' : 'Nguyễn Văn An',
        role,
        isEmailVerified: true,
        shopId: role === 'SELLER_OWNER' ? 'shop_gearvn' : undefined,
        createdAt: new Date().toISOString(),
      },
      token: `mock_jwt_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };
  }

  async register(fullName: string, email: string, phoneNumber: string): Promise<AuthSession> {
    return {
      user: {
        id: `usr_${Date.now()}`,
        email,
        fullName,
        phoneNumber,
        role: 'BUYER',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      },
      token: `mock_jwt_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };
  }

  async getMe(): Promise<User | null> {
    return null;
  }

  async logout(): Promise<void> {
    // clean
  }
}

// ==========================================
// 10. MOCK GAME ACCOUNT API
// ==========================================

export class MockGameAccountRepository implements IGameAccountApi {
  async getGames(): Promise<GameSummary[]> {
    return gameCatalog.filter((g) => g.isActive !== false);
  }

  async getGameBySlug(slug: string): Promise<GameSummary | null> {
    return gameCatalog.find((g) => g.slug === slug) || null;
  }

  async searchGameAccounts(params: GameAccountSearchParams): Promise<ApiPaginatedResponse<GameAccountProduct>> {
    let result = gameAccountProducts.filter((p) => p.status === 'ACTIVE');

    if (params.query) {
      const q = params.query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.game.name.toLowerCase().includes(q) ||
          p.server.toLowerCase().includes(q)
      );
    }

    if (params.gameSlug) {
      result = result.filter((p) => p.game.slug === params.gameSlug);
    }

    if (params.platform) {
      result = result.filter((p) => p.platform === params.platform || p.platform === 'CROSS_PLATFORM');
    }

    if (params.server) {
      result = result.filter((p) => p.server.toLowerCase().includes(params.server!.toLowerCase()));
    }

    if (params.minPrice !== undefined) {
      result = result.filter((p) => p.basePrice >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      result = result.filter((p) => p.basePrice <= params.maxPrice!);
    }

    if (params.inStockOnly) {
      result = result.filter((p) => p.availableStock > 0);
    }

    if (params.deliveryMode) {
      result = result.filter((p) => p.deliveryMode === params.deliveryMode);
    }

    if (params.hasWarranty) {
      result = result.filter((p) => p.warrantyHours > 0);
    }

    if (params.canChangeEmail) {
      result = result.filter((p) => p.changeability.canChangeEmail);
    }

    if (params.attributes) {
      for (const [key, val] of Object.entries(params.attributes)) {
        if (val) {
          result = result.filter((p) => String(p.publicAttributes[key]) === String(val));
        }
      }
    }

    // Sort
    if (params.sortBy === 'PRICE_ASC') {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (params.sortBy === 'PRICE_DESC') {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (params.sortBy === 'BEST_SELLER') {
      result.sort((a, b) => b.soldCount - a.soldCount);
    } else if (params.sortBy === 'SELLER_RATING') {
      result.sort((a, b) => b.shop.rating - a.shop.rating);
    } else if (params.sortBy === 'NEWEST') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 12;
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated = result.slice((page - 1) * pageSize, page * pageSize);

    return {
      success: true,
      data: paginated,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getGameAccountBySlug(slug: string): Promise<GameAccountProduct | null> {
    return gameAccountProducts.find((p) => p.slug === slug) || null;
  }

  async getGameAccountById(id: string): Promise<GameAccountProduct | null> {
    return gameAccountProducts.find((p) => p.id === id) || null;
  }

  async getFeaturedGameAccounts(): Promise<GameAccountProduct[]> {
    return gameAccountProducts.filter((p) => p.status === 'ACTIVE').slice(0, 6);
  }
}

// ==========================================
// 11. MOCK GAME ACCOUNT INVENTORY API
// ==========================================

export class MockGameAccountInventoryRepository implements IGameAccountInventoryApi {
  async getInventory(params?: { productId?: string; status?: string; search?: string }): Promise<GameAccountInventoryItemSummary[]> {
    let list = [...gameInventory];

    if (params?.productId) {
      list = list.filter((i) => i.productId === params.productId);
    }

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((i) => i.status === params.status);
    }

    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.internalCode.toLowerCase().includes(s) ||
          i.maskedLogin.toLowerCase().includes(s) ||
          (i.productName && i.productName.toLowerCase().includes(s))
      );
    }

    return list;
  }

  async addItem(input: CreateGameAccountInventoryItemInput): Promise<GameAccountInventoryItemSummary> {
    const prod = gameAccountProducts.find((p) => p.id === input.productId);
    const masked = input.credentials.login.length > 4
      ? input.credentials.login.slice(0, 3) + '***' + (input.credentials.login.includes('@') ? '@' + input.credentials.login.split('@')[1] : '')
      : 'acc***';

    const newItem: GameAccountInventoryItemSummary = {
      id: `inv_item_${Date.now()}`,
      productId: input.productId,
      productName: prod?.name || 'Tài khoản game',
      internalCode: input.internalCode || `CODE-${Date.now().toString().slice(-4)}`,
      maskedLogin: masked,
      status: 'AVAILABLE',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    gameInventory.unshift(newItem);

    // Increment availableStock on product
    if (prod) {
      prod.availableStock += 1;
      if (prod.variants[0]) {
        prod.variants[0].stock += 1;
        prod.variants[0].availability = 'IN_STOCK';
      }
    }

    return newItem;
  }

  async importBulk(
    productId: string,
    rawText: string
  ): Promise<{ importedCount: number; errorCount: number; errors?: Array<{ line: number; reason: string }> }> {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const prod = gameAccountProducts.find((p) => p.id === productId);
    let imported = 0;
    const errors: Array<{ line: number; reason: string }> = [];

    lines.forEach((line, index) => {
      const parts = line.split('|');
      if (parts.length < 2 || !parts[0].trim() || !parts[1].trim()) {
        errors.push({ line: index + 1, reason: 'Sai định dạng (cần ít nhất login|password)' });
        return;
      }
      const login = parts[0].trim();
      const masked = login.length > 4 ? login.slice(0, 3) + '***' : 'acc***';

      const item: GameAccountInventoryItemSummary = {
        id: `inv_item_${Date.now()}_${index}`,
        productId,
        productName: prod?.name || 'Tài khoản game',
        internalCode: `BULK-${index + 1}`,
        maskedLogin: masked,
        status: 'AVAILABLE',
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      gameInventory.unshift(item);
      imported += 1;
    });

    if (prod && imported > 0) {
      prod.availableStock += imported;
      if (prod.variants[0]) {
        prod.variants[0].stock += imported;
        prod.variants[0].availability = 'IN_STOCK';
      }
    }

    return {
      importedCount: imported,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async disableItem(id: string): Promise<void> {
    const item = gameInventory.find((i) => i.id === id);
    if (item && item.status === 'AVAILABLE') {
      item.status = 'DISABLED';
      item.updatedAt = new Date().toISOString();
      const prod = gameAccountProducts.find((p) => p.id === item.productId);
      if (prod && prod.availableStock > 0) {
        prod.availableStock -= 1;
        if (prod.variants[0]) {
          prod.variants[0].stock = prod.availableStock;
          if (prod.availableStock === 0) prod.variants[0].availability = 'OUT_OF_STOCK';
        }
      }
    }
  }

  async enableItem(id: string): Promise<void> {
    const item = gameInventory.find((i) => i.id === id);
    if (item && item.status === 'DISABLED') {
      item.status = 'AVAILABLE';
      item.updatedAt = new Date().toISOString();
      const prod = gameAccountProducts.find((p) => p.id === item.productId);
      if (prod) {
        prod.availableStock += 1;
        if (prod.variants[0]) {
          prod.variants[0].stock = prod.availableStock;
          prod.variants[0].availability = 'IN_STOCK';
        }
      }
    }
  }

  async deleteDraft(id: string): Promise<void> {
    const idx = gameInventory.findIndex((i) => i.id === id && i.status === 'DRAFT');
    if (idx > -1) {
      gameInventory.splice(idx, 1);
    }
  }
}

// ==========================================
// 12. MOCK DIGITAL DELIVERY API
// ==========================================

export class MockDigitalDeliveryRepository implements IDigitalDeliveryApi {
  async getDeliverySummary(orderId: string): Promise<DigitalDeliverySummary> {
    const order = digitalOrders.find((o) => o.id === orderId || o.code === orderId);
    return {
      orderId: order?.id || orderId,
      deliveryStatus: order?.deliveryStatus || 'READY',
      itemCount: order?.quantity || 1,
      revealedAt: order?.deliveryStatus === 'REVEALED' ? new Date().toISOString() : undefined,
      warrantyEndsAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      instructions: [
        'Đăng nhập và kiểm tra toàn bộ thông tin tài khoản ngay khi nhận.',
        'Đổi mật khẩu và kích hoạt phương thức bảo mật 2 lớp.',
        'Nhấn "Xác nhận hoạt động" khi đã kiểm tra xong để hoàn tất đơn hàng.',
      ],
      requiresReauthentication: false,
    };
  }

  async revealDelivery(orderId: string, _authPass?: string): Promise<RevealedGameAccountDelivery> {
    // Artificial delay to simulate network & audit logging
    await new Promise((resolve) => setTimeout(resolve, 400));

    const existing = revealedDeliveries[orderId];
    if (existing) {
      const ord = digitalOrders.find((o) => o.id === orderId);
      if (ord) ord.deliveryStatus = 'REVEALED';
      return existing;
    }

    // Generate ephemeral mock credentials for new reveal
    const delivery: RevealedGameAccountDelivery = {
      deliveryId: `del_${Date.now()}_secret`,
      orderId,
      revealedAt: new Date().toISOString(),
      warrantyEndsAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      credentials: [
        {
          inventoryItemId: `item_${Date.now()}`,
          login: `gamer.vn.${Date.now().toString().slice(-4)}@demo.invalid`,
          password: `P@ssw0rd#Secure${Math.floor(Math.random() * 9000 + 1000)}`,
          recoveryEmail: `rec.buyer.${Date.now().toString().slice(-4)}@outlook.com`,
          recoveryCode: `REC-GAMER-${Date.now().toString().slice(-6)}`,
          additionalFields: [
            { label: 'Tên nhân vật', value: 'ProPlayerVN' },
            { label: 'Loại tài khoản', value: 'Gốc - Đổi được thông tin' },
          ],
        },
      ],
      instructions: [
        '1. Đăng nhập ngay vào ứng dụng hoặc trang chủ nhà phát hành.',
        '2. Đổi mật khẩu cấp 1 và cấp 2 (nếu có).',
        '3. Cập nhật số điện thoại và email bảo mật sang thông tin của bạn.',
        '4. Tuyệt đối không chia sẻ mật khẩu cho bất kỳ ai khác.',
      ],
    };

    revealedDeliveries[orderId] = delivery;
    const ord = digitalOrders.find((o) => o.id === orderId);
    if (ord) {
      ord.deliveryStatus = 'REVEALED';
      ord.allowedActions.confirmReceived = true;
    }

    return delivery;
  }

  async confirmReceived(orderId: string): Promise<{ success: boolean; completedAt: string }> {
    const ord = digitalOrders.find((o) => o.id === orderId);
    const now = new Date().toISOString();
    if (ord) {
      ord.orderStatus = 'COMPLETED';
      ord.deliveryStatus = 'REVEALED';
      ord.allowedActions.confirmReceived = false;
    }
    return { success: true, completedAt: now };
  }

  async reportIssue(input: {
    orderId: string;
    issueType: string;
    description: string;
    evidenceImages: string[];
    desiredSolution: string;
  }): Promise<DigitalDispute> {
    const ord = digitalOrders.find((o) => o.id === input.orderId);
    const dispute: DigitalDispute = {
      id: `disp_${Date.now()}`,
      orderId: input.orderId,
      orderCode: ord?.code || 'ORD-UNKNOWN',
      buyerId: 'user_buyer_1',
      buyerName: 'Người Mua',
      shopId: 'shop_gamevn',
      shopName: 'Shop Game Pro Uy Tín',
      productTitle: ord?.productName || 'Tài khoản game',
      issueType: input.issueType as any,
      description: input.description,
      evidenceImages: input.evidenceImages,
      desiredSolution: input.desiredSolution as any,
      status: 'PENDING_SELLER_RESPONSE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    digitalDisputes.unshift(dispute);
    if (ord) {
      ord.orderStatus = 'DISPUTED';
      ord.deliveryStatus = 'REPORTED';
      ord.allowedActions.reportIssue = false;
    }

    return dispute;
  }
}

// ==========================================
// 13. MOCK DIGITAL DISPUTE API
// ==========================================

export class MockDigitalDisputeRepository implements IDigitalDisputeApi {
  async getDisputes(_role?: 'BUYER' | 'SELLER' | 'ADMIN'): Promise<DigitalDispute[]> {
    return digitalDisputes;
  }

  async getDisputeById(id: string): Promise<DigitalDispute | null> {
    return digitalDisputes.find((d) => d.id === id) || null;
  }

  async sellerRespond(disputeId: string, message: string): Promise<DigitalDispute> {
    const disp = digitalDisputes.find((d) => d.id === disputeId);
    if (!disp) throw new Error('Không tìm thấy khiếu nại');
    disp.sellerResponse = {
      message,
      respondedAt: new Date().toISOString(),
    };
    disp.status = 'ESCALATED_TO_ADMIN';
    disp.updatedAt = new Date().toISOString();
    return disp;
  }

  async adminResolve(
    disputeId: string,
    resolution: 'REFUND' | 'REPLACE' | 'DISMISS',
    notes: string
  ): Promise<DigitalDispute> {
    const disp = digitalDisputes.find((d) => d.id === disputeId);
    if (!disp) throw new Error('Không tìm thấy khiếu nại');
    disp.status = resolution === 'DISMISS' ? 'REJECTED' : resolution === 'REFUND' ? 'RESOLVED_REFUNDED' : 'RESOLVED_REPLACED';
    disp.adminResolution = {
      resolution,
      notes,
      resolvedAt: new Date().toISOString(),
    };
    disp.updatedAt = new Date().toISOString();

    const ord = digitalOrders.find((o) => o.id === disp.orderId);
    if (ord) {
      ord.orderStatus = resolution === 'REFUND' ? 'REFUNDED' : 'COMPLETED';
    }

    return disp;
  }
}

// ==========================================
// 14. MOCK APP ACCOUNT API
// ==========================================

export class MockAppAccountRepository implements IAppAccountApi {
  async getApplications(): Promise<ApplicationSummary[]> {
    return applicationCatalog;
  }

  async getApplicationBySlug(slug: string): Promise<ApplicationSummary | null> {
    return applicationCatalog.find((a) => a.slug === slug) || null;
  }

  async createApplication(input: Partial<ApplicationSummary>): Promise<ApplicationSummary> {
    const slug = input.slug || (input.name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newApp: ApplicationSummary = {
      id: input.id || `app_${Date.now()}`,
      slug,
      name: input.name || 'Ứng Dụng Mới',
      logo: input.logo || input.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      logoUrl: input.logoUrl || input.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      category: input.category || 'AI',
      supportedPlatforms: input.supportedPlatforms || ['WEB', 'WINDOWS', 'MAC', 'ANDROID', 'IOS'],
      officialWebsiteUrl: input.officialWebsiteUrl || '',
      description: input.description || '',
      isActive: true,
      activeListingsCount: 1,
    };
    applicationCatalog.unshift(newApp);
    return newApp;
  }

  async updateApplication(id: string, input: Partial<ApplicationSummary>): Promise<ApplicationSummary> {
    const idx = applicationCatalog.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Không tìm thấy ứng dụng mẫu');
    applicationCatalog[idx] = {
      ...applicationCatalog[idx],
      ...input,
    };
    return applicationCatalog[idx];
  }

  async deleteApplication(id: string): Promise<void> {
    applicationCatalog = applicationCatalog.filter((a) => a.id !== id);
  }

  async resetApplications(): Promise<ApplicationSummary[]> {
    applicationCatalog = [...mockApplications];
    return applicationCatalog;
  }

  async searchAppAccounts(params: AppAccountSearchParams): Promise<ApiPaginatedResponse<AppAccountProduct>> {
    let result = [...appAccountProducts];

    if (params.query) {
      const q = params.query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.applicationName && p.applicationName.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q))) ||
          p.plans.some((pl) => pl.name.toLowerCase().includes(q))
      );
    }

    if (params.applicationSlug) {
      result = result.filter((p) => p.applicationSlug === params.applicationSlug);
    }

    if (params.category) {
      result = result.filter((p) => p.appCategory === params.category);
    }

    if (params.platform) {
      result = result.filter((p) => p.platforms && p.platforms.includes(params.platform!));
    }

    if (params.fulfillmentType) {
      result = result.filter((p) => p.plans.some((pl) => pl.fulfillmentType === params.fulfillmentType));
    }

    if (params.minPrice !== undefined) {
      result = result.filter((p) => p.basePrice >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      result = result.filter((p) => p.basePrice <= params.maxPrice!);
    }

    if (params.inStockOnly) {
      result = result.filter((p) => {
        return p.plans.some((pl) => {
          if (pl.fulfillmentType === 'PRE_CREATED_ACCOUNT' || pl.fulfillmentType === 'LICENSE_KEY') {
            return (pl.stock || 0) > 0;
          }
          return (pl.availableSlots || 0) > 0;
        });
      });
    }

    if (params.sortBy) {
      switch (params.sortBy) {
        case 'PRICE_ASC':
          result.sort((a, b) => a.basePrice - b.basePrice);
          break;
        case 'PRICE_DESC':
          result.sort((a, b) => b.basePrice - a.basePrice);
          break;
        case 'BEST_SELLER':
          result.sort((a, b) => b.soldCount - a.soldCount);
          break;
        case 'SELLER_RATING':
          result.sort((a, b) => (b.shop?.rating || 0) - (a.shop?.rating || 0));
          break;
        case 'NEWEST':
        default:
          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 12;
    const total = result.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = result.slice(start, start + pageSize);

    return {
      success: true,
      data: items,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getAppAccountBySlug(slug: string): Promise<AppAccountProduct | null> {
    return appAccountProducts.find((p) => p.slug === slug) || null;
  }

  async getAppAccountById(id: string): Promise<AppAccountProduct | null> {
    return appAccountProducts.find((p) => p.id === id) || null;
  }

  async getFeaturedAppAccounts(): Promise<AppAccountProduct[]> {
    return appAccountProducts.slice(0, 4);
  }
}

// ==========================================
// 15. MOCK APP ACCOUNT INVENTORY API
// ==========================================

export class MockAppAccountInventoryRepository implements IAppAccountInventoryApi {
  async getInventory(params?: { productId?: string; planId?: string; status?: string; search?: string }): Promise<AppAccountInventoryItemSummary[]> {
    let result = [...appInventory];
    if (params?.productId) {
      result = result.filter((i) => i.productId === params.productId);
    }
    if (params?.planId) {
      result = result.filter((i) => i.planId === params.planId);
    }
    if (params?.status && params.status !== 'ALL') {
      result = result.filter((i) => i.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.internalCode.toLowerCase().includes(q) ||
          (i.maskedLogin && i.maskedLogin.toLowerCase().includes(q)) ||
          (i.maskedSecret && i.maskedSecret.toLowerCase().includes(q))
      );
    }
    return result;
  }

  async addItem(input: CreateAppAccountInventoryItemInput): Promise<AppAccountInventoryItemSummary> {
    const prod = appAccountProducts.find((p) => p.id === input.productId);
    const plan = prod?.plans.find((pl) => pl.id === input.planId);

    const login = input.credentials?.login;
    const licenseKey = input.credentials?.licenseKey || input.licenseKey;
    const masked = login
      ? login.replace(/^(.{2})(.*)(@.*)$/, '$1***$3')
      : licenseKey
      ? licenseKey.replace(/^(.{4})(.*)(.{4})$/, '$1-XXXX-XXXX-$3')
      : undefined;

    const newItem: AppAccountInventoryItemSummary = {
      id: `app_inv_${Date.now()}`,
      productId: input.productId,
      productName: prod?.name || 'Sản phẩm ứng dụng',
      planId: input.planId,
      planName: plan?.name || 'Gói dịch vụ',
      internalCode: input.internalCode || `ITEM-${Date.now().toString().slice(-6)}`,
      fulfillmentType: plan?.fulfillmentType || 'PRE_CREATED_ACCOUNT',
      maskedLogin: login ? masked : undefined,
      maskedSecret: licenseKey ? masked : undefined,
      status: 'AVAILABLE',
      notes: input.notes || input.privateNote,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    appInventory.unshift(newItem);

    // Update product/plan stock
    if (plan && (plan.fulfillmentType === 'PRE_CREATED_ACCOUNT' || plan.fulfillmentType === 'LICENSE_KEY')) {
      plan.stock = (plan.stock || 0) + 1;
      if (prod) {
        prod.stock = prod.plans.reduce((acc, pl) => acc + (pl.stock || 0), 0);
      }
    }

    return newItem;
  }

  async importBulk(productId: string, planId: string, rawText: string): Promise<{ importedCount: number; errorCount: number; errors?: Array<{ line: number; reason: string }> }> {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    let imported = 0;
    const errors: Array<{ line: number; reason: string }> = [];

    lines.forEach((line, idx) => {
      const parts = line.split('|').map((s) => s.trim());
      if (parts.length < 1 || !parts[0]) {
        errors.push({ line: idx + 1, reason: 'Dòng trống hoặc không đúng định dạng' });
        return;
      }
      this.addItem({
        productId,
        planId,
        internalCode: `BULK-${Date.now().toString().slice(-4)}-${idx + 1}`,
        credentials: {
          login: parts[0],
          password: parts[1] || 'DefaultPass@123',
          licenseKey: parts[0],
        },
      });
      imported++;
    });

    return { importedCount: imported, errorCount: errors.length, errors: errors.length > 0 ? errors : undefined };
  }

  async disableItem(id: string): Promise<void> {
    const item = appInventory.find((i) => i.id === id);
    if (item) {
      item.status = 'DISABLED';
      item.updatedAt = new Date().toISOString();
    }
  }

  async enableItem(id: string): Promise<void> {
    const item = appInventory.find((i) => i.id === id);
    if (item) {
      item.status = 'AVAILABLE';
      item.updatedAt = new Date().toISOString();
    }
  }

  async deleteDraft(id: string): Promise<void> {
    appInventory = appInventory.filter((i) => i.id !== id);
  }

  async getPlanCapacities(productId: string): Promise<AppPlanCapacity[]> {
    return appPlanCapacities[productId] || [];
  }

  async updatePlanCapacity(productId: string, planId: string, totalSlots: number): Promise<AppPlanCapacity> {
    if (!appPlanCapacities[productId]) {
      appPlanCapacities[productId] = [];
    }
    let cap = appPlanCapacities[productId].find((c) => c.planId === planId);
    if (!cap) {
      const prod = appAccountProducts.find((p) => p.id === productId);
      const plan = prod?.plans.find((pl) => pl.id === planId);
      cap = {
        productId,
        planId,
        planName: plan?.name || 'Gói',
        fulfillmentType: plan?.fulfillmentType || 'FAMILY_OR_TEAM_INVITATION',
        totalSlots,
        assignedSlots: 0,
        availableSlots: totalSlots,
        updatedAt: new Date().toISOString(),
      };
      appPlanCapacities[productId].push(cap);
    } else {
      const currentAssigned = cap.assignedSlots || 0;
      cap.totalSlots = Math.max(currentAssigned, totalSlots);
      cap.availableSlots = cap.totalSlots - currentAssigned;
      cap.updatedAt = new Date().toISOString();
    }

    // Sync with product plan
    const prod = appAccountProducts.find((p) => p.id === productId);
    const plan = prod?.plans.find((pl) => pl.id === planId);
    if (plan) {
      plan.totalSlots = cap.totalSlots;
      plan.availableSlots = cap.availableSlots;
    }

    return cap;
  }
}

// ==========================================
// 16. MOCK APP ORDER API
// ==========================================

export class MockAppOrderRepository implements IAppOrderApi {
  async getAppDeliveryContent(orderId: string): Promise<AppDeliveryContent> {
    if (appDeliveryContents[orderId]) {
      return appDeliveryContents[orderId];
    }
    // Return a default ready or preparing content
    return {
      orderId,
      fulfillmentType: 'BUYER_EMAIL_ACTIVATION',
      activationStatus: 'ACTIVATION_PENDING',
      instructions: [
        'Người bán đang chuẩn bị kích hoạt dịch vụ cho bạn.',
        'Vui lòng kiểm tra lại email bạn đã cung cấp khi đặt hàng.',
      ],
    };
  }

  async submitBuyerFields(orderId: string, buyerProvidedValues: Record<string, string>): Promise<void> {
    const existing = appDeliveryContents[orderId] || {
      orderId,
      fulfillmentType: 'BUYER_EMAIL_ACTIVATION',
      activationStatus: 'ACTIVATION_PENDING',
    };
    existing.buyerProvidedValues = buyerProvidedValues;
    if (buyerProvidedValues.buyerEmail) {
      existing.targetEmail = buyerProvidedValues.buyerEmail;
    }
    existing.activationStatus = 'INVITATION_SENT';
    appDeliveryContents[orderId] = existing;
  }

  async sellerMarkActivationCompleted(orderId: string, deliveryContent: Partial<AppDeliveryContent>): Promise<void> {
    const existing = appDeliveryContents[orderId] || {
      orderId,
      fulfillmentType: deliveryContent.fulfillmentType || 'BUYER_EMAIL_ACTIVATION',
      activationStatus: 'ACTIVATED',
    };
    appDeliveryContents[orderId] = {
      ...existing,
      ...deliveryContent,
      activationStatus: 'ACTIVATED',
      activatedAt: new Date().toISOString(),
    };

    const ord = digitalOrders.find((o) => o.id === orderId);
    if (ord) {
      ord.deliveryStatus = 'READY';
      ord.orderStatus = 'DELIVERED';
      ord.allowedActions.confirmReceived = true;
    }
  }

  async sellerResendInvite(orderId: string): Promise<void> {
    const existing = appDeliveryContents[orderId];
    if (existing) {
      existing.activationStatus = 'INVITATION_SENT';
    }
  }
}

// 18. MOCK SHOP API (Storefront, Follow, Like, Verified Reviews)
export class MockShopRepository implements IShopApi {
  async getShop(shopIdOrSlug: string): Promise<Shop | null> {
    await new Promise((r) => setTimeout(r, 50));
    if (!shopIdOrSlug) return shops[0] || null;
    const cleanId = shopIdOrSlug.trim();
    
    // 1. Exact match
    const exact = shops.find(
      (s) =>
        s.id === cleanId ||
        s.slug === cleanId ||
        s.name.toLowerCase() === cleanId.toLowerCase()
    );
    if (exact) return exact;

    // 2. Partial match
    const partial = shops.find(
      (s) =>
        s.name.toLowerCase().includes(cleanId.toLowerCase()) ||
        cleanId.toLowerCase().includes(s.slug.toLowerCase()) ||
        cleanId.toLowerCase().includes(s.name.toLowerCase()) ||
        cleanId.toLowerCase().includes(s.id.toLowerCase())
    );
    if (partial) return partial;

    // 3. Fallback to default active shop so user is never blocked
    return shops[0] || null;
  }

  async getShopProducts(shopId: string): Promise<Product[]> {
    await new Promise((r) => setTimeout(r, 50));
    const matchedProducts = products.filter((p) => p.shop?.id === shopId || p.shop?.slug === shopId || p.shop?.name === shopId);
    const matchedGame = (gameAccountProducts as any[]).filter((g) => g.shop?.id === shopId || g.shop?.slug === shopId || g.shop?.name === shopId);
    const matchedApp = (appAccountProducts as any[]).filter((a) => a.shop?.id === shopId || a.shop?.slug === shopId || a.shop?.name === shopId);
    const result = [...matchedProducts, ...matchedGame, ...matchedApp] as any as Product[];
    if (result.length > 0) return result;
    return [...products.slice(0, 4), ...gameAccountProducts.slice(0, 2), ...appAccountProducts.slice(0, 2)] as any as Product[];
  }

  async toggleFollow(shopId: string, isFollowing: boolean): Promise<{ followerCount: number; isFollowing: boolean }> {
    const shop = shops.find((s) => s.id === shopId || s.slug === shopId);
    if (shop) {
      shop.isFollowing = isFollowing;
      shop.followerCount = Math.max(0, (shop.followerCount || 0) + (isFollowing ? 1 : -1));
      return { followerCount: shop.followerCount, isFollowing };
    }
    return { followerCount: isFollowing ? 1 : 0, isFollowing };
  }

  async toggleLike(shopId: string, isLiked: boolean): Promise<{ likeCount: number; isLiked: boolean }> {
    const shop = shops.find((s) => s.id === shopId || s.slug === shopId);
    if (shop) {
      shop.isLiked = isLiked;
      shop.likeCount = Math.max(0, (shop.likeCount || 0) + (isLiked ? 1 : -1));
      return { likeCount: shop.likeCount, isLiked };
    }
    return { likeCount: isLiked ? 1 : 0, isLiked };
  }

  async getReviews(shopId: string, productId?: string): Promise<ShopReview[]> {
    await new Promise((r) => setTimeout(r, 50));
    return shopReviews.filter((r) => {
      if (productId) {
        return (r.shopId === shopId || r.productId === productId);
      }
      return r.shopId === shopId;
    });
  }

  async addReview(data: { shopId: string; productId?: string; productName?: string; rating: number; comment: string; orderId?: string; buyerName?: string }): Promise<ShopReview> {
    const newReview: ShopReview = {
      id: `rev_${Date.now()}`,
      shopId: data.shopId,
      productId: data.productId,
      productName: data.productName,
      orderId: data.orderId || `ord_${Date.now()}`,
      buyerName: data.buyerName || 'Khách hàng đã mua',
      buyerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      rating: data.rating,
      comment: data.comment,
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };
    shopReviews.unshift(newReview);

    // Update shop rating average
    const matched = shopReviews.filter((r) => r.shopId === data.shopId);
    if (matched.length > 0) {
      const avg = matched.reduce((sum, r) => sum + r.rating, 0) / matched.length;
      const shop = shops.find((s) => s.id === data.shopId);
      if (shop) {
        shop.rating = Number(avg.toFixed(2));
      }
    }
    return newReview;
  }

  async checkPurchaseEligibility(shopId: string, productId?: string): Promise<{ hasPurchased: boolean; orderId?: string; orderCode?: string }> {
    // Check if there are any completed/paid orders matching product or shop
    const matchedOrder = orders.find((o) => {
      if (productId) {
        return o.items.some((i) => i.productId === productId);
      }
      return o.shop?.id === shopId || o.shop?.slug === shopId;
    });

    if (matchedOrder) {
      return {
        hasPurchased: true,
        orderId: matchedOrder.id,
        orderCode: matchedOrder.orderCode,
      };
    }

    const matchedDigital = digitalOrders.find((d) => (d as any).productId === productId || d.productName.toLowerCase().includes(productId?.toLowerCase() || ''));
    if (matchedDigital) {
      return {
        hasPurchased: true,
        orderId: matchedDigital.id,
        orderCode: matchedDigital.code,
      };
    }

    // Default demo purchase history for demo testing
    if (productId === 'ga_001' || productId === 'prod_rog_strix' || shopId === 'shop_gamevn' || shopId === 'shop_gearvn') {
      return {
        hasPurchased: true,
        orderId: 'ord_demo_verified_01',
        orderCode: 'VN20240911-VERIFIED',
      };
    }

    return { hasPurchased: false };
  }
}
