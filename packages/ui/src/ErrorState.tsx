import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải được dữ liệu vào lúc này. Vui lòng thử lại sau.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-100 bg-red-50/40">
      <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="mt-1 text-sm text-slate-600 max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
          Thử lại
        </Button>
      )}
    </div>
  );
};
