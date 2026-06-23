import { Holding, StockData } from '../types/index.js';

export function calculateInvestment(purchasePrice: number, quantity: number): number {
  return purchasePrice * quantity;
}

export function calculatePresentValue(cmp: number | null, quantity: number): number | null {
  if (cmp === null) return null;
  return cmp * quantity;
}

export function calculateGainLoss(
  presentValue: number | null,
  investment: number
): number | null {
  if (presentValue === null) return null;
  return presentValue - investment;
}

export function calculateGainLossPercent(
  gainLoss: number | null,
  investment: number
): number | null {
  if (gainLoss === null || investment === 0) return null;
  return (gainLoss / investment) * 100;
}

export function calculatePortfolioPercent(
  investment: number,
  totalInvestment: number
): number | null {
  if (totalInvestment === 0) return null;
  return (investment / totalInvestment) * 100;
}

export function buildStockData(
  holding: Holding,
  cmp: number | null,
  peRatio: number | null,
  latestEarnings: number | null,
  totalInvestment: number
): StockData {
  const investment = calculateInvestment(holding.purchasePrice, holding.quantity);
  const presentValue = calculatePresentValue(cmp, holding.quantity);
  const gainLoss = calculateGainLoss(presentValue, investment);
  const gainLossPercent = calculateGainLossPercent(gainLoss, investment);
  const portfolioPercent = calculatePortfolioPercent(investment, totalInvestment);

  return {
    ...holding,
    cmp,
    peRatio,
    latestEarnings,
    investment,
    presentValue,
    gainLoss,
    gainLossPercent,
    portfolioPercent,
  };
}