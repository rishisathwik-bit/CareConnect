import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 5, count, size = 'sm', interactive = false, onSelect }) {
  const stars = [1, 2, 3, 4, 5];
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((star) => {
          const filled = star <= Math.round(rating);
          return (
            <button
              type="button"
              key={star}
              disabled={!interactive}
              onClick={() => interactive && onSelect && onSelect(star)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'}`}
            >
              <Star
                className={`${sizeClass} ${
                  filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                }`}
              />
            </button>
          );
        })}
      </div>
      {rating !== undefined && (
        <span className="text-xs font-semibold text-slate-700 ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-slate-400 font-normal">
          ({count})
        </span>
      )}
    </div>
  );
}
