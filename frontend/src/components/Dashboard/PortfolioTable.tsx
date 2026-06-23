'use client';
import React, { memo, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { StockData } from '../../types';
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  getGainLossColorClass,
} from '../../utils/formatters';

interface Props {
  stocks: StockData[];
}

function PortfolioTable({ stocks }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // useMemo ensures column definitions are only recreated when the component mounts
  const columns = useMemo<ColumnDef<StockData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Particulars',
        cell: ({ getValue, row }) => (
          <div>
            <p className="font-medium text-white text-sm">{getValue<string>()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{row.original.ticker}</p>
          </div>
        ),
      },
      {
        accessorKey: 'exchange',
        header: 'NSE / BSE',
        cell: ({ getValue }) => (
          <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300 font-mono">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'purchasePrice',
        header: 'Buy Price',
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatCurrency(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'investment',
        header: 'Investment',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-blue-300">{formatCurrency(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'portfolioPercent',
        header: 'Portfolio %',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-gray-400">
            {formatPercent(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: 'cmp',
        header: 'CMP',
        cell: ({ getValue }) => (
          <span className="tabular-nums font-semibold text-yellow-400">
            {formatCurrency(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: 'presentValue',
        header: 'Present Value',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-violet-300">
            {formatCurrency(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: 'gainLoss',
        header: 'Gain / Loss',
        cell: ({ getValue, row }) => {
          const value = getValue<number | null>();
          const pct = row.original.gainLossPercent;
          const cls = getGainLossColorClass(value);
          return (
            <div className={cls}>
              <p className="font-semibold tabular-nums">{formatCurrency(value)}</p>
              <p className="text-xs tabular-nums opacity-80">{formatPercent(pct)}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'peRatio',
        header: 'P/E Ratio',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-gray-300">
            {formatNumber(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: 'latestEarnings',
        header: 'EPS',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-gray-300">
            {formatCurrency(getValue<number | null>())}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: stocks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-700/60 shadow-md">
      <table className="min-w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-gray-800 border-b border-gray-700">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-gray-200 transition-colors"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  <span className="ml-1 opacity-60">
                    {{ asc: '↑', desc: '↓' }[header.column.getIsSorted() as string] ?? ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className={`border-b border-gray-700/40 hover:bg-gray-700/25 transition-colors ${
                i % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-800/30'
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-gray-300">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(PortfolioTable);