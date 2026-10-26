'use client';

import React, { useState } from 'react';
import { SplitResult, SearchRequest } from '@/lib/types';
import { calculateDuration, calculateTransferDuration, formatStationName } from '@/lib/utils';

interface JourneyDetailViewProps {
  split: SplitResult;
  request: SearchRequest;
  onBack: () => void;
}

export function JourneyDetailView({
  split,
  request,
  onBack,
}: JourneyDetailViewProps) {
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('');
  const [passengerBerth, setPassengerBerth] = useState('No preference');
  const [alertLate, setAlertLate] = useState(true);

  const { leg1, leg2, splitStation, totalFare, trainName } = split;

  const leg1Seats = leg1.statusDetail?.match(/\d+/)?.[0] || '12';
  const leg2Seats = leg2.statusDetail?.match(/\d+/)?.[0] || '8';

  const isSameTrain = leg1.trainNumber === leg2.trainNumber;

  const totalDuration = calculateDuration(
    leg1.departureTime,
    leg1.departureDay,
    leg2.arrivalTime,
    leg2.arrivalDay
  );

  const leg1Duration = calculateDuration(
    leg1.departureTime,
    leg1.departureDay,
    leg1.arrivalTime,
    leg1.arrivalDay
  );

  const leg2Duration = calculateDuration(
    leg2.departureTime,
    leg2.departureDay,
    leg2.arrivalTime,
    leg2.arrivalDay
  );

  const transferDuration = calculateTransferDuration(
    leg1.arrivalTime,
    leg1.arrivalDay,
    leg2.departureTime,
    leg2.departureDay
  );

  return (
    <div className="bg-[#f8fafc] text-slate-900 min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 group cursor-pointer"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          <span>Back to results</span>
        </button>

        {/* Title & Badges */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
            {formatStationName(request.from.name)} to{' '}
            {formatStationName(request.to.name)}, split at{' '}
            {formatStationName(splitStation.name)}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white">
              2 tickets
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {totalDuration} door to door
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Seats on both legs
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              {isSameTrain ? 'Zero transfer (same train)' : `${transferDuration} change`}
            </span>
          </div>
        </div>

        {/* Two-Column Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Vertical Timeline (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            {/* 1. Origin Halt */}
            <div className="relative pl-7 pb-6 border-l-2 border-slate-200">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-sm" />
              <div className="font-bold text-slate-900 text-base">{request.from.name}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Depart {leg1.date} · {leg1.departureTime}
              </div>
            </div>

            {/* Leg 1 Train Box */}
            <div className="ml-7 my-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    {leg1.trainName || trainName} #{leg1.trainNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">Duration ~{leg1Duration}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {leg1.statusDetail || leg1.status}
                  </span>
                  <div className="text-xs font-extrabold text-slate-900 mt-1">
                    ₹{leg1.fare ?? 1180}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                <span>Class: <strong className="text-slate-800">{leg1.travelClass}</strong></span>
                <span>·</span>
                <span>Quota: <strong className="text-slate-800">{leg1.quota || 'RLWL'}</strong></span>
              </div>
            </div>

            {/* 2. Intermediate Split Halt (Arrive) */}
            <div className="relative pl-7 pt-4 pb-2 border-l-2 border-slate-200">
              <div className="absolute -left-[9px] top-5 w-4 h-4 rounded-full bg-[#f95738] border-2 border-white shadow-sm" />
              <div className="font-bold text-slate-900 text-base">{splitStation.name}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Arrive {leg1.arrivalTime}
              </div>
            </div>

            {/* Change Announcement Box */}
            <div className="ml-7 my-4 p-4 rounded-xl bg-orange-50 border border-orange-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-[#f95738] mb-1">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>{isSameTrain ? 'Berth switch on same train' : 'Change trains here'}</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                {isSameTrain
                  ? 'You remain on the exact same physical train rake. You simply switch to your confirmed berth for leg 2.'
                  : 'Waiting hall and retiring rooms are on the station premises.'}
              </p>
              <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-white text-orange-700 border border-orange-200">
                {isSameTrain ? '0m transfer · Zero missed connection risk' : `${transferDuration} · comfortable change`}
              </span>
            </div>

            {/* Intermediate Split Halt (Depart) */}
            <div className="relative pl-7 pb-6 border-l-2 border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Depart {leg2.departureTime}
              </div>
            </div>

            {/* Leg 2 Train Box */}
            <div className="ml-7 my-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    {leg2.trainName || trainName} #{leg2.trainNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">Duration ~{leg2Duration}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {leg2.statusDetail || leg2.status}
                  </span>
                  <div className="text-xs font-extrabold text-slate-900 mt-1">
                    ₹{leg2.fare ?? 3000}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                <span>Class: <strong className="text-slate-800">{leg2.travelClass}</strong></span>
                <span>·</span>
                <span>Quota: <strong className="text-slate-800">{leg2.quota || 'RLWL'}</strong></span>
              </div>
            </div>

            {/* 3. Destination Halt */}
            <div className="relative pl-7 pt-4">
              <div className="absolute -left-[9px] top-5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
              <div className="font-bold text-slate-900 text-base">{request.to.name}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Arrive {leg2.arrivalTime} {leg2.arrivalDay > 1 ? `(+${leg2.arrivalDay - 1})` : ''}
              </div>
            </div>

            {/* Warning Callout Box */}
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                !
              </div>
              <div>
                <span className="font-bold block mb-1">These are two separate bookings</span>
                <p className="text-amber-800 leading-relaxed">
                  {isSameTrain
                    ? 'Both sections are booked as two separate PNRs on IRCTC for the same train rake. This unlocks separate station-quota berths.'
                    : 'If the first train arrives late, your second ticket is not held for you. Rail Split alerts you when leg 1 is running behind so you can decide early.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Fare Breakdown & Booking Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Fare Breakdown Card */}
            <div className="bg-[#0b1329] text-white rounded-2xl p-6 sm:p-7 shadow-xl">
              <h3 className="font-bold text-white text-base mb-4">Fare breakdown</h3>

              <div className="space-y-3 text-xs border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Leg 1 · {request.from.code} to {splitStation.code} ({leg1.travelClass})</span>
                  <span className="font-mono font-bold text-white">₹{leg1.fare ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Leg 2 · {splitStation.code} to {request.to.code} ({leg2.travelClass})</span>
                  <span className="font-mono font-bold text-white">₹{leg2.fare ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>IRCTC charges</span>
                  <span>Added at booking</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-6">
                <span className="text-xs text-slate-300">Total before charges</span>
                <span className="text-2xl font-black text-white">
                  ₹{totalFare ?? ((leg1.fare ?? 0) + (leg2.fare ?? 0))}
                </span>
              </div>

              {/* Booking Advice */}
              <div className="bg-slate-800/80 rounded-xl p-3 text-xs text-slate-300 mb-5 border border-slate-700/80">
                <span className="font-bold text-white block mb-0.5">Booking Tip:</span>
                Book leg 2 first. It has {leg2Seats} seats left against {leg1Seats} on leg 1.
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <a
                  href="https://www.irctc.co.in/nget/train-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#f95738] hover:bg-[#e04526] text-white font-extrabold text-xs sm:text-sm text-center block transition-all shadow-md shadow-orange-500/20"
                >
                  Book leg 2 on IRCTC →
                </a>

                <a
                  href="https://www.irctc.co.in/nget/train-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm text-center block border border-slate-700 transition-all"
                >
                  Book leg 1 on IRCTC →
                </a>
              </div>
            </div>

            {/* Passenger Details Helper Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Passenger, saved once</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    NAME AS ON ID
                  </label>
                  <input
                    type="text"
                    placeholder="Passenger full name"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-[#f95738]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      AGE
                    </label>
                    <input
                      type="number"
                      placeholder="Age"
                      value={passengerAge}
                      onChange={(e) => setPassengerAge(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-[#f95738]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      BERTH
                    </label>
                    <select
                      value={passengerBerth}
                      onChange={(e) => setPassengerBerth(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-[#f95738] cursor-pointer"
                    >
                      <option value="No preference">No preference</option>
                      <option value="Lower">Lower</option>
                      <option value="Middle">Middle</option>
                      <option value="Upper">Upper</option>
                      <option value="Side Lower">Side Lower</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={alertLate}
                      onChange={(e) => setAlertLate(e.target.checked)}
                      className="w-4 h-4 text-[#f95738] rounded border-slate-300 focus:ring-[#f95738]"
                    />
                    <span>Alert me if leg 1 runs late</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
