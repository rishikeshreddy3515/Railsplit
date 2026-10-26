"use client";

import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem } from "@/components/ui/navbar-menu";
import { cn } from "@/lib/utils";

export function RailSplitNavbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className={cn("relative z-50 flex justify-center", className)}>
      <Menu setActive={setActive}>
        <MenuItem setActive={setActive} active={active} item="Dijkstra Engine">
          <div className="flex flex-col space-y-3 text-xs w-64 p-1">
            <div>
              <span className="font-bold text-slate-900 block">Same-Train State DAG</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                Evaluates a 2-hop state graph across all intermediate commercial halts.
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Zero-Transfer Invariance</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                Stays on the exact same physical train rake—zero missed connection risk.
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Status: 100% Active</span>
              <span className="text-[10px] text-slate-400">O(K) Complexity</span>
            </div>
          </div>
        </MenuItem>

        <MenuItem setActive={setActive} active={active} item="Railway Quotas">
          <div className="flex flex-col space-y-3 text-xs w-64 p-1">
            <div>
              <span className="font-bold text-slate-900 block">GNWL (General Quota)</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                End-to-end quota pooled across all passengers; frequently hits heavy waitlist.
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">RLWL (Remote Location)</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                Dedicated station-pair quotas at major junction hubs that unlock confirmed split seats.
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">PQWL (Pooled Quota)</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                Shared intermediate wayside station pool evaluated as secondary candidates.
              </span>
            </div>
          </div>
        </MenuItem>

        <MenuItem setActive={setActive} active={active} item="Hybrid API">
          <div className="flex flex-col space-y-3 text-xs w-64 p-1">
            <div>
              <span className="font-bold text-slate-900 block">TTL Quota Protection</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                In-memory 2-hour cache eliminates redundant live queries and saves 95%+ of API credits.
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block">Pluggable Provider</span>
              <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                Compatible with RailRadar v1, RapidAPI IRCTC, and local timetable graph.
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <HoveredLink href="/api/provider-status" target="_blank" className="text-blue-600 font-semibold hover:underline block">
                View Live Diagnostics Endpoint →
              </HoveredLink>
            </div>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}

export default RailSplitNavbar;
