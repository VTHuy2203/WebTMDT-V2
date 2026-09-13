import React from 'react';
import type { BuyerFieldDefinition } from '@marketplace/types';
import { ShieldAlert, AlertCircle, Info } from 'lucide-react';

export interface DynamicBuyerFieldsProps {
  fields: BuyerFieldDefinition[];
  values: Record<string, string>;
  onChange: (fieldKey: string, value: string) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

export const DynamicBuyerFields: React.FC<DynamicBuyerFieldsProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
  className = '',
}) => {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Security Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold tracking-wide uppercase text-amber-950">Lưu ý an toàn tuyệt đối</p>
          <p className="text-amber-800 leading-relaxed">
            Hệ thống & Người bán <strong>KHÔNG BAO GIỜ</strong> yêu cầu mật khẩu email của bạn, mã OTP ngân hàng hoặc thông tin thẻ thanh toán.
            Chỉ cung cấp địa chỉ email/tên tài khoản để nhận lời mời kích hoạt.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field) => {
          const val = values[field.key] || '';
          const error = errors[field.key];

          return (
            <div key={field.key} className="space-y-1">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>
                  {field.label}
                  {field.required && <span className="text-rose-500 ml-1">*</span>}
                </span>
              </label>

              {field.type === 'SELECT' && field.options && field.options.length > 0 ? (
                <select
                  disabled={disabled}
                  value={val}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    error ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                  }`}
                >
                  <option value="">-- Chọn {field.label.toLowerCase()} --</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'EMAIL' ? 'email' : 'text'}
                  disabled={disabled}
                  placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                  value={val}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    error ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                  }`}
                />
              )}

              {field.helpText && !error && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400" />
                  <span>{field.helpText}</span>
                </p>
              )}

              {error && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
