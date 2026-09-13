import React, { useState, useEffect } from 'react';
import type { AppAccountProduct, ApplicationSummary } from '@marketplace/types';
import { appAccountApi } from '@marketplace/api-client';
import { AppAccountProductCard } from '../components/app/AppAccountProductCard';
import { AppAccountFilters, type AppAccountFilterValues } from '../components/app/AppAccountFilters';
import { Sparkles, ShieldCheck, Zap, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface AppAccountsLandingViewProps {
  onSelectProduct: (product: AppAccountProduct) => void;
  onViewShop?: (shopId: string) => void;
}

export const AppAccountsLandingView: React.FC<AppAccountsLandingViewProps> = ({ onSelectProduct, onViewShop }) => {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [products, setProducts] = useState<AppAccountProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterValues, setFilterValues] = useState<AppAccountFilterValues>({
    sortBy: 'NEWEST',
  });

  // Load app catalog
  useEffect(() => {
    appAccountApi.getApplications().then((apps) => {
      setApplications(apps);
    });
  }, []);

  // Load products based on filters
  useEffect(() => {
    setLoading(true);
    appAccountApi
      .searchAppAccounts({
        query: filterValues.query,
        applicationSlug: filterValues.applicationSlug,
        category: filterValues.category,
        platform: filterValues.platform,
        fulfillmentType: filterValues.fulfillmentType,
        inStockOnly: filterValues.inStockOnly,
        sortBy: filterValues.sortBy,
        page,
        pageSize: 12,
      })
      .then((res) => {
        setProducts(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filterValues, page]);

  const handleResetFilters = () => {
    setFilterValues({ sortBy: 'NEWEST' });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white py-12 md:py-16 px-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="max-w-7xl mx-auto relative z-10 space-y-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thị Trường Tài Khoản & Bản Quyền Số Chính Chủ</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Tài Khoản AI & Bản Quyền Phần Mềm{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Chính Hãng
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Google Gemini Advanced, Canva Pro, Microsoft 365, ChatGPT Plus, JetBrains... Nâng cấp trên Email cá nhân hoặc nhận tài khoản tức thì. Cam kết bảo hành 1 đổi 1 suốt thời hạn sử dụng.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bảo mật an toàn 100% (Không xin mật khẩu cá nhân)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Kích hoạt tự động qua mã QR 24/7</span>
              </div>
            </div>
          </div>

          {/* Quick Apps Highlight Pill Grid */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            {applications.slice(0, 6).map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  setFilterValues((prev) => ({
                    ...prev,
                    applicationSlug: prev.applicationSlug === app.slug ? undefined : app.slug,
                  }));
                  setPage(1);
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 backdrop-blur-md cursor-pointer ${
                  filterValues.applicationSlug === app.slug
                    ? 'bg-emerald-600/30 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs">
                  <img src={app.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'} alt={app.name} className="w-full h-full object-contain rounded-lg" />
                </div>
                <span className="text-[11px] font-bold text-slate-200 line-clamp-1">{app.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Filters Sidebar */}
          <div className="lg:col-span-3 lg:sticky lg:top-24">
            <AppAccountFilters
              applications={applications}
              values={filterValues}
              onChange={(newFilters) => {
                setFilterValues(newFilters);
                setPage(1);
              }}
              onReset={handleResetFilters}
            />
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-9 space-y-6">
            {/* Sort & Count Header */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="text-xs text-slate-500">
                Hiển thị <strong className="text-slate-900">{products.length}</strong> trên tổng số{' '}
                <strong className="text-slate-900">{total}</strong> sản phẩm ứng dụng
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp theo:
                </span>
                <select
                  value={filterValues.sortBy || 'NEWEST'}
                  onChange={(e) => setFilterValues({ ...filterValues, sortBy: e.target.value as any })}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="NEWEST">Mới nhất</option>
                  <option value="BEST_SELLER">Bán chạy nhất</option>
                  <option value="PRICE_ASC">Giá tăng dần</option>
                  <option value="PRICE_DESC">Giá giảm dần</option>
                  <option value="SELLER_RATING">Đánh giá người bán</option>
                </select>
              </div>
            </div>

            {/* Product Cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <AppAccountProductCard
                    key={product.id}
                    product={product}
                    onClick={() => onSelectProduct(product)}
                    onViewShop={onViewShop}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Không tìm thấy gói tài khoản phù hợp</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Hãy thử nới lỏng bộ lọc hoặc tìm kiếm theo từ khóa ứng dụng khác.
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Xóa toàn bộ bộ lọc
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 px-3">
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
