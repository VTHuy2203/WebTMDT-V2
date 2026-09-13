import React from 'react';
import type { GameAccountProduct } from '@marketplace/types';
import { GamePlatformBadge, StatusBadge } from '@marketplace/ui';
import { formatCurrency } from '@marketplace/utils';
import { Zap, ShieldCheck, Store, Star, ArrowRight, ShoppingCart } from 'lucide-react';

export interface GameAccountProductCardProps {
  product: GameAccountProduct;
  onSelect: (product: GameAccountProduct) => void;
  onAddToCart?: (product: GameAccountProduct) => void;
  onViewShop?: (shopId: string) => void;
}

export const GameAccountProductCard: React.FC<GameAccountProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  onViewShop,
}) => {
  const isOutOfStock = product.availableStock <= 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer relative"
    >
      {/* Thumbnail with overlay badges */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
          <GamePlatformBadge platform={product.platform} />
          {product.deliveryMode === 'AUTO_AFTER_PAYMENT' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
              <Zap className="w-2.5 h-2.5 fill-current" />
              <span>Giao tự động</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500 text-white shadow-xs">
              <span>Giao {product.deliveryEstimateMinutes || 15}p</span>
            </span>
          )}
        </div>

        {/* Bottom Thumbnail Info: Game Name & Server */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white/90">
          <span className="font-semibold truncate">{product.game?.name || product.gameName || 'Tài khoản game'}</span>
          <span className="shrink-0 px-1.5 py-0.5 rounded bg-black/60 text-[10px] backdrop-blur-xs font-mono">
            {product.server}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Key Dynamic Attributes Preview */}
          <div className="grid grid-cols-2 gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
            {product.publicAttributes?.rank && (
              <div>
                <span className="text-slate-400">Rank: </span>
                <span className="font-bold text-slate-800 capitalize">
                  {String(product.publicAttributes.rank).replace('-', ' ')}
                </span>
              </div>
            )}
            {product.publicAttributes?.champions_count !== undefined && (
              <div>
                <span className="text-slate-400">Tướng: </span>
                <span className="font-bold text-slate-800">{String(product.publicAttributes.champions_count)}</span>
              </div>
            )}
            {product.publicAttributes?.skins_count !== undefined && (
              <div>
                <span className="text-slate-400">Skin: </span>
                <span className="font-bold text-purple-700">{String(product.publicAttributes.skins_count)}</span>
              </div>
            )}
            {product.publicAttributes?.five_star_chars !== undefined && (
              <div>
                <span className="text-slate-400">5★ Chars: </span>
                <span className="font-bold text-amber-600">{String(product.publicAttributes.five_star_chars)}</span>
              </div>
            )}
            {product.publicAttributes?.vandal_skins && (
              <div className="col-span-2 truncate">
                <span className="text-slate-400">Skin: </span>
                <span className="font-semibold text-slate-800">{String(product.publicAttributes.vandal_skins)}</span>
              </div>
            )}
            {product.warrantyHours > 0 && (
              <div className="col-span-2 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Bảo hành {product.warrantyHours} giờ</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Stock Status */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-red-600">
                {formatCurrency(product.basePrice)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-semibold ${
                isOutOfStock ? 'text-slate-400' : product.availableStock <= 2 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {isOutOfStock ? 'Hết hàng' : `Còn ${product.availableStock} acc`}
            </span>
          </div>

          {/* Shop & Action Footer */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onViewShop ? onViewShop(product.shop?.id || product.shop?.slug || '') : onSelect(product);
              }}
              className="flex items-center gap-1.5 text-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-2 py-0.5 rounded-full border border-slate-200/80 text-[11px] truncate max-w-[65%] cursor-pointer transition-all"
              title={`Xem gian hàng ${product.shop?.name || 'Shop'}`}
            >
              <img
                src={product.shop?.logo || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=60'}
                alt={product.shop?.name}
                className="w-4 h-4 rounded-full object-cover border border-slate-300 shrink-0"
              />
              <span className="truncate font-medium">{product.shop?.name || 'Shop'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {onAddToCart && !isOutOfStock && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Thêm vào giỏ"
                  aria-label="Thêm vào giỏ"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>Chi tiết</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
