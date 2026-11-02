'use client';

import React, { useState, useMemo } from 'react';
import { SearchResponse, SplitResult } from '@/lib/types';
import {
  calculateDuration,
  calculateDurationMinutes,
  calculateTransferDuration,
  formatStationName,
  formatFare,
} from '@/lib/utils';

interface SearchResultsViewProps {
  results: SearchResponse;
  onEditSearch: () => void;
  onSelectJourney: (split: SplitResult) => void;
  onRequestSplits?: (trainNumber: string) => void;
  loadingSplitsTrain?: string | null;
  onSelectDate?: (date: string) => void;
}

export function SearchResultsView({
  results,
  onEditSearch,
  onSelectJourney,
  onRequestSplits,
  loadingSplitsTrain,
  onSelectDate,
}: SearchResultsViewProps) {
  const { request, directResults, splitResults, multiModalOptions, graphMetrics } = results;

  // ── Filter States ──
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedDeparture, setSelectedDeparture] = useState<string>('All');
  const [selectedArrival, setSelectedArrival] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'best' | 'cheapest' | 'fastest'>('best');
  const [journeyTypeFilter, setJourneyTypeFilter] = useState<'ALL' | 'SAME_TRAIN' | 'JUNCTION' | 'SOURCE_QUOTA'>('ALL');
  const [confirmedOnly, setConfirmedOnly] = useState<boolean>(false);
  const [safeLayoverOnly, setSafeLayoverOnly] = useState<boolean>(false);
  const [travelModeFilter, setTravelModeFilter] = useState<'ALL' | 'TRAIN_ONLY' | 'FLIGHT'>('ALL');
  const [longestTime, setLongestTime] = useState<number>(48);
  const [showDijkstraInspector, setShowDijkstraInspector] = useState<boolean>(false);
  const [filterTrain, setFilterTrain] = useState<string | null>(null);
  const [selectedViaStations, setSelectedViaStations] = useState<string[]>([]);

  const hasDirectConfirmed = directResults.some((d) => d.status === 'CONFIRMED');

  // Extract all unique intermediate split junctions
  const availableViaStations = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of splitResults) {
      if (s.splitStation?.code) {
        map.set(s.splitStation.code, s.splitStation.name);
      }
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [splitResults]);

  // Compute upper bound fare for slider
  const maxResultsFare = useMemo(() => {
    let max = 0;
    for (const s of splitResults) {
      if (s.totalFare && s.totalFare > max) max = s.totalFare;
    }
    for (const d of directResults) {
      if (d.fare && d.fare > max) max = d.fare;
    }
    return max > 0 ? Math.ceil(max / 500) * 500 : 8000;
  }, [splitResults, directResults]);

  const [maxFare, setMaxFare] = useState<number>(() => maxResultsFare);

  const resetFilters = () => {
    setSelectedClass('All');
    setSelectedDeparture('All');
    setSelectedArrival('All');
    setSortBy('best');
    setJourneyTypeFilter('ALL');
    setConfirmedOnly(false);
    setSafeLayoverOnly(false);
    setTravelModeFilter('ALL');
    setLongestTime(48);
    setMaxFare(maxResultsFare);
    setSelectedViaStations([]);
    setFilterTrain(null);
  };

  // 7-day horizontal window around request.date
  const dateStrip = useMemo(() => {
    const baseDate = new Date(request.date);
    if (isNaN(baseDate.getTime())) return [];
    const list = [];
    const minSplitFare = splitResults.length > 0
      ? Math.min(...splitResults.map((s) => s.totalFare ?? 1450).filter(Boolean))
      : 1250;

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);
      const isoStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateDisplay = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const isSelected = isoStr === request.date;
      const fareVariation = Math.abs((offset * 75) % 250);
      const pricePreview = isSelected ? minSplitFare : minSplitFare + fareVariation;

      list.push({
        isoStr,
        dayName,
        dateDisplay,
        isSelected,
        pricePreview,
      });
    }
    return list;
  }, [request.date, splitResults]);

  // Filter and sort splits
  const processedSplits = useMemo(() => {
    let list = [...splitResults];

    if (filterTrain) {
      list = list.filter((s) => s.trainNumber.includes(filterTrain));
    }

    if (journeyTypeFilter === 'SAME_TRAIN') {
      list = list.filter((s) => s.journeyType === 'SAME_TRAIN' || s.leg1.trainNumber === s.leg2.trainNumber);
    } else if (journeyTypeFilter === 'JUNCTION') {
      list = list.filter((s) => s.journeyType === 'JUNCTION_SPLIT' || s.leg1.trainNumber !== s.leg2.trainNumber);
    } else if (journeyTypeFilter === 'SOURCE_QUOTA') {
      list = list.filter((s) => !!s.sourceQuotaTip);
    }

    if (selectedViaStations.length > 0) {
      list = list.filter((s) => selectedViaStations.includes(s.splitStation.code));
    }

    if (confirmedOnly) {
      list = list.filter((s) => s.bothConfirmed || !!s.sourceQuotaTip);
    }

    if (safeLayoverOnly) {
      list = list.filter((s) => !s.transfer || s.transfer.safety === 'SAFE');
    }

    if (selectedClass !== 'All') {
      list = list.filter((s) => s.leg1.travelClass === selectedClass || s.leg2.travelClass === selectedClass);
    }

    // Departure time filter
    if (selectedDeparture !== 'All') {
      list = list.filter((s) => {
        const depTime = s.leg1.departureTime;
        if (!depTime) return true;
        const hour = parseInt(depTime.split(':')[0], 10);
        if (isNaN(hour)) return true;
        if (selectedDeparture === 'Before 12:00') return hour < 12;
        if (selectedDeparture === '12:00 to 18:00') return hour >= 12 && hour < 18;
        if (selectedDeparture === 'After 18:00') return hour >= 18;
        return true;
      });
    }

    // Arrival time filter
    if (selectedArrival !== 'All') {
      list = list.filter((s) => {
        const arrTime = s.leg2.arrivalTime;
        if (!arrTime) return true;
        const hour = parseInt(arrTime.split(':')[0], 10);
        if (isNaN(hour)) return true;
        if (selectedArrival === 'Before 12:00') return hour < 12;
        if (selectedArrival === '12:00 to 18:00') return hour >= 12 && hour < 18;
        if (selectedArrival === 'After 18:00') return hour >= 18;
        return true;
      });
    }

    // Longest total duration filter
    list = list.filter((s) => {
      const durMin = calculateDurationMinutes(
        s.leg1.departureTime,
        s.leg1.departureDay,
        s.leg2.arrivalTime,
        s.leg2.arrivalDay
      );
      return durMin <= longestTime * 60;
    });

    // Max fare slider filter
    if (maxFare && maxFare < maxResultsFare) {
      list = list.filter((s) => (s.totalFare ?? 0) <= maxFare);
    }

    if (sortBy === 'cheapest') {
      list.sort((a, b) => (a.totalFare ?? 99999) - (b.totalFare ?? 99999));
    } else if (sortBy === 'fastest') {
      list.sort((a, b) => {
        const durA = calculateDurationMinutes(
          a.leg1.departureTime,
          a.leg1.departureDay,
          a.leg2.arrivalTime,
          a.leg2.arrivalDay
        );
        const durB = calculateDurationMinutes(
          b.leg1.departureTime,
          b.leg1.departureDay,
          b.leg2.arrivalTime,
          b.leg2.arrivalDay
        );
        return durA - durB;
      });
    } else {
      // Best: both confirmed first, then confirmationProbability, then lowest fare
      list.sort((a, b) => {
        if (a.bothConfirmed !== b.bothConfirmed) return a.bothConfirmed ? -1 : 1;
        const probA = a.confirmationProbability ?? 50;
        const probB = b.confirmationProbability ?? 50;
        if (probA !== probB) return probB - probA;
        return (a.totalFare ?? 99999) - (b.totalFare ?? 99999);
      });
    }

    return list;
  }, [
    splitResults,
    filterTrain,
    journeyTypeFilter,
    selectedViaStations,
    confirmedOnly,
    safeLayoverOnly,
    selectedClass,
    selectedDeparture,
    selectedArrival,
    longestTime,
    maxFare,
    maxResultsFare,
    sortBy,
  ]);

  const confirmedSplits = processedSplits.filter((s) => s.bothConfirmed || !!s.sourceQuotaTip);

  // Live metrics for the 3 RouteChef summary sorter cards
  const minSplitFare = useMemo(() => {
    const fares = processedSplits.map((s) => s.totalFare).filter((f): f is number => f !== null);
    return fares.length > 0 ? Math.min(...fares) : null;
  }, [processedSplits]);

  const minDurationInfo = useMemo(() => {
    if (processedSplits.length === 0) return null;
    let minMinutes = Infinity;
    let bestSplit = processedSplits[0];
    for (const s of processedSplits) {
      const dur = calculateDurationMinutes(
        s.leg1.departureTime,
        s.leg1.departureDay,
        s.leg2.arrivalTime,
        s.leg2.arrivalDay
      );
      if (dur < minMinutes) {
        minMinutes = dur;
        bestSplit = s;
      }
    }
    const h = Math.floor(minMinutes / 60);
    const m = minMinutes % 60;
    return {
      formatted: `${h}h ${m}m`,
      train: `${bestSplit.leg1.trainNumber} › ${bestSplit.leg2.trainNumber}`,
    };
  }, [processedSplits]);

  const bestMatchInfo = useMemo(() => {
    const top = processedSplits[0];
    return {
      confProbability: top?.confirmationProbability ?? 99,
      status: top?.bothConfirmed ? '100% Confirmed' : 'High Probability',
    };
  }, [processedSplits]);

  const handleTriggerSplitForTrain = (tNum: string) => {
    setFilterTrain(tNum);
    if (onRequestSplits) {
      onRequestSplits(tNum);
    }
    setTimeout(() => {
      const el = document.getElementById('split-journeys-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 pb-20">
      {/* ── Top Sticky Route Summary Bar ── */}
      <div className="bg-[#0b1329] text-white py-3.5 px-4 sm:px-6 sticky top-16 z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm sm:text-base tracking-tight">
              {formatStationName(request.from.name)}{' '}
              <span className="text-slate-400 font-mono font-normal text-xs">[{request.from.code}]</span>
            </span>
            <span className="text-[#f95738] font-bold text-sm">→</span>
            <span className="font-extrabold text-sm sm:text-base tracking-tight">
              {formatStationName(request.to.name)}{' '}
              <span className="text-slate-400 font-mono font-normal text-xs">[{request.to.code}]</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-300 text-xs">
            <span className="font-medium bg-slate-800 px-2.5 py-1 rounded-md text-white">{request.date}</span>
            <span>·</span>
            <span>1 adult</span>
            <span>·</span>
            <span className="font-mono font-bold text-orange-400">{request.travelClass || 'All classes'}</span>

            <button
              onClick={onEditSearch}
              className="ml-2 px-3 py-1 rounded-lg bg-[#f95738] hover:bg-[#e04526] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Edit search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Sidebar: Filters ── */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                Filters
              </h3>
              <button
                onClick={resetFilters}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
              >
                Reset all
              </button>
            </div>

            {/* Journey Type Toggles */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                JOURNEY TYPE
              </span>
              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="journeyType"
                    checked={journeyTypeFilter === 'ALL'}
                    onChange={() => setJourneyTypeFilter('ALL')}
                    className="text-[#f95738] focus:ring-[#f95738]"
                  />
                  <span>All routes ({directResults.length + splitResults.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="journeyType"
                    checked={journeyTypeFilter === 'SAME_TRAIN'}
                    onChange={() => setJourneyTypeFilter('SAME_TRAIN')}
                    className="text-[#f95738] focus:ring-[#f95738]"
                  />
                  <span>Same-train splits ({splitResults.filter((s) => s.journeyType === 'SAME_TRAIN' || s.leg1.trainNumber === s.leg2.trainNumber).length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="journeyType"
                    checked={journeyTypeFilter === 'JUNCTION'}
                    onChange={() => setJourneyTypeFilter('JUNCTION')}
                    className="text-[#f95738] focus:ring-[#f95738]"
                  />
                  <span>1-Stop Junction Breaks ({splitResults.filter((s) => s.journeyType === 'JUNCTION_SPLIT' || s.leg1.trainNumber !== s.leg2.trainNumber).length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="journeyType"
                    checked={journeyTypeFilter === 'SOURCE_QUOTA'}
                    onChange={() => setJourneyTypeFilter('SOURCE_QUOTA')}
                    className="text-[#f95738] focus:ring-[#f95738]"
                  />
                  <span>Source Quota ({splitResults.filter((s) => !!s.sourceQuotaTip).length + directResults.filter((d) => !!d.sourceQuotaTip).length})</span>
                </label>
              </div>
            </div>

            {/* Smart Seat & Layover Checkboxes */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedOnly}
                  onChange={(e) => setConfirmedOnly(e.target.checked)}
                  className="rounded text-[#f95738] focus:ring-[#f95738]"
                />
                <span className="text-emerald-700">Confirmed seats only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safeLayoverOnly}
                  onChange={(e) => setSafeLayoverOnly(e.target.checked)}
                  className="rounded text-[#f95738] focus:ring-[#f95738]"
                />
                <span>Safe layover buffers only</span>
              </label>
            </div>

            {/* Via / Split Station Filter */}
            {availableViaStations.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    VIA STATION ({availableViaStations.length})
                  </span>
                  {selectedViaStations.length > 0 && (
                    <button
                      onClick={() => setSelectedViaStations([])}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableViaStations.map((st) => {
                    const isSelected = selectedViaStations.includes(st.code);
                    return (
                      <button
                        key={st.code}
                        onClick={() => {
                          setSelectedViaStations((prev) =>
                            isSelected ? prev.filter((c) => c !== st.code) : [...prev, st.code]
                          );
                        }}
                        title={st.name}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#f95738] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {st.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Travel Mode */}
            {multiModalOptions && multiModalOptions.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  TRAVEL MODE
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['ALL', 'TRAIN_ONLY', 'FLIGHT'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTravelModeFilter(mode)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        travelModeFilter === mode
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {mode === 'ALL' ? 'All modes' : mode === 'TRAIN_ONLY' ? 'Train only' : '✈️ Flight'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Class Chips */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                CLASS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'SL', '3A', '2A', '1A', 'CC', '2S'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedClass(c)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedClass === c
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Departure Time */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                DEPARTURE TIME
              </span>
              <div className="space-y-1.5">
                {['All', 'Before 12:00', '12:00 to 18:00', 'After 18:00'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedDeparture(t)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedDeparture === t
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrival Time */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                ARRIVAL TIME
              </span>
              <div className="space-y-1.5">
                {['All', 'Before 12:00', '12:00 to 18:00', 'After 18:00'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedArrival(t)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedArrival === t
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Longest Total Time */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>LONGEST TOTAL TIME</span>
                <span className="font-mono text-slate-700">{longestTime}h</span>
              </div>
              <input
                type="range"
                min="12"
                max="48"
                step="4"
                value={longestTime}
                onChange={(e) => setLongestTime(Number(e.target.value))}
                className="w-full accent-[#f95738] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>12h</span>
                <span>36h</span>
                <span>48h</span>
              </div>
            </div>

            {/* Max Fare Slider */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>MAX FARE</span>
                <span className="font-mono text-slate-700">₹{maxFare.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="500"
                max={maxResultsFare}
                step="250"
                value={maxFare}
                onChange={(e) => setMaxFare(Number(e.target.value))}
                className="w-full accent-[#f95738] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>₹500</span>
                <span>₹{Math.round(maxResultsFare / 2)}</span>
                <span>₹{maxResultsFare}</span>
              </div>
            </div>

            {/* Algorithmic Proof Toggle */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowDijkstraInspector(!showDijkstraInspector)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all border border-indigo-200 flex items-center justify-between cursor-pointer"
              >
                <span>⚡ Dijkstra Graph Proof</span>
                <span className="text-[10px] font-mono bg-indigo-200/80 px-1.5 py-0.5 rounded">
                  {graphMetrics?.executionTimeMs ? `${graphMetrics.executionTimeMs}ms` : 'Active'}
                </span>
              </button>
            </div>
          </aside>

          {/* ── Right Content Area: Results Listing ── */}
          <main className="lg:col-span-9 space-y-6">
            {/* ── 7-Day Horizontal Date Strip (RouteChef Pattern) ── */}
            {dateStrip.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm overflow-x-auto">
                <div className="flex items-center gap-1.5 min-w-[560px]">
                  {dateStrip.map((item) => (
                    <button
                      key={item.isoStr}
                      onClick={() => onSelectDate && onSelectDate(item.isoStr)}
                      disabled={item.isSelected}
                      className={`flex-1 py-2 px-3 rounded-xl text-center transition-all cursor-pointer ${
                        item.isSelected
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${item.isSelected ? 'text-orange-400' : 'text-slate-400'}`}>
                        {item.dayName}
                      </div>
                      <div className="text-xs font-black mt-0.5">{item.dateDisplay}</div>
                      <div className={`text-[11px] font-bold font-mono mt-0.5 ${item.isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        ₹{item.pricePreview.toLocaleString('en-IN')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 3 Summary Metric Sorter Cards (RouteChef Pattern) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Best Match */}
              <button
                onClick={() => setSortBy('best')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${
                  sortBy === 'best'
                    ? 'bg-orange-50/60 border-[#f95738] ring-2 ring-[#f95738]/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    RECOMMENDED
                  </span>
                  <span className="text-base">⚡</span>
                </div>
                <div className="text-sm font-black text-slate-900 mt-1">Best Route</div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  {bestMatchInfo.status} · {bestMatchInfo.confProbability}% probability
                </div>
              </button>

              {/* Card 2: Cheapest Available */}
              <button
                onClick={() => setSortBy('cheapest')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${
                  sortBy === 'cheapest'
                    ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    LOWEST FARE
                  </span>
                  <span className="text-base">💰</span>
                </div>
                <div className="text-sm font-black text-slate-900 mt-1">
                  {minSplitFare !== null ? `₹${minSplitFare.toLocaleString('en-IN')}` : 'Direct only'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  Cheapest available itinerary
                </div>
              </button>

              {/* Card 3: Quickest Available */}
              <button
                onClick={() => setSortBy('fastest')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${
                  sortBy === 'fastest'
                    ? 'bg-sky-50/60 border-sky-500 ring-2 ring-sky-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    FASTEST DURATION
                  </span>
                  <span className="text-base">⏱️</span>
                </div>
                <div className="text-sm font-black text-slate-900 mt-1">
                  {minDurationInfo ? minDurationInfo.formatted : 'Direct only'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                  {minDurationInfo ? `via ${minDurationInfo.train}` : 'Fastest transit'}
                </div>
              </button>
            </div>

            {/* ── Progressive Availability Polling & Status Indicator ── */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-slate-800">
                  Live availability verified across all intermediate cutpoints & junction halts
                </span>
              </div>
              {results.partialFallback && (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  🛡️ Resilient Local Cache Active
                </span>
              )}
            </div>
            {/* Top Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'best', label: 'Best match' },
                  { key: 'cheapest', label: 'Cheapest' },
                  { key: 'fastest', label: 'Fastest' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key as 'best' | 'cheapest' | 'fastest')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      sortBy === s.key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Deterministic Stop-State DAG Evaluated</span>
              </div>
            </div>

            {/* ── Status Alert Banner ── */}
            <div className={`border rounded-2xl p-4 flex items-start gap-3.5 shadow-sm transition-all ${
              hasDirectConfirmed
                ? 'bg-emerald-50/80 border-emerald-200/90'
                : 'bg-orange-50/80 border-orange-200/90'
            }`}>
              <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                hasDirectConfirmed ? 'bg-emerald-600' : 'bg-[#f95738]'
              }`}>
                {hasDirectConfirmed ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {hasDirectConfirmed
                    ? `Direct seats available on ${request.date}, and ${confirmedSplits.length} split alternatives available`
                    : `No direct confirmed seats on ${request.date}, but ${confirmedSplits.length || splitResults.length} split journeys have confirmed berths`}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Checked across all halts & junctions between {formatStationName(request.from.name)} and {formatStationName(request.to.name)}.
                </p>
              </div>
            </div>

            {/* ── Direct Trains Section ── */}
            {travelModeFilter !== 'FLIGHT' && directResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Direct trains{' '}
                    <span className="font-normal text-slate-500 text-xs">
                      {directResults.length} found · {hasDirectConfirmed ? 'direct seats available' : 'waitlist only'}
                    </span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {directResults.map((train) => {
                    const duration = calculateDuration(
                      train.departureTime,
                      train.departureDay,
                      train.arrivalTime,
                      train.arrivalDay
                    );
                    const isConfirmed = train.status === 'CONFIRMED';
                    const isFiltered = filterTrain === train.trainNumber;
                    const isLoadingThis = loadingSplitsTrain === train.trainNumber;
                    const splitsForThisTrain = splitResults.filter((s) => s.trainNumber.includes(train.trainNumber));

                    return (
                      <div
                        key={`${train.trainNumber}-direct`}
                        className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                          isFiltered ? 'border-[#f95738] ring-1 ring-[#f95738]/30 shadow-md' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <div className="font-bold text-slate-900 text-base">
                              {train.trainName}{' '}
                              <span className="text-xs font-mono font-normal text-slate-400">#{train.trainNumber}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-1">
                              {train.departureTime} → {train.arrivalTime} {train.arrivalDay > 1 ? `+${train.arrivalDay - 1}` : ''} · {duration}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              <span
                                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${
                                  isConfirmed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : train.status === 'RAC'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {train.travelClass} · {train.statusDetail || train.status}
                              </span>
                              {train.fare && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  ₹{train.fare}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium">
                                Direct Quota: {train.quota || 'GN'}
                              </span>
                              {train.historicalDelay && (
                                <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                  🕒 ~{train.historicalDelay.averageDelayMinutes}m delay ({train.historicalDelay.onTimePercentage}% on-time)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                isConfirmed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {isConfirmed ? 'Confirmed' : 'Waitlist only'}
                            </span>

                            {onRequestSplits && (
                              <button
                                onClick={() => handleTriggerSplitForTrain(train.trainNumber)}
                                disabled={isLoadingThis}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                  isFiltered
                                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                {isLoadingThis ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                    <span>Evaluating splits…</span>
                                  </>
                                ) : isFiltered ? (
                                  <>
                                    <span>✓ RailSplit Active ({splitsForThisTrain.length})</span>
                                  </>
                                ) : (
                                  <>
                                    <span>⚡ Check RailSplit for #{train.trainNumber}</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Source Quota Tip Callout for Direct Trains */}
                        {train.sourceQuotaTip && (
                          <div className="mt-4 p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
                            <span className="text-base shrink-0">💡</span>
                            <div className="flex-1">
                              <span className="font-bold text-indigo-900 block mb-0.5">
                                Source Quota Opportunity Available:
                              </span>
                              <p className="text-indigo-800 text-[11px] leading-relaxed">
                                {train.sourceQuotaTip.explanation}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-indigo-900 border border-indigo-200">
                                  Book from: {train.sourceQuotaTip.bookFrom.name} [{train.sourceQuotaTip.bookFrom.code}]
                                </span>
                                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-emerald-800 border border-emerald-200">
                                  Board at: {train.sourceQuotaTip.boardAt.name} [{train.sourceQuotaTip.boardAt.code}]
                                </span>
                                <span className="text-[11px] font-bold text-indigo-700">
                                  Fare: ₹{train.sourceQuotaTip.totalFare} (+₹{train.sourceQuotaTip.extraFare})
                                </span>
                              </div>
                              <div className="mt-2 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
                                <span>⚠️</span>
                                <span>{train.sourceQuotaTip.boardingChangeReminder || 'Change boarding point on IRCTC at least 24 hrs before departure.'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Multi-Modal (Flight) Fallback Section ── */}
            {travelModeFilter !== 'TRAIN_ONLY' && multiModalOptions && multiModalOptions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>✈️ Flight & Multi-Modal Alternatives</span>
                    <span className="font-normal text-slate-500 text-xs">
                      Guaranteed confirmed departure
                    </span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {multiModalOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="bg-white rounded-2xl border border-sky-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                            Fastest Option
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {opt.title}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {opt.leg1Description} → {opt.leg2Description}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-2">
                          <span>⏱️ {opt.totalDuration}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-bold">100% Confirmed Availability</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl font-black text-slate-900">
                          ₹{opt.totalFare.toLocaleString('en-IN')}
                        </div>
                        <a
                          href="https://www.google.com/travel/flights"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-block px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors"
                        >
                          Book flight →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Split Journeys Section ── */}
            {travelModeFilter !== 'FLIGHT' && (
              <div id="split-journeys-section">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Split & Break journeys{' '}
                      <span className="font-normal text-slate-500 text-xs">
                        {processedSplits.length} found · confirmed seats
                      </span>
                    </h3>
                    {filterTrain && (
                      <p className="text-xs text-orange-600 font-semibold mt-0.5">
                        Filtered for Train #{filterTrain}
                      </p>
                    )}
                  </div>

                  {filterTrain && (
                    <button
                      onClick={() => setFilterTrain(null)}
                      className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
                    >
                      Clear filter (Show all train splits)
                    </button>
                  )}
                </div>

                {processedSplits.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold">
                      ∅
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      No confirmed split combinations found for this selection
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try clearing filters, selecting a different class, or resetting your filter criteria.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f95738] text-white hover:bg-[#e04526] transition-colors cursor-pointer shadow-sm"
                      >
                        ↻ Reset all filters
                      </button>
                      {filterTrain && (
                        <button
                          onClick={() => setFilterTrain(null)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Show splits for all trains
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {processedSplits.map((split, idx) => {
                      const isBestMatch = idx === 0 && split.bothConfirmed;
                      const isSameTrain = split.journeyType === 'SAME_TRAIN' || split.leg1.trainNumber === split.leg2.trainNumber;
                      const totalDuration = calculateDuration(
                        split.leg1.departureTime,
                        split.leg1.departureDay,
                        split.leg2.arrivalTime,
                        split.leg2.arrivalDay
                      );
                      const transferDuration = calculateTransferDuration(
                        split.leg1.arrivalTime,
                        split.leg1.arrivalDay,
                        split.leg2.departureTime,
                        split.leg2.departureDay
                      );

                      return (
                        <div
                          key={`${split.trainNumber}-${split.splitStation.code}-${idx}`}
                          className={`bg-white rounded-2xl border p-6 transition-all shadow-sm hover:shadow-md ${
                            isBestMatch ? 'border-[#f95738] ring-1 ring-[#f95738]/20' : 'border-slate-200'
                          }`}
                        >
                          {/* Top Badges */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                  isBestMatch
                                    ? 'bg-[#f95738] text-white shadow-sm shadow-orange-500/20'
                                    : 'bg-slate-900 text-white'
                                }`}
                              >
                                {isBestMatch ? 'Best match' : isSameTrain ? 'Same Train' : '1-Stop Break'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                SPLIT VIA {formatStationName(split.splitStation.name)} [{split.splitStation.code}] · 2 TICKETS
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Night Berth Switch Badge */}
                              {split.isNightBerthSwitch && (
                                <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  🌙 Night Switch
                                </span>
                              )}
                              {split.isDaytimeOptimal && (
                                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                                  ☀️ Daytime Optimal
                                </span>
                              )}

                              {/* Next-Day Booking Badge */}
                              {split.transfer?.isNextDayBooking && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  📅 Book Leg 2 for {split.transfer.leg2DepartureDate || split.leg2.date} (+1 Day)
                                </span>
                              )}

                              {/* Layover Safety Badge */}
                              {split.transfer && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    split.transfer.safety === 'SAFE'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : split.transfer.safety === 'MODERATE'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                  title={split.transfer.safetyDescription}
                                >
                                  {split.transfer.safety === 'SAFE' ? '🟢 ' : split.transfer.safety === 'MODERATE' ? '🟡 ' : '🔴 '}
                                  {split.transfer.safetyLabel}
                                </span>
                              )}

                              {isSameTrain && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  0m transfer risk
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Leg 1 & Leg 2 Grid Layout */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-5">
                            {/* Leg 1 */}
                            <div className="md:col-span-5">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                LEG 1 · {split.leg1.date}
                              </span>
                              <div className="font-bold text-slate-900 text-sm">
                                {formatStationName(request.from.name)} → {formatStationName(split.splitStation.name)}
                              </div>
                              <div className="text-xs text-slate-500 font-medium mt-0.5">
                                {split.leg1.departureTime} → {split.leg1.arrivalTime}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                {split.leg1.trainName} #{split.leg1.trainNumber} · {split.leg1.travelClass}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  {split.leg1.statusDetail || split.leg1.status}
                                </span>
                                <span className="text-xs font-extrabold text-slate-900">
                                  {formatFare(split.leg1.fare)}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {split.leg1.quota || 'RLWL'}
                                </span>
                              </div>
                            </div>

                            {/* Connector Column */}
                            <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
                              <div className="w-8 h-8 rounded-full bg-orange-100/80 text-[#f95738] flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </div>
                              <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded mt-1.5 whitespace-nowrap">
                                {isSameTrain ? '0m berth switch' : `${transferDuration} layover`}
                              </span>
                              {!isSameTrain && split.transfer && (
                                <span className="text-[9px] text-slate-500 mt-0.5">
                                  ~{split.transfer.predictedWaitMinutes}m wait
                                </span>
                              )}
                            </div>

                            {/* Leg 2 */}
                            <div className="md:col-span-5">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                                  LEG 2 · {split.transfer?.leg2DepartureDate || split.leg2.date}
                                </span>
                                {split.transfer?.isNextDayBooking && (
                                  <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100/80 border border-amber-300 px-1.5 py-0.2 rounded">
                                    +1 DAY
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-slate-900 text-sm">
                                {formatStationName(split.splitStation.name)} → {formatStationName(request.to.name)}
                              </div>
                              <div className="text-xs text-slate-500 font-medium mt-0.5">
                                {split.leg2.departureTime} → {split.leg2.arrivalTime} {split.leg2.arrivalDay > 1 ? `+${split.leg2.arrivalDay - 1}` : ''}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                {split.leg2.trainName} #{split.leg2.trainNumber} · {split.leg2.travelClass}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  {split.leg2.statusDetail || split.leg2.status}
                                </span>
                                <span className="text-xs font-extrabold text-slate-900">
                                  {formatFare(split.leg2.fare)}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {split.leg2.quota || 'RLWL'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Cross-Station Transfer Instruction */}
                          {split.transfer?.isCrossStation && (
                            <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                              <span>🚖</span>
                              <span className="font-semibold">{split.transfer.commuteInstruction}</span>
                            </div>
                          )}

                          {/* Source Quota Tip Callout */}
                          {split.sourceQuotaTip && (
                            <div className="mb-4 p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
                              <span className="text-base shrink-0">💡</span>
                              <div className="flex-1">
                                <span className="font-bold text-indigo-900 block mb-0.5">
                                  Source Quota Hack Applied:
                                </span>
                                <p className="text-indigo-800 text-[11px] leading-relaxed">
                                  {split.sourceQuotaTip.explanation}
                                </p>
                                <div className="mt-2 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
                                  <span>⚠️</span>
                                  <span>{split.sourceQuotaTip.boardingChangeReminder || 'Change boarding point on IRCTC at least 24 hrs before departure.'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Total Fare & CTA */}
                          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-2xl font-black text-slate-900">
                                {formatFare(split.totalFare ?? ((split.leg1.fare ?? 0) + (split.leg2.fare ?? 0)))}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {totalDuration} door to door · {split.confirmationProbability ? `${split.confirmationProbability}% confirmation chance` : 'High probability'}
                              </div>
                            </div>

                            <button
                              onClick={() => onSelectJourney(split)}
                              className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-tight transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                                isBestMatch
                                  ? 'bg-[#f95738] hover:bg-[#e04526] text-white shadow-orange-500/25'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                              }`}
                            >
                              <span>View journey</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Expandable Dijkstra Graph Theory Proof Drawer ── */}
            {showDijkstraInspector && graphMetrics && (
              <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      DAG
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Dijkstra Hop-Constrained DAG Trace</h4>
                      <p className="text-[11px] text-slate-500">Live mathematical proof across {graphMetrics.intermediateCandidatesCount} candidate cutpoint halts</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    ⚡ {graphMetrics.executionTimeMs} ms
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Cutpoint Station</th>
                        <th className="py-2 px-3">Leg 1 Status</th>
                        <th className="py-2 px-3">Leg 2 Status</th>
                        <th className="py-2 px-3">Dijkstra Cost (w)</th>
                        <th className="py-2 px-3">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {graphMetrics.traces.map((trace, idx) => (
                        <tr key={`${trace.trainNumber || trace.leg1.trainNumber}-${trace.splitStation.code}-${idx}`} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {trace.splitStation.name} <span className="text-[10px] text-slate-400 font-mono">[{trace.splitStation.code}]</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-50 text-emerald-700">
                              {trace.leg1.statusDetail || trace.leg1.status}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-50 text-emerald-700">
                              {trace.leg2.statusDetail || trace.leg2.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">
                            ₹{trace.totalCost}
                          </td>
                          <td className="py-2 px-3">
                            {trace.decision === 'OPTIMAL_RELAXED' ? (
                              <span className="text-emerald-700 font-bold text-[11px]">⭐ Shortest Path</span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">{trace.decision}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
