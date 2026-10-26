'use client';

import dynamic from 'next/dynamic';

const SearchPage = dynamic(() => import('@/components/SearchPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">RailSplit</h1>
          </div>
          <p className="text-blue-200 text-sm sm:text-base mt-1">
            Find confirmed split-ticket options when direct seats are unavailable
          </p>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 animate-pulse">
          <div className="h-4 bg-stone-200 rounded w-1/4 mb-4" />
          <div className="h-10 bg-stone-100 rounded mb-3" />
          <div className="h-10 bg-stone-100 rounded" />
        </div>
      </main>
    </div>
  ),
});

export default function Page() {
  return <SearchPage />;
}
