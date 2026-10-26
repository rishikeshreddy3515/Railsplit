'use client';

import React from 'react';
import { BrandLogo } from './BrandLogo';

export function LandingSections({
  onSelectRoute,
}: {
  onSelectRoute?: (from: string, to: string) => void;
}) {
  return (
    <div className="bg-[#f8fafc] text-slate-900">
      {/* ── Section 1: Three steps from sold out to a seat ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight max-w-md">
            Three steps from <br />
            sold out to a seat
          </h2>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed">
            The search runs the same way every time, so you always see direct trains
            before anything split.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="pt-4 border-t-2 border-[#f95738]">
            <span className="text-[11px] font-mono font-bold uppercase text-[#f95738] tracking-wider block mb-2">
              STEP 1
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Pick your route and date
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Enter where you start and where you need to reach. Choose a class or leave it open.
            </p>
          </div>

          {/* Step 2 */}
          <div className="pt-4 border-t-2 border-[#f95738]">
            <span className="text-[11px] font-mono font-bold uppercase text-[#f95738] tracking-wider block mb-2">
              STEP 2
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              We check direct, then every stop
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              If no direct seat exists, Rail Split tests each station on the way and pairs trains with a safe change time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="pt-4 border-t-2 border-[#f95738]">
            <span className="text-[11px] font-mono font-bold uppercase text-[#f95738] tracking-wider block mb-2">
              STEP 3
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Book each leg on IRCTC
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Passenger details carry across every leg. You finish each booking on the official site.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Comparison Showcase ── */}
      <section className="bg-white border-y border-slate-200/80 py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-2">
              JODHPUR TO VIJAYAWADA · FRI 6 NOV
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              The same trip, two different answers
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Direct Waitlisted */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-base">Booking one ticket end to end</span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                    Waitlisted
                  </span>
                </div>

                <div className="space-y-4 text-sm font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Sleeper</span>
                    <span className="font-mono font-bold text-rose-600">WL 112</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">3A</span>
                    <span className="font-mono font-bold text-rose-600">WL 64</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">2A</span>
                    <span className="font-mono font-bold text-amber-700">RLWL 23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">1A</span>
                    <span className="font-mono font-bold text-rose-600">WL 7</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 font-medium">
                Every class is on the waitlist, so the train looks full.
              </div>
            </div>

            {/* Right Card: Two tickets split (Dark Navy Theme) */}
            <div className="bg-[#0b1329] text-white rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                  <span className="font-bold text-white text-base">Two tickets, split at New Delhi</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full">
                    Seats on both
                  </span>
                </div>

                {/* Sub-leg 1 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-200">Jodhpur Jn</span>
                    <span className="text-slate-400 font-mono">20:35</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Mandore Express · 3A · <span className="text-emerald-400 font-bold">AVL 14</span> · ₹1,180
                  </div>
                </div>

                {/* Transfer Callout */}
                <div className="my-3 py-2 px-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">New Delhi 05:10 → 07:25</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                    2h 15m change
                  </span>
                </div>

                {/* Sub-leg 2 */}
                <div>
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-200">Vijayawada Jn</span>
                    <span className="text-slate-400 font-mono">05:40 +1</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Andhra Pradesh Express · 2A · <span className="text-emerald-400 font-bold">AVL 6</span> · ₹3,000
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total for 2 tickets</span>
                <span className="text-2xl font-black text-white">₹4,180</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Routes people search when trains fill up ── */}
      <section id="popular-routes" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-8">
          Routes people search when trains fill up
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              from: 'Jodhpur',
              to: 'Vijayawada',
              fromCode: 'JU',
              toCode: 'BZA',
              hint: 'Often split at New Delhi or Solapur',
            },
            {
              from: 'Jaipur',
              to: 'Chennai',
              fromCode: 'JP',
              toCode: 'MAS',
              hint: 'Try a change at New Delhi or Nagpur',
            },
            {
              from: 'Ahmedabad',
              to: 'Kolkata',
              fromCode: 'ADI',
              toCode: 'HWH',
              hint: 'Try a change at Nagpur or Vadodara',
            },
            {
              from: 'Delhi',
              to: 'Vijayawada',
              fromCode: 'NDLS',
              toCode: 'BZA',
              hint: 'Try a change at Bhopal or Nagpur',
            },
          ].map((r) => (
            <button
              key={`${r.fromCode}-${r.toCode}`}
              onClick={() => onSelectRoute && onSelectRoute(r.fromCode, r.toCode)}
              className="text-left bg-white border border-slate-200 hover:border-[#f95738] rounded-2xl p-5 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-base group-hover:text-[#f95738] transition-colors">
                  {r.from} → {r.to}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {r.fromCode} · {r.toCode}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">{r.hint}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Section 4: Split tickets are separate bookings ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Split tickets are separate bookings
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed mb-6">
            If the first train runs late, the second ticket is not protected by the first.
            Rail Split recommends at least 90 minutes between trains and marks anything tighter in amber.
            For same-train splits, transfer risk is strictly 0m.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              90 min or more: comfortable
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              60 to 89 min: tight
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
              Under 60 min: hidden
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 5: Footer ── */}
      <footer className="bg-[#0b1329] text-white border-t border-slate-800/80 pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
            {/* Logo column */}
            <div className="md:col-span-2">
              <BrandLogo className="mb-4" />
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                Find the seats other searches miss by combining tickets across stations with mathematical shortest-path optimization.
              </p>
            </div>

            {/* Product */}
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3">
                Product
              </span>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Search trains</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#popular-routes" className="hover:text-white transition-colors">Popular routes</a></li>
              </ul>
            </div>

            {/* Help */}
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3">
                Help
              </span>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">PNR status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3">
                Legal
              </span>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 text-[11px] text-slate-500 leading-relaxed text-center sm:text-left">
            Rail Split is not affiliated with Indian Railways or IRCTC. Every ticket is booked on the official IRCTC platform.
            Trains, times, seats and fares on this page are sample data for design preview and algorithm verification.
          </div>
        </div>
      </footer>
    </div>
  );
}
