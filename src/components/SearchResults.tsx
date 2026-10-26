'use client';

import { useState } from 'react';
import {
  SearchResponse,
  SplitResult,
  DirectResult,
  AvailabilityStatus,
  GraphExecutionMetrics,
} from '@/lib/types';

function StatusBadge({
  status,
  detail,
  quota,
}: {
  status: AvailabilityStatus;
  detail?: string;
  quota?: string;
}) {
  const config: Record<AvailabilityStatus, { bg: string; text: string; label: string }> = {
    CONFIRMED: { bg: 'bg-emerald-500/10 border-emerald-500/30 shadow-sm shadow-emerald-500/10', text: 'text-emerald-700', label: 'Confirmed' },
    RAC: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-700', label: 'RAC' },
    WAITLIST: { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-700', label: 'Waitlist' },
    NOT_AVAILABLE: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-600', label: 'Not Available' },
    UNKNOWN: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-600', label: 'Unknown' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${c.bg} ${c.text}`}>
      <span>{detail || c.label}</span>
      {quota && <span className="opacity-75 text-[10px] font-mono tracking-wider">[{quota}]</span>}
    </span>
  );
}

function formatFare(fare: number | null): string {
  if (fare === null) return '—';
  return `₹${fare.toLocaleString('en-IN')}`;
}

function DayLabel({ day }: { day: number }) {
  if (day === 1) return null;
  return <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">Day {day}</span>;
}

// ── Route Timeline with 3D Station Pin ──
function RouteTimeline({
  from,
  split,
  to,
  dep,
  splitArr,
  splitDep,
  arr,
  depDay,
  splitDay,
  arrDay,
}: {
  from: string;
  split?: string;
  to: string;
  dep: string;
  splitArr?: string;
  splitDep?: string;
  arr: string;
  depDay: number;
  splitDay?: number;
  arrDay: number;
}) {
  return (
    <div className="flex items-center gap-0 text-xs w-full overflow-x-auto py-3">
      {/* Origin */}
      <div className="flex flex-col items-center shrink-0">
        <span className="font-bold text-slate-800 tracking-tight">{from}</span>
        <div className="relative flex items-center justify-center mt-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-md shadow-blue-500/30 ring-4 ring-blue-100" />
        </div>
        <span className="text-slate-500 font-medium text-[11px] mt-1">{dep} <DayLabel day={depDay} /></span>
      </div>

      {/* Track line 1 */}
      <div className="flex-1 min-w-10 h-1 bg-gradient-to-r from-blue-500 to-amber-500 rounded-full mx-2 opacity-80" />

      {split && (
        <>
          {/* Split Station 3D Radar Pin */}
          <div className="flex flex-col items-center shrink-0 px-1">
            <span className="font-bold text-amber-700 tracking-tight flex items-center gap-1">
              <span>{split}</span>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-100/80 px-1.5 py-0.2 rounded-full">Split Hub</span>
            </span>

            {/* Animated Pin Marker */}
            <div className="relative flex items-center justify-center mt-1.5">
              <div className="absolute w-6 h-6 rounded-full bg-amber-400/40 pin-ring" />
              <div className="relative w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-lg shadow-amber-500/40 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>

            <span className="text-slate-600 font-medium text-[11px] mt-1">
              {splitArr && <span>{splitArr}</span>}
              {splitArr && splitDep && <span className="text-slate-400 mx-0.5">/</span>}
              {splitDep && <span>{splitDep}</span>}
              {splitDay && <DayLabel day={splitDay} />}
            </span>
          </div>

          {/* Track line 2 */}
          <div className="flex-1 min-w-10 h-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full mx-2 opacity-80" />
        </>
      )}

      {/* Destination */}
      <div className="flex flex-col items-center shrink-0">
        <span className="font-bold text-slate-800 tracking-tight">{to}</span>
        <div className="relative flex items-center justify-center mt-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 shadow-md shadow-emerald-500/30 ring-4 ring-emerald-100" />
        </div>
        <span className="text-slate-500 font-medium text-[11px] mt-1">{arr} <DayLabel day={arrDay} /></span>
      </div>
    </div>
  );
}

// ── Direct Result Card ──
function DirectCard({
  result,
  onCheckSplits,
  isLoadingSplits,
  isSplitSelected,
}: {
  result: DirectResult;
  onCheckSplits?: (trainNumber: string) => void;
  isLoadingSplits?: boolean;
  isSplitSelected?: boolean;
}) {
  const isConfirmed = result.status === 'CONFIRMED';

  return (
    <div className={`liquid-glass rounded-2xl p-5 hover:shadow-lg transition-all border ${
      isSplitSelected ? 'ring-2 ring-emerald-500/80 border-emerald-300' : 'border-slate-200/80'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-base">#{result.trainNumber}</span>
            <span className="text-slate-700 font-medium text-sm">{result.trainName}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Direct Journey · Class <span className="font-semibold text-slate-700">{result.travelClass}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={result.status} detail={result.statusDetail} quota={result.quota} />
          <span className="font-bold text-slate-900 text-base">{formatFare(result.fare)}</span>
        </div>
      </div>

      <RouteTimeline
        from={result.from.code}
        to={result.to.code}
        dep={result.departureTime}
        arr={result.arrivalTime}
        depDay={result.departureDay}
        arrDay={result.arrivalDay}
      />

      {/* On-Demand RailSplit Action Button */}
      {onCheckSplits && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            {isConfirmed ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Direct berth confirmed. No split required.</span>
              </span>
            ) : (
              <span className="text-amber-800 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Direct waitlisted ({result.statusDetail || 'GNWL'}). Check for same-train splits.</span>
              </span>
            )}
          </div>

          <button
            onClick={() => onCheckSplits(result.trainNumber)}
            disabled={isLoadingSplits}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
              isConfirmed
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isLoadingSplits ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Evaluating Dijkstra…</span>
              </>
            ) : (
              <>
                <span>⚡ {isConfirmed ? 'Check RailSplit Options' : 'Find Same-Train Splits'}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isConfirmed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-700/60 text-white'}`}>
                  0m Transfer
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Split Result Card with Radiant Moving Border ──
function SplitCardInner({ result }: { result: SplitResult }) {
  return (
    <div className="p-5">
      {result.bothConfirmed && (
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold tracking-tight">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>BOTH SECTIONS CONFIRMED</span>
            <span className="text-[10px] font-normal text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              Zero Transfer Risk
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Dijkstra Shortest Path
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-base">#{result.trainNumber}</span>
            <span className="text-slate-700 font-medium text-sm">{result.trainName}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Split at <span className="font-bold text-amber-700">{result.splitStation.name} ({result.splitStation.code})</span> · Class <span className="font-semibold text-slate-700">{result.leg1.travelClass}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-slate-900 text-lg">{formatFare(result.totalFare)}</span>
          {result.totalFare !== null && (
            <div className="text-[11px] text-slate-500 font-medium">
              {formatFare(result.leg1.fare)} + {formatFare(result.leg2.fare)}
            </div>
          )}
        </div>
      </div>

      <RouteTimeline
        from={result.leg1.from.code}
        split={result.splitStation.code}
        to={result.leg2.to.code}
        dep={result.leg1.departureTime}
        splitArr={result.leg1.arrivalTime}
        splitDep={result.leg2.departureTime}
        arr={result.leg2.arrivalTime}
        depDay={result.leg1.departureDay}
        splitDay={result.leg1.arrivalDay}
        arrDay={result.leg2.arrivalDay}
      />

      {/* Sub-section details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
        <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section 1</span>
            <StatusBadge status={result.leg1.status} detail={result.leg1.statusDetail} quota={result.leg1.quota} />
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {result.leg1.from.name} → {result.leg1.to.name}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {result.leg1.departureTime} — {result.leg1.arrivalTime} · {formatFare(result.leg1.fare)}
          </div>
        </div>
        <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section 2</span>
            <StatusBadge status={result.leg2.status} detail={result.leg2.statusDetail} quota={result.leg2.quota} />
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {result.leg2.from.name} → {result.leg2.to.name}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {result.leg2.departureTime} — {result.leg2.arrivalTime} · {formatFare(result.leg2.fare)}
          </div>
        </div>
      </div>

      {/* Why this recommendation works */}
      {result.whyRecommendation && (
        <div className="mt-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-bold text-amber-950">Why this split works: </span>
            {result.whyRecommendation}
          </div>
        </div>
      )}

      {/* Separate tickets notice */}
      <div className="mt-3 bg-blue-50/80 border border-blue-200/60 rounded-xl px-3.5 py-2.5 text-xs text-blue-800 flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Separate tickets required on IRCTC. Seat/berth numbers may differ between sections, but you remain on the exact same train.</span>
      </div>

      {/* Demo booking placeholders */}
      <div className="mt-3.5 flex gap-2">
        <button
          disabled
          className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed hover:bg-slate-100"
          title="Booking placeholder in demo mode"
        >
          Book Leg 1 (Demo)
        </button>
        <button
          disabled
          className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed hover:bg-slate-100"
          title="Booking placeholder in demo mode"
        >
          Book Leg 2 (Demo)
        </button>
      </div>
    </div>
  );
}

function SplitCard({ result }: { result: SplitResult }) {
  if (result.bothConfirmed) {
    return (
      <div className="moving-border-wrapper shadow-lg hover:shadow-xl transition-all">
        <div className="moving-border-beam" />
        <div className="moving-border-inner">
          <SplitCardInner result={result} />
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-glass rounded-2xl border border-slate-200/80 hover:shadow-md transition-shadow">
      <SplitCardInner result={result} />
    </div>
  );
}

// ── Algorithmic Transparency: Dijkstra Graph Inspector ──
function DijkstraGraphInspector({
  metrics,
  fromCode,
  toCode,
}: {
  metrics?: GraphExecutionMetrics;
  fromCode: string;
  toCode: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'PENALIZED'>('ALL');

  if (!metrics || metrics.traces.length === 0) return null;

  const filteredTraces = metrics.traces.filter((t) => {
    if (filter === 'CONFIRMED') {
      return t.decision === 'OPTIMAL_RELAXED' || t.decision === 'CONFIRMED_SUBOPTIMAL';
    }
    if (filter === 'PENALIZED') {
      return t.decision === 'PENALIZED_WAITLIST' || t.decision === 'PRUNED_UNAVAILABLE';
    }
    return true;
  });

  const optimalTrace = metrics.traces.find((t) => t.decision === 'OPTIMAL_RELAXED');

  return (
    <div className="liquid-glass rounded-2xl border border-indigo-200/80 overflow-hidden shadow-lg shadow-indigo-500/5 transition-all">
      {/* Header with collapsible toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-4 bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/90 border-b border-indigo-100/80 cursor-pointer flex items-center justify-between transition-colors hover:bg-indigo-50/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/30">
            DAG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                Dijkstra Shortest-Path Execution Trace
              </h3>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-full border border-indigo-200">
                Live Graph Theory Relaxation
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified Hop-Constrained Stop-State DAG evaluation across {metrics.intermediateCandidatesCount} candidate cutpoint junctions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            ⚡ {metrics.executionTimeMs} ms
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-6">
          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DAG Vertices |V|</span>
              <span className="text-lg font-extrabold text-slate-800 font-mono mt-0.5 block">{metrics.verticesCount} States</span>
              <span className="text-[11px] text-slate-500">(Station, Hops)</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Edges Relaxed |E|</span>
              <span className="text-lg font-extrabold text-slate-800 font-mono mt-0.5 block">{metrics.edgesEvaluated} Sub-routes</span>
              <span className="text-[11px] text-slate-500">Direct + Cutpoints</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Traversal Latency</span>
              <span className="text-lg font-extrabold text-indigo-600 font-mono mt-0.5 block">{metrics.executionTimeMs} ms</span>
              <span className="text-[11px] text-slate-500">Min-Heap Priority Queue</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transfer Invariance</span>
              <span className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5 block">0 Transfers</span>
              <span className="text-[11px] text-slate-500">Same-Train Berth Switch</span>
            </div>
          </div>

          {/* Graph Topology Visual Diagram */}
          <div className="bg-slate-900 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between text-xs mb-3 text-slate-400">
              <span className="font-mono uppercase tracking-wider font-semibold">Graph Topology: Origin → Cutpoint Hubs → Destination</span>
              <span className="text-[11px] text-slate-300">Min-Heap Objective: Fare + AvailabilityPenalty</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2">
              {/* Source Node */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-600/90 border-2 border-blue-400 flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20">
                  {fromCode}
                </div>
                <span className="text-[11px] font-medium text-slate-300 mt-1.5">Source (Hop 0)</span>
              </div>

              {/* Connecting DAG Beams */}
              <div className="flex-1 w-full flex flex-col items-center gap-1.5 px-2">
                <div className="w-full text-center text-[10px] font-mono text-slate-400">
                  Exploring {metrics.traces.length} candidate cutpoints
                </div>
                <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-amber-500 relative flex items-center justify-center">
                  <div className="absolute w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  <div className="absolute px-2 py-0.5 bg-slate-800 rounded-full text-[9px] font-mono text-indigo-300 border border-indigo-500/30">
                    O(|V| log |V| + |E|)
                  </div>
                </div>
              </div>

              {/* Optimal Split Node */}
              <div className="flex flex-col items-center">
                {optimalTrace ? (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/90 border-2 border-amber-300 flex items-center justify-center font-bold text-sm shadow-lg shadow-amber-500/30 animate-pulse">
                      {optimalTrace.splitStation.code}
                    </div>
                    <span className="text-[11px] font-semibold text-amber-300 mt-1.5">
                      Relaxed Cutpoint (Hop 1)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-slate-700 border-2 border-slate-500 flex items-center justify-center font-bold text-sm">
                      —
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 mt-1.5">No Confirmed Cut</span>
                  </>
                )}
              </div>

              {/* Connecting DAG Beams */}
              <div className="flex-1 w-full flex flex-col items-center gap-1.5 px-2">
                <div className="w-full text-center text-[10px] font-mono text-slate-400">
                  Zero transfer invariance
                </div>
                <div className="w-full h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 relative flex items-center justify-center">
                  <div className="px-2 py-0.5 bg-slate-800 rounded-full text-[9px] font-mono text-emerald-300 border border-emerald-500/30">
                    Weight: {optimalTrace ? `₹${optimalTrace.totalCost}` : '∞'}
                  </div>
                </div>
              </div>

              {/* Destination Node */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/90 border-2 border-emerald-400 flex items-center justify-center font-bold text-sm shadow-lg shadow-emerald-500/20">
                  {toCode}
                </div>
                <span className="text-[11px] font-medium text-slate-300 mt-1.5">Sink (Hop 2)</span>
              </div>
            </div>
          </div>

          {/* Interactive Decision Ledger & Filter */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Dijkstra Edge Relaxation Ledger ({filteredTraces.length} Evaluated)
              </span>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                {(['ALL', 'CONFIRMED', 'PENALIZED'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilter(mode)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      filter === mode
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {mode === 'ALL' ? 'All Cutpoints' : mode === 'CONFIRMED' ? 'Confirmed Cuts' : 'Penalized / Pruned'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Cutpoint Station</th>
                    <th className="py-2.5 px-3">Leg 1 ({fromCode} → S)</th>
                    <th className="py-2.5 px-3">Leg 2 (S → {toCode})</th>
                    <th className="py-2.5 px-3">Dijkstra Cost (w)</th>
                    <th className="py-2.5 px-3">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTraces.map((trace, idx) => {
                    const isOptimal = trace.decision === 'OPTIMAL_RELAXED';
                    return (
                      <tr
                        key={`${trace.trainNumber || trace.leg1.trainNumber}-${trace.splitStation.code}-${idx}`}
                        className={isOptimal ? 'bg-emerald-50/60 font-medium' : 'hover:bg-slate-50/60'}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">
                            {trace.splitStation.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            [{trace.splitStation.code}] {trace.trainNumber ? `· #${trace.trainNumber}` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge
                            status={trace.leg1.status}
                            detail={trace.leg1.statusDetail}
                            quota={trace.leg1.quota}
                          />
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            ₹{trace.leg1.fare ?? '—'} (cost: {trace.leg1Cost})
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge
                            status={trace.leg2.status}
                            detail={trace.leg2.statusDetail}
                            quota={trace.leg2.quota}
                          />
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            ₹{trace.leg2.fare ?? '—'} (cost: {trace.leg2Cost})
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {isFinite(trace.totalCost) ? `₹${trace.totalCost}` : '∞ (Pruned)'}
                        </td>
                        <td className="py-2.5 px-3">
                          {isOptimal ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              ⭐ Shortest Path Relaxed
                            </span>
                          ) : trace.decision === 'CONFIRMED_SUBOPTIMAL' ? (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              Suboptimal (Higher Fare)
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                              +10k WL Penalty
                            </span>
                          )}
                          <div className="text-[10px] text-slate-500 mt-1 max-w-xs">
                            {trace.decisionReason}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mathematical Proof Footer */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <span className="font-bold">Algorithmic Formulation & Quota Mechanics: </span>
              In Indian Railways (IRCTC), physical train coaches are partitioned into separate station-to-station quota pools. When end-to-end direct quota (GNWL) is depleted, intermediate junction quotas (RLWL / PQWL) often remain available. The RailSplit engine constructs a Stop-State DAG and runs Dijkstra relaxation over edge costs: Cost = Fare + AvailabilityPenalty. The algorithm dynamically finds the minimum-weight 2-hop path on the identical train without transferring rakes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Results Component ──
export function SearchResults({
  results,
  onRequestSplits,
  loadingSplitsTrain,
}: {
  results: SearchResponse;
  onRequestSplits?: (trainNumber: string) => void;
  loadingSplitsTrain?: string | null;
}) {
  const { directResults, splitResults, message } = results;
  const confirmedSplits = splitResults.filter((s) => s.bothConfirmed);
  const otherSplits = splitResults.filter((s) => !s.bothConfirmed);

  const hasDirectConfirmed = directResults.some((d) => d.status === 'CONFIRMED');
  const noResults = directResults.length === 0 && splitResults.length === 0;

  // Direct-first intelligence:
  // If direct train is already confirmed, hide splits by default so user doesn't waste time!
  // If direct train is waitlisted, show splits immediately.
  const [showSplitsSection, setShowSplitsSection] = useState<boolean>(!hasDirectConfirmed);
  const [filterTrain, setFilterTrain] = useState<string | null>(null);

  const handleTrainSplitAction = (trainNumber: string) => {
    setFilterTrain(trainNumber);
    setShowSplitsSection(true);

    const hasSplitsForThisTrain = splitResults.some((s) => s.trainNumber === trainNumber);
    if (!hasSplitsForThisTrain && onRequestSplits) {
      onRequestSplits(trainNumber);
    }
  };

  const displayedConfirmedSplits = filterTrain
    ? confirmedSplits.filter((s) => s.trainNumber === filterTrain)
    : confirmedSplits;

  const displayedOtherSplits = filterTrain
    ? otherSplits.filter((s) => s.trainNumber === filterTrain)
    : otherSplits;

  return (
    <div className="mt-8 space-y-8">
      {/* Informational Message */}
      {message && (
        <div className="liquid-glass rounded-xl px-4 py-3.5 text-slate-700 text-sm font-medium border border-slate-200">
          {message}
        </div>
      )}

      {/* No results */}
      {noResults && !message && (
        <div className="liquid-glass rounded-2xl text-center py-12 text-slate-400 border border-slate-200">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-slate-600">No trains found for this route</p>
          <p className="text-sm mt-1">Try different stations or travel date.</p>
        </div>
      )}

      {/* Direct-First Status Banner */}
      {directResults.length > 0 && (
        hasDirectConfirmed ? (
          <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-emerald-500/20">
                ✓
              </div>
              <div>
                <div className="font-bold text-sm text-emerald-950">
                  Confirmed Direct Journey Available!
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Direct berths are available on your train. No ticket splitting required.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setFilterTrain(null);
                setShowSplitsSection(!showSplitsSection);
                if (!showSplitsSection && splitResults.length === 0 && onRequestSplits) {
                  onRequestSplits('ALL');
                }
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100/60 transition-all shrink-0 shadow-sm"
            >
              {showSplitsSection ? 'Hide RailSplit Alternatives' : '⚡ Check RailSplit Alternatives Anyway'}
            </button>
          </div>
        ) : (
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-amber-500/20">
                !
              </div>
              <div>
                <div className="font-bold text-sm text-amber-950">
                  Direct Ticket is Waitlisted ({directResults[0]?.statusDetail || 'GNWL'})
                </div>
                <div className="text-xs text-amber-700 mt-0.5">
                  Direct booking unavailable. Use RailSplit to unlock confirmed Remote Location Quotas (RLWL) on the exact same train.
                </div>
              </div>
            </div>
            {!showSplitsSection && (
              <button
                onClick={() => {
                  setFilterTrain(null);
                  setShowSplitsSection(true);
                  if (splitResults.length === 0 && onRequestSplits) {
                    onRequestSplits('ALL');
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shrink-0 shadow-md shadow-emerald-600/20"
              >
                ⚡ Find Confirmed Same-Train Splits
              </button>
            )}
          </div>
        )
      )}

      {/* Direct results */}
      {directResults.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Direct Journey Status ({directResults.length} Train{directResults.length > 1 ? 's' : ''})
            </h2>
            {splitResults.length > 0 && !showSplitsSection && (
              <button
                onClick={() => setShowSplitsSection(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                View RailSplit Alternatives ({splitResults.length})
              </button>
            )}
          </div>
          <div className="space-y-3">
            {directResults.map((r) => (
              <DirectCard
                key={`${r.trainNumber}-direct`}
                result={r}
                onCheckSplits={handleTrainSplitAction}
                isLoadingSplits={loadingSplitsTrain === r.trainNumber || loadingSplitsTrain === 'ALL'}
                isSplitSelected={filterTrain === r.trainNumber}
              />
            ))}
          </div>
        </section>
      )}

      {/* On-Demand RailSplit Section */}
      {showSplitsSection && (
        <>
          {/* Active filter banner if a specific train was clicked */}
          {filterTrain && (
            <div className="flex items-center justify-between bg-slate-100 rounded-xl px-4 py-2 text-xs">
              <span className="font-medium text-slate-700">
                Filtered RailSplit options for <span className="font-bold">Train #{filterTrain}</span>
              </span>
              <button
                onClick={() => setFilterTrain(null)}
                className="font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Show All Trains ({splitResults.length} Splits)
              </button>
            </div>
          )}

          {/* Dijkstra Shortest-Path Graph Theory Inspector */}
          {results.graphMetrics && results.graphMetrics.traces.length > 0 && (
            <DijkstraGraphInspector
              metrics={
                filterTrain
                  ? {
                      ...results.graphMetrics,
                      traces: results.graphMetrics.traces.filter(
                        (t) => (t.trainNumber || t.leg1.trainNumber) === filterTrain
                      ),
                    }
                  : results.graphMetrics
              }
              fromCode={results.request.from.code}
              toCode={results.request.to.code}
            />
          )}

          {/* Confirmed split results with Radiant Moving Border */}
          {displayedConfirmedSplits.length > 0 && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Confirmed Split-Seat Alternatives</span>
                  <span className="text-xs font-normal text-emerald-600">({displayedConfirmedSplits.length})</span>
                </h2>
                {!hasDirectConfirmed && (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full shadow-sm border border-emerald-300/60">
                    ⭐ Solves Unavailable Direct Booking
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {displayedConfirmedSplits.map((r, i) => (
                  <SplitCard key={`${r.trainNumber}-split-${r.splitStation.code}-${i}`} result={r} />
                ))}
              </div>
            </section>
          )}

          {/* Other split results */}
          {displayedOtherSplits.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Other Split Options
                <span className="text-xs font-normal text-slate-400">({displayedOtherSplits.length})</span>
              </h2>
              <div className="space-y-3">
                {displayedOtherSplits.map((r, i) => (
                  <SplitCard key={`${r.trainNumber}-osplit-${r.splitStation.code}-${i}`} result={r} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
