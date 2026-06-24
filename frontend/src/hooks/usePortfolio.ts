'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { portfolioApi } from '../services/apiService';
import { StockData, SectorSummary, PortfolioSummary } from '../types';

const REFRESH_INTERVAL_MS = 15_000;

interface PortfolioState {
  stocks: StockData[];
  sectors: SectorSummary[];
  summary: PortfolioSummary | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: PortfolioState = {
  stocks: [],
  sectors: [],
  summary: null,
  loading: true,
  error: null,
  lastUpdated: null,
};

/**
 * Custom hook that fetches the combined dashboard payload and re-fetches every
 * 15 seconds, with three polling optimizations:
 *
 *   - No overlap: an in-flight guard plus a self-scheduling setTimeout (the next
 *     tick is queued only after the current fetch settles) prevent stacked
 *     requests on a slow network.
 *   - Pause when hidden: polling stops while the tab is in the background.
 *   - Resume on focus: returning to the tab triggers an immediate refresh.
 *
 * On refresh the previous data stays visible (no loading flash) while new data
 * loads — the "stale-while-revalidate" pattern.
 */
export function usePortfolio() {
  const [state, setState] = useState<PortfolioState>(initialState);

  // Guards against overlapping requests: while a fetch is running, any other
  // trigger (interval tick, tab re-focus, manual refresh) is skipped.
  const isFetchingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      // Single request — backend returns stocks, sectors, and summary together.
      const { stocks, sectors, summary } = await portfolioApi.getDashboard();

      setState({
        stocks,
        sectors,
        summary,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch portfolio data',
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []); // setState/refs are stable — safe to omit from deps

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const clearPending = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const scheduleNext = () => {
      clearPending();
      timeoutId = setTimeout(run, REFRESH_INTERVAL_MS);
    };

    // One poll cycle: fetch, then queue the next tick — but only while the tab
    // is visible, so a backgrounded tab stops polling entirely.
    const run = async () => {
      await fetchAll();
      if (!document.hidden) scheduleNext();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        clearPending(); // pause polling in the background
      } else {
        run(); // resume: refresh immediately, then restart the cycle
      }
    };

    run(); // initial load + start polling
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearPending();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchAll]);

  return { ...state, refresh: fetchAll };
}