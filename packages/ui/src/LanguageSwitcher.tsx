import React, { useState } from 'react';
import { useI18n, EXCHANGE_RATE_VND_TO_USD } from '@marketplace/utils';
import { Globe, Check, ChevronDown } from 'lucide-react';

export interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'dropdown' | 'compact';
  showRateBadge?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'pill',
  showRateBadge = true,
}) => {
  const { locale, currency, setLocale, toggleLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
          locale === 'en'
            ? 'bg-blue-50/90 text-blue-700 border-blue-200 hover:bg-blue-100'
            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
        } ${className}`}
        title={`Đổi sang ${locale === 'vi' ? 'English (USD)' : 'Tiếng Việt (VNĐ)'} • Tỉ giá: 1$ = 26.250đ`}
      >
        <span>{locale === 'vi' ? '🇻🇳' : '🇺🇸'}</span>
        <span className="font-extrabold">{locale === 'vi' ? 'VNĐ' : 'USD ($)'}</span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <div className="inline-flex p-0.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => setLocale('vi')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              locale === 'vi'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🇻🇳</span>
            <span>VNĐ</span>
          </button>
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              locale === 'en'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🇺🇸</span>
            <span>USD ($)</span>
          </button>
        </div>

        {showRateBadge && (
          <div
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80"
            title="Tỉ giá quy đổi cố định toàn sàn"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>1$ = 26.250đ</span>
          </div>
        )}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
      >
        <Globe className="w-3.5 h-3.5 text-slate-400" />
        <span>{locale === 'vi' ? '🇻🇳 Tiếng Việt (VNĐ)' : '🇺🇸 English ($ USD)'}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-1.5 text-xs animate-in fade-in-50 zoom-in-95">
            <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
              Ngôn ngữ & Tiền tệ (1$ = 26.250đ)
            </div>
            <div className="space-y-0.5 mt-1">
              <button
                type="button"
                onClick={() => {
                  setLocale('vi');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-colors ${
                  locale === 'vi'
                    ? 'bg-purple-50 text-purple-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇻🇳</span>
                  <div>
                    <span className="block font-bold">Tiếng Việt</span>
                    <span className="text-[10px] text-slate-400">Đơn vị: VNĐ (₫)</span>
                  </div>
                </div>
                {locale === 'vi' && <Check className="w-3.5 h-3.5 text-purple-600" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocale('en');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-colors ${
                  locale === 'en'
                    ? 'bg-blue-50 text-blue-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇺🇸</span>
                  <div>
                    <span className="block font-bold">English</span>
                    <span className="text-[10px] text-slate-400">Currency: USD ($)</span>
                  </div>
                </div>
                {locale === 'en' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
