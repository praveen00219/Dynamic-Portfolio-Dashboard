import YahooFinanceApi from 'yahoo-finance2';
import cacheService from './CacheService.js';
import { QuoteData } from '../types/index.js';

// One TTL per ticker. CMP, P/E and EPS all come from the same yahoo-finance2
// quote() response, so a single cache entry refreshed every 15s (the frontend
// polling interval) is both correct and as cheap as possible — a second,
// longer-lived "fundamentals" cache would never prevent a network call because
// the price (which must be fresh) is fetched in the same request.
const QUOTE_CACHE_TTL = 15;

// yahoo-finance2 exports the YahooFinance class itself (not a pre-made instance).
// We instantiate it here so method calls have the correct 'this' context.
const yf = new YahooFinanceApi();

/**
 * FinanceService fetches live stock quotes from Yahoo Finance (via yahoo-finance2).
 *
 * Yahoo Finance has no official public API, so yahoo-finance2 calls their
 * internal JSON endpoints. This can break with site changes and may hit rate
 * limits, so each ticker is:
 *   - cached for QUOTE_CACHE_TTL seconds (one entry per ticker), and
 *   - request-coalesced: concurrent callers for the same ticker share a single
 *     in-flight network request instead of each firing their own (stampede
 *     prevention).
 *
 * Together these guarantee Yahoo is called at most once per ticker per TTL
 * window, regardless of how many endpoints or clients ask at the same time.
 *
 * Data fields used:
 *   regularMarketPrice       → CMP
 *   trailingPE               → P/E Ratio (trailing twelve months)
 *   epsTrailingTwelveMonths  → Latest EPS (earnings per share)
 */
class FinanceService {
  // Tickers with a network request currently in progress. Concurrent callers
  // await the same promise so only one Yahoo request is made per ticker.
  private inFlight = new Map<string, Promise<QuoteData>>();

  async getQuote(ticker: string): Promise<QuoteData> {
    const cacheKey = `quote:${ticker}`;

    // 1. Fresh value in cache — return immediately, no network call.
    const cached = cacheService.get<QuoteData>(cacheKey);
    if (cached !== undefined) return cached;

    // 2. A fetch for this ticker is already running — reuse it (coalescing).
    const pending = this.inFlight.get(ticker);
    if (pending !== undefined) return pending;

    // 3. Cache miss with nothing in flight — start a single fetch and register
    //    it so any concurrent callers share this exact promise.
    const request = this.fetchAndCache(ticker, cacheKey);
    this.inFlight.set(ticker, request);
    return request;
  }

  private async fetchAndCache(ticker: string, cacheKey: string): Promise<QuoteData> {
    try {
      const quote = await yf.quote(ticker);

      const data: QuoteData = {
        cmp: quote.regularMarketPrice ?? null,
        peRatio: quote.trailingPE ?? null,
        latestEarnings: quote.epsTrailingTwelveMonths ?? null,
      };

      // Only cache a usable quote. If the price came back null (failed/empty
      // response), leave it uncached so the next cycle retries instead of
      // serving "—" for the whole TTL window.
      if (data.cmp !== null) {
        cacheService.set(cacheKey, data, QUOTE_CACHE_TTL);
      }

      return data;
    } catch (error) {
      console.error(
        `[FinanceService] Failed to fetch quote for ${ticker}:`,
        error instanceof Error ? error.message : error
      );
      // Return null values on failure — the UI displays "—" for missing data.
      return { cmp: null, peRatio: null, latestEarnings: null };
    } finally {
      // Always release the in-flight slot so future cycles can fetch again,
      // whether this attempt succeeded or failed.
      this.inFlight.delete(ticker);
    }
  }

  /**
   * Fetch multiple quotes in parallel using Promise.allSettled so one failure
   * does not block the rest of the portfolio from loading. Per-ticker caching
   * and coalescing (above) keep the actual Yahoo call count bounded.
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