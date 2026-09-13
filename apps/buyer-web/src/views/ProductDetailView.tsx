import React, { useState } from 'react';
import type { Product, ProductVariant, GameAccountProduct, AppAccountProduct, ShopReview } from '@marketplace/types';
import { Price, Rating, StatusBadge, Button, GamePlatformBadge, RiskNotice } from '@marketplace/ui';
import { shopApi } from '@marketplace/api-client';
import { useAuthStore } from '@marketplace/auth';
import { TechSpecsTable } from '../components/TechSpecsTable';
import { GameAccountOverview } from '../components/game/GameAccountOverview';
import { AccountChangeabilityCard } from '../components/game/AccountChangeabilityCard';
import { DigitalDeliveryCard } from '../components/game/DigitalDeliveryCard';
import { AppAccountProductDetailView } from '../components/app/AppAccountProductDetailView';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Scale,
  ShoppingCart,
  Zap,
  CheckCircle2,
  Store,
  Bell,
  Check,
  Gamepad2,
  Server,
  Lock,
  Clock,
  Flag,
  Star,
  MessageCircle,
} from 'lucide-react';
import { ReportViolationModal } from '../components/ReportViolationModal';
import { useChatStore } from '../stores/useChatStore';

import { useI18n } from '@marketplace/utils';

export interface ProductDetailViewProps {
  product: Product;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onBuyNow: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onToggleCompare: (product: Product) => void;
  isCompared: boolean;
  onNavigate?: (view: string, params?: any) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  onToggleCompare,
  isCompared,
  onNavigate,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { openChatWithShop } = useChatStore();
  const { locale, t, formatPrice } = useI18n();
  const formatCurrency = (amount: number) => formatPrice(amount);

  const [selectedImage, setSelectedImage] = useState(
    product?.thumbnail || (product as any)?.logo || (product as any)?.images?.[0]?.url || (product as any)?.images?.[0] || ''
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product?.variants?.[0] || {
      id: 'default',
      sku: 'SKU-DEFAULT',
      name: 'Tiêu chuẩn',
      options: {},
      price: product?.basePrice || 0,
      stock: 10,
      availability: 'IN_STOCK',
    }
  );

  // Review states (Only verified buyers can review)
  const [canReview, setCanReview] = useState(false);
  const [eligibilityOrderId, setEligibilityOrderId] = useState<string | undefined>();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [productReviews, setProductReviews] = useState<ShopReview[]>([]);

