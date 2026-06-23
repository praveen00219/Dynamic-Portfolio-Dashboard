import axios from 'axios';
import { ApiResponse, StockData, SectorSummary, PortfolioSummary } from '../types';

// In development, Next.js rewrites /api/* to the Express backend (see next.config.ts).
// In production, set NEXT_PUBLIC_API_URL to the deployed backend URL.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  if (!res.data.success) {
    throw new Error(res.data.error ?? 'API returned an error');
  }
  return res.data.data;
}

export const portfolioApi = {
  getPortfolio: () =>
    unwrap(client.get<ApiResponse<StockData[]>>('/api/portfolio')),

  getSectors: () =>
    unwrap(client.get<ApiResponse<SectorSummary[]>>('/api/portfolio/sectors')),

  getSummary: () =>
    unwrap(client.get<ApiResponse<PortfolioSummary>>('/api/portfolio/summary')),
};