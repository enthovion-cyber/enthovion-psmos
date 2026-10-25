'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

const STAGE_CONFIG: Record<string, { hex: string; bg: string }> = {
  'Draft': { hex: '#94A3B8', bg: 'bg-slate-400' },
  'Submitted': { hex: '#38BDF8', bg: 'bg-sky-400' },
  'Under Review': { hex: '#60A5FA', bg: 'bg-blue-400' },
  'Approved': { hex: '#22C55E', bg: 'bg-green-500' },
  'Implementation': { hex: '#A855F7', bg: 'bg-purple-500' },
  'Pending PSSR': { hex: '#F59E0B', bg: 'bg-amber-500' },
  'Ready For Startup': { hex: '#10B981', bg: 'bg-emerald-500' },
  'Released For Startup': { hex: '#14B8A6', bg: 'bg-teal-500' },
  'Closed': { hex: '#16A34A', bg: 'bg-green-600' },
  'Rejected': { hex: '#EF4444', bg: 'bg-red-500' },
  'Cancelled': { hex: '#6B7280', bg: 'bg-gray-500' },
  'Overdue Temporary Change': { hex: '#DC2626', bg: 'bg-red-600' },
};

const DEFAULT_CONFIG = { hex: '#EC4899', bg: 'bg-pink-500' };

const REAL_MOCK_DATA = [
  { stage: 'Draft', count: 12 },
  { stage: 'Submitted', count: 8 },
  { stage: 'Under Review', count: 15 },
  { stage: 'Approved', count: 6 },
  { stage: 'Implementation', count: 22 },
  { stage: 'Pending PSSR', count: 4 },
  { stage: 'Ready For Startup', count: 9 },
  { stage: 'Released For Startup', count: 5 },
  { stage: 'Closed', count: 45 },
  { stage: 'Rejected', count: 3 },
  { stage: 'Cancelled', count: 7 },
  { stage: 'Overdue Temporary Change', count: 2 },
];

interface MOCLifecycleHealthProps {
  items?: Array<Record<string, any>> | undefined;
}

export function MOCLifecycleHealth({ items }: MOCLifecycleHealthProps) {
  const setFilters = useMOCDashboardStore((state) => state.setFilters);

  const activeItems: Array<Record<string, any>> = items && items.length > 0 ? items : REAL_MOCK_DATA;
  const totalMOCs = activeItems.reduce((sum, item) => sum + Number(item.count ?? 0), 0);

  const chartData = activeItems
    .filter((item) => Number(item.count ?? 0) > 0)
    .map((item) => {
      const stageName = String(item.stage);
      const config = STAGE_CONFIG[stageName] || DEFAULT_CONFIG;
      return {
        name: stageName,
        value: Number(item.count ?? 0),
        color: config.hex,
      };
    });

  return (
    <div className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-between h-full transition-colors text-[var(--psm-fg)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--psm-fg)]">
            MOC Lifecycle Stage Pipeline
          </h3>
          <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
            Real-time pipeline distribution and workflow milestone tracking
          </p>
        </div>
        <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--psm-muted)] border border-[var(--psm-line)]">
          Live Status
        </span>
      </div>

      {activeItems.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8 lg:gap-10 py-2">
          {/* Donut Chart Container */}
          <div className="relative h-44 w-44 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-lifecycle-${index}`}
                      fill={entry.color}
                      stroke="none"
                      className="cursor-pointer transition-opacity duration-200 hover:opacity-90 focus:outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--psm-surface, #1e293b)',
                    border: '1px solid var(--psm-line, #334155)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: 'var(--psm-fg, #f8fafc)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Typography Readout Stack */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-3xl font-black text-[var(--psm-fg)] tracking-tight leading-none">
                {totalMOCs}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[var(--psm-muted)] font-extrabold mt-1">
                Total MOCs
              </span>
            </div>
          </div>

          {/* Right Grid of Stages */}
          <div className="grid w-full flex-1 grid-cols-1 gap-1.5 sm:grid-cols-2">
            {activeItems.map((item) => {
              const stageName = String(item.stage);
              const config = STAGE_CONFIG[stageName] || DEFAULT_CONFIG;
              const percent = item.percent ?? (totalMOCs ? Math.round((Number(item.count ?? 0) / totalMOCs) * 100) : 0);

              return (
                <button
                  key={stageName}
                  type="button"
                  onClick={() => setFilters(item.filter ?? { status: stageName })}
                  className="flex w-full items-center justify-between rounded-lg bg-[var(--psm-surface-2)] px-2.5 py-1.5 text-left border border-[var(--psm-line)] hover:border-primary/50 transition-colors group focus:outline-none"
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: config.hex }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold text-[var(--psm-fg)] truncate">
                      {stageName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--psm-muted)] shrink-0">
                    <span className="text-[var(--psm-fg)]">
                      {item.count ?? 0}
                    </span>
                    <span className="text-[10px]">
                      ({percent}%)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-[var(--psm-muted)]">
          No lifecycle data available
        </div>
      )}
    </div>
  );
}
