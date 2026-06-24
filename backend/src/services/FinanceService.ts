import axios from 'axios';
import cacheService from './CacheService.js';
import googleFinanceService, { GoogleFinanceService } from './GoogleFinanceService.js';
import { QuoteData } from '../types/index.js';

// CMP is volatile — refresh every 15 seconds (matches the frontend polling interval).
const CMP_CACHE_TTL = 15;

// Yahoo's public chart endpoint returns the live price WITHOUT a crumb/cookie,
// unlike the quote endpoint (which yahoo-finance2 uses) that now fails with
// "Failed to get crumb, status 429". query2 is a mirror used as a fallback.
const YAHOO_CHART_HOSTS = [
  'https://query1.finance.yahoo.com',
  'https://query2.finance.yahoo.com',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Minimal shape of the fields we read from the chart response.
interface YahooChartResponse {
  chart?: {
    result?: Array<{ meta?: { regularMarketPrice?: number } }> | null;
  };
}

/**
 * FinanceService produces a combined quote for a ticker:
 *
 *   CMP             → Yahoo Finance chart endpoint (/v8/finance/chart) — no crumb
 *   P/E Ratio       → Google Finance (per the task)
 *   Latest Earnings → Google Finance (per the task)
 *
 * CMP and the Google fundamentals are fetched in parallel. CMP is cached for 15s
 * and request-coalesced per ticker so Yahoo is hit at most once per ticker per
 * window regardless of how many callers ask at once.
 */
class FinanceService {
  // Tickers with a CMP request currently in progress (coalescing / stampede guard).
  private inFlight = new Map<string, Promise<number | null>>();

  async getQuote(ticker: string): Promise<QuoteData> {
    const [cmp, fundamentals] = await Promise.all([
      this.getCmp(ticker),
      googleFinanceService.getFundamentals(GoogleFinanceService.toSymbol(ticker)),
    ]);

    return {
      cmp,
      peRatio: fundamentals.peRatio,
      latestEarnings: fundamentals.latestEarnings,
    };
  }

  /** CMP from Yahoo's chart endpoint, cached 15s and coalesced per ticker. */
  private async getCmp(ticker: string): Promise<number | null> {
    const cacheKey = `cmp:${ticker}`;

    const cached = cacheService.get<number>(cacheKey);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(ticker);
    if (pending !== undefined) return pending;

    const request = this.fetchCmp(ticker, cacheKey);
    this.inFlight.set(ticker, request);
    return request;
  }

  private async fetchCmp(ticker: string, cacheKey: string): Promise<number | null> {
    try {
      for (const host of YAHOO_CHART_HOSTS) {
        try {
          const { data } = await axios.get<YahooChartResponse>(
            `${host}/v8/finance/chart/${encodeURIComponent(ticker)}`,
            {
              params: { interval: '1d', range: '1d' },
              timeout: 8000,
              headers: { 'User-Agent': USER_AGENT },
            }
          );

          const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (typeof price === 'number') {
            cacheService.set(cacheKey, price, CMP_CACHE_TTL);
            return price;
          }
        } catch {
          // Try the next host (query2) before giving up.
        }
      }
      return null; // not cached → retried next cycle
    } catch (error) {
      console.error(
        `[FinanceService] Failed to fetch CMP for ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    } finally {
      // Always release the in-flight slot so future cycles can fetch again.
      this.inFlight.delete(ticker);
    }
  }

  /**
   * Fetch multiple quotes in parallel using Promise.allSettled so one failure
   * does not block the rest of the portfolio from loading. Per-ticker caching
   * and coalescing keep the actual upstream call count bounded.
   */
  async getMultipleQuotes(tickers: string[]): Promise<Map<string, QuoteData>> {
    const results = new Map<string, QuoteData>();

    await Promise.allSettled(
      tickers.map(async (ticker) => {
        results.set(ticker, await this.getQuote(ticker));
      })
    );

    return results;
  }
}

export default new FinanceService();