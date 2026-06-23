import { Router, Request, Response, NextFunction } from 'express';
import portfolioService from '../services/PortfolioService.js';
import { ApiResponse, StockData, SectorSummary, PortfolioSummary } from '../types/index.js';

const router = Router();

// GET /api/portfolio
// Returns all holdings enriched with live CMP, P/E, EPS, and computed metrics
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await portfolioService.getPortfolio();
    const response: ApiResponse<StockData[]> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/portfolio/sectors
// Returns stocks grouped by sector with sector-level investment/gain summaries
router.get('/sectors', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await portfolioService.getSectorSummaries();
    const response: ApiResponse<SectorSummary[]> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/portfolio/summary
// Returns aggregate totals: investment, present value, gain/loss
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await portfolioService.getSummary();
    const response: ApiResponse<PortfolioSummary> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;