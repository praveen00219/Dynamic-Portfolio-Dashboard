import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import financeService from './FinanceService.js';
import { buildStockData } from '../utils/calculations.js';
import { Holding, StockData, SectorSummary, PortfolioSummary, DashboardData } from '../types/index.js';

// ESM does not expose __dirname — derive it from the current module's URL
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * PortfolioService is the orchestration layer.
 * It combines static holdings data (from JSON) with live quotes (from FinanceService)
 * and computes derived metrics (investment, present value, gain/loss, etc.).
 */
class PortfolioService {
  private getHoldings(): Holding[] {
    // Read and parse once per request. In a larger system this would be cached,
    // but holdings.json is tiny so the cost is negligible.
    const filePath = join(__dirname, '../data/holdings.json');
    return JSON.parse(readFileSync(filePath, 'utf-8')) as Holding[];
  }

  async getPortfolio(): Promise<StockData[]> {
    const holdings = this.getHoldings();
    const tickers = holdings.map((h) => h.ticker);

    // Fetch all quotes in parallel with caching
    const quotesMap = await financeService.getMultipleQuotes(tickers);

    // Total investment is needed to compute each stock's portfolio weight
    const totalInvestment = holdings.reduce(
      (sum, h) => sum + h.purchasePrice * h.quantity,
      0
    );

    return holdings.map((holding) => {
      const quote = quotesMap.get(holding.ticker) ?? {
        cmp: null,
        peRatio: null,
        latestEarnings: null,
      };

      return buildStockData(
        holding,
        quote.cmp,
        quote.peRatio,
        quote.latestEarnings,
        totalInvestment
      );
    });
  }

  /**
   * Pure derivation: group an already-built stocks array by sector.
   * Accepts StockData[] so callers can reuse a single getPortfolio() build
   * instead of re-fetching quotes (this is what removes the API amplification).
   */
  private summarizeBySector(stocks: StockData[]): SectorSummary[] {
    const sectorMap = new Map<string, StockData[]>();
    for (const stock of stocks) {
      const existing = sectorMap.get(stock.sector) ?? [];
      sectorMap.set(stock.sector, [...existing, stock]);
    }

    return Array.from(sectorMap.entries()).map(([sector, sectorStocks]) => {
      const totalInvestment = sectorStocks.reduce((sum, s) => sum + s.investment, 0);

      // If CMP is unavailable for a stock, fall back to investment to avoid distorting the total
      const totalPresentValue = sectorStocks.reduce(
        (sum, s) => sum + (s.presentValue ?? s.investment),
        0
      );

      const gainLoss = totalPresentValue - totalInvestment;
      const gainLossPercent = totalInvestment > 0 ? (gainLoss / totalInvestment) * 100 : 0;

      return {
        sector,
        totalInvestment,
        totalPresentValue,
        gainLoss,
        gainLossPercent,
        stocks: sectorStocks,
      };
    });
  }

  /**
   * Pure derivation: portfolio-level totals from an already-built stocks array.
   */
  private summarize(stocks: StockData[]): PortfolioSummary {
    const totalInvestment = stocks.reduce((sum, s) => sum + s.investment, 0);
    const totalPresentValue = stocks.reduce(
      (sum, s) => sum + (s.presentValue ?? s.investment),
      0
    );
    const totalGainLoss = totalPresentValue - totalInvestment;
    const totalGainLossPercent =
      totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      totalGainLossPercent,
      stockCount: stocks.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getSectorSummaries(): Promise<SectorSummary[]> {
    const stocks = await this.getPortfolio();
    return this.summarizeBySector(stocks);
  }

  async getSummary(): Promise<PortfolioSummary> {
    const stocks = await this.getPortfolio();
    return this.summarize(stocks);
  }

  /**
   * Combined dashboard payload: builds the portfolio ONCE and derives sectors
   * and summary from the same array. This replaces the previous pattern where
   * the frontend made three separate calls that each rebuilt the portfolio
   * (3× API amplification). The standalone routes above are kept for
   * backward compatibility.
   */
  async getDashboard(): Promise<DashboardData> {
    const stocks = await this.getPortfolio();
    return {
      stocks,
      sectors: this.summarizeBySector(stocks),
      summary: this.summarize(stocks),
    };
  }
}

export default new PortfolioService();