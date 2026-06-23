import YahooFinanceApi from 'yahoo-finance2';
import cacheService from './CacheService.js';
import { QuoteData } from '../types/index.js';

// CMP is volatile — refresh every 15 seconds (matches frontend polling interval)
const CMP_CACHE_TTL = 15;

// P/E and EPS change only with quarterly results — cache for 1 hour
const FUNDAMENTALS_CACHE_TTL = 3600;

// yahoo-finance2 exports the YahooFinance class itself (not a pre-made instance).
// We instantiate it here so method calls have the correct 'this' context.
const yf = new YahooFinanceApi();

/**
 * FinanceService fetches live stock quotes from Yahoo Finance (via yahoo-finance2).
 *
 * Yahoo Finance has no official public API, so yahoo-finance2 scrapes their
 * internal API endpoints. This can break with site changes and may hit rate
 * limits. CacheService is used to absorb repeated requests within each TTL window.
 *
 * Data fields used:
 *   regularMarketPrice  → CMP
 *   trailingPE          → P/E Ratio (trailing twelve months)
 *   epsTrailingTwelveMonths → Latest EPS (earnings per share)
 */
class FinanceService {
  async getQuote(ticker: string): Promise<QuoteData> {
    const cmpKey = `cmp:${ticker}`;
    const fundKey = `fundamentals:${ticker}`;

    const cachedCmp = cacheService.get<number>(cmpKey);
    const cachedFund = cacheService.get<{ peRatio: number | null; latestEarnings: number | null }>(fundKey);

    // Both values are in cache — return immediately without a network call
    if (cachedCmp !== undefined && cachedFund !== undefined) {
      return { cmp: cachedCmp, peRatio: cachedFund.peRatio, latestEarnings: cachedFund.latestEarnings };
    }

    try {
      const quote = await yf.quote(ticker);

      const cmp: number | null = quote.regularMarketPrice ?? null;
      const peRatio: number | null = quote.trailingPE ?? null;
      const latestEarnings: number | null = quote.epsTrailingTwelveMonths ?? null;

      // Store with different TTLs: CMP expires quickly, fundamentals persist longer
      if (cmp !== null) cacheService.set(cmpKey, cmp, CMP_CACHE_TTL);
      cacheService.set(fundKey, { peRatio, latestEarnings }, FUNDAMENTALS_CACHE_TTL);

      return { cmp, peRatio, latestEarnings };
    } catch (error) {
      console.error(
        `[FinanceService] Failed to fetch quote for ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      // Return null values on failure — the UI displays "—" for missing data
      return { cmp: null, peRatio: null, latestEarnings: null };
    }
  }

  /**
   * Fetch multiple quotes in parallel using Promise.allSettled so one failure
   * does not block the rest of the portfolio from loading.
   */
  async getMultipleQuotes(tickers: string[]): Promise<Map<string, QuoteData>> {
    const results = new Map<string, QuoteData>();

    await Promise.allSettled(
      tickers.map(async (ticker) => {
        const data = await this.getQuote(ticker);
        results.set(ticker, data);
      })
    );

    return results;
  }
}

export default new FinanceService();