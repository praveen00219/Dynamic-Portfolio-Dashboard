# Portfolio Dashboard

A full-stack real-time investment portfolio tracker.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · Node.js · Express · TanStack Table · Recharts

---

## Project Structure

```
8byte/
├── backend/
│   └── src/
│       ├── data/
│       │   └── holdings.json         # Static portfolio holdings
│       ├── types/
│       │   └── index.ts              # Shared TypeScript interfaces
│       ├── utils/
│       │   └── calculations.ts       # Pure calculation helpers
│       ├── services/
│       │   ├── CacheService.ts        # node-cache singleton wrapper
│       │   ├── FinanceService.ts       # CMP from Yahoo; merges Google + Yahoo fundamentals
│       │   ├── GoogleFinanceService.ts # P/E + Latest Earnings scraped from Google Finance
│       │   └── PortfolioService.ts     # Orchestration: holdings + quotes → StockData
│       ├── routes/
│       │   └── portfolio.ts          # Express route handlers
│       ├── middleware/
│       │   └── errorHandler.ts       # Request logger + error handler
│       └── index.ts                  # Express app entry point
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx            # Root layout with metadata
        │   ├── page.tsx              # Dashboard page (entry)
        │   └── globals.css           # Tailwind directives
        ├── components/
        │   ├── ui/
        │   │   ├── LoadingSpinner.tsx
        │   │   └── ErrorMessage.tsx
        │   └── Dashboard/
        │       ├── SummaryCards.tsx  # 4-card totals strip
        │       ├── PortfolioTable.tsx # TanStack Table with sortable columns
        │       ├── SectorSummary.tsx  # Per-sector cards
        │       ├── AllocationChart.tsx # Recharts donut (portfolio allocation)
        │       └── SectorChart.tsx    # Recharts grouped bar (sector distribution)
        ├── hooks/
        │   └── usePortfolio.ts       # Data fetching + 15s refresh interval
        ├── services/
        │   └── apiService.ts         # Axios client + API call wrappers
        ├── types/
        │   └── index.ts              # Frontend TypeScript interfaces
        └── utils/
            └── formatters.ts         # Currency, percent, color helpers
```

---

## Quick Start

### Prerequisites
- Node.js 18 or later
- npm

### 1 — Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
# Runs on http://localhost:3001
```

### 2 — Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

| Method | Endpoint                    | Description                                  |
|--------|-----------------------------|----------------------------------------------|
| GET    | `/api/portfolio`            | All holdings with live CMP, P/E, EPS, metrics |
| GET    | `/api/portfolio/sectors`    | Holdings grouped by sector with summaries    |
| GET    | `/api/portfolio/summary`    | Portfolio-level totals                       |
| GET    | `/health`                   | Server health check                          |

### Sample Response — `/api/portfolio/summary`

```json
{
  "success": true,
  "data": {
    "totalInvestment": 432000,
    "totalPresentValue": 451200,
    "totalGainLoss": 19200,
    "totalGainLossPercent": 4.44,
    "stockCount": 12,
    "lastUpdated": "2026-06-24T10:30:00.000Z"
  },
  "timestamp": "2026-06-24T10:30:00.123Z"
}
```

---

## Environment Variables

**backend/.env**
```
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Adding Your Own Holdings

Edit `backend/src/data/holdings.json`. Each entry requires:

```json
{
  "id": "13",
  "name": "Stock Full Name",
  "ticker": "SYMBOL.NS",
  "exchange": "NSE",
  "purchasePrice": 1000.00,
  "quantity": 10,
  "sector": "Technology"
}
```

Use `.NS` suffix for NSE stocks and `.BO` for BSE stocks (Yahoo Finance format).

---

## Deployment

- **Backend**: Deploy to Railway, Render, or any Node.js host. Set `FRONTEND_URL` to your frontend domain.
- **Frontend**: Deploy to Vercel. Set `NEXT_PUBLIC_API_URL` to your backend URL in Vercel environment variables.