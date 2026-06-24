# Technical Document — Portfolio Dashboard

## Key Challenges and Solutions

---

### 1. No Official Yahoo Finance or Google Finance API

**Challenge:**
Neither Yahoo Finance nor Google Finance provides a free, public REST API. Scraping their websites directly breaks frequently due to DOM changes and can result in IP bans.

**Solution:**
Each data point is sourced as the case study specifies:

- **CMP → Yahoo Finance.** The `yahoo-finance2` npm package wraps Yahoo's internal JSON endpoints (`regularMarketPrice`), giving structured responses without HTML scraping.
- **P/E Ratio + Latest Earnings → Google Finance.** `GoogleFinanceService` fetches the public Google Finance quote page (`https://www.google.com/finance/quote/SYMBOL:EXCHANGE`) and parses the `P/E ratio` and `Earnings per share` stats out of the rendered HTML.

`FinanceService` fetches both in parallel and merges them: CMP always comes from Yahoo, while P/E and Latest Earnings prefer the Google value and **fall back to Yahoo's `trailingPE` / `epsTrailingTwelveMonths`** when a scrape returns nothing. This keeps the dashboard populated even when Google's markup changes.

**Trade-off acknowledged:**
Both sources are unofficial. Yahoo's internal API can change, and Google Finance HTML scraping is fragile by nature (class names/layout can change without notice) — hence the Yahoo fallback and graceful `—` on failure. In production, a paid data provider (Twelve Data, Alpha Vantage, NSE India API) would replace both.

---

### 2. Rate Limiting and Performance

**Challenge:**
Fetching quotes for 12 stocks on every request would quickly hit Yahoo Finance's rate limits, especially with a 15-second refresh interval.

**Solution — per-source caching with `node-cache` + request coalescing:**

| Source / Data         | Cache key          | Cache TTL  | Rationale                                            |
|-----------------------|--------------------|------------|------------------------------------------------------|
| Yahoo quote (CMP)     | `quote:{ticker}`   | 15 seconds | Matches the frontend polling interval                |
| Google fundamentals   | `google:{symbol}`  | 5 minutes  | P/E drifts slowly; throttles scraping to avoid blocks |

On each request, CacheService is checked first; a network call is only made when the entry has expired. In addition, each service keeps an **in-flight map** so concurrent callers for the same ticker/symbol share one request instead of stampeding the upstream. Together these cap Yahoo at once per ticker per 15s and Google at once per symbol per 5 min, regardless of how many clients poll.

---

### 3. Parallel Async Fetching

**Challenge:**
Fetching 12 stock quotes sequentially would take 12× the latency of a single request.

**Solution:**
`Promise.allSettled` in `FinanceService.getMultipleQuotes()` fires all quote fetches in parallel. `allSettled` (vs `Promise.all`) ensures one failing ticker does not cancel the rest — the failed ticker simply returns `{ cmp: null, peRatio: null, latestEarnings: null }` and the UI shows `—` for that cell.

---

### 4. Data Accuracy and Missing Values

**Challenge:**
Scraped data can be null or malformed. Calculations like Present Value and Gain/Loss become invalid without a CMP.

**Solution:**
All derived fields (`presentValue`, `gainLoss`, `gainLossPercent`, `portfolioPercent`) are typed as `number | null`. The calculation utilities return `null` when inputs are null. The frontend `formatters.ts` displays `—` for null values. This prevents NaN from propagating and misleading the user.

---

### 5. Preventing Unnecessary Re-renders

**Challenge:**
A 15-second refresh triggers state updates across the entire component tree, which would re-render every row in the table.

**Solution:**
- `React.memo` wraps every dashboard component — re-renders only occur if props actually change (by reference).
- `useMemo` is used for TanStack Table column definitions (recreated only on mount) and for Recharts chart data arrays (recreated only when `stocks` or `sectors` arrays change).
- `useCallback` wraps the `fetchAll` function in `usePortfolio` so the `setInterval` reference stays stable across renders.

---

### 6. Security — API Keys Never Exposed to the Client

**Challenge:**
All finance API calls must be authenticated or proxied — keys cannot live in browser-side code.

**Solution:**
All Yahoo Finance calls happen exclusively in the Node.js backend. The Next.js frontend communicates only with the Express backend via `/api/*` routes. The `next.config.ts` rewrites `/api/*` to `http://localhost:3001/api/*` in development. In production, `NEXT_PUBLIC_API_URL` is set to the deployed backend URL.

No secrets are in the frontend `.env.local` (only the backend URL is there, which is not sensitive).

---

### 7. Stale-While-Revalidate Pattern

**Challenge:**
On each 15-second refresh, showing a full loading spinner would cause a jarring UX.

**Solution:**
The `usePortfolio` hook only shows the `loading: true` spinner on the very first fetch (`stocks.length === 0`). On subsequent polls, the previous data remains visible while new data loads in the background. The header shows the `lastUpdated` timestamp so the user always knows how fresh the data is.

---

## Architecture Decisions

| Decision | Reason |
|----------|--------|
| Service layer (CacheService → FinanceService → PortfolioService) | Single Responsibility — each service has one job. PortfolioService doesn't know about HTTP; FinanceService doesn't know about portfolio math |
| Singleton services (`export default new XService()`) | Node.js module caching ensures one instance per process — correct for a single-server deployment |
| `resolveJsonModule` in tsconfig | Lets TypeScript import `holdings.json` with type inference; the file is loaded once at module startup, not on each request |
| Next.js App Router + `'use client'` only where needed | Server components for layout; client components only for interactive elements (table sorting, charts, hooks) |
| TanStack Table v8 | Headless — gives full control over markup and Tailwind styling without fighting a pre-styled component |
| Recharts | Composable React-first charts with good TypeScript support; no external SVG manipulation needed |