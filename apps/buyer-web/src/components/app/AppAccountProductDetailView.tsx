import React, { useState } from 'react';
import type { AppAccountProduct, AppAccountPlan } from '@marketplace/types';
import { Price, FulfillmentTypeBadge, DynamicBuyerFields } from '@marketplace/ui';
import {
  ShieldCheck,
  Clock,
  Check,
  Star,
  Store,
  ChevronRight,
  Info,
  Sparkles,
  Monitor,
  Smartphone,
  Globe,
  Apple,
  CreditCard,
  Zap,
  Key,
  Users,
  MessageCircle,
} from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';

export interface AppAccountProductDetailViewProps {
  product: AppAccountProduct;
  onBack: () => void;
  onBuyNow: (plan: AppAccountPlan, buyerFieldValues: Record<string, string>) => void;
  onNavigate?: (view: string, params?: any) => void;
}

export const AppAccountProductDetailView: React.FC<AppAccountProductDetailViewProps> = ({
  product,
  onBack,
  onBuyNow,
  onNavigate,
}) => {
  const { openChatWithShop } = useChatStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    return product.selectedPlanId || product.plans?.[0]?.id || '';
  });

  const selectedPlan = product.plans?.find((p) => p.id === selectedPlanId) || product.plans?.[0];

  const [buyerFieldValues, setBuyerFieldValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, value: string) => {
    setBuyerFieldValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCheckoutClick = () => {
    if (!selectedPlan) return;

    // Validate required buyer fields
    const requiredFields = selectedPlan.requiredBuyerFields || selectedPlan.buyerFieldDefinitions || [];
    const newErrors: Record<string, string> = {};

    for (const field of requiredFields) {
      if (field.required) {
        const val = buyerFieldValues[field.key]?.trim();
        if (!val) {
          newErrors[field.key] = `Vui lòng nhập ${field.label.toLowerCase()}`;
        } else if (field.type === 'EMAIL' && !/^\S+@\S+\.\S+$/.test(val)) {
          newErrors[field.key] = 'Email không hợp lệ (Ví dụ: name@gmail.com)';
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onBuyNow(selectedPlan, buyerFieldValues);
  };

  const renderPlatformIcons = () => {
    const platforms = product.platforms || [];
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        {platforms.includes('WEB') && (
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
            <Globe className="w-3.5 h-3.5 text-blue-500" /> Web
          </span>
        )}
        {platforms.includes('WINDOWS') && (
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
            <Monitor className="w-3.5 h-3.5 text-blue-600" /> Windows
          </span>
        )}
        {(platforms.includes('MAC') || platforms.includes('MACOS')) && (
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
            <Apple className="w-3.5 h-3.5 text-slate-800" /> macOS / iOS
          </span>
        )}
        {platforms.includes('ANDROID') && (
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Android
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={onBack} className="hover:text-emerald-600 transition-colors">
          Trang chủ
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={onBack} className="hover:text-emerald-600 transition-colors">
          Tài khoản Ứng dụng & AI
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Info, Plans & Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-20 h-20 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm flex items-center justify-center flex-shrink-0">
                <img
                  src={product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {product.applicationName || 'Bản Quyền Chính Hãng'}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Chuyên mục: {product.appCategory || 'Phần mềm'}
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{product.rating || 5.0}</span>
                    <span className="text-slate-400 font-normal">({product.reviewCount || 0} đánh giá)</span>
                  </div>
                  <span>•</span>
                  <span>Đã bán: <strong className="text-slate-900">{product.soldCount || 0}</strong></span>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Cam kết bảo hành suốt thời hạn gói</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700">Nền tảng hỗ trợ:</span>
              {renderPlatformIcons()}
            </div>
          </div>

          {/* Plan Selector Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>1. Chọn gói cước & thời hạn sử dụng</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Lựa chọn gói dịch vụ phù hợp với nhu cầu và phương thức kích hoạt của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Đang chọn</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{plan.name}</h3>
                      <FulfillmentTypeBadge type={plan.fulfillmentType} />
                    </div>

                    {/* Features list */}
                    {plan.features && plan.features.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        {plan.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <Check className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Price & Duration */}
                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-black text-rose-600">
                          <Price amount={plan.price} />
                        </span>
                        {plan.originalPrice && (
                          <span className="text-xs text-slate-400 line-through ml-2">
                            <Price amount={plan.originalPrice} />
                          </span>
                        )}
                      </div>

                      {plan.serviceDuration && (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {plan.serviceDuration.value}{' '}
                          {plan.serviceDuration.unit === 'DAY' ? 'ngày' : plan.serviceDuration.unit === 'MONTH' ? 'tháng' : 'năm'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Buyer Fields Form */}
          {selectedPlan && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-600" />
                  <span>2. Thông tin nhận gói kích hoạt & Bàn giao</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedPlan.fulfillmentType === 'PRE_CREATED_ACCOUNT'
                    ? 'Gói tài khoản cấp sẵn bàn giao tự động tức thì ngay sau khi thanh toán VietQR.'
                    : selectedPlan.fulfillmentType === 'LICENSE_KEY'
                    ? 'Mã bản quyền và link tải sẽ được cấp tự động ngay khi thanh toán thành công.'
                    : selectedPlan.fulfillmentType === 'FAMILY_OR_TEAM_INVITATION'
                    ? 'Cung cấp email cá nhân để shop gửi link mời tham gia nhóm bản quyền.'
                    : 'Cung cấp thông tin tài khoản để người bán thực hiện nâng cấp gói chính chủ.'}
                </p>
              </div>

              {/* Context Banner based on Fulfillment Type */}
              {selectedPlan.fulfillmentType === 'PRE_CREATED_ACCOUNT' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Tài khoản cấp sẵn - Bàn giao tức thì tự động 24/7</span>
                  </div>
                  <p className="leading-relaxed">
                    Bạn <strong>không cần điền trước thông tin tài khoản</strong>. Sau khi hoàn tất chuyển khoản quét mã QR 24/7, hệ thống sẽ hiển thị ngay Email đăng nhập, Mật khẩu và Hướng dẫn sử dụng trong mục Đơn hàng của bạn.
                  </p>
                </div>
              )}

              {selectedPlan.fulfillmentType === 'LICENSE_KEY' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <Key className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Mã bản quyền chính hãng (License Key) - Cấp tự động</span>
                  </div>
                  <p className="leading-relaxed">
                    Chuỗi mã License Key kèm liên kết tải ứng dụng chính thức sẽ được bàn giao ngay lập tức sau khi thanh toán thành công.
                  </p>
                </div>
              )}

              {selectedPlan.fulfillmentType === 'BUYER_EMAIL_ACTIVATION' && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Nâng cấp trực tiếp trên tài khoản chính chủ</span>
                  </div>
                  <p className="leading-relaxed">
                    Vui lòng cung cấp địa chỉ Email hoặc tài khoản của bạn bên dưới để shop gửi link mời kích hoạt gói cước chính chủ. <strong>Lưu ý bảo mật: Sàn TechMarket và người bán không bao giờ yêu cầu mật khẩu hay mã OTP của bạn.</strong>
                  </p>
                </div>
              )}

              {selectedPlan.fulfillmentType === 'FAMILY_OR_TEAM_INVITATION' && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-purple-900">
                    <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>Gia nhập nhóm bản quyền Family / Team</span>
                  </div>
                  <p className="leading-relaxed">
                    Bạn chỉ cần cung cấp địa chỉ Email bên dưới. Shop sẽ gửi thư mời gia nhập nhóm gia đình/đội nhóm qua email trong vòng 15-30 phút.
                  </p>
                </div>
              )}

              {/* Render dynamic fields if any */}
              {(selectedPlan.requiredBuyerFields || selectedPlan.buyerFieldDefinitions || []).length > 0 ? (
                <DynamicBuyerFields
                  fields={selectedPlan.requiredBuyerFields || selectedPlan.buyerFieldDefinitions || []}
                  values={buyerFieldValues}
                  onChange={handleFieldChange}
                  errors={errors}
                />
              ) : selectedPlan.fulfillmentType === 'PRE_CREATED_ACCOUNT' || selectedPlan.fulfillmentType === 'LICENSE_KEY' ? null : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Gói cước này được bàn giao tức thì tự động sau khi thanh toán, không yêu cầu điền trước thông tin.</span>
                </div>
              )}
            </div>
          )}

          {/* Detailed Features & Guides */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
            <h2 className="text-lg font-black text-slate-900">Mô tả chi tiết & Tính năng sản phẩm</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {product.features && product.features.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Các quyền lợi nổi bật:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.setupGuide && product.setupGuide.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Quy trình giao hàng & Kích hoạt:</h3>
                <div className="space-y-2">
                  {product.setupGuide.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs text-slate-700 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Summary & Sticky CTA */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-lg">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
              Tổng kết thanh toán
            </h3>

            {selectedPlan && (
              <div className="space-y-3">
                <div className="flex justify-between items-start text-xs">
                  <span className="text-slate-500 font-medium">Gói đã chọn:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[180px]">{selectedPlan.name}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Thời hạn sử dụng:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPlan.serviceDuration?.value || 1}{' '}
                    {selectedPlan.serviceDuration?.unit === 'DAY' ? 'ngày' : selectedPlan.serviceDuration?.unit === 'MONTH' ? 'tháng' : 'năm'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Thời hạn bảo hành:</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedPlan.warrantyDuration?.value || 1}{' '}
                    {selectedPlan.warrantyDuration?.unit === 'DAY' ? 'ngày' : selectedPlan.warrantyDuration?.unit === 'MONTH' ? 'tháng' : 'năm'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-rose-600">
                    <Price amount={selectedPlan.price} />
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckoutClick}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <CreditCard className="w-4 h-4" />
              <span>Tiến hành thanh toán</span>
            </button>
          </div>

          {/* Seller Trust Card */}
          {product.shop && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={product.shop.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={product.shop.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate flex items-center gap-1">
                    <span>{product.shop.name}</span>
                    {product.shop.isOfficial && (
                      <span className="text-[9px] bg-blue-50 text-blue-700 px-1 rounded font-bold">Official</span>
                    )}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-700">{product.shop.rating}</span>
                    <span>• {(product.shop as any).productCount || 100}+ sản phẩm</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[10px] text-slate-400">Tỷ lệ phản hồi</p>
                  <p className="font-bold text-slate-800">{(product.shop as any).responseRate || 99}%</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[10px] text-slate-400">Người theo dõi</p>
                  <p className="font-bold text-slate-800">{((product.shop as any).followerCount || 1000).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    openChatWithShop(
                      {
                        id: product.shop?.id || 'shop_gearvn',
                        name: product.shop?.name || 'Shop Đối Tác',
                        logo: product.shop?.logo,
                        isOfficial: product.shop?.isOfficial,
                        responseRate: (product.shop as any)?.responseRate || 99,
                      },
                      undefined,
                      selectedPlan
                        ? {
                            name: `${product.name} - ${selectedPlan.name}`,
                            price: selectedPlan.price,
                            image: product.thumbnail,
                          }
                        : undefined
                    )
                  }
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat với Shop</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate?.('shop', { shopId: product.shop?.id || 'shop_gearvn' })}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Xem Shop
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
