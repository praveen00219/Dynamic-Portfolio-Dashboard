'use client';
import React from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import SummaryCards from '../components/Dashboard/SummaryCards';
import PortfolioTable from '../components/Dashboard/PortfolioTable';
import SectorSummary from '../components/Dashboard/SectorSummary';
import AllocationChart from '../components/Dashboard/AllocationChart';
import SectorChart from '../components/Dashboard/SectorChart';

export default function DashboardPage() {
  const { stocks, sectors, summary, loading, error, lastUpdated, refresh } = usePortfolio();

  // Show full-page spinner only on the very first load
  if (loading && stocks.length === 0) return <LoadingSpinner />;

  if (error && stocks.length === 0) {
    return <ErrorMessage message={error} onRetry={refresh} />;
  }

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-6 md:px-8">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Portfolio Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              NSE live data · auto-refreshes every 15 s
            </p>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-xs text-red-400 bg-red-950/50 border border-red-700/50 px-3 py-1 rounded-full">
                Refresh failed — showing cached data
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refresh}
              className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ── Summary Cards ─────────────────────────────────────────── */}
        {summary && <SummaryCards summary={summary} />}

        {/* ── Charts ────────────────────────────────────────────────── */}
        {stocks.length > 0 && sectors.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AllocationChart stocks={stocks} />
            <SectorChart sectors={sectors} />
          </div>
        )}

        {/* ── Sector Breakdown ──────────────────────────────────────── */}
        {sectors.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-300 mb-3">Sector Breakdown</h2>
            <SectorSummary sectors={sectors} />
          </section>
        )}

        {/* ── Holdings Table ────────────────────────────────────────── */}
        {stocks.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-300 mb-3">Holdings</h2>
            <PortfolioTable stocks={stocks} />
          </section>
        )}

        {/* ── Disclaimer ────────────────────────────────────────────── */}
        <p className="text-xs text-gray-600 text-center pb-4">
          Data sourced via Yahoo Finance (unofficial). For informational purposes only — not financial advice.
        </p>
      </div>
    </main>
  );
}