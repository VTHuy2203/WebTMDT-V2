import React, { useEffect, useState } from 'react';
import type { Product, Category, Brand, TechFilterDefinition } from '@marketplace/types';
import { productApi } from '@marketplace/api-client';
import { ProductCard } from '../components/ProductCard';
import { Button, EmptyState } from '@marketplace/ui';
import {
  Laptop,
  SlidersHorizontal,
  ArrowUpDown,
  ShieldCheck,
  Cpu,
  RotateCcw,
  Search,
  Check,
  X,
  Filter,
} from 'lucide-react';

export interface TechProductsLandingViewProps {
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleCompare?: (product: Product) => void;
  comparedIds?: string[];
  initialCategory?: string;
  onViewShop?: (shopId: string) => void;
}

export const TechProductsLandingView: React.FC<TechProductsLandingViewProps> = ({
  onSelectProduct,
  onAddToCart,
  onToggleCompare,
  comparedIds = [],
  initialCategory = '',
  onViewShop,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [techFilters, setTechFilters] = useState<TechFilterDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [selectedTechSpecs, setSelectedTechSpecs] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<any>('RELEVANCE');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load Categories and Brands
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, brs] = await Promise.all([
          productApi.getCategories(),
          productApi.getBrands(),
        ]);
        setCategories(cats);
        setBrands(brs);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Load tech filters when category changes
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

  // Execute Search for Hardware Products Only
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const res = await productApi.search({
          query: query.trim() || undefined,
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          sortBy,
          techSpecs: selectedTechSpecs,
        });
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to load tech products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
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

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (priceRange.min || priceRange.max ? 1 : 0) +
    Object.keys(selectedTechSpecs).length;

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold backdrop-blur-md">
            <Laptop className="w-3.5 h-3.5" />
            <span>Phần Cứng & Đồ Công Nghệ Chính Hãng</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Sản Phẩm Công Nghệ{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              Chính Hãng 100%
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Laptop Gaming, MacBook, Flagship điện thoại, Màn hình đồ họa cao cấp. Tất cả thiết bị đều có số Serial/IMEI kích hoạt bảo hành điện tử chính hãng và chính sách đổi trả minh bạch.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-blue-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bảo hành Serial/IMEI chính hãng</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-300">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Đổi trả trong 7 ngày nếu có lỗi NSX</span>
            </div>
          </div>
        </div>

        {/* Search Bar inside Page */}
        <div className="mt-6 max-w-xl relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên máy, chip i7/Ryzen, RAM, VGA RTX 4060..."
              className="w-full pl-10 pr-24 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-sm text-white focus:text-slate-900 rounded-2xl border border-white/20 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 text-xs text-slate-400 hover:text-slate-200"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100 px-3 py-2 rounded-xl"
          >
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Bộ lọc phần cứng {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{products.length} sản phẩm</span>
          </div>
        </div>

        {/* Sidebar Filter for Desktop & Mobile */}
        <aside
          className={`${
            showMobileFilters ? 'block' : 'hidden'
          } lg:block bg-white rounded-2xl border border-slate-200 p-5 space-y-6 lg:sticky lg:top-24 shadow-xs`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">Bộ Lọc Phần Cứng</h2>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Xóa tất cả ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* 1. Categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh Mục</h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Tất cả danh mục
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Brands */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thương Hiệu</h3>
            <div className="flex flex-wrap gap-1.5">
              {brands.map((br) => {
                const isSelected = selectedBrand === br.slug;
                return (
                  <button
                    key={br.id}
                    onClick={() => setSelectedBrand(isSelected ? '' : br.slug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {br.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Price Range */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Khoảng Giá (VNĐ)</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Dưới 15 triệu', min: 0, max: 15000000 },
                { label: 'Từ 15 – 30 triệu', min: 15000000, max: 30000000 },
                { label: 'Từ 30 – 50 triệu', min: 30000000, max: 50000000 },
                { label: 'Trên 50 triệu', min: 50000000, max: undefined },
              ].map((p, idx) => {
                const isSelected = priceRange.min === p.min && priceRange.max === p.max;
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setPriceRange(isSelected ? {} : { min: p.min, max: p.max })
                    }
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Dynamic Technical Specs */}
          {techFilters.map((tf) => (
            <div key={tf.key} className="space-y-2 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{tf.label}</h3>
              <div className="flex flex-wrap gap-1.5">
                {tf.options.map((opt) => {
                  const isChecked = selectedTechSpecs[tf.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleTechFilterToggle(tf.key, opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                        isChecked
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Products Grid Area (3 cols on desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header Bar: Count & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">
                {selectedCategory
                  ? categories.find((c) => c.slug === selectedCategory)?.name || 'Sản phẩm công nghệ'
                  : 'Tất cả sản phẩm công nghệ'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {products.length} sản phẩm
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
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

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 bg-slate-200/70 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="Không tìm thấy sản phẩm công nghệ phù hợp"
              description="Hãy thử bỏ bớt tiêu chí lọc về thương hiệu, khoảng giá hoặc cấu hình chip/RAM để tìm kiếm."
              actionText="Xóa tất cả bộ lọc"
              onAction={handleClearAllFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                  onToggleCompare={onToggleCompare}
                  isCompared={comparedIds.includes(p.id)}
                  onViewShop={onViewShop}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
