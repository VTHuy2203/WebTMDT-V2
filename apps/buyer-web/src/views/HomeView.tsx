import React, { useEffect, useState } from 'react';
import type { Product, Category, AppAccountProduct, GameAccountProduct } from '@marketplace/types';
import { productApi, appAccountApi, gameAccountApi } from '@marketplace/api-client';
import { ProductCard } from '../components/ProductCard';
import { AppAccountProductCard } from '../components/app/AppAccountProductCard';
import { GameAccountProductCard } from '../components/game/GameAccountProductCard';
import { Button } from '@marketplace/ui';
import {
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Flame,
  Sparkles,
  CheckCircle2,
  Gamepad2,
  Layers,
  Sparkle,
  Package,
} from 'lucide-react';

export interface HomeViewProps {
  onSelectProduct: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleCompare: (product: Product) => void;
  comparedIds: string[];
  onNavigateSearch: (categorySlug?: string) => void;
  onNavigateView?: (view: string) => void;
  onViewShop?: (shopId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectProduct,
  onAddToCart,
  onToggleCompare,
  comparedIds,
  onNavigateSearch,
  onNavigateView,
  onViewShop,
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredAppAccounts, setFeaturedAppAccounts] = useState<AppAccountProduct[]>([]);
  const [featuredGameAccounts, setFeaturedGameAccounts] = useState<GameAccountProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prods, cats, apps, games] = await Promise.all([
          productApi.getFeatured(),
          productApi.getCategories(),
          appAccountApi.getFeaturedAppAccounts(),
          gameAccountApi.getFeaturedGameAccounts(),
        ]);
        setFeaturedProducts(prods);
        setCategories(cats);
        setFeaturedAppAccounts(apps);
        setFeaturedGameAccounts(games);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner Section: Balanced multi-industry marketplace presentation */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-12 shadow-2xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold backdrop-blur-md">
              <Package className="w-3.5 h-3.5" />
              <span>Đồ Công Nghệ</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold backdrop-blur-md">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Nick Game VIP</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tài Khoản AI & App</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Sàn Thương Mại Điện Tử <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">Công Nghệ & Kỹ Thuật Số</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Mua sắm Laptop, Flagship chính hãng bảo hành Serial/IMEI, Nick Game bàn giao tự động tức thì qua kho Vault,
            và tài khoản Gemini Advanced, ChatGPT Plus, Canva Pro kích hoạt chính chủ 100%.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => (onNavigateView ? onNavigateView('app-accounts') : onNavigateSearch())}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer font-bold"
            >
              <Sparkles className="w-4 h-4" />
              <span>Khám phá Tài Khoản AI</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => (onNavigateView ? onNavigateView('game-accounts') : onNavigateSearch())}
              className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-400/40 text-purple-200 backdrop-blur-md cursor-pointer font-bold"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Tài Khoản Game</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigateSearch()}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md cursor-pointer"
            >
              Đồ Công Nghệ
            </Button>
          </div>
        </div>

        {/* Decorative ambient light */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-90">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80"
            alt="AI App Marketplace"
            className="w-[380px] rounded-2xl shadow-2xl border border-white/10 rotate-1 hover:rotate-0 transition-transform duration-500"
          />
        </div>
      </section>

      {/* SECTION 1: PROMINENT AI & APP ACCOUNTS (Gemini, ChatGPT, Canva Pro...) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Tài Khoản Ứng Dụng & Trí Tuệ Nhân Tạo (AI) Bản Quyền
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                MỚI
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Google Gemini Advanced 2TB, ChatGPT Plus, Canva Pro, Microsoft 365, Spotify... Kích hoạt email chính chủ, bảo hành 1 đổi 1.
            </p>
          </div>

          <button
            onClick={() => (onNavigateView ? onNavigateView('app-accounts') : onNavigateSearch())}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            <span>Xem tất cả App / AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-slate-200/70 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : featuredAppAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Chưa có tài khoản ứng dụng nào được đăng bán.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredAppAccounts.map((app) => (
              <AppAccountProductCard
                key={app.id}
                product={app}
                onClick={() => onSelectProduct(app)}
                onViewShop={onViewShop}
              />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: FEATURED GAME ACCOUNTS (Instant Vault Delivery) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Kho Tài Khoản Game VIP (Bàn Giao Tự Động)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-xs">
                HOT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nick LMHT, Valorant, Genshin Impact, Steam... Lưu trữ kho Vault mã hóa, bàn giao tức thì ngay sau thanh toán qua QR 24/7.
            </p>
          </div>

          <button
            onClick={() => (onNavigateView ? onNavigateView('game-accounts') : onNavigateSearch())}
            className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors cursor-pointer"
          >
            <span>Xem tất cả Nick Game</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-slate-200/70 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : featuredGameAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Chưa có tài khoản game nào được đăng bán.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGameAccounts.map((game) => (
              <GameAccountProductCard
                key={game.id}
                product={game}
                onSelect={(p) => onSelectProduct(p)}
                onAddToCart={(p) => onAddToCart(p)}
                onViewShop={onViewShop}
              />
            ))}
          </div>
        )}
      </section>

      {/* Category Icons Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Danh Mục Công Nghệ Nổi Bật</h2>
          <button
            onClick={() => onNavigateSearch()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Chưa có danh mục sản phẩm.
          </div>
        ) : <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigateSearch(cat.slug)}
              className="group flex flex-col items-center p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-slate-800 group-hover:text-white flex items-center justify-center text-3xl transition-colors mb-3 shadow-inner">
                {cat.icon || '📦'}
              </div>
              <h3 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cat.description}</p>
            </div>
          ))}
        </div>}
      </section>

      {/* Flash Sale Banner with Countdown */}
      {featuredProducts.length > 0 && <section className="p-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Flame className="w-8 h-8 text-amber-200 fill-amber-200 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black uppercase tracking-wider">FLASH SALE</span>
                <span className="px-2 py-0.5 rounded bg-white text-red-600 text-xs font-extrabold">HÔM NAY</span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">Giảm đến 5.000.000 ₫ cho các dòng Laptop Gaming & Flagship</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-rose-100">Kết thúc trong:</span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
              <span className="px-2.5 py-1.5 bg-slate-900/80 rounded-xl">03</span>:
              <span className="px-2.5 py-1.5 bg-slate-900/80 rounded-xl">45</span>:
              <span className="px-2.5 py-1.5 bg-slate-900/80 rounded-xl">19</span>
            </div>
          </div>
        </div>
      </section>}

      {/* SECTION 3: PHYSICAL TECH HARDWARE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sản Phẩm Công Nghệ Chính Hãng</h2>
          </div>
          <button
            onClick={() => onNavigateSearch()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Xem thêm <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-slate-200/70 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Chưa có sản phẩm công nghệ nào được đăng bán.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                onToggleCompare={onToggleCompare}
                isCompared={comparedIds.includes(prod.id)}
                onViewShop={onViewShop}
              />
            ))}
          </div>
        )}
      </section>

      {/* Official Verified Shops */}
      {featuredProducts.length > 0 && <section className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Gian Hàng Ủy Quyền Chính Hãng</span>
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Cam kết sản phẩm mới 100% nguyên seal, xuất hóa đơn VAT điện tử</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onViewShop && onViewShop('shop_gearvn')}
            className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100" alt="GEARVN" className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">GEARVN Official Store</h4>
              <p className="text-xs text-slate-500">Đại lý số 1 Laptop Gaming Asus, Acer, MSI</p>
              <span className="text-[11px] font-semibold text-emerald-600">Đánh giá 4.9 ★ (28.4k theo dõi)</span>
            </div>
          </div>
          <div
            onClick={() => onViewShop && onViewShop('shop_phongvu')}
            className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100" alt="Phong Vũ" className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">Phong Vũ Tech Mart</h4>
              <p className="text-xs text-slate-500">Màn hình, linh kiện máy tính, tai nghe</p>
              <span className="text-[11px] font-semibold text-emerald-600">Đánh giá 4.8 ★ (45.2k theo dõi)</span>
            </div>
          </div>
          <div
            onClick={() => onViewShop && onViewShop('shop_apple')}
            className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <img src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100" alt="Apple" className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform" />
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">Apple Premium Reseller</h4>
              <p className="text-xs text-slate-500">MacBook, iPhone VN/A bảo hành 1 đổi 1</p>
              <span className="text-[11px] font-semibold text-emerald-600">Đánh giá 5.0 ★ (89.0k theo dõi)</span>
            </div>
          </div>
        </div>
      </section>}
    </div>
  );
};
