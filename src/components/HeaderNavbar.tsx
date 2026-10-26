'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BrandLogo } from './BrandLogo';
import { ProviderDiagnostics } from '@/lib/hybrid-provider';

export function HeaderNavbar({
  onResetSearch,
}: {
  onResetSearch?: () => void;
}) {
  const [diagnostics, setDiagnostics] = useState<ProviderDiagnostics | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<{
    success: boolean;
    status: number;
    message: string;
    raw?: string;
  } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    try {
      const res = await fetch('/api/provider-status');
      const data = await res.json();
      if (data.diagnostics) {
        setDiagnostics(data.diagnostics);
      }
    } catch {
      // Ignore background fetch failure
    }
  }, []);

  useEffect(() => {
    let active = true;
    const poll = () => {
      if (!active) return;
      void fetchDiagnostics();
    };

    poll();
    const interval = setInterval(poll, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchDiagnostics]);

  const handleTestKey = async (save: boolean = false) => {
    if (!inputKey.trim()) return;
    setTesting(true);
    setTestOutput(null);
    setActionFeedback(null);

    try {
      const res = await fetch('/api/provider-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: inputKey.trim(),
          testOnly: !save,
        }),
      });
      const data = await res.json();
      if (data.testResult) {
        setTestOutput(data.testResult);
      }
      if (data.diagnostics) {
        setDiagnostics(data.diagnostics);
      }
      if (save) {
        setActionFeedback('New API key saved in memory and cache refreshed!');
      }
    } catch (err) {
      setTestOutput({
        success: false,
        status: 0,
        message: err instanceof Error ? err.message : 'Network failure',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await fetch('/api/provider-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearCache: true }),
      });
      const data = await res.json();
      if (data.diagnostics) {
        setDiagnostics(data.diagnostics);
      }
      setActionFeedback('Cache cleared! Next search will query live endpoints.');
    } catch {
      setActionFeedback('Failed to clear cache.');
    }
  };

  return (
    <>
      <nav className="bg-[#0b1329] border-b border-slate-800/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onResetSearch}
            className="hover:opacity-90 transition-opacity focus:outline-none"
          >
            <BrandLogo />
          </button>

          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <button
              onClick={onResetSearch}
              className="hover:text-white transition-colors"
            >
              Search trains
            </button>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              How it works
            </a>
            <a
              href="#popular-routes"
              className="hover:text-white transition-colors"
            >
              Popular routes
            </a>
            <a
              href="#pnr-status"
              className="hover:text-white transition-colors"
            >
              PNR status
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* API Status Telemetry Pill */}
            <button
              onClick={() => {
                setShowApiModal(true);
                fetchDiagnostics();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm cursor-pointer hover:scale-105 active:scale-95"
              style={{
                backgroundColor: diagnostics?.isLiveApiConfigured
                  ? diagnostics.lastApiStatus === 429
                    ? 'rgba(239, 68, 68, 0.15)'
                    : diagnostics.lastApiStatus === 200
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(99, 102, 241, 0.15)',
                borderColor: diagnostics?.isLiveApiConfigured
                  ? diagnostics.lastApiStatus === 429
                    ? 'rgba(239, 68, 68, 0.4)'
                    : diagnostics.lastApiStatus === 200
                    ? 'rgba(16, 185, 129, 0.4)'
                    : 'rgba(245, 158, 11, 0.4)'
                  : 'rgba(99, 102, 241, 0.4)',
                color: diagnostics?.isLiveApiConfigured
                  ? diagnostics.lastApiStatus === 429
                    ? '#f87171'
                    : diagnostics.lastApiStatus === 200
                    ? '#34d399'
                    : '#fbbf24'
                  : '#a5b4fc',
              }}
              title="Click to view Live API Diagnostics & Quota Telemetry"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  diagnostics?.isLiveApiConfigured
                    ? diagnostics.lastApiStatus === 429
                      ? 'bg-rose-500 animate-pulse'
                      : diagnostics.lastApiStatus === 200
                      ? 'bg-emerald-400'
                      : 'bg-amber-400 animate-ping'
                    : 'bg-indigo-400'
                }`}
              />
              <span className="hidden sm:inline">
                {diagnostics?.isLiveApiConfigured
                  ? diagnostics.lastApiStatus === 429
                    ? 'API: 429 Quota Exceeded'
                    : diagnostics.lastApiStatus === 200
                    ? `API: Live 200 OK (${diagnostics.apiSuccesses})`
                    : 'API: Key Active'
                  : 'Engine: Local DAG'}
              </span>
              <span className="sm:hidden">
                {diagnostics?.isLiveApiConfigured
                  ? diagnostics.lastApiStatus === 429
                    ? '429 Limit'
                    : 'Live API'
                  : 'Local'}
              </span>
            </button>

            <button
              onClick={() => alert('Demo Mode: User authentication is simulated in local environment.')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all"
            >
              Log in
            </button>
          </div>
        </div>
      </nav>

      {/* ── Interactive Live API Diagnostics & Key Switcher Modal ── */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1329] border border-slate-700 rounded-3xl max-w-xl w-full text-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#f95738] flex items-center justify-center font-bold text-sm">
                  ⚡
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Live Railway API Telemetry</h3>
                  <p className="text-[11px] text-slate-400">Real-time status, quota protection, and key management</p>
                </div>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Attempts</span>
                <span className="text-xl font-black text-amber-400">{diagnostics?.apiAttempts ?? 0}</span>
                <span className="text-[9px] text-slate-500 block">HTTP calls fired</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Successes</span>
                <span className="text-xl font-black text-emerald-400">{diagnostics?.apiSuccesses ?? 0}</span>
                <span className="text-[9px] text-slate-500 block">HTTP 200 OK</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fallbacks</span>
                <span className="text-xl font-black text-rose-400">{diagnostics?.fallbackCount ?? 0}</span>
                <span className="text-[9px] text-slate-500 block">DAG protected</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cache Hits</span>
                <span className="text-xl font-black text-blue-400">{diagnostics?.cacheHits ?? 0}</span>
                <span className="text-[9px] text-slate-500 block">Credits saved</span>
              </div>
            </div>

            {/* Status Alert Box */}
            {diagnostics?.isLiveApiConfigured ? (
              diagnostics.lastApiStatus === 429 ? (
                <div className="bg-rose-950/50 border border-rose-800/80 rounded-2xl p-4 text-xs text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>Remote Server Responded with HTTP 429 (Rate Limit / Quota Exceeded)</span>
                  </div>
                  <p className="text-[11px] text-rose-300 leading-relaxed">
                    Your key <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono text-rose-200">{diagnostics.maskedApiKey}</code> was triggered, but the remote provider reported:
                  </p>
                  <div className="bg-black/40 p-2.5 rounded-xl font-mono text-[11px] text-rose-300 border border-rose-900/50 break-all">
                    {diagnostics.lastApiError || 'Monthly quota exceeded. Maximum 100 requests per month.'}
                  </div>
                  <p className="text-[11px] text-rose-400/90">
                    💡 <strong>Safe Fallback Active:</strong> RailSplit automatically protected your session by serving high-fidelity deterministic timetable results from the local Dijkstra engine so you never encounter downtime.
                  </p>
                </div>
              ) : diagnostics.lastApiStatus === 200 ? (
                <div className="bg-emerald-950/50 border border-emerald-800/80 rounded-2xl p-4 text-xs text-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Live Railway API Connected and Operational (200 OK)</span>
                  </div>
                  <p className="text-[11px] text-emerald-300">
                    Provider: <span className="font-semibold text-white">{diagnostics.configuredProvider}</span> ({diagnostics.baseUrl})
                  </p>
                </div>
              ) : (
                <div className="bg-amber-950/50 border border-amber-800/80 rounded-2xl p-4 text-xs text-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>API Key Configured: {diagnostics.maskedApiKey}</span>
                  </div>
                  <p className="text-[11px] text-amber-300">
                    Provider endpoint: {diagnostics.baseUrl} · Ready for searches.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-indigo-950/50 border border-indigo-800/80 rounded-2xl p-4 text-xs text-indigo-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-indigo-400">
                  <span>Running in High-Fidelity Local Engine Mode</span>
                </div>
                <p className="text-[11px] text-indigo-300">
                  Full multi-stop Dijkstra graph calculation with 0-transfer invariance. Add an API key below to enable live network verification.
                </p>
              </div>
            )}

            {/* Test or Switch API Key Form */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Test or Apply an API Key
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Paste RailRadar or RapidAPI key (e.g. rg_...)"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-[#f95738]"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleTestKey(false)}
                    disabled={testing || !inputKey.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    {testing ? 'Testing ping…' : 'Ping Live API'}
                  </button>
                  <button
                    onClick={() => handleTestKey(true)}
                    disabled={testing || !inputKey.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f95738] hover:bg-[#e04526] disabled:opacity-50 text-white transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    Save & Activate
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="ml-auto px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>

              {/* Action feedback */}
              {actionFeedback && (
                <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl mt-2">
                  {actionFeedback}
                </div>
              )}

              {/* Test Output Box */}
              {testOutput && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono space-y-1 mt-2 ${
                    testOutput.success
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{testOutput.success ? '✓ 200 OK' : `✕ Status: ${testOutput.status}`}</span>
                    <span className="text-[10px] text-slate-400">Test Probe</span>
                  </div>
                  <p className="text-[11px]">{testOutput.message}</p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowApiModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Close Telemetry Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
