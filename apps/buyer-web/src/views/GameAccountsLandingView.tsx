import React, { useState, useEffect } from 'react';
import type { GameAccountProduct, GameSummary, GameAccountSearchParams } from '@marketplace/types';
import { gameAccountApi } from '@marketplace/api-client';
import { GameAccountProductCard } from '../components/game/GameAccountProductCard';
import { GameAccountFilters } from '../components/game/GameAccountFilters';
import { RiskNotice, EmptyState, Button } from '@marketplace/ui';
import {
  Gamepad2,
  Sparkles,
  Zap,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';

export interface GameAccountsLandingViewProps {
  onSelectProduct: (product: GameAccountProduct) => void;
  onAddToCart?: (product: GameAccountProduct) => void;
  onViewShop?: (shopId: string) => void;
}

export const GameAccountsLandingView: React.FC<GameAccountsLandingViewProps> = ({
  onSelectProduct,
  onAddToCart,
  onViewShop,
}) => {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGameSlug, setSelectedGameSlug] = useState<string | undefined>(undefined);
  const [products, setProducts] = useState<GameAccountProduct[]>([]);
  const [filters, setFilters] = useState<GameAccountSearchParams>({
    sortBy: 'NEWEST',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Load games catalog on mount
  useEffect(() => {
    async function loadGames() {
      try {
        const list = await gameAccountApi.getGames();
        setGames(list);
      } catch (err) {
        console.error('Failed to load game catalog:', err);
      }
    }
    loadGames();
  }, []);

  // Search/filter game accounts
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const res = await gameAccountApi.searchGameAccounts({
          ...filters,
          gameSlug: selectedGameSlug,
          query: searchQuery.trim() || undefined,
        });
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to load game accounts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [selectedGameSlug, filters, searchQuery]);

  const handleResetFilters = () => {
    setSelectedGameSlug(undefined);
    setSearchQuery('');
    setFilters({ sortBy: 'NEWEST' });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Gaming Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-10 text-white shadow-xl border border-indigo-900/50">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Sàn Giao Dịch Tài Khoản Game An Toàn Số 1</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Mua Bán Tài Khoản Game <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400">Tự Động & Đảm Bảo</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Nhận ngay tài khoản sau khi chuyển khoản quét mã QR 24/7. Bảo vệ người mua với chính sách kiểm tra 72 giờ và hỗ trợ hoàn tiền 100% nếu sai mô tả.
          </p>

          {/* Quick Value Props */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-semibold">Giao ngay 24/7</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-200">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-semibold">Bảo hành back acc</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-200">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="font-semibold">Shop uy tín 100%</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Featured Games Quick Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Gamepad2 className="w-4 h-4 text-blue-600" />
            <span>Danh Mục Game Phổ Biến</span>
          </h2>
          {selectedGameSlug && (
            <button
              onClick={() => setSelectedGameSlug(undefined)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Xem tất cả
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGameSlug(selectedGameSlug === game.slug ? undefined : game.slug)}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                selectedGameSlug === game.slug
                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-100'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <img
                src={game.logoUrl}
                alt={game.name}
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-slate-900 truncate">{game.name}</h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  {game.platforms.join(', ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tướng, skin nổi bật, rank (ví dụ: Raz Muay Thái, Kuronami, AR 58)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Sort selector & Mobile filter toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Bộ lọc</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 w-full sm:w-auto">
            <span className="shrink-0 hidden sm:inline">Sắp xếp:</span>
            <select
              value={filters.sortBy || 'NEWEST'}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="NEWEST">Mới đăng nhất</option>
              <option value="PRICE_ASC">Giá tăng dần</option>
              <option value="PRICE_DESC">Giá giảm dần</option>
              <option value="BEST_SELLER">Bán chạy nhất</option>
              <option value="SELLER_RATING">Đánh giá shop cao</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid with Sidebar Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Sidebar */}
        <div className={`lg:col-span-3 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
          <GameAccountFilters
            games={games}
            selectedGameSlug={selectedGameSlug}
            onSelectGame={setSelectedGameSlug}
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Listings Grid */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Tìm thấy <strong className="text-slate-900 font-bold">{products.length}</strong> tài khoản game phù hợp
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-72 bg-slate-200/70 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="Không tìm thấy tài khoản game phù hợp"
              description="Hãy thử nới lỏng bộ lọc khoảng giá, chọn tựa game khác hoặc bỏ tiêu chí lọc."
              actionText="Xóa tất cả bộ lọc"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <GameAccountProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                  onViewShop={onViewShop}
                />
              ))}
            </div>
          )}

          {/* Safety & Risk Notice at bottom */}
          <RiskNotice />
        </div>
      </div>
    </div>
  );
};
