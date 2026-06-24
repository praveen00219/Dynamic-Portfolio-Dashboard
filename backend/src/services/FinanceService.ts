import YahooFinanceApi from 'yahoo-finance2';
import cacheService from './CacheService.js';
import googleFinanceService, { GoogleFinanceService } from './GoogleFinanceService.js';
import { QuoteData } from '../types/index.js';

// CMP is volatile — refresh every 15 seconds (matches the frontend polling interval).
const CMP_CACHE_TTL = 15;

// yahoo-finance2 exports the YahooFinance class itself (not a pre-made instance).
// We instantiate it here so method calls have the correct 'this' context.
const yf = new YahooFinanceApi();

// Yahoo gives us CMP plus P/E and EPS in a single quote() call. CMP is the
// authoritative source; the P/E and EPS are kept only as a fallback for when
// Google Finance (the task's required source for those two) is unavailable.
interface YahooQuote {
  cmp: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
}

/**
 * FinanceService produces a combined quote for a ticker:
 *
 *   CMP             → Yahoo Finance (yahoo-finance2)            — always
 *   P/E Ratio       → Google Finance, falling back to Yahoo    — per the task
 *   Latest Earnings → Google Finance, falling back to Yahoo    — per the task
 *
 * Yahoo and Google are fetched in parallel. Each source is cached and
 * request-coalesced independently so the upstreams are hit at most once per
 * ticker per TTL window regardless of how many callers ask concurrently.
 */
class FinanceService {
  // Tickers with a Yahoo request currently in progress (coalescing).
  private inFlight = new Map<string, Promise<YahooQuote>>();

  async getQuote(ticker: string): Promise<QuoteData> {
    // Fetch both sources in parallel — neither blocks the other.
    const [yahoo, google] = await Promise.all([
      this.getYahooQuote(ticker),
      googleFinanceService.getFundamentals(GoogleFinanceService.toSymbol(ticker)),
    ]);

    return {
      cmp: yahoo.cmp,
      // Google is primary for P/E and earnings; Yahoo fills any gap.
      peRatio: google.peRatio ?? yahoo.peRatio,
      latestEarnings: google.latestEarnings ?? yahoo.latestEarnings,
    };
  }

  /** Yahoo quote (CMP + fallback fundamentals), cached 15s and coalesced per ticker. */
  private async getYahooQuote(ticker: string): Promise<YahooQuote> {
    const cacheKey = `quote:${ticker}`;

    const cached = cacheService.get<YahooQuote>(cacheKey);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(ticker);
    if (pending !== undefined) return pending;

    const request = this.fetchYahoo(ticker, cacheKey);
    this.inFlight.set(ticker, request);
    return request;
  }

  private async fetchYahoo(ticker: string, cacheKey: string): Promise<YahooQuote> {
    try {
      const quote = await yf.quote(ticker);

      const data: YahooQuote = {
        cmp: quote.regularMarketPrice ?? null,
        peRatio: quote.trailingPE ?? null,
        latestEarnings: quote.epsTrailingTwelveMonths ?? null,
      };

      // Only cache a usable quote so a failed/empty price is retried next cycle.
      if (data.cmp !== null) {
        cacheService.set(cacheKey, data, CMP_CACHE_TTL);
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