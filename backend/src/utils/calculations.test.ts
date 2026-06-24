import { describe, it, expect } from 'vitest';
import {
  calculateInvestment,
  calculatePresentValue,
  calculateGainLoss,
  calculateGainLossPercent,
  calculatePortfolioPercent,
  buildStockData,
} from './calculations.js';
import { Holding } from '../types/index.js';

describe('calculateInvestment', () => {
  it('multiplies purchase price by quantity', () => {
    expect(calculateInvestment(100, 10)).toBe(1000);
  });

  it('handles fractional purchase prices', () => {
    expect(calculateInvestment(2400.5, 2)).toBe(4801);
  });

  it('returns 0 when quantity is 0', () => {
    expect(calculateInvestment(100, 0)).toBe(0);
  });
});

describe('calculatePresentValue', () => {
  it('multiplies CMP by quantity', () => {
    expect(calculatePresentValue(150, 10)).toBe(1500);
  });

  it('returns null when CMP is null (missing market data)', () => {
    expect(calculatePresentValue(null, 10)).toBeNull();
  });

  it('returns 0 when quantity is 0', () => {
    expect(calculatePresentValue(150, 0)).toBe(0);
  });
});

describe('calculateGainLoss', () => {
  it('returns a positive value for a gain', () => {
    expect(calculateGainLoss(1500, 1000)).toBe(500);
  });

  it('returns a negative value for a loss', () => {
    expect(calculateGainLoss(800, 1000)).toBe(-200);
  });

  it('returns 0 when present value equals investment', () => {
    expect(calculateGainLoss(1000, 1000)).toBe(0);
  });

  it('returns null when present value is null', () => {
    expect(calculateGainLoss(null, 1000)).toBeNull();
  });
});

describe('calculateGainLossPercent', () => {
  it('computes the percent gain relative to investment', () => {
    expect(calculateGainLossPercent(500, 1000)).toBe(50);
  });

  it('computes a negative percent for a loss', () => {
    expect(calculateGainLossPercent(-200, 1000)).toBe(-20);
  });

  it('returns null when gain/loss is null', () => {
    expect(calculateGainLossPercent(null, 1000)).toBeNull();
  });

  it('returns null when investment is 0 (avoids divide-by-zero)', () => {
    expect(calculateGainLossPercent(500, 0)).toBeNull();
  });
});

describe('calculatePortfolioPercent', () => {
  it('computes a holding share of the total investment', () => {
    expect(calculatePortfolioPercent(250, 1000)).toBe(25);
  });

  it('returns 100 when the holding is the entire portfolio', () => {
    expect(calculatePortfolioPercent(1000, 1000)).toBe(100);
  });

  it('returns null when total investment is 0', () => {
    expect(calculatePortfolioPercent(250, 0)).toBeNull();
  });
});

describe('buildStockData', () => {
  const holding: Holding = {
    id: '1',
    name: 'Reliance Industries Ltd',
    ticker: 'RELIANCE.NS',
    exchange: 'NSE',
    purchasePrice: 2400,
    quantity: 10,
    sector: 'Energy',
  };

  it('assembles all derived metrics for a valid quote', () => {
    const result = buildStockData(holding, 2600, 28.5, 95.2, 48000);
    expect(result).toMatchObject({
      id: '1',
      ticker: 'RELIANCE.NS',
      cmp: 2600,
      peRatio: 28.5,
      latestEarnings: 95.2,
      investment: 24000, // 2400 * 10
      presentValue: 26000, // 2600 * 10
      gainLoss: 2000, // 26000 - 24000
      portfolioPercent: 50, // 24000 / 48000 * 100
    });
  });

  it('propagates nulls through CMP-dependent fields when CMP is missing', () => {
    const result = buildStockData(holding, null, null, null, 48000);
    expect(result.cmp).toBeNull();
    expect(result.presentValue).toBeNull();
    expect(result.gainLoss).toBeNull();
    expect(result.gainLossPercent).toBeNull();
    // Fields that do not depend on CMP are still computed.
    expect(result.investment).toBe(24000);
    expect(result.portfolioPercent).toBe(50);
  });
});