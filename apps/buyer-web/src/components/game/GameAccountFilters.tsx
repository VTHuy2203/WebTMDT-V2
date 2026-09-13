import React from 'react';
import type { GameSummary, GamePlatform, GameAccountSearchParams } from '@marketplace/types';
import { Filter, RotateCcw, Zap, ShieldCheck, Mail } from 'lucide-react';

export interface GameAccountFiltersProps {
  games: GameSummary[];
  selectedGameSlug?: string;
  onSelectGame: (slug?: string) => void;
  filters: GameAccountSearchParams;
  onFilterChange: (newFilters: GameAccountSearchParams) => void;
  onReset: () => void;
}

export const GameAccountFilters: React.FC<GameAccountFiltersProps> = ({
  games,
  selectedGameSlug,
  onSelectGame,
  filters,
  onFilterChange,
  onReset,
}) => {
  const platforms: { key: GamePlatform; label: string }[] = [
    { key: 'MOBILE', label: 'Di Động (Mobile)' },
    { key: 'PC', label: 'PC / Máy Tính' },
    { key: 'PLAYSTATION', label: 'PlayStation' },
    { key: 'CROSS_PLATFORM', label: 'Đa Nền Tảng' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-6 shadow-xs text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Bộ Lọc Tài Khoản</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Game Selector */}
      <div className="space-y-2">
        <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Tựa Game</h4>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectGame(undefined)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              !selectedGameSlug
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất cả game ({games.length})
          </button>
          {games.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectGame(g.slug)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                selectedGameSlug === g.slug
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{g.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform Filter */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Nền Tảng</h4>
        <div className="space-y-1">
          {platforms.map((plat) => (
            <label key={plat.key} className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="radio"
                name="platform"
                checked={filters.platform === plat.key}
                onChange={() =>
                  onFilterChange({
                    ...filters,
                    platform: filters.platform === plat.key ? undefined : plat.key,
                  })
                }
                className="rounded text-blue-600"
              />
              <span className="text-slate-700 text-xs">{plat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Khoảng Giá (VND)</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Từ ₫"
            value={filters.minPrice || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Đến ₫"
            value={filters.maxPrice || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Special Feature Checkboxes */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Tiêu Chí Đặc Biệt</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.deliveryMode === 'AUTO_AFTER_PAYMENT'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  deliveryMode: e.target.checked ? 'AUTO_AFTER_PAYMENT' : undefined,
                })
              }
              className="rounded text-blue-600"
            />
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Giao tự động tức thì</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.hasWarranty}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  hasWarranty: e.target.checked ? true : undefined,
                })
              }
              className="rounded text-blue-600"
            />
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Có bảo hành cam kết</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.canChangeEmail}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  canChangeEmail: e.target.checked ? true : undefined,
                })
              }
              className="rounded text-blue-600"
            />
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Mail className="w-3.5 h-3.5 text-purple-600" />
              <span>Hỗ trợ đổi email</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.inStockOnly}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  inStockOnly: e.target.checked ? true : undefined,
                })
              }
              className="rounded text-blue-600"
            />
            <span className="text-slate-700 font-medium">Chỉ hiện tài khoản còn hàng</span>
          </label>
        </div>
      </div>
    </div>
  );
};
