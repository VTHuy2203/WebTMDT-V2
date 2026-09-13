import React from 'react';
import type { Product } from '@marketplace/types';
import { Button, Price } from '@marketplace/ui';
import { Scale, X, ArrowRight } from 'lucide-react';

export interface CompareDrawerProps {
  comparedProducts: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCompareNow: () => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  comparedProducts,
  onRemove,
  onClear,
  onCompareNow,
}) => {
  if (comparedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-700 py-3 px-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left count */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">So sánh sản phẩm ({comparedProducts.length}/4)</h4>
            <p className="text-xs text-slate-400">Chọn 2-4 sản phẩm để đối chiếu thông số phần cứng</p>
          </div>
        </div>

        {/* Selected Items preview */}
        <div className="flex items-center gap-3 overflow-x-auto max-w-full py-1">
          {comparedProducts.map((prod) => (
            <div
              key={prod.id}
              className="relative flex items-center gap-2 p-1.5 pr-3 bg-slate-800/80 border border-slate-700 rounded-xl min-w-[200px]"
            >
              <img src={prod.thumbnail} alt={prod.name} className="w-9 h-9 object-cover rounded-lg bg-white" />
              <div className="truncate flex-1">
                <p className="text-xs font-medium truncate">{prod.name}</p>
                <Price amount={prod.basePrice} size="sm" className="text-xs text-red-400" />
              </div>
              <button
                onClick={() => onRemove(prod.id)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Xóa tất cả
          </button>
          <Button
            size="sm"
            onClick={onCompareNow}
            disabled={comparedProducts.length < 2}
            className="flex items-center gap-1.5"
          >
            <span>So sánh ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
