import React, { useState, useEffect } from 'react';
import type { ServiceDuration, DurationUnit } from '@marketplace/types';
import { Clock } from 'lucide-react';

export interface ServiceDurationInputProps {
  value: ServiceDuration;
  onChange: (value: ServiceDuration) => void;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const SERVICE_PRESETS = [1, 3, 6, 12, 24, 36];

export const ServiceDurationInput: React.FC<ServiceDurationInputProps> = ({
  value,
  onChange,
  label = 'Thời hạn gói dịch vụ',
  helperText = 'Thời gian sử dụng gói tài khoản hoặc bản quyền sau khi kích hoạt',
  error,
  disabled = false,
  className = '',
}) => {
  const [isCustom, setIsCustom] = useState<boolean>(() => {
    return !(value.unit === 'MONTH' && SERVICE_PRESETS.includes(value.value));
  });

  useEffect(() => {
    const isPreset = value.unit === 'MONTH' && SERVICE_PRESETS.includes(value.value);
    if (!isPreset) {
      setIsCustom(true);
    }
  }, [value.unit, value.value]);

  const handleSelectPreset = (months: number) => {
    setIsCustom(false);
    onChange({ value: months, unit: 'MONTH' });
  };

  const handleCustomChange = (num: number, unit: DurationUnit) => {
    onChange({ value: Math.max(1, num || 1), unit });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <Clock className="w-4 h-4 text-indigo-600" />
            {label}
          </label>
          <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {value.value} {value.unit === 'DAY' ? 'ngày' : value.unit === 'MONTH' ? 'tháng' : 'năm'}
          </span>
        </div>
      )}

      {/* Preset Chips */}
      <div className="flex flex-wrap gap-2">
        {SERVICE_PRESETS.map((months) => {
          const isSelected = !isCustom && value.unit === 'MONTH' && value.value === months;
          return (
            <button
              key={months}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(months)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {months} tháng
            </button>
          );
        })}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsCustom(true)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
            isCustom
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          Tùy chỉnh...
        </button>
      </div>

      {/* Custom Input controls */}
      {isCustom && (
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type="number"
              min={1}
              max={3650}
              disabled={disabled}
              value={value.value || ''}
              onChange={(e) => handleCustomChange(parseInt(e.target.value, 10) || 1, value.unit)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Nhập số..."
            />
          </div>
          <div className="w-36">
            <select
              disabled={disabled}
              value={value.unit}
              onChange={(e) => handleCustomChange(value.value, e.target.value as DurationUnit)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="DAY">Ngày</option>
              <option value="MONTH">Tháng</option>
              <option value="YEAR">Năm</option>
            </select>
          </div>
        </div>
      )}

      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
