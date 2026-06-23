'use client';
import React, { memo } from 'react';
import { PortfolioSummary } from '../../types';
import { formatCurrency, formatPercent, getGainLossColorClass } from '../../utils/formatters';

interface Props {
  summary: PortfolioSummary;
}

interface Card {
  label: string;
  value: string;
  sub?: string;
  valueClass: string;
}

function SummaryCards({ summary }: Props) {
  const gainLossClass = getGainLossColorClass(summary.totalGainLoss);

  const cards: Card[] = [
    {
      label: 'Total Investment',
      value: formatCurrency(summary.totalInvestment),
      valueClass: 'text-blue-400',
    },
    {
      label: 'Present Value',
      value: formatCurrency(summary.totalPresentValue),
      valueClass: 'text-violet-400',
    },
    {
      label: 'Overall Gain / Loss',
      value: formatCurrency(summary.totalGainLoss),
      sub: formatPercent(summary.totalGainLossPercent),
      valueClass: gainLossClass,
    },
    {
      label: 'Holdings',
      value: summary.stockCount.toString(),
      sub: 'across all sectors',
      valueClass: 'text-gray-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-gray-800 border border-gray-700/60 rounded-2xl p-5 shadow-md"
        >
          <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
            {card.label}
          </p>
          <p className={`text-xl font-bold tabular-nums ${card.valueClass}`}>{card.value}</p>
          {card.sub && (
            <p className={`text-sm mt-1 tabular-nums ${card.valueClass} opacity-80`}>
              {card.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(SummaryCards);