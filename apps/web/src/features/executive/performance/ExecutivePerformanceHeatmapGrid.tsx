'use client';

import React from 'react';
import type { ExecutiveHeatmapCell } from '../types/executive-performance.types';
import { ExecutiveHeatmapCellStatusBadge } from '../shared/ExecutiveHeatmapCellStatusBadge';

interface Props {
  cells: ExecutiveHeatmapCell[];
  onCellClick?: (cell: ExecutiveHeatmapCell) => void;
}

export function ExecutivePerformanceHeatmapGrid({ cells = [], onCellClick }: Props) {
  // Extract unique rows and columns
  const rows = Array.from(new Set(cells.map((c) => c.row_label)));
  const columns = Array.from(new Set(cells.map((c) => c.column_label)));

  const getCell = (row: string, col: string) => {
    return cells.find((c) => c.row_label === row && c.column_label === col);
  };

  const getCellBg = (status?: string) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'Monitor':
        return 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border-amber-500/30';
      case 'Warning':
      case 'Attention Required':
        return 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-800 dark:text-orange-300 border-orange-500/30';
      case 'Critical':
      case 'High Risk':
        return 'bg-red-500/25 hover:bg-red-500/35 text-red-800 dark:text-red-300 border-red-500/40';
      case 'Restricted':
        return 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-800 dark:text-purple-300 border-purple-500/30';
      default:
        return 'bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  if (!cells.length) {
    return (
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-12 text-center text-sm text-[var(--psm-muted)]">
        No permitted performance heatmap data available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <div className="border-b border-[var(--psm-line)] p-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--psm-text)]">Process Safety Health Heatmap</h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Cross-module risk and compliance density across permitted scopes. Click a cell for drilldown.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:mt-0">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500/30 border border-emerald-500/50" /> Healthy</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500/30 border border-amber-500/50" /> Monitor</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-orange-500/30 border border-orange-500/50" /> Warning</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500/30 border border-red-500/50" /> Critical</span>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left font-semibold text-[var(--psm-muted)] min-w-[140px]">Scope</th>
              {columns.map((col) => (
                <th key={col} className="p-2 text-center font-semibold text-[var(--psm-muted)] min-w-[100px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => (
              <tr key={row}>
                <td className="p-2 font-bold text-[var(--psm-text)]">{row}</td>
                {columns.map((col) => {
                  const cell = getCell(row, col);
                  const status = cell?.cell_status ?? 'Unavailable';
                  const val = cell?.cell_value ?? cell?.cell_text_value ?? '—';
                  const isRestricted = cell?.restricted;

                  return (
                    <td key={`${row}-${col}`} className="p-1">
                      <button
                        type="button"
                        onClick={() => cell && onCellClick?.(cell)}
                        disabled={!cell || isRestricted}
                        title={
                          cell
                            ? `${row} · ${col}: ${status} (${val})`
                            : 'No data'
                        }
                        className={`w-full rounded-lg border p-2.5 text-center font-bold transition-all ${getCellBg(
                          status
                        )} ${!cell || isRestricted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        <div className="text-sm font-black">{isRestricted ? '🔒' : val}</div>
                        <div className="mt-0.5 text-[10px] font-medium tracking-tight">
                          {isRestricted ? 'Restricted' : status}
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
