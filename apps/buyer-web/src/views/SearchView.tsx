import React, { useEffect, useState } from 'react';
import type {
  Product,
  Category,
  Brand,
  TechFilterDefinition,
  AppAccountProduct,
  GameAccountProduct,
} from '@marketplace/types';
import { productApi, appAccountApi, gameAccountApi } from '@marketplace/api-client';
import { ProductCard } from '../components/ProductCard';
import { AppAccountProductCard } from '../components/app/AppAccountProductCard';
import { GameAccountProductCard } from '../components/game/GameAccountProductCard';
import { Button, EmptyState } from '@marketplace/ui';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Bot,
  Gamepad2,
  Laptop,
  Layers,
  Sparkles,
} from 'lucide-react';

export type SearchDomainTab = 'ALL' | 'APP' | 'GAME' | 'HARDWARE';

export interface SearchViewProps {
  initialQuery?: string;
  initialCategory?: string;
  onSelectProduct: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleCompare: (product: Product) => void;
  comparedIds: string[];
  onViewShop?: (shopId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery = '',
  initialCategory = '',
  onSelectProduct,
  onAddToCart,
  onToggleCompare,
  comparedIds,
  onViewShop,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [appAccounts, setAppAccounts] = useState<AppAccountProduct[]>([]);
  const [gameAccounts, setGameAccounts] = useState<GameAccountProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [techFilters, setTechFilters] = useState<TechFilterDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Domain tab
  const [activeTab, setActiveTab] = useState<SearchDomainTab>('ALL');

  // Filters State
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [selectedTechSpecs, setSelectedTechSpecs] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<any>('RELEVANCE');

  // Keep query in sync when props update
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
    if (initialCategory) {
      setActiveTab('HARDWARE');
    }
  }, [initialCategory]);

  // Load static filter definitions
  useEffect(() => {
    async function loadMeta() {
      const [cats, brs] = await Promise.all([
        productApi.getCategories(),
        productApi.getBrands(),
      ]);
      setCategories(cats);
      setBrands(brs);
    }
    loadMeta();
  }, []);

  // Load Tech Filters when category changes
  useEffect(() => {
    async function loadTechFilters() {
      if (selectedCategory) {
        const filters = await productApi.getTechFilters(selectedCategory);
        setTechFilters(filters);
      } else {
        setTechFilters([]);
      }
    }
    loadTechFilters();
  }, [selectedCategory]);

  // Execute Universal Multi-Domain Search
  useEffect(() => {
    async function runSearch() {
      setIsLoading(true);
      try {
        const [prodRes, appRes, gameRes] = await Promise.all([
          productApi.search({
            query,
            category: selectedCategory || undefined,
            brand: selectedBrand || undefined,
            minPrice: priceRange.min,
            maxPrice: priceRange.max,
            sortBy,
            techSpecs: selectedTechSpecs,
          }),
          appAccountApi.searchAppAccounts({ query }),
          gameAccountApi.searchGameAccounts({ query }),
        ]);
        setProducts(prodRes.data);
        setAppAccounts(appRes.data);
        setGameAccounts(gameRes.data);
      } catch (err) {
        console.error('Universal Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    runSearch();
  }, [query, selectedCategory, selectedBrand, priceRange, selectedTechSpecs, sortBy]);

  const handleTechFilterToggle = (key: string, value: string) => {
    setSelectedTechSpecs((prev) => {
      const next = { ...prev };
      if (next[key] === value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange({});
    setSelectedTechSpecs({});
    setQuery('');
  };

  const activeHardwareFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (priceRange.min || priceRange.max ? 1 : 0) +
    Object.keys(selectedTechSpecs).length;

  const totalResultsCount = products.length + appAccounts.length + gameAccounts.length;

  return (
    <div className="space-y-6 pb-20">
      {/* Title & Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">
              {query ? `Kết quả tìm kiếm cho "${query}"` : 'Tất Cả Sản Phẩm & Dịch Vụ'}
            </h1>
            {totalResultsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {totalResultsCount} kết quả
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống tìm kiếm thông minh kết hợp Phần cứng công nghệ, Tài khoản Ứng dụng & AI và Kho Nick Game.
          </p>
        </div>

        {/* Sort Select for Hardware */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <span>Sắp xếp:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="RELEVANCE">Liên quan nhất</option>
            <option value="NEWEST">Mới nhất</option>
            <option value="PRICE_ASC">Giá tăng dần</option>
            <option value="PRICE_DESC">Giá giảm dần</option>
            <option value="BEST_SELLER">Bán chạy nhất</option>
            <option value="RATING">Đánh giá cao nhất</option>
          </select>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tất cả</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'ALL' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {totalResultsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('APP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'APP'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-500" />
          <span>Ứng Dụng & AI</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'APP' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {appAccounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('GAME')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'GAME'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-indigo-500" />
          <span>Tài Khoản Game</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'GAME' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {gameAccounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HARDWARE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'HARDWARE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Laptop className="w-4 h-4 text-blue-500" />
          <span>Sản Phẩm Công Nghệ</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'HARDWARE' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'
            }`}
          >
            {products.length}
          </span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 bg-slate-200/70 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : totalResultsCount === 0 ? (
        <EmptyState
          title={`Không tìm thấy kết quả phù hợp cho "${query}"`}
          description="Hãy thử kiểm tra lại chính tả hoặc tìm các từ khóa phổ biến như Gemini, ChatGPT, Canva, Valorant, MacBook, Laptop..."
          actionText="Xóa bộ lọc & Xem tất cả"
          onAction={handleClearAllFilters}
        />
      ) : (
        /* Content Display based on Tab */
        <div className="space-y-10">
          {/* 1. APP ACCOUNTS & AI SECTION */}
          {(activeTab === 'ALL' || activeTab === 'APP') && appAccounts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Tài Khoản Ứng Dụng & Trí Tuệ Nhân Tạo (AI)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {appAccounts.length} sản phẩm
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {appAccounts.map((app) => (
                  <AppAccountProductCard
                    key={app.id}
                    product={app}
                    onClick={() => onSelectProduct(app)}
                    onViewShop={onViewShop}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 2. GAME ACCOUNTS SECTION */}
          {(activeTab === 'ALL' || activeTab === 'GAME') && gameAccounts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Kho Tài Khoản Game VIP (Bàn Giao Tự Động)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                    {gameAccounts.length} nick game
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {gameAccounts.map((game) => (
                  <GameAccountProductCard
                    key={game.id}
                    product={game}
                    onSelect={onSelectProduct}
                    onAddToCart={onAddToCart}
                    onViewShop={onViewShop}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 3. HARDWARE PRODUCTS SECTION (With Hardware Filters) */}
          {(activeTab === 'ALL' || activeTab === 'HARDWARE') && (
            <section className="space-y-4">
              {activeTab === 'ALL' && (
                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Sản Phẩm Công Nghệ & Phần Cứng
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {products.length} sản phẩm
                    </span>
                  </div>
                </div>
              )}

              {products.length === 0 && activeTab === 'HARDWARE' ? (
                <EmptyState
                  title="Không tìm thấy sản phẩm phần cứng phù hợp"
                  description="Hãy thử bỏ bớt tiêu chí lọc về CPU, RAM hoặc nới rộng khoảng giá để tìm được sản phẩm."
                  actionText="Xóa tất cả bộ lọc phần cứng"
                  onAction={handleClearAllFilters}
                />
              ) : products.length === 0 ? null : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                  {/* Sidebar Filters for Hardware */}
                  <aside className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 lg:sticky lg:top-24">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-sm text-slate-900">Bộ Lọc Phần Cứng</h3>
                      </div>
                      {activeHardwareFiltersCount > 0 && (
                        <button
                          onClick={handleClearAllFilters}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold"
                        >
                          Xóa tất cả ({activeHardwareFiltersCount})
                        </button>
                      )}
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh Mục</h4>
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedCategory('')}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            !selectedCategory ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Tất cả danh mục
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.slug)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              selectedCategory === cat.slug
                                ? 'bg-blue-50 text-blue-600 font-bold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brands */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thương Hiệu</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {brands.map((brand) => {
                          const isSelected = selectedBrand === brand.slug;
                          return (
                            <button
                              key={brand.id}
                              onClick={() => setSelectedBrand(isSelected ? '' : brand.slug)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {brand.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Khoảng Giá (VNĐ)</h4>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Dưới 15 triệu', min: 0, max: 15000000 },
                          { label: 'Từ 15 - 30 triệu', min: 15000000, max: 30000000 },
                          { label: 'Từ 30 - 45 triệu', min: 30000000, max: 45000000 },
                          { label: 'Trên 45 triệu', min: 45000000, max: undefined },
                        ].map((range, idx) => {
                          const isSelected = priceRange.min === range.min && priceRange.max === range.max;
                          return (
                            <button
                              key={idx}
                              onClick={() => setPriceRange(isSelected ? {} : { min: range.min, max: range.max })}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-600 font-bold'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {range.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dynamic Technical Specs Filter */}
                    {techFilters.map((tf) => (
                      <div key={tf.key} className="space-y-2 pt-3 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{tf.label}</h4>
                        <div className="space-y-1">
                          {tf.options.map((opt) => {
                            const isChecked = selectedTechSpecs[tf.key] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleTechFilterToggle(tf.key, opt.value)}
                                className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                  isChecked
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                      isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                  <span>{opt.label}</span>
                                </div>
                                {opt.count !== undefined && (
                                  <span className="text-[11px] text-slate-400">({opt.count})</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </aside>

                  {/* Hardware Products Grid */}
                  <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((prod) => (
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
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
