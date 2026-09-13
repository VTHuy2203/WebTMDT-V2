import React from 'react';
import type { Product } from '@marketplace/types';
import { Price, Rating, StatusBadge } from '@marketplace/ui';
import { Eye, Scale, ShoppingCart, CheckCircle2 } from 'lucide-react';

export interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleCompare?: (product: Product) => void;
  onViewShop?: (shopId: string) => void;
  isCompared?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  onToggleCompare,
  onViewShop,
  isCompared = false,
}) => {
  // Extract key specs for tech cards
  const specs = product.specifications || [];
  const cpu = specs.find((s) => s.key === 'cpu')?.value;
  const ram = specs.find((s) => s.key === 'ram')?.value;
  const gpu = specs.find((s) => s.key === 'gpu')?.value;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400/60 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Thumbnail & Quick Actions */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={product.thumbnail}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Availability Badge */}
        <div className="absolute top-3 left-3 z-10">
          <StatusBadge status={product.variants[0]?.availability || 'IN_STOCK'} />
        </div>

        {/* Quick action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(product);
              }}
              title="So sánh cấu hình"
              className={`p-2 rounded-xl backdrop-blur-md transition-colors shadow-sm ${
                isCompared
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/90 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            title="Xem chi tiết"
            className="p-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 p-4">
        {/* Shop & Brand */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2 gap-2">
          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] shrink-0">
            {product.brand?.name || 'Chính hãng'}
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewShop ? onViewShop(product.shop?.id || product.shop?.slug || '') : onSelect(product);
            }}
            className="flex items-center gap-1.5 text-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-2 py-1 rounded-full border border-slate-200/80 transition-all shrink-0 max-w-[170px] cursor-pointer"
            title={`Xem gian hàng ${product.shop?.name || 'Shop'}`}
          >
            <img
              src={product.shop?.logo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
              alt={product.shop?.name}
              className="w-4 h-4 rounded-full object-cover border border-slate-300 shrink-0"
            />
            <span className="truncate text-[11px] font-medium text-slate-800 hover:text-blue-700">{product.shop?.name || 'Shop'}</span>
            {product.shop?.isOfficial && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50 shrink-0" />}
          </div>
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onSelect(product)}
          className="font-bold text-sm text-slate-800 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer mb-2 min-h-[40px]"
        >
          {product.name}
        </h3>

        {/* Technical Highlights (Electronic Products) */}
        {(cpu || ram || gpu) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cpu && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium truncate max-w-[140px]">
                {cpu.split('(')[0]}
              </span>
            )}
            {ram && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                {ram.split(' ')[0]} RAM
              </span>
            )}
            {gpu && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium truncate max-w-[120px]">
                {gpu.split('(')[0]}
              </span>
            )}
          </div>
        )}

        {/* Rating & Sold */}
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <Rating score={product.rating} reviewCount={product.reviewCount} />
          <span className="text-xs text-slate-400">| Đã bán {product.soldCount}</span>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Price amount={product.basePrice} compareAtAmount={product.compareAtPrice} size="sm" />
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
              title="Thêm vào giỏ hàng"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