  React.useEffect(() => {
    async function loadReviewsAndEligibility() {
      try {
        if (product.shop?.id) {
          const res = await shopApi.checkPurchaseEligibility(product.shop.id, product.id);
          setCanReview(res.hasPurchased);
          setEligibilityOrderId(res.orderId);

          const revs = await shopApi.getReviews(product.shop.id, product.id);
          setProductReviews(revs);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadReviewsAndEligibility();
  }, [product.id, product.shop?.id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.shop?.id || !canReview || !newComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      const added = await shopApi.addReview({
        shopId: product.shop.id,
        productId: product.id,
        productName: product.name,
        rating: newRating,
        comment: newComment.trim(),
        orderId: eligibilityOrderId,
        buyerName: user?.fullName || 'Khách hàng đã mua',
      });
      setProductReviews((prev) => [added, ...prev]);
      setNewComment('');
      alert('✓ Cảm ơn bạn! Đánh giá xác thực đã được đăng tải.');
    } catch {
      alert('Có lỗi khi gửi đánh giá.');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  const [quantity, setQuantity] = useState(1);
  const [notifySubscribed, setNotifySubscribed] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const isOutOfStock = selectedVariant.availability === 'OUT_OF_STOCK' || selectedVariant.stock === 0;

  if (product.type === 'DIGITAL_APP_ACCOUNT') {
    const appProduct = product as unknown as AppAccountProduct;
    return (
      <AppAccountProductDetailView
        product={appProduct}
        onNavigate={onNavigate}
        onBack={() => window.history.back()}
        onBuyNow={(plan, buyerFieldValues) => {
          onBuyNow(
            {
              ...product,
              basePrice: plan.price,
              name: `${product.name} - ${plan.name}`,
            },
            {
              id: plan.id,
              sku: plan.sku || plan.id,
              name: plan.name,
              price: plan.price,
              options: buyerFieldValues,
              stock: plan.stock || plan.availableSlots || 1,
              availability: 'IN_STOCK',
            },
            1
          );
        }}
      />
    );
  }

  if (product.type === 'DIGITAL_GAME_ACCOUNT') {
    const gameAccount = product as GameAccountProduct;
    const isAccOutOfStock = gameAccount.availableStock <= 0;

    return (
      <div className="space-y-8 pb-20 max-w-7xl mx-auto">
        {/* Top Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          {/* Gallery Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 relative">
              <img
                src={selectedImage}
                alt={gameAccount.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4 flex gap-1.5">
                <GamePlatformBadge platform={gameAccount.platform} />
                {gameAccount.deliveryMode === 'AUTO_AFTER_PAYMENT' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500 text-white shadow-xs">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Giao tự động</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500 text-white shadow-xs">
                    <span>Giao {gameAccount.deliveryEstimateMinutes || 15}p</span>
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {gameAccount.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gameAccount.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === img.url
                        ? 'border-blue-600 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Privacy Alert */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ảnh chụp bằng chứng đã được người bán che các thông tin nhạy cảm (UID, SĐT, Email).</span>
            </div>
          </div>

          {/* Right Summary Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Game name & server */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold">
                  {gameAccount.game.name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <Server className="w-3.5 h-3.5" />
                  {gameAccount.server}
                </span>
                <span>•</span>
                <span className="text-slate-500 font-mono">Mã: #{gameAccount.id.slice(-6).toUpperCase()}</span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {gameAccount.name}
              </h1>

              {/* Rating & Sold Stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Rating score={gameAccount.rating} size="sm" />
                  <span className="font-bold text-slate-800">{gameAccount.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({gameAccount.reviewCount} đánh giá)</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">
                  Đã bán: <strong className="text-slate-900">{gameAccount.soldCount}</strong> tài khoản
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Bảo hành {gameAccount.warrantyHours} giờ
                </span>
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-baseline justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-medium">Giá bán niêm yết</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-red-600">
                      {formatCurrency(gameAccount.basePrice)}
                    </span>
                    {gameAccount.compareAtPrice && gameAccount.compareAtPrice > gameAccount.basePrice && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(gameAccount.compareAtPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Tình trạng kho</span>
                  <span
                    className={`text-xs font-bold ${
                      isAccOutOfStock ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {isAccOutOfStock ? 'Hết hàng' : `Còn sẵn ${gameAccount.availableStock} tài khoản`}
                  </span>
                </div>
              </div>

              {/* Quantity */}
              {!isAccOutOfStock && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-slate-700">Số lượng:</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 font-bold font-mono text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(gameAccount.availableStock, quantity + 1))}
                      disabled={quantity >= gameAccount.availableStock}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    (Mỗi đơn vị sẽ nhận 1 thông tin tài khoản riêng)
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => onBuyNow(gameAccount, undefined, quantity)}
                  disabled={isAccOutOfStock}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isAccOutOfStock ? 'Tạm hết tài khoản' : 'Mua Ngay (Nhận Tài Khoản Ngay)'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onAddToCart(gameAccount, undefined, quantity)}
                  disabled={isAccOutOfStock}
                  className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Thêm Vào Giỏ Hàng</span>
                </Button>
              </div>

              {/* Shop Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold text-slate-900">{gameAccount.shop.name}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">Đánh giá: {gameAccount.shop.rating} ★</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openChatWithShop(
                        {
                          id: gameAccount.shop.id,
                          name: gameAccount.shop.name,
                          logo: gameAccount.shop.logo,
                          isOfficial: true,
                          responseRate: 99,
                        },
                        undefined,
                        {
                          name: gameAccount.name,
                          price: gameAccount.basePrice,
                          image: selectedImage,
                        }
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat Shop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    title="Tố cáo vi phạm nick lỗi hoặc gian hàng"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Báo cáo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('shop', { shopId: gameAccount.shop.id || 'shop_gamevn' })}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer hover:underline text-xs flex items-center gap-0.5"
                  >
                    Xem gian hàng →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <GameAccountOverview product={gameAccount} />
        <AccountChangeabilityCard changeability={gameAccount.changeability} />
        <DigitalDeliveryCard product={gameAccount} />
        <RiskNotice />

        <ReportViolationModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          shopId={gameAccount.shop.id}
          shopName={gameAccount.shop.name}
          productId={gameAccount.id}
          productName={gameAccount.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        {/* Gallery Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute top-4 left-4">
              <StatusBadge status={selectedVariant.availability} />
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img.url ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Warranty Highlight Card */}
          {product.warranty && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Bảo Hành Chính Hãng {product.warranty.durationMonths} Tháng</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{product.warranty.policy}</p>
              {product.warranty.requiresSerial && (
                <p className="text-[11px] text-blue-700 font-semibold">
                  ✓ Thiết bị được kích hoạt bảo hành điện tử tự động qua Serial / IMEI khi nhận hàng.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Product Details & Variant Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-blue-600">{product.brand?.name || 'Chính hãng'}</span>
              <span className="font-mono text-slate-400">SKU: {selectedVariant.sku}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <Rating score={product.rating} reviewCount={product.reviewCount} />
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">Đã bán {product.soldCount}</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-emerald-600 font-semibold">Kho còn: {selectedVariant.stock}</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Giá bán niêm yết:</span>
              <Price
                amount={selectedVariant.price}
                compareAtAmount={selectedVariant.compareAtPrice}
                size="xl"
              />
            </div>
            <button
              onClick={() => onToggleCompare(product)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isCompared
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{isCompared ? 'Đang so sánh' : 'Thêm vào so sánh'}</span>
            </button>
          </div>

          {/* Variants Selector */}
          {product.variants.length > 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn Cấu Hình / Phiên Bản:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.image) setSelectedImage(v.image);
                      }}
                      className={`flex flex-col p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-900">{v.name}</span>
                      <span className="text-xs font-semibold text-red-600 mt-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4 pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Số lượng:</label>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-semibold text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Actions according to Availability State (Section 19 & 20) */}
          <div className="pt-2">
            {isOutOfStock ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <p className="text-xs text-amber-800 font-medium">
                  Phiên bản này hiện đang tạm hết hàng. Bạn có thể đăng ký nhận thông báo khi có hàng lại.
                </p>
                {notifySubscribed ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100 p-2.5 rounded-xl">
                    <Check className="w-4 h-4" />
                    <span>Đã đăng ký! Chúng tôi sẽ gửi thông báo ngay khi hàng về kho.</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setNotifySubscribed(true)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>Nhận thông báo khi có hàng (Notify me)</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onAddToCart(product, selectedVariant, quantity)}
                  className="flex-1 flex items-center justify-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Thêm Vào Giỏ Hàng</span>
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onBuyNow(product, selectedVariant, quantity)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20"
                >
                  <Zap className="w-5 h-5" />
                  <span>Mua Ngay (Thanh toán QR 24/7)</span>
                </Button>
              </div>
            )}
          </div>

          {/* Shop Card (Section 40) */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src={product.shop.logo}
                alt={product.shop.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900">{product.shop.name}</h4>
                  {product.shop.isOfficial && <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-50" />}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                  <span>Đánh giá: <strong>{product.shop.rating} ★</strong></span>
                  <span>•</span>
                  <span>Phản hồi: <strong>99%</strong></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openChatWithShop(
                    {
                      id: product.shop.id,
                      name: product.shop.name,
                      logo: product.shop.logo,
                      isOfficial: product.shop.isOfficial,
                      responseRate: (product.shop as any).responseRate || 99,
                    },
                    undefined,
                    {
                      name: product.name,
                      price: selectedVariant.price,
                      image: selectedImage,
                    }
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat với Shop</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                title="Tố cáo gian hàng hoặc sản phẩm vi phạm"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Báo cáo</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('shop', { shopId: product.shop.id || product.shop.slug || 'shop_gearvn' })}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                Xem Shop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Tech Specs Table */}
        <div className="lg:col-span-7">
          <TechSpecsTable specifications={product.specifications} />
        </div>

        {/* Right: Description & Policy */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Đặc Điểm Nổi Bật
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Delivery & Warranty guarantee */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs text-slate-600">
            <h4 className="font-bold text-sm text-slate-900">Chính Sách Bán Hàng</h4>
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Giao hàng hỏa tốc trong 2 giờ tại TP.HCM & Hà Nội, các tỉnh thành khác từ 1-2 ngày.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Đổi trả 1 đổi 1 trong 30 ngày đầu nếu phát hiện lỗi phần cứng từ nhà sản xuất.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>Hỗ trợ tra cứu tem bảo hành Serial / IMEI trực tuyến 24/7.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Q&A Section (Section 34, 35) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Đánh Giá & Nhận Xét Từ Khách Hàng</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chỉ những khách hàng đã mua và nhận hàng mới được để lại nhận xét</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-center">
              <span className="text-3xl font-black text-amber-500">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400 block">trên 5 sao</span>
            </div>
            <div className="border-l border-slate-200 pl-4 space-y-1">
              <Rating score={product.rating} size="md" />
              <span className="text-[11px] text-slate-500 block">Dựa trên {product.reviewCount} lượt đánh giá thực tế</span>
            </div>
          </div>
        </div>

        {/* Review form or Locked banner based on purchase eligibility */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
          {canReview ? (
            <form onSubmit={handleAddReview} className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bạn đã mua sản phẩm này - Hãy để lại đánh giá và nhận xét trải nghiệm</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đánh giá số sao:</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewRating(s)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star className={`w-5 h-5 ${s <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">({newRating}/5 sao)</span>
                </div>
              </div>
              <div>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Nhận xét của bạn về chất lượng máy/tài khoản, đóng gói, bảo hành..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <Button type="submit" isLoading={isSubmittingReview} size="sm" className="font-bold">
                Gửi Đánh Giá Xác Thực
              </Button>
            </form>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Chỉ có khách hàng đã mua sản phẩm mới được quyền đánh giá</span>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Để đảm bảo 100% tính khách quan và chống đánh giá ảo, hệ thống tự động khóa tính năng nhận xét đối với tài khoản chưa từng hoàn tất mua sản phẩm này.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {productReviews.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{r.buyerName}</span>
                  {r.isVerifiedPurchase && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ✓ Đã mua hàng từ {product.shop.name}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-[11px]">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <Rating score={r.rating} />
              <p className="text-slate-700 leading-relaxed">{r.comment}</p>
            </div>
          ))}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Lê Hoàng Nam</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                  ✓ Đã mua hàng từ {product.shop.name}
                </span>
              </div>
              <span className="text-slate-400 text-[11px]">3 ngày trước</span>
            </div>
            <Rating score={5} />
            <p className="text-slate-700 leading-relaxed">
              Máy nguyên seal, check số Serial trên trang bảo hành chính hãng chuẩn 100%. Màn hình OLED quá đẹp, tần số quét cao lướt mượt mà. Thanh toán quét mã QR 24/7 tiện lợi không cần gửi ảnh bill cho shop.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Nguyễn Quốc Huy</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                  ✓ Đã mua hàng từ {product.shop.name}
                </span>
              </div>
              <span className="text-slate-400 text-[11px]">1 tuần trước</span>
            </div>
            <Rating score={5} />
            <p className="text-slate-700 leading-relaxed">
              Giao hỏa tốc đúng 2 giờ đã nhận được tại Quận 1. Đóng thùng xốp chống sốc rất kỹ lưỡng, shipper nhiệt tình. Cấu hình chạy các tác vụ đồ họa và code cực kỳ nhanh.
            </p>
          </div>
        </div>
      </div>

      <ReportViolationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        shopId={product.shop.id}
        shopName={product.shop.name}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
};
