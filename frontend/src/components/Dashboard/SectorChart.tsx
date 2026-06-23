'use client';
import React, { memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SectorSummary } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  sectors: SectorSummary[];
}

function SectorChart({ sectors }: Props) {
  const data = useMemo(
    () =>
      sectors.map((s) => ({
        name: s.sector,
        Investment: Math.round(s.totalInvestment),
        'Present Value': Math.round(s.totalPresentValue),
      })),
    [sectors]
  );

  const tickFormatter = (value: number) =>
    `₹${(value / 1000).toFixed(0)}K`;

  return (
    <div className="bg-gray-800 border border-gray-700/60 rounded-2xl p-5 shadow-md">
      <h3 className="text-white font-semibold text-sm mb-4">Sector Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={tickFormatter}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value)]}
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '12px',
              fontSize: '12px',
            }}
            itemStyle={{ color: '#D1D5DB' }}
            labelStyle={{ color: '#9CA3AF' }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{value}</span>
            )}
          />
          <Bar dataKey="Investment" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Present Value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(SectorChart);