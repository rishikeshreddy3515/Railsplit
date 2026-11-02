'use client';

import React, { useState } from 'react';
import { SplitResult, SearchRequest } from '@/lib/types';
import { calculateDuration, calculateTransferDuration, formatStationName, formatFare } from '@/lib/utils';

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

  const { leg1, leg2, splitStation, totalFare, trainName, transfer, sourceQuotaTip } = split;

  const isSameTrain = split.journeyType === 'SAME_TRAIN' || leg1.trainNumber === leg2.trainNumber;

  const leg1SeatsMatch = leg1.statusDetail?.match(/\d+/)?.[0];
  const leg2SeatsMatch = leg2.statusDetail?.match(/\d+/)?.[0];

  const bookingTipText = (leg1SeatsMatch && leg2SeatsMatch)
    ? Number(leg2SeatsMatch) <= Number(leg1SeatsMatch)
      ? `Book leg 2 first. It has ${leg2SeatsMatch} seats left against ${leg1SeatsMatch} on leg 1.`
      : `Book leg 1 first. It has ${leg1SeatsMatch} seats left against ${leg2SeatsMatch} on leg 2.`
    : `Both legs have confirmed allocations in their respective station quotas.`;

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
              {split.bothConfirmed ? 'Seats confirmed on both legs' : 'Split confirmation alternative'}
            </span>
            {transfer && (
              <span
                className={`px-3 py-1 rounded-full border ${transfer.safety === 'SAFE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : transfer.safety === 'MODERATE'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
              >
                {transfer.safety === 'SAFE' ? '🟢 ' : transfer.safety === 'MODERATE' ? '🟡 ' : '🔴 '}
                {transfer.safetyLabel}
              </span>
            )}
            {transfer?.isNextDayBooking && (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
                📅 Book Leg 2 for {transfer.leg2DepartureDate || leg2.date} (+1 Day)
              </span>
            )}
            {split.isNightBerthSwitch && (
              <span className="px-3 py-1 rounded-full bg-indigo-900 text-indigo-100 border border-indigo-700 font-bold flex items-center gap-1">
                🌙 Night Berth Switch (00:00 - 05:00)
              </span>
            )}
            {split.isDaytimeOptimal && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1">
                ☀️ Practical Daytime Optimal
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              {isSameTrain ? 'Zero transfer (same train)' : `${transferDuration} layover`}
            </span>
          </div>
        </div>

        {/* Two-Column Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Vertical Timeline (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            {/* Source Quota Tip Banner if available */}
            {(sourceQuotaTip || leg1.sourceQuotaTip || leg2.sourceQuotaTip) && (
              <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950">
                <div className="flex items-center gap-2 font-black text-indigo-900 text-sm mb-1">
                  <span>💡</span>
                  <span>Routechef Source-Origin Quota Tip</span>
                </div>
                <p className="text-indigo-800 leading-relaxed mb-2">
                  {(sourceQuotaTip || leg1.sourceQuotaTip || leg2.sourceQuotaTip)?.explanation}
                </p>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-150 font-mono text-[11px] space-y-1 mb-2">
                  <div><strong>IRCTC Station to Book From:</strong> {(sourceQuotaTip || leg1.sourceQuotaTip || leg2.sourceQuotaTip)?.bookFrom.name} [{(sourceQuotaTip || leg1.sourceQuotaTip || leg2.sourceQuotaTip)?.bookFrom.code}]</div>
                  <div><strong>Official Boarding Station:</strong> {(sourceQuotaTip || leg1.sourceQuotaTip || leg2.sourceQuotaTip)?.boardAt.name} [{(sourceQuotaTip || leg1.sourceQuotaTip || leg2.sourceQuotaTip)?.boardAt.code}]</div>
                </div>
                <div className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{(sourceQuotaTip || leg1.sourceQuotaTip || leg2.sourceQuotaTip)?.boardingChangeReminder || 'Change boarding point on IRCTC at least 24 hrs before departure.'}</span>
                </div>
              </div>
            )}

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
                    {formatFare(leg1.fare)}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                <span>Class: <strong className="text-slate-800">{leg1.travelClass}</strong></span>
                <span>·</span>
                <span>Quota: <strong className="text-slate-800">{leg1.quota || 'RLWL'}</strong></span>
                {leg1.historicalDelay && (
                  <>
                    <span>·</span>
                    <span>Delay: ~{leg1.historicalDelay.averageDelayMinutes}m ({leg1.historicalDelay.onTimePercentage}% on-time)</span>
                  </>
                )}
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
                <span>{isSameTrain ? 'Berth switch on same train' : 'Change trains at junction'}</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                {isSameTrain
                  ? 'You remain on the exact same physical train rake. You simply switch to your confirmed berth for leg 2.'
                  : transfer?.isCrossStation
                    ? transfer.commuteInstruction
                    : 'Platform change at junction. Waiting hall and retiring rooms available on station premises.'}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-white text-orange-700 border border-orange-200">
                  {isSameTrain ? '0m transfer · Zero missed connection risk' : `${transferDuration} layover`}
                </span>
                {!isSameTrain && transfer && (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-white text-slate-700 border border-slate-200">
                    Predicted wait: ~{transfer.predictedWaitMinutes} mins
                  </span>
                )}
                {transfer && (
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${transfer.safety === 'SAFE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : transfer.safety === 'MODERATE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                    {transfer.safetyLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Intermediate Split Halt (Depart) */}
            <div className="relative pl-7 pb-6 border-l-2 border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                Depart {leg2.departureTime} {transfer?.isNextDayBooking ? `(${transfer.leg2DepartureDate || leg2.date} · +1 Day)` : ''}
              </div>
              {transfer?.isNextDayBooking && (
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200">
                    📅 Book Leg 2 for {transfer.leg2DepartureDate || leg2.date} (+1 Day)
                  </span>
                </div>
              )}
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
                    {formatFare(leg2.fare)}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                <span>Class: <strong className="text-slate-800">{leg2.travelClass}</strong></span>
                <span>·</span>
                <span>Quota: <strong className="text-slate-800">{leg2.quota || 'RLWL'}</strong></span>
                {leg2.historicalDelay && (
                  <>
                    <span>·</span>
                    <span>Delay: ~{leg2.historicalDelay.averageDelayMinutes}m ({leg2.historicalDelay.onTimePercentage}% on-time)</span>
                  </>
                )}
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

            {/* Dual PNR Alert Box */}
            <div className="mt-8 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-xs text-amber-950 flex items-start gap-3 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                !
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="font-extrabold text-amber-950 block text-sm">
                  Important IRCTC Dual-PNR Booking Rule
                </span>
                <p className="text-amber-900 leading-relaxed font-medium">
                  {transfer?.isNextDayBooking ? (
                    <>
                      Important IRCTC Rule: Book <strong>PNR #1 ({request.from.code} → {splitStation.code})</strong> for <strong>{leg1.date}</strong>, and book <strong>PNR #2 ({splitStation.code} → {request.to.code})</strong> for <strong>{transfer.leg2DepartureDate || leg2.date}</strong> (when the train arrives at {splitStation.name}).
                    </>
                  ) : (
                    <>
                      Book <strong>PNR #1 ({request.from.code} → {splitStation.code})</strong> and <strong>PNR #2 ({splitStation.code} → {request.to.code})</strong> for <strong>{leg1.date}</strong>. {isSameTrain ? 'Both tickets are for the same physical train rake—you simply switch to your confirmed berth.' : `Connecting journey across ${splitStation.name}.`}
                    </>
                  )}
                </p>
                {split.isNightBerthSwitch && (
                  <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded text-indigo-900 text-[11px] font-medium">
                    🌙 <strong>Night Switch Notice:</strong> The berth change occurs between 00:00 and 05:00. Set an alarm 15 minutes before arrival.
                  </div>
                )}
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
                  <span className="font-mono font-bold text-white">{formatFare(leg1.fare)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Leg 2 · {splitStation.code} to {request.to.code} ({leg2.travelClass})</span>
                  <span className="font-mono font-bold text-white">{formatFare(leg2.fare)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>IRCTC charges</span>
                  <span>Added at booking</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs text-slate-300">Total before charges</span>
                <span className="text-2xl font-black text-white">
                  {formatFare(totalFare ?? ((leg1.fare ?? 0) + (leg2.fare ?? 0)))}
                </span>
              </div>

              {/* Telescopic Direct Fare Comparison Delta */}
              {split.directFareComparison && (
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/80 mb-5 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Direct train base fare:</span>
                    <span className="font-mono font-semibold text-slate-200">₹{split.directFareComparison.directFare}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>Telescopic fare delta:</span>
                    <span className="font-mono">
                      {split.directFareComparison.fareDifference >= 0 ? `+₹${split.directFareComparison.fareDifference}` : `-₹${Math.abs(split.directFareComparison.fareDifference)}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight pt-0.5">
                    Minor telescopic booking delta unlocks confirmed berths across separate station quotas.
                  </p>
                </div>
              )}

              {/* Booking Advice */}
              <div className="bg-slate-800/80 rounded-xl p-3 text-xs text-slate-300 mb-5 border border-slate-700/80">
                <span className="font-bold text-white block mb-0.5">Booking Tip:</span>
                {bookingTipText}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <a
                  href="https://www.irctc.co.in/nget/train-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#f95738] hover:bg-[#e04526] text-white font-extrabold text-xs sm:text-sm text-center block transition-all shadow-md shadow-orange-500/20"
                >
                  Book leg 2 on IRCTC {transfer?.isNextDayBooking ? `(${transfer.leg2DepartureDate || leg2.date}) ` : ''}→
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
