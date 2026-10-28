'use client';

import dynamic from 'next/dynamic';

const SearchPage = dynamic(() => import('@/components/SearchPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0b1329] text-white">
      <header className="border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f95738] flex items-center justify-center shadow-sm shadow-orange-500/30">
              <span className="text-white font-bold text-xs">RS</span>
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white">
              Rail <span className="font-medium text-slate-300">Split</span>
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
        <div className="space-y-4 max-w-xl animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-12 bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
      </main>
    </div>
  ),
});

export default function Page() {
  return <SearchPage />;
}
