'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Station, TravelClass, SearchResponse, SplitResult } from '@/lib/types';
import { HeaderNavbar } from './HeaderNavbar';
import { HeroSearch } from './HeroSearch';
import { LandingSections } from './LandingSections';
import { SearchResultsView } from './SearchResultsView';
import { JourneyDetailView } from './JourneyDetailView';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';

const RAIL_LOADING_STATES = [
  { text: 'Resolving origin and destination stations' },
  { text: 'Traversing timetable route graph' },
  { text: 'Querying direct General Quota (GNWL)' },
  { text: 'Scanning intermediate junction halts' },
  { text: 'Evaluating Remote Location Quotas (RLWL)' },
  { text: 'Executing Hop-Constrained Same-Train Dijkstra' },
  { text: 'Verifying connection invariance' },
  { text: 'Finalizing confirmed split-seat options' },
];

function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export default function SearchPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromCode, setFromCode] = useState('JU');
  const [toCode, setToCode] = useState('BZA');
  const [date, setDate] = useState(getTomorrow);
  const [travelClass, setTravelClass] = useState<TravelClass>('3A');
  const [includeSplits, setIncludeSplits] = useState(true);
  const [minChangeTime, setMinChangeTime] = useState('90');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<SplitResult | null>(null);
  const [loadingSplitsTrain, setLoadingSplitsTrain] = useState<string | null>(null);

  const minDate = useMemo(() => getToday(), []);

  useEffect(() => {
    fetch('/api/stations')
      .then((r) => r.json())
      .then(setStations)
      .catch(() => setError('Failed to load stations'));
  }, []);

  const swapStations = useCallback(() => {
    setFromCode((prev) => {
      setToCode(prev);
      return toCode;
    });
  }, [toCode]);

  const handleRequestSplits = async (trainNumber?: string) => {
    const from = results?.request.from.code || fromCode;
    const to = results?.request.to.code || toCode;
    const travelDate = results?.request.date || date;
    const tClass = results?.request.travelClass || travelClass;

    if (!from || !to || !travelDate) return;
    setLoadingSplitsTrain(trainNumber || 'ALL');

    try {
      const params = new URLSearchParams({
        from,
        to,
        date: travelDate,
        class: tClass,
        splits: 'true',
        fresh: 'true',
      });
      if (trainNumber && trainNumber !== 'ALL') {
        params.set('trainNumber', trainNumber);
      }
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (res.ok) {
        setResults((prev) => {
          if (!prev) return data;
          const otherSplits = trainNumber && trainNumber !== 'ALL'
            ? prev.splitResults.filter((s) => s.trainNumber !== trainNumber)
            : [];
          return {
            ...prev,
            splitResults: [...data.splitResults, ...otherSplits],
            graphMetrics: data.graphMetrics || prev.graphMetrics,
          };
        });
      }
    } catch (err) {
      console.error('Failed to load on-demand splits:', err);
    } finally {
      setLoadingSplitsTrain(null);
    }
  };

  const executeSearch = async (from: string, to: string, travelDate: string, tClass: TravelClass) => {
    if (!from || !to || !travelDate) return;
    if (from === to) {
      setError('Origin and destination must be different.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedJourney(null);
    setSearched(true);

    const startTime = Date.now();
    try {
      const params = new URLSearchParams({
        from,
        to,
        date: travelDate,
        class: tClass,
        splits: includeSplits ? 'true' : 'false',
      });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      const elapsed = Date.now() - startTime;
      if (elapsed < 600) {
        await new Promise((r) => setTimeout(r, 600 - elapsed));
      }

      if (!res.ok) {
        setError(data.error || 'Search failed');
      } else {
        setResults(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(fromCode, toCode, date, travelClass);
  };

  const handleSelectRoute = (from: string, to: string) => {
    setFromCode(from);
    setToCode(to);
    executeSearch(from, to, date, travelClass);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-[#f95738] selection:text-white">
      {/* Multi-Step Animated Loader */}
      <MultiStepLoader loadingStates={RAIL_LOADING_STATES} loading={loading} duration={150} loop={false} />

      {/* Modern Dark Header Navbar */}
      <HeaderNavbar onResetSearch={() => {
        setSearched(false);
        setSelectedJourney(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />

      {/* Error alert toast */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs font-semibold text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 font-bold ml-2">✕</button>
          </div>
        </div>
      )}

      {/* View 1: Detailed Journey View (Page 5) */}
      {!loading && selectedJourney && results && (
        <JourneyDetailView
          split={selectedJourney}
          request={results.request}
          onBack={() => setSelectedJourney(null)}
        />
      )}

      {/* View 2: Search Results View (Pages 3 & 4) */}
      {!loading && !selectedJourney && searched && results && (
        <SearchResultsView
          results={results}
          onEditSearch={() => {
            setSearched(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectJourney={(split) => setSelectedJourney(split)}
          onRequestSplits={handleRequestSplits}
          loadingSplitsTrain={loadingSplitsTrain}
        />
      )}

      {/* View 3: Landing / Home Hero & Search + Features (Pages 1 & 2) */}
      {(!searched || (!results && !loading)) && !selectedJourney && (
        <>
          <HeroSearch
            stations={stations}
            fromCode={fromCode}
            toCode={toCode}
            date={date}
            travelClass={travelClass}
            onFromChange={setFromCode}
            onToChange={setToCode}
            onDateChange={setDate}
            onClassChange={setTravelClass}
            onSwapStations={swapStations}
            onSearch={handleSearch}
            loading={loading}
            minDate={minDate}
            includeSplits={includeSplits}
            onIncludeSplitsChange={setIncludeSplits}
            minChangeTime={minChangeTime}
            onMinChangeTimeChange={setMinChangeTime}
          />

          <LandingSections onSelectRoute={handleSelectRoute} />
        </>
      )}
    </div>
  );
}
