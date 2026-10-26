import React from 'react';

export function BrandLogo({
  className = '',
  textColor = 'text-white',
}: {
  className?: string;
  textColor?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#f95738] flex items-center justify-center shadow-sm shadow-orange-500/30">
        <svg
          className="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        >
          <line x1="4" y1="8" x2="20" y2="8" />
          <line x1="4" y1="16" x2="20" y2="16" />
        </svg>
      </div>
      <span className={`text-base sm:text-lg font-black tracking-tight ${textColor}`}>
        Rail <span className="font-medium text-slate-300">Split</span>
      </span>
    </div>
  );
}
