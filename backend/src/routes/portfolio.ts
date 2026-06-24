import { Router, Request, Response } from 'express';
import portfolioService from '../services/PortfolioService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, StockData, SectorSummary, PortfolioSummary, DashboardData } from '../types/index.js';

const router = Router();

// GET /api/portfolio
// Returns all holdings enriched with live CMP, P/E, EPS, and computed metrics
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const data = await portfolioService.getPortfolio();
  const response: ApiResponse<StockData[]> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}));

// GET /api/portfolio/sectors
// Returns stocks grouped by sector with sector-level investment/gain summaries
router.get('/sectors', asyncHandler(async (_req: Request, res: Response) => {
  const data = await portfolioService.getSectorSummaries();
  const response: ApiResponse<SectorSummary[]> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}));

// GET /api/portfolio/summary
// Returns aggregate totals: investment, present value, gain/loss
router.get('/summary', asyncHandler(async (_req: Request, res: Response) => {
  const data = await portfolioService.getSummary();
  const response: ApiResponse<PortfolioSummary> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}));

// GET /api/portfolio/dashboard
// Returns stocks, sector summaries, and portfolio totals in a single payload,
// built from ONE portfolio fetch. Lets the frontend refresh with one request
// instead of three (removes API amplification).
router.get('/dashboard', asyncHandler(async (_req: Request, res: Response) => {
  const data = await portfolioService.getDashboard();
  const response: ApiResponse<DashboardData> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}));

export default router;