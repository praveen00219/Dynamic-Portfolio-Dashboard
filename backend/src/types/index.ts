export interface Holding {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  purchasePrice: number;
  quantity: number;
  sector: string;
}

export interface QuoteData {
  cmp: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
}

export interface StockData extends Holding {
  cmp: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
  investment: number;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
  portfolioPercent: number | null;
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  stocks: StockData[];
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  stockCount: number;
  lastUpdated: string;
}

export interface DashboardData {
  stocks: StockData[];
  sectors: SectorSummary[];
  summary: PortfolioSummary;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}