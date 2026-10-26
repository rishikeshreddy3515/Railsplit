'use client';

import React from 'react';
import { Station, TravelClass, TRAVEL_CLASS_LABELS } from '@/lib/types';

interface HeroSearchProps {
  stations: Station[];
  fromCode: string;
  toCode: string;
  date: string;
  travelClass: TravelClass;
  onFromChange: (code: string) => void;
  onToChange: (code: string) => void;
  onDateChange: (date: string) => void;
  onClassChange: (c: TravelClass) => void;
  onSwapStations: () => void;
  onSearch: (e: React.FormEvent) => void;
  loading: boolean;
  minDate: string;
  includeSplits: boolean;
  onIncludeSplitsChange: (checked: boolean) => void;
  minChangeTime: string;
  onMinChangeTimeChange: (time: string) => void;
}

export function HeroSearch({
  stations,
  fromCode,
  toCode,
  date,
  travelClass,
  onFromChange,
  onToChange,
  onDateChange,
  onClassChange,
  onSwapStations,
  onSearch,
  loading,
  minDate,
  includeSplits,
  onIncludeSplitsChange,
  minChangeTime,
  onMinChangeTimeChange,
}: HeroSearchProps) {
  // Format quick date pills
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const thisWeekend = new Date(today);
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  thisWeekend.setDate(today.getDate() + daysUntilSaturday);
  const weekendStr = thisWeekend.toISOString().split('T')[0];

  const nextFriday = new Date(today);
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  nextFriday.setDate(today.getDate() + daysUntilFriday);
  const fridayStr = nextFriday.toISOString().split('T')[0];

  return (
    <div className="bg-[#0b1329] text-white pt-10 pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Top Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          {/* Left Column: Headlines */}
          <div className="lg:col-span-7">
            <div className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
              SEATS ACROSS STATIONS
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-5">
              Full train? We <br />
              <span className="text-white">find the gaps.</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
              Rail Split looks for direct seats first. When there are none, it checks
              every station along the way and pairs tickets from different trains or quotas into one journey.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-full bg-slate-800/90 text-slate-200 border border-slate-700/80">
                Direct trains first
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-800/90 text-slate-200 border border-slate-700/80">
                Up to 3 legs
              </span>
              <span className="px-3 py-1.5 rounded-full bg-slate-800/90 text-slate-200 border border-slate-700/80">
                Tight changes flagged
              </span>
            </div>
          </div>

          {/* Right Column: Floating Ticket Demo Card (as in PDF Page 1) */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl shadow-black/40 border border-slate-100/10 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              {/* Leg 1 */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>LEG 1</span>
                  <span>FRI 6 NOV</span>
                </div>
                <div className="flex items-baseline justify-between font-black text-2xl text-slate-900">
                  <span>JU</span>
                  <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
                  <span>NDLS</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-1">
                  <span>20:35</span>
                  <span>05:10 <span className="text-[10px] text-orange-600 font-bold">+1</span></span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="font-semibold text-slate-700">Mandore Express 3A</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    AVL 14
                  </span>
                </div>
              </div>

              {/* Station Change Bar */}
              <div className="py-2 px-3 my-3 rounded-lg bg-orange-50 border border-orange-200/80 text-[11px] font-bold text-[#f95738] flex items-center justify-between">
                <span>CHANGE AT NEW DELHI</span>
                <span className="font-mono">2H 15M</span>
              </div>

              {/* Leg 2 */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>LEG 2</span>
                  <span>SAT 7 NOV</span>
                </div>
                <div className="flex items-baseline justify-between font-black text-2xl text-slate-900">
                  <span>NDLS</span>
                  <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
                  <span>BZA</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-1">
                  <span>07:25</span>
                  <span>05:40 <span className="text-[10px] text-orange-600 font-bold">+1</span></span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="font-semibold text-slate-700">Andhra Pradesh Express 2A</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    AVL 6
                  </span>
                </div>
              </div>

              {/* Footer Total */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">2 tickets · 33h 05m</span>
                <span className="text-xl font-black text-slate-900">₹4,180</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Segmented Floating Search Form ── */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-5 border border-slate-200 text-slate-900">
          <form onSubmit={onSearch}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* FROM field */}
              <div className="md:col-span-3 bg-slate-50 rounded-xl p-2.5 border border-slate-200 relative focus-within:ring-2 focus-within:ring-[#f95738]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  FROM
                </label>
                <div className="flex items-center justify-between mt-0.5">
                  <select
                    value={fromCode}
                    onChange={(e) => onFromChange(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer truncate"
                  >
                    <option value="">Select origin</option>
                    {stations.map((s) => (
                      <option key={s.code} value={s.code} disabled={s.code === toCode}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {fromCode && (
                    <span className="ml-1 text-[11px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {fromCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Swap Button */}
              <div className="hidden md:flex md:col-span-1 justify-center -mx-3 z-10">
                <button
                  type="button"
                  onClick={onSwapStations}
                  className="w-8 h-8 rounded-full bg-white border border-slate-300 shadow-sm hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-transform hover:rotate-180 duration-300"
                  title="Swap stations"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </div>

              {/* TO field */}
              <div className="md:col-span-3 bg-slate-50 rounded-xl p-2.5 border border-slate-200 relative focus-within:ring-2 focus-within:ring-[#f95738]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  TO
                </label>
                <div className="flex items-center justify-between mt-0.5">
                  <select
                    value={toCode}
                    onChange={(e) => onToChange(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer truncate"
                  >
                    <option value="">Select destination</option>
                    {stations.map((s) => (
                      <option key={s.code} value={s.code} disabled={s.code === fromCode}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {toCode && (
                    <span className="ml-1 text-[11px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {toCode}
                    </span>
                  )}
                </div>
              </div>

              {/* DATE field */}
              <div className="md:col-span-3 bg-slate-50 rounded-xl p-2.5 border border-slate-200 relative focus-within:ring-2 focus-within:ring-[#f95738]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  DATE
                </label>
                <input
                  type="date"
                  value={date}
                  min={minDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer mt-0.5"
                />
              </div>

              {/* CLASS field */}
              <div className="md:col-span-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200 relative focus-within:ring-2 focus-within:ring-[#f95738]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  CLASS
                </label>
                <select
                  value={travelClass}
                  onChange={(e) => onClassChange(e.target.value as TravelClass)}
                  className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer mt-0.5"
                >
                  {(Object.entries(TRAVEL_CLASS_LABELS) as [TravelClass, string][]).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Big Orange "Find trains →" Button */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={loading || !fromCode || !toCode || !date}
                className="w-full py-3.5 px-6 rounded-xl bg-[#f95738] hover:bg-[#e04526] disabled:bg-slate-300 text-white font-extrabold text-sm sm:text-base tracking-tight transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Searching route and quotas…</span>
                  </>
                ) : (
                  <>
                    <span>Find trains</span>
                    <span className="text-lg">→</span>
                  </>
                )}
              </button>
            </div>

            {/* Secondary Search Options & Date Shortcut Pills */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={includeSplits}
                    onChange={(e) => onIncludeSplitsChange(e.target.checked)}
                    className="w-4 h-4 text-[#f95738] rounded border-slate-300 focus:ring-[#f95738]"
                  />
                  <span>Include split journeys</span>
                </label>

                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-slate-400">Minimum change time:</span>
                  <select
                    value={minChangeTime}
                    onChange={(e) => onMinChangeTimeChange(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="0">0 min (Same-train only)</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                  </select>
                </div>
              </div>

              {/* Quick Date Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onDateChange(tomorrowStr)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    date === tomorrowStr
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => onDateChange(weekendStr)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    date === weekendStr
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  This weekend
                </button>
                <button
                  type="button"
                  onClick={() => onDateChange(fridayStr)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    date === fridayStr
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Next Friday
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
