import React, { useState } from 'react';
import type { Product } from '@marketplace/types';
import { Price, Rating, Button, EmptyState } from '@marketplace/ui';
import { Trash2, ShoppingCart, Check, X, Sparkles } from 'lucide-react';

export interface CompareViewProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onAddToCart: (product: Product) => void;
  onBackToSearch: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  products,
  onRemove,
  onClear,
  onAddToCart,
  onBackToSearch,
}) => {
  const [highlightDiff, setHighlightDiff] = useState(true);

  if (products.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="Chưa có sản phẩm nào trong danh sách so sánh"
          description="Vui lòng bấm vào biểu tượng cân (Scale) trên sản phẩm ở trang tìm kiếm hoặc trang chi tiết để thêm vào bảng so sánh."
          actionText="Tìm kiếm sản phẩm ngay"
          onAction={onBackToSearch}
        />
      </div>
    );
  }

  // Common spec keys to compare
  const compareKeys = [
    { key: 'cpu', label: 'Bộ vi xử lý (CPU)' },
    { key: 'gpu', label: 'Card đồ họa (GPU)' },
    { key: 'ram', label: 'Bộ nhớ RAM' },
    { key: 'storage', label: 'Ổ cứng / Lưu trữ' },
    { key: 'screen_size', label: 'Màn hình' },
    { key: 'refresh_rate', label: 'Tần số quét' },
    { key: 'battery', label: 'Dung lượng Pin' },
    { key: 'weight', label: 'Trọng lượng' },
  ];

  const getSpecValue = (product: Product, key: string): string => {
    const spec = product.specifications.find((s) => s.key === key);
    return spec?.value || '—';
  };

  const isDifferent = (key: string): boolean => {
    if (products.length < 2) return false;
    const firstVal = getSpecValue(products[0], key);
    return products.some((p) => getSpecValue(p, key) !== firstVal);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            So Sánh Cấu Hình Phần Cứng ({products.length} sản phẩm)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Đối chiếu trực quan thông số kỹ thuật, màn hình, hiệu năng và giá bán.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={highlightDiff}
              onChange={(e) => setHighlightDiff(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Làm nổi bật điểm khác biệt
            </span>
          </label>
          <button
            onClick={onClear}
            className="text-xs text-red-600 hover:text-red-700 font-semibold"
          >
            Xóa tất cả
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table with Sticky Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          {/* Sticky Product Cards Header */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="p-4 w-48 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-20">
                Sản phẩm
              </th>
              {products.map((prod) => (
                <th key={prod.id} className="p-4 w-72 align-top z-10">
                  <div className="flex flex-col space-y-3">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white border border-slate-200">
                      <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => onRemove(prod.id)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-900/60 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Xóa khỏi so sánh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-blue-600">{prod.brand?.name}</span>
                      <h3 className="font-bold text-sm text-slate-800 line-clamp-2 mt-0.5">{prod.name}</h3>
                      <Price amount={prod.basePrice} compareAtAmount={prod.compareAtPrice} size="sm" className="mt-1" />
                    </div>

                    <Button
                      size="sm"
                      onClick={() => onAddToCart(prod)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Thêm giỏ hàng</span>
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Matrix Rows */}
          <tbody className="divide-y divide-slate-100 text-xs">
            {/* Rating */}
            <tr>
              <td className="p-4 font-bold text-slate-700 bg-slate-50 sticky left-0">Đánh giá</td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  <Rating score={p.rating} reviewCount={p.reviewCount} />
                </td>
              ))}
            </tr>

            {/* Shop */}
            <tr>
              <td className="p-4 font-bold text-slate-700 bg-slate-50 sticky left-0">Gian hàng bán lẻ</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 font-semibold text-slate-800">
                  {p.shop.name}
                </td>
              ))}
            </tr>

            {/* Warranty */}
            <tr>
              <td className="p-4 font-bold text-slate-700 bg-slate-50 sticky left-0">Thời gian bảo hành</td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-slate-800 font-medium">
                  {p.warranty?.durationMonths ? `${p.warranty.durationMonths} Tháng chính hãng` : 'Theo chính sách shop'}
                </td>
              ))}
            </tr>

            {/* Hardware Specifications */}
            {compareKeys.map((item) => {
              const diff = highlightDiff && isDifferent(item.key);
              return (
                <tr key={item.key} className={diff ? 'bg-amber-50/50' : ''}>
                  <td className={`p-4 font-bold text-slate-700 sticky left-0 ${diff ? 'bg-amber-100/50 text-amber-900' : 'bg-slate-50'}`}>
                    {item.label}
                  </td>
                  {products.map((p) => {
                    const val = getSpecValue(p, item.key);
                    return (
                      <td key={p.id} className={`p-4 font-medium text-slate-800 ${diff ? 'font-bold text-blue-900' : ''}`}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
