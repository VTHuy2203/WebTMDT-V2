import React from 'react';
import type { ShopGroupedCart } from '@marketplace/types';
import { Price, Button, EmptyState } from '@marketplace/ui';
import { formatCurrency, useI18n } from '@marketplace/utils';
import { Trash2, Store, ArrowRight, ShieldCheck } from 'lucide-react';

export interface CartViewProps {
  groupedCart: ShopGroupedCart[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onToggleSelect: (cartItemId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onProceedCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  groupedCart,
  onUpdateQuantity,
  onRemoveItem,
  onToggleSelect,
  onSelectAll,
  onProceedCheckout,
  onContinueShopping,
}) => {
  const { locale, t } = useI18n();
  const allItems = groupedCart.flatMap((g) => g.items);
  const selectedItems = allItems.filter((i) => i.selected);
  const isAllSelected = allItems.length > 0 && selectedItems.length === allItems.length;

  const totalSelectedPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);


  if (allItems.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="Giỏ hàng của bạn đang trống"
          description="Hãy khám phá các siêu phẩm laptop gaming, smartphone và phụ kiện công nghệ để thêm vào giỏ hàng."
          actionText="Bắt đầu mua sắm"
          onAction={onContinueShopping}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Giỏ Hàng Công Nghệ ({allItems.length} sản phẩm)
        </h1>
        <button
          onClick={onContinueShopping}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Tiếp tục chọn hàng
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Grouped by Shop Cart Items (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Select all header */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
            <label className="flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Chọn tất cả ({allItems.length} sản phẩm)</span>
            </label>
            <span className="text-xs text-slate-400">Đã chọn: {selectedItems.length}</span>
          </div>

          {/* Grouped by Shop (Section 21) */}
          {groupedCart.map((group) => (
            <div
              key={group.shopId}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
            >
              {/* Shop Header */}
              <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                <Store className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs text-slate-800">{group.shopName}</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">
                  Chính hãng
                </span>
              </div>

              {/* Items in this Shop */}
              <div className="divide-y divide-slate-100 p-4 space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 first:pt-0">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                      />
                      <img
                        src={item.thumbnail}
                        alt={item.productName}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.productName}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {item.variantName}
                          </span>
                          {(item.productId.startsWith('ga_') || item.productSlug.includes('acc-') || item.productSlug.includes('game')) && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-100">
                              Sản phẩm số — không vận chuyển
                            </span>
                          )}
                        </div>
                        <Price amount={item.price} size="sm" />
                      </div>
                    </div>

                    {/* Quantity & Delete */}
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pl-7 sm:pl-0">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-l-xl font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-semibold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-r-xl font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-xs text-slate-900 sm:w-28 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Checkout Summary (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 lg:sticky lg:top-24">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
            {locale === 'en' ? 'Order Summary' : 'Tóm Tắt Đơn Hàng'}
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{locale === 'en' ? `Subtotal (${selectedItems.length} items):` : `Tạm tính (${selectedItems.length} món):`}</span>
              <span className="font-semibold text-slate-900">{formatCurrency(totalSelectedPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{locale === 'en' ? 'Est. Shipping:' : 'Phí vận chuyển dự kiến:'}</span>
              <span className="font-semibold text-slate-900">{selectedItems.length > 0 ? formatCurrency(50000) : formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>{locale === 'en' ? 'TechPlatform Discount:' : 'Ưu đãi sàn TechMarket:'}</span>
              <span className="font-semibold">{totalSelectedPrice > 30000000 ? `-${formatCurrency(500000)}` : formatCurrency(0)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-800">{locale === 'en' ? 'Total Payment:' : 'Tổng thanh toán:'}</span>
            <span className="text-xl font-extrabold text-red-600">
              {formatCurrency(
                Math.max(
                  0,
                  totalSelectedPrice +
                    (selectedItems.length > 0 ? 50000 : 0) -
                    (totalSelectedPrice > 30000000 ? 500000 : 0)
                )
              )}
            </span>
          </div>

          <Button
            size="lg"
            onClick={onProceedCheckout}
            disabled={selectedItems.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm"
          >
            <span>{locale === 'en' ? 'Proceed to Checkout' : 'Tiến Hành Đặt Hàng'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Thanh toán mã hóa bảo mật chuẩn VietQR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
