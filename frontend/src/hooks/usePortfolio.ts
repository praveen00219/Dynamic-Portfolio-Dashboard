'use client';
import { useState, useEffect, useCallback } from 'react';
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
 * Custom hook that fetches all three portfolio endpoints in parallel
 * and re-fetches every 15 seconds.
 *
 * On refresh the previous data remains visible (no loading flash) while
 * new data loads — this is the "stale-while-revalidate" pattern.
 */
export function usePortfolio() {
  const [state, setState] = useState<PortfolioState>(initialState);

  const fetchAll = useCallback(async () => {
    try {
      const [stocks, sectors, summary] = await Promise.all([
        portfolioApi.getPortfolio(),
        portfolioApi.getSectors(),
        portfolioApi.getSummary(),
      ]);

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
    }
  }, []); // setState is stable — safe to omit from deps

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval); // cleanup on unmount
  }, [fetchAll]);

  return { ...state, refresh: fetchAll };
}