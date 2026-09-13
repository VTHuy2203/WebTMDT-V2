import React from 'react';
import {
  Package,
  Gamepad2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Key,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export interface SellerListingHubViewProps {
  onSelectType: (type: 'product-new' | 'game-account-new' | 'app-account-new') => void;
}

export const SellerListingHubView: React.FC<SellerListingHubViewProps> = ({ onSelectType }) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trung tâm Đăng bán Đa ngành hàng</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Chọn Hình Thức Đăng Bán Phù Hợp
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Hệ thống sàn hỗ trợ 3 mô hình kinh doanh chuyên biệt: Hàng công nghệ vật lý giao nhận toàn quốc,
            Tài khoản Nick Game bảo mật mã hóa Vault, và Tài khoản Ứng dụng/AI đa gói cước linh hoạt.
          </p>
        </div>
      </div>

      {/* 3 Main Listing Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel 1: Physical Goods */}
        <div className="bg-white rounded-3xl border border-slate-200/80 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 p-6 flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block">
                Hàng vật lý
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                Sản phẩm Công nghệ & Phụ kiện
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đăng bán thiết bị phần cứng, Laptop, PC, Chuột, Bàn phím, Tai nghe... Quản lý theo phiên bản màu sắc,
                cấu hình, mã SKU tồn kho và tích hợp giao vận toàn quốc (GHTK, GHN, Viettel Post).
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Giao hàng bưu cục & Tracking mã vận đơn</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Quản lý bảo hành theo Serial / IMEI</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>Hỗ trợ đa phân loại (Variants & SKU)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectType('product-new')}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md cursor-pointer"
          >
            <span>Đăng sản phẩm công nghệ</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Channel 2: Game Account */}
        <div className="bg-white rounded-3xl border border-slate-200/80 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 p-6 flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 inline-block">
                Digital Nick Game
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                Tài khoản Game (Nick Game)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đăng bán tài khoản game LMHT, Valorant, Genshin Impact, Steam, Tốc Chiến...
                Mỗi tài khoản là duy nhất (1-1), lưu trữ trong kho bảo mật mã hóa Vault và tự động bàn giao
                thông tin đăng nhập cho người mua ngay khi thanh toán SePay thành công.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Bàn giao tài khoản tự động tức thì (Instant Vault)</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span>Kho mật khẩu mã hóa an toàn tuyệt đối</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Cơ chế khiếu nại bảo hiểm tài khoản</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectType('game-account-new')}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md cursor-pointer"
          >
            <span>Đăng bán Nick Game</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Channel 3: App & AI Account */}
        <div className="bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 p-6 flex flex-col justify-between space-y-6 group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 inline-block">
                Digital Subscription & AI
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Tài khoản Ứng dụng & AI
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đăng bán tài khoản phần mềm bản quyền: Gemini Advanced, Canva Pro, Microsoft 365, ChatGPT Plus, Spotify...
                Hỗ trợ thiết lập đa gói cước (1 tháng, 6 tháng, 1 năm), tách biệt thời hạn sử dụng và bảo hành,
                kích hoạt email chính chủ hoặc cấp license key.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Cấu hình đa gói cước (Multi-Plan Builder)</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <span>5 hình thức: Email, Family, Vault, Key, Manual</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>Tách bạch thời hạn dùng & cam kết bảo hành</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectType('app-account-new')}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md cursor-pointer"
          >
            <span>Đăng bán Ứng dụng & AI</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
