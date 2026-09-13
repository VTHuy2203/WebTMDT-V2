import React, { useEffect, useState } from 'react';
import type { Shop, Product, ShopReview } from '@marketplace/types';
import { shopApi, cartApi } from '@marketplace/api-client';
import { useAuthStore } from '@marketplace/auth';
import { useI18n, formatCurrency } from '@marketplace/utils';
import { Button, StatusBadge, Rating } from '@marketplace/ui';
import { ReportViolationModal } from '../components/ReportViolationModal';
import {
  Store,
  ShieldCheck,
  Heart,
  UserPlus,
  UserCheck,
  MessageCircle,
  Star,
  Package,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Share2,
  Filter,
  Sparkles,
  Gamepad2,
  Cpu,
  ShoppingCart,
  Zap,
  Flag,
  Send,
} from 'lucide-react';
import { useChatStore } from '../stores/useChatStore';

export interface ShopDetailViewProps {
  shopId: string;
  onNavigate: (view: string, params?: any) => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ShopDetailView: React.FC<ShopDetailViewProps> = ({
  shopId,
  onNavigate,
  onSelectProduct,
  onAddToCart,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { locale, t } = useI18n();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Social actions
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'about'>('products');

  // Product filtering & sorting
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC'>('POPULAR');

  // Purchase eligibility for review
  const [canReview, setCanReview] = useState(false);
  const [eligibilityOrderId, setEligibilityOrderId] = useState<string | undefined>();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);

  const [quickChatText, setQuickChatText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadShopData() {
      setIsLoading(true);
      try {
        let foundShop = await shopApi.getShop(shopId || 'shop_gearvn');
        if (!foundShop) {
          foundShop = await shopApi.getShop('shop_gearvn');
        }
        if (foundShop) {
          setShop(foundShop);
          setIsFollowing(!!foundShop.isFollowing);
          setFollowerCount(foundShop.followerCount || 0);
          setIsLiked(!!foundShop.isLiked);
          setLikeCount(foundShop.likeCount || Math.floor((foundShop.followerCount || 100) * 0.45));

          // Fetch products
          const shopProds = await shopApi.getShopProducts(foundShop.id);
          setProducts(shopProds);

          // Fetch reviews
          const shopRevs = await shopApi.getReviews(foundShop.id);
          setReviews(shopRevs);

          // Check purchase eligibility
          const eligibility = await shopApi.checkPurchaseEligibility(foundShop.id);
          setCanReview(eligibility.hasPurchased);
          setEligibilityOrderId(eligibility.orderId);
        }
      } catch (err) {
        console.error('Failed to load shop data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadShopData();
  }, [shopId]);

  // Handle Follow Toggle
  const handleToggleFollow = async () => {
    if (!shop) return;
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    const newCount = followerCount + (nextState ? 1 : -1);
    setFollowerCount(Math.max(0, newCount));

    try {
      await shopApi.toggleFollow(shop.id, nextState);
      showToast(nextState ? '✓ Đã theo dõi gian hàng!' : 'Đã hủy theo dõi gian hàng');
    } catch {
      setIsFollowing(!nextState);
      setFollowerCount(followerCount);
    }
  };

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (!shop) return;
    const nextState = !isLiked;
    setIsLiked(nextState);
    const newCount = likeCount + (nextState ? 1 : -1);
    setLikeCount(Math.max(0, newCount));

    try {
      await shopApi.toggleLike(shop.id, nextState);
      showToast(nextState ? '❤️ Đã thích gian hàng!' : 'Đã bỏ thích gian hàng');
    } catch {
      setIsLiked(!nextState);
      setLikeCount(likeCount);
    }
  };

  // Handle Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !canReview || !newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const added = await shopApi.addReview({
        shopId: shop.id,
        rating: newRating,
        comment: newComment.trim(),
        orderId: eligibilityOrderId,
        buyerName: user?.fullName || 'Khách hàng đã mua',
      });
      setReviews((prev) => [added, ...prev]);
      setNewComment('');
      showToast('✓ Đã gửi đánh giá xác thực thành công!');
    } catch (err) {
      alert('Có lỗi khi gửi đánh giá.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin gian hàng...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không Tìm Thấy Gian Hàng</h2>
        <p className="text-xs text-slate-500">
          Gian hàng này không tồn tại hoặc đã tạm dừng hoạt động.
        </p>
        <Button onClick={() => onNavigate('home')}>Quay Về Trang Chủ</Button>
      </div>
    );
  }

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter === 'ALL') return true;
    if (productCategoryFilter === 'GAME') return p.category?.slug.includes('game') || p.id.startsWith('ga_');
    if (productCategoryFilter === 'APP') return p.category?.slug.includes('app') || p.id.startsWith('app_');
    if (productCategoryFilter === 'TECH') return !p.category?.slug.includes('game') && !p.category?.slug.includes('app');
    return true;
  });

  // Sorted Products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'NEWEST') return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
    if (sortBy === 'PRICE_ASC') return a.basePrice - b.basePrice;
    if (sortBy === 'PRICE_DESC') return b.basePrice - a.basePrice;
    return (b.soldCount || 0) - (a.soldCount || 0); // POPULAR
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại trang chủ</span>
      </button>

      {/* Hero Storefront Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* Cover Image */}
        <div className="h-44 sm:h-56 w-full relative bg-slate-800">
          <img
            src={shop.coverImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200'}
            alt={shop.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />

          {/* Official badge overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-rose-900/80 backdrop-blur-md text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Báo cáo sai phạm gian hàng"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Báo cáo shop</span>
            </button>
          </div>
        </div>

        {/* Shop Info Card Bar */}
        <div className="p-6 sm:p-8 pt-0 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Left: Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative">
                <img
                  src={shop.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                  alt={shop.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-white"
                />
                {shop.isOfficial && (
                  <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 rounded-full text-white ring-2 ring-white" title="Gian hàng chính hãng đã xác thực">
                    <CheckCircle2 className="w-4 h-4 fill-blue-600 text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {shop.name}
                  </h1>
                  {shop.isOfficial && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-wider">
                      CHÍNH HÃNG
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Đang Hoạt Động
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-xl line-clamp-2">
                  {shop.description || 'Gian hàng công nghệ & tài khoản số uy tín được bảo hộ bởi sàn TechMarket.'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <strong>{shop.rating}</strong> / 5 ({reviews.length} đánh giá)
                  </span>
                  <span>•</span>
                  <span>Tỉ lệ phản hồi: <strong>{shop.responseRate || 99}%</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Actions (Follow, Like, Chat) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {/* Message / Chat Button */}
              <button
                type="button"
                onClick={() => {
                  useChatStore.getState().openChatWithShop(
                    shop,
                    `Xin chào ${shop.name}! Tôi quan tâm đến các sản phẩm của shop và cần trao đổi thêm.`
                  );
                }}
                className="px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Nhắn Tin Cho Shop</span>
              </button>

              {/* Like Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  isLiked
                    ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50/50 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isLiked ? 'Đã Thích' : 'Yêu Thích'}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 font-mono">
                  {likeCount}
                </span>
              </button>

              {/* Follow Button */}
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Đang Theo Dõi</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Theo Dõi Shop</span>
                  </>
                )}
                <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono">
                  {followerCount}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Sản phẩm</span>
                <span className="font-extrabold text-slate-900">{products.length} mặt hàng</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Người theo dõi</span>
                <span className="font-extrabold text-slate-900">{followerCount} người</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Heart className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Lượt yêu thích</span>
                <span className="font-extrabold text-slate-900">{likeCount} lượt</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Bảo vệ giao dịch</span>
                <span className="font-extrabold text-slate-900">100% An Toàn</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trao Đổi & Chat Trực Tiếp Với Gian Hàng */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={shop.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                  alt={shop.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/30"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight">
                    Trao Đổi & Tư Vấn Trực Tiếp Với {shop.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    🟢 Đang Trực Tuyến
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Phản hồi ngay sau 1-2 phút • Trao đổi tình trạng tài khoản, bảo hành phần cứng hoặc báo giá số lượng lớn.
                </p>
              </div>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {[
                'Sản phẩm còn sẵn hàng không?',
                'Tư vấn chi tiết cấu hình & chính sách?',
                'Tài khoản bàn giao qua hình thức nào?',
                'Chính sách bảo hành 1 đổi 1 thế nào?',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    useChatStore.getState().openChatWithShop(shop, chip);
                  }}
                  className="px-3 py-1 rounded-xl text-[11px] font-medium bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 transition-all cursor-pointer backdrop-blur-sm"
                >
                  💬 {chip}
                </button>
              ))}
            </div>

            {/* Direct App Channels: Zalo & Tele */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="text-[11px] text-slate-300 font-semibold">Kênh chat trực tiếp:</span>
              <a
                href="https://zalo.me/0325324064"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0068FF] text-white text-[11px] font-bold hover:bg-[#0058db] transition-all shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Zalo: +84 325 324 064</span>
              </a>
              <a
                href="https://t.me/mind_flux_0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#229ED9] text-white text-[11px] font-bold hover:bg-[#1e8ec3] transition-all shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Telegram: @mind_flux_0</span>
              </a>
            </div>
          </div>

          {/* Quick Chat Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = quickChatText.trim();
              if (!text) return;
              useChatStore.getState().openChatWithShop(shop, text);
              setQuickChatText('');
            }}
            className="w-full lg:w-96 flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-inner"
          >
            <input
              type="text"
              value={quickChatText}
              onChange={(e) => setQuickChatText(e.target.value)}
              placeholder="Nhắn tin cho chủ shop ngay..."
              className="flex-1 bg-transparent px-3 text-xs text-white placeholder-slate-400 outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Ngay</span>
            </button>
          </form>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Tất Cả Sản Phẩm ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Đánh Giá Khách Hàng ({reviews.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'about'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Hồ Sơ & Cam Kết Shop</span>
        </button>
      </div>

      {/* TAB 1: SẢN PHẨM CỦA SHOP */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setProductCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  productCategoryFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({products.length})
              </button>
              <button
                onClick={() => setProductCategoryFilter('TECH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  productCategoryFilter === 'TECH'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đồ công nghệ
              </button>
              <button
                onClick={() => setProductCategoryFilter('GAME')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  productCategoryFilter === 'GAME'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Nick Game
              </button>
              <button
                onClick={() => setProductCategoryFilter('APP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  productCategoryFilter === 'APP'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tài khoản AI / App
              </button>
            </div>

            {/* Sắp xếp */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 border-none text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="POPULAR">Bán chạy nhất</option>
                <option value="NEWEST">Mới nhất</option>
                <option value="PRICE_ASC">Giá tăng dần</option>
                <option value="PRICE_DESC">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {sortedProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Chưa có sản phẩm nào trong danh mục này</h4>
              <p className="text-xs text-slate-400">Gian hàng đang cập nhật và đăng tải thêm sản phẩm mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(p);
                    } else {
                      onNavigate('product-detail', { product: p });
                    }
                  }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.shop?.isOfficial && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-sm">
                        Chính Hãng
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">
                        {p.category?.name || 'Sản phẩm'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-sm font-extrabold text-red-600">
                          {formatCurrency(p.basePrice)}
                        </span>
                        {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatCurrency(p.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {p.rating}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            useChatStore.getState().openChatWithShop(
                              shop,
                              `Shop ơi, tư vấn giúp mình sản phẩm "${p.name}" với!`,
                              {
                                id: p.id,
                                name: p.name,
                                price: p.basePrice,
                                image: p.thumbnail,
                              }
                            );
                          }}
                          className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Nhắn tin hỏi shop về sản phẩm này"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Hỏi Shop</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ĐÁNH GIÁ TỪ KHÁCH HÀNG (CHỈ MUA HÀNG MỚI ĐƯỢC ĐÁNH GIÁ) */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Summary & Policy Notice */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-5">
              <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-3xl font-black text-amber-600 block">{shop.rating}</span>
                <span className="text-[11px] text-amber-700 font-semibold">trên 5 sao</span>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Đánh Giá Từ Người Mua Đã Xác Thực
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tổng hợp {reviews.length} đánh giá khách quan từ những khách hàng đã thực hiện giao dịch thành công.
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Đánh giá thật - Được xác thực qua mã đơn hàng sàn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Review Submission Area (STRICT CHECK: CHỈ MUA HÀNG MỚI ĐƯỢC ĐÁNH GIÁ) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
            {canReview ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>Xác thực người mua:</strong> Hệ thống xác nhận bạn đã có đơn hàng hoàn tất tại gian hàng này. Hãy chia sẻ cảm nhận thực tế của bạn!
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mức độ hài lòng của bạn:
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {newRating === 5 && 'Tuyệt vời, rất hài lòng (5 sao)'}
                      {newRating === 4 && 'Hài lòng (4 sao)'}
                      {newRating === 3 && 'Bình thường (3 sao)'}
                      {newRating === 2 && 'Chưa hài lòng (2 sao)'}
                      {newRating === 1 && 'Rất tệ (1 sao)'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nội dung nhận xét:
                  </label>
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm về chất lượng sản phẩm, thời gian bàn giao và dịch vụ hỗ trợ của shop..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <Button type="submit" isLoading={isSubmittingReview} className="font-bold">
                  Gửi Đánh Giá Xác Thực
                </Button>
              </form>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-amber-950">
                      Tính Năng Đánh Giá Đang Khóa: Chỉ Người Đã Mua Hàng Mới Được Đánh Giá
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Để loại bỏ hoàn toàn các đánh giá ảo, nâng khống hoặc cố tình dìm hàng đối thủ, sàn TechMarket quy định <strong>chỉ những khách hàng đã phát sinh đơn hàng và hoàn tất nhận hàng</strong> từ gian hàng <strong>{shop.name}</strong> mới có quyền gửi nhận xét và chấm sao.
                    </p>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('products')}
                    className="text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    Xem Sản Phẩm Của Shop Để Mua Hàng
                  </Button>
                  {!isAuthenticated && (
                    <button
                      onClick={() => onNavigate('auth')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Đăng nhập nếu bạn đã có tài khoản
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* List of Verified Reviews */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">
              Nhận Xét Từ Khách Hàng ({reviews.length})
            </h4>

            {reviews.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Chưa có đánh giá nào cho gian hàng này.
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.buyerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={r.buyerName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{r.buyerName}</span>
                          {r.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đã mua hàng từ shop</span>
                            </span>
                          )}
                        </div>
                        {r.productName && (
                          <span className="text-[11px] text-slate-400 block">
                            Sản phẩm: {r.productName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-0.5 justify-end">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pl-11">
                    {r.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HỒ SƠ & CAM KẾT GIAN HÀNG */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-slate-900">Giới Thiệu Gian Hàng</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {shop.description || 'Gian hàng chính thức trên sàn thương mại điện tử TechMarket.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Địa chỉ kho hàng</span>
                    <span className="font-semibold text-slate-800">{shop.address || 'TP. Hồ Chí Minh, Việt Nam'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hotline CSKH Shop</span>
                    <span className="font-semibold text-slate-800">{shop.phone || '1800 6868'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email liên hệ</span>
                    <span className="font-semibold text-slate-800">{shop.email || 'support@shop.com'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Thời gian tham gia sàn</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(shop.joinedDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cam kết của shop */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-slate-900">Chính Sách & Cam Kết Dịch Vụ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 space-y-1">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-900 block">100% Hàng Chuẩn</span>
                  <p className="text-slate-600 text-[11px]">Sản phẩm chính hãng, bảo hành đầy đủ Serial/IMEI.</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-900 block">Bàn Giao Nhanh</span>
                  <p className="text-slate-600 text-[11px]">Tài khoản bàn giao tự động tức thì qua quét mã QR 24/7.</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 space-y-1">
                  <Lock className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-purple-900 block">Bảo Hành 1 Đổi 1</span>
                  <p className="text-slate-600 text-[11px]">Cam kết bồi thường và hoàn tiền 100% nếu phát sinh lỗi.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar: Pháp lý & Định danh */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-xs h-fit">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Hồ Sơ Pháp Lý Định Danh</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Chủ sở hữu gian hàng:</span>
                <span className="font-bold text-slate-800">{shop.ownerFullName || 'Đã xác thực danh tính'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tình trạng thẩm định CCCD:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã đối soát CCCD & Tài khoản ngân hàng
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Trạng thái hoạt động:</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Gian Hàng Hợp Chuẩn
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Violation Modal */}
      <ReportViolationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        shopId={shop.id}
        shopName={shop.name}
      />
    </div>
  );
};
