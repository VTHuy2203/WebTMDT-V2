import React from 'react';
import type { AppAccountProduct } from '@marketplace/types';
import { Price } from '@marketplace/ui';
import { FulfillmentTypeBadge } from '@marketplace/ui';
import { Star, ShieldCheck, Clock, Check, Monitor, Smartphone, Globe, Apple } from 'lucide-react';

export interface AppAccountProductCardProps {
  product: AppAccountProduct;
  onClick: () => void;
  onViewShop?: (shopId: string) => void;
}

export const AppAccountProductCard: React.FC<AppAccountProductCardProps> = ({ product, onClick, onViewShop }) => {
  const plans = product.plans || [];
  const primaryPlan = plans[0];
  const lowestPrice = plans.length ? Math.min(...plans.map((p) => p.price)) : product.basePrice || 0;
  const planWithLowest = plans.find((p) => p.price === lowestPrice) || primaryPlan;

  const renderPlatformIcons = () => {
    const platforms = product.platforms || [];
    return (
      <div className="flex items-center gap-1 text-slate-400">
        {platforms.includes('WEB') && <span title="Web browser"><Globe className="w-3.5 h-3.5" /></span>}
        {platforms.includes('WINDOWS') && <span title="Windows PC"><Monitor className="w-3.5 h-3.5" /></span>}
        {(platforms.includes('MAC') || platforms.includes('MACOS')) && <span title="macOS / iOS"><Apple className="w-3.5 h-3.5" /></span>}
        {platforms.includes('ANDROID') && <span title="Android"><Smartphone className="w-3.5 h-3.5" /></span>}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Top Banner & App Icon Header */}
      <div className="relative p-4 pb-2 flex items-start justify-between gap-3 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xs flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'}
              alt={product.name}
              className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {product.applicationName || 'App Bản Quyền'}
            </span>
            <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors mt-0.5">
              {product.name}
            </h3>
          </div>
        </div>

        {product.discountPercent ? (
          <span className="px-2 py-0.5 text-xs font-black bg-rose-500 text-white rounded-lg shadow-xs">
            -{product.discountPercent}%
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-4 pt-2 flex-1 flex flex-col justify-between space-y-3">
        {/* Description snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Plan / Fulfillment Tag */}
        {planWithLowest && (
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Hình thức nhận:</span>
              <FulfillmentTypeBadge type={planWithLowest.fulfillmentType} />
            </div>

            {/* Duration & Warranty Badges */}
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
              {planWithLowest.serviceDuration && (
                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  Gói {planWithLowest.serviceDuration.value} {planWithLowest.serviceDuration.unit === 'DAY' ? 'ngày' : planWithLowest.serviceDuration.unit === 'MONTH' ? 'tháng' : 'năm'}
                </span>
              )}
              {planWithLowest.warrantyDuration && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  BH {planWithLowest.warrantyDuration.value} {planWithLowest.warrantyDuration.unit === 'DAY' ? 'ngày' : planWithLowest.warrantyDuration.unit === 'MONTH' ? 'tháng' : 'năm'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pricing & Shop Footer */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Từ</span>
                <span className="text-base font-extrabold text-rose-600">
                  <Price amount={lowestPrice} />
                </span>
              </div>
              {product.originalPrice && (
                <span className="text-[11px] text-slate-400 line-through">
                  <Price amount={product.originalPrice} />
                </span>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              {renderPlatformIcons()}
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-700">{product.rating || 5.0}</span>
                <span>({product.soldCount || 0} đã bán)</span>
              </div>
            </div>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewShop ? onViewShop(product.shop?.id || 'shop_gearvn') : onClick();
            }}
            className="flex items-center gap-1.5 text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 px-2 py-0.5 rounded-full border border-slate-200/80 text-[11px] truncate max-w-[70%] cursor-pointer transition-all"
            title={`Xem gian hàng ${product.shop?.name || 'Shop'}`}
          >
            <img
              src={product.shop?.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=60'}
              alt={product.shop?.name || 'Shop'}
              className="w-4 h-4 rounded-full object-cover border border-slate-300 shrink-0"
            />
            <span className="truncate font-medium">{product.shop?.name || 'Sàn AI & Bản Quyền'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
