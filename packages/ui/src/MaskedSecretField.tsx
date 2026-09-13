import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

export interface MaskedSecretFieldProps {
  label?: string;
  value: string;
  isSecret?: boolean;
  defaultMasked?: boolean;
  compact?: boolean;
  hideLabel?: boolean;
  className?: string;
  onCopySuccess?: () => void;
}

export const MaskedSecretField: React.FC<MaskedSecretFieldProps> = ({
  label = 'Mật khẩu',
  value,
  isSecret = true,
  defaultMasked = true,
  compact = false,
  hideLabel = false,
  className = '',
  onCopySuccess,
}) => {
  const [isRevealed, setIsRevealed] = useState(!defaultMasked);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (onCopySuccess) onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const isMasked = isSecret && !isRevealed;
  const displayValue = isMasked ? '••••••••••' : value;

  // Compact inline mode (ideal for table rows & tight spaces)
  if (compact) {
    return (
      <div
        className={`inline-flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 text-xs font-mono transition-colors ${className}`}
      >
        <span
          className={`font-bold text-slate-800 select-all ${
            isMasked
              ? 'tracking-widest whitespace-nowrap select-none text-[11px]'
              : 'whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]'
          }`}
          aria-live="polite"
        >
          {displayValue}
        </span>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isSecret && (
            <button
              type="button"
              onClick={() => setIsRevealed(!isRevealed)}
              className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
              title={isRevealed ? 'Ẩn thông tin' : 'Hiện thông tin'}
              aria-label={isRevealed ? 'Ẩn' : 'Hiện'}
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`p-1 rounded-lg hover:bg-white transition-colors cursor-pointer ${
              copied ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-indigo-600'
            }`}
            title={copied ? 'Đã sao chép' : 'Sao chép'}
            aria-label="Sao chép"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // Standard block / card mode
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 gap-2 text-xs ${className}`}
    >
      <div className="flex flex-col min-w-0 flex-1 pr-2">
        {!hideLabel && label && (
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            {label}
          </span>
        )}
        <span
          className={`font-mono text-slate-900 font-bold select-all text-[13px] mt-0.5 ${
            isMasked ? 'tracking-widest whitespace-nowrap select-none' : 'break-all'
          }`}
          aria-live="polite"
        >
          {displayValue}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        {isSecret && (
          <button
            type="button"
            onClick={() => setIsRevealed(!isRevealed)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title={isRevealed ? 'Ẩn thông tin' : 'Hiện thông tin'}
            aria-label={isRevealed ? `Ẩn ${label}` : `Hiện ${label}`}
          >
            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
          }`}
          aria-label={`Sao chép ${label}`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã sao chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
