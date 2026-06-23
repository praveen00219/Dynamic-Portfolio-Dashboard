'use client';
import React, { memo, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StockData } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const PALETTE = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#0EA5E9', '#A855F7',
];

interface Props {
  stocks: StockData[];
}

function AllocationChart({ stocks }: Props) {
  // Recompute only when stocks array changes
  const data = useMemo(
    () =>
      stocks.map((s, i) => ({
        name: s.name,
        value: s.investment,
        fill: PALETTE[i % PALETTE.length],
      })),
    [stocks]
  );

  return (
    <div className="bg-gray-800 border border-gray-700/60 rounded-2xl p-5 shadow-md">
      <h3 className="text-white font-semibold text-sm mb-4">Portfolio Allocation</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Investment']}
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '12px',
              fontSize: '12px',
            }}
            itemStyle={{ color: '#D1D5DB' }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Legend
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(AllocationChart);