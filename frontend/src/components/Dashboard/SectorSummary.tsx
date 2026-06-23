'use client';
import React, { memo } from 'react';
import { SectorSummary as SectorSummaryType } from '../../types';
import { formatCurrency, formatPercent, getGainLossColorClass } from '../../utils/formatters';

interface Props {
  sectors: SectorSummaryType[];
}

function SectorSummary({ sectors }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      {sectors.map((sector) => {
        const gainClass = getGainLossColorClass(sector.gainLoss);
        return (
          <div
            key={sector.sector}
            className="bg-gray-800 border border-gray-700/60 rounded-2xl p-5 shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">{sector.sector}</h3>
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                {sector.stocks.length} stock{sector.stocks.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Investment</span>
                <span className="tabular-nums text-blue-300">
                  {formatCurrency(sector.totalInvestment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Present Value</span>
                <span className="tabular-nums text-violet-300">
                  {formatCurrency(sector.totalPresentValue)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                <span className="text-gray-400">Gain / Loss</span>
                <div className={`text-right ${gainClass}`}>
                  <p className="tabular-nums font-semibold">{formatCurrency(sector.gainLoss)}</p>
                  <p className="text-xs tabular-nums opacity-80">
                    {formatPercent(sector.gainLossPercent)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(SectorSummary);