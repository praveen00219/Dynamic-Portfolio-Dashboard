import axios from 'axios';
import cacheService from './CacheService.js';

// P/E and earnings move slowly (P/E drifts with price; earnings change quarterly).
// A 5-minute cache keeps them fresh enough while throttling scrape volume so
// Google Finance does not rate-limit/block us (the task calls for exactly this).
const GOOGLE_CACHE_TTL = 300;

export interface GoogleFundamentals {
  peRatio: number | null;
  latestEarnings: number | null;
}

/**
 * GoogleFinanceService scrapes P/E Ratio and Latest Earnings (EPS) from the
 * public Google Finance quote page (https://www.google.com/finance/quote/SYMBOL:EXCHANGE).
 *
 * Google Finance has no official API, so this parses the rendered HTML. That is
 * inherently fragile — class names and layout can change without notice — so
 * every failure path returns nulls and the caller (FinanceService) falls back
 * to Yahoo. Results are cached and concurrent requests for the same symbol are
 * coalesced to keep scrape volume low.
 */
class GoogleFinanceService {
  private inFlight = new Map<string, Promise<GoogleFundamentals>>();

  /**
   * Convert a Yahoo-style ticker into a Google Finance symbol.
   *   "HDFCBANK.NS" -> "HDFCBANK:NSE"
   *   "511577.BO"   -> "511577:BOM"
   */
  static toSymbol(ticker: string): string {
    const base = ticker.replace(/\.(NS|BO)$/i, '');
    const exchange = /\.BO$/i.test(ticker) ? 'BOM' : 'NSE';
    return `${base}:${exchange}`;
  }

  async getFundamentals(symbol: string): Promise<GoogleFundamentals> {
    const cacheKey = `google:${symbol}`;

    const cached = cacheService.get<GoogleFundamentals>(cacheKey);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(symbol);
    if (pending !== undefined) return pending;

    const request = this.scrape(symbol, cacheKey);
    this.inFlight.set(symbol, request);
    return request;
  }

  private async scrape(symbol: string, cacheKey: string): Promise<GoogleFundamentals> {
    try {
      const url = `https://www.google.com/finance/quote/${symbol}`;
      const { data: html } = await axios.get<string>(url, {
        timeout: 8000,
        responseType: 'text',
        // Keep the raw HTML string — don't let axios try to JSON-parse it.
        transformResponse: (d) => d,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      const peRatio = parseFinancialNumber(extractStat(html, 'P/E ratio'));
      // Google's quote page labels EPS as "Earnings per share" when present.
      // It is not always rendered, in which case this is null and Yahoo fills it.
      const latestEarnings = parseFinancialNumber(extractStat(html, 'Earnings per share'));

      const result: GoogleFundamentals = { peRatio, latestEarnings };

      // Only cache a useful scrape so a transient empty page is retried next time.
      if (peRatio !== null || latestEarnings !== null) {
        cacheService.set(cacheKey, result, GOOGLE_CACHE_TTL);
      }
      return result;
    } catch (error) {
      console.error(
        `[GoogleFinanceService] Failed to scrape ${symbol}:`,
        error instanceof Error ? error.message : error
      );
      return { peRatio: null, latestEarnings: null };
    } finally {
      this.inFlight.delete(symbol);
    }
  }
}

/**
 * Find a labelled statistic on the Google Finance page and return the raw text
 * of the value rendered immediately after the label.
 *
 * Google renders each stat as a label div followed by a value div, e.g.
 *   <div ...>P/E ratio</div><div ...>29.45</div>
 * We locate the label text, then read the first value div after it.
 */
function extractStat(html: string, label: string): string | null {
  const marker = `>${label}<`;
  const start = html.indexOf(marker);
  if (start === -1) return null;

  // Skip past the label's own closing tag, then grab the next div's text.
  const afterLabel = html.slice(start);
  const labelClose = afterLabel.indexOf('</div>');
  if (labelClose === -1) return null;

  const rest = afterLabel.slice(labelClose + '</div>'.length);
  const match = rest.match(/<div[^>]*>([^<]+)<\/div>/);
  return match ? match[1].trim() : null;
}

/**
 * Parse a financial figure from scraped text, tolerating currency symbols,
 * thousands separators, and percent/blank/dash placeholders.
 *   "₹1,234.50" -> 1234.5 | "29.45" -> 29.45 | "—" / "-" / "" -> null
 */
function parseFinancialNumber(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

export { GoogleFinanceService };
export default new GoogleFinanceService();