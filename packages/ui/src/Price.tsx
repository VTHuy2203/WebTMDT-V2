import React from 'react';
import { formatCurrency, getDiscountPercentage, cn, useI18n } from '@marketplace/utils';

export interface PriceProps {
  amount: number;
  compareAtAmount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDiscountBadge?: boolean;
  className?: string;
}

export const Price: React.FC<PriceProps> = ({
  amount,
  compareAtAmount,
  size = 'md',
  showDiscountBadge = true,
  className,
}) => {
  // Subscribe to locale changes for instant currency conversion
  useI18n();
  const discount = compareAtAmount ? getDiscountPercentage(compareAtAmount, amount) : 0;


  const sizeStyles = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl lg:text-3xl font-extrabold',
  };

  return (
    <div className={cn('flex items-baseline flex-wrap gap-2', className)}>
      <span className={cn('text-red-600 tracking-tight', sizeStyles[size])}>
        {formatCurrency(amount)}
      </span>

      {compareAtAmount && compareAtAmount > amount && (
        <>
          <span className="text-xs lg:text-sm text-slate-400 line-through">
            {formatCurrency(compareAtAmount)}
          </span>
          {showDiscountBadge && discount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded">
              -{discount}%
            </span>
          )}
        </>
      )}
    </div>
  );
};
