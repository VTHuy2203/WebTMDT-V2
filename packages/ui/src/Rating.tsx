import React from 'react';
import { cn } from '@marketplace/utils';

export interface RatingProps {
  score: number; // 0 to 5
  reviewCount?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  score,
  reviewCount,
  size = 'sm',
  className,
}) => {
  const rounded = Math.round(score * 10) / 10;
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(starSize, star <= Math.round(score) ? 'fill-amber-400' : 'fill-slate-200')}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-700">{rounded.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-xs text-slate-400">({reviewCount})</span>
      )}
    </div>
  );
};
