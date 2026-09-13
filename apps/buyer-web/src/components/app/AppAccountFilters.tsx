import React from 'react';
import type {
  ApplicationSummary,
  ApplicationCategory,
  ApplicationPlatform,
  AppAccountFulfillmentType,
} from '@marketplace/types';
import { Search, RotateCcw, Filter, Check } from 'lucide-react';

export interface AppAccountFilterValues {
  query?: string;
  applicationSlug?: string;
  category?: ApplicationCategory;
  platform?: ApplicationPlatform;
  fulfillmentType?: AppAccountFulfillmentType;
  inStockOnly?: boolean;
  sortBy?: 'RELEVANCE' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'BEST_SELLER' | 'SELLER_RATING';
}

export interface AppAccountFiltersProps {
  applications: ApplicationSummary[];
  values: AppAccountFilterValues;
  onChange: (values: AppAccountFilterValues) => void;
  onReset: () => void;
}

const CATEGORIES: Array<{ key: ApplicationCategory; label: string }> = [
  { key: 'AI', label: 'Trí tuệ nhân tạo (AI)' },
  { key: 'DESIGN', label: 'Thiết kế đồ họa' },
  { key: 'OFFICE', label: 'Văn phòng & Lưu trữ' },
  { key: 'DEV_TOOLS', label: 'Công cụ lập trình' },
  { key: 'ENTERTAINMENT', label: 'Giải trí & Âm nhạc' },
];

const FULFILLMENTS: Array<{ key: AppAccountFulfillmentType; label: string }> = [
  { key: 'BUYER_EMAIL_ACTIVATION', label: 'Kích hoạt Email chính chủ' },
  { key: 'FAMILY_OR_TEAM_INVITATION', label: 'Mời Family / Team' },
  { key: 'PRE_CREATED_ACCOUNT', label: 'Tài khoản cấp sẵn' },
  { key: 'LICENSE_KEY', label: 'Key bản quyền / Redeem' },
];

export const AppAccountFilters: React.FC<AppAccountFiltersProps> = ({
  applications,
  values,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Bộ lọc nâng cao</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-medium transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Search query */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700">Tìm kiếm từ khóa</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Gemini, Canva, Microsoft 365..."
            value={values.query || ''}
            onChange={(e) => onChange({ ...values, query: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700">Danh mục ứng dụng</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onChange({ ...values, category: undefined })}
            className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all ${
              !values.category
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tất cả
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => onChange({ ...values, category: values.category === cat.key ? undefined : cat.key })}
              className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all ${
                values.category === cat.key
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Specific App Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700">Ứng dụng phần mềm</label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onChange({ ...values, applicationSlug: undefined })}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
              !values.applicationSlug
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>Tất cả ứng dụng</span>
            {!values.applicationSlug && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
          {applications.map((app) => {
            const isSelected = values.applicationSlug === app.slug;
            return (
              <button
                key={app.id}
                onClick={() => onChange({ ...values, applicationSlug: isSelected ? undefined : app.slug })}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{app.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fulfillment Type */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700">Hình thức kích hoạt</label>
        <div className="space-y-1">
          {FULFILLMENTS.map((f) => {
            const isChecked = values.fulfillmentType === f.key;
            return (
              <label
                key={f.key}
                className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none py-1 hover:text-emerald-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onChange({ ...values, fulfillmentType: isChecked ? undefined : f.key })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>{f.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* In Stock Toggle */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Chỉ hiện còn slot / sẵn hàng</span>
        <input
          type="checkbox"
          checked={!!values.inStockOnly}
          onChange={(e) => onChange({ ...values, inStockOnly: e.target.checked })}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
        />
      </div>
    </div>
  );
};
