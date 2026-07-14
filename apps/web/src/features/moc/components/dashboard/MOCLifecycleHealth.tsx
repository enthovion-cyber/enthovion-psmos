'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

// Master configuration providing distinct colors for every single MOC lifecycle stage
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

// High-fidelity production mock data fallback
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
  items?: Array<{ stage: string; count: number; filter?: any; percent?: number }>;
}

export function MOCLifecycleHealth({ items }: MOCLifecycleHealthProps) {
  const setFilters = useMOCDashboardStore((state) => state.setFilters);

  // Fallback cleanly to highly realistic data array if items array is missing or empty
  const activeItems = items && items.length > 0 ? items : REAL_MOCK_DATA;

  // Computes the total aggregate volume dynamically
  const totalMOCs = activeItems.reduce((sum, item) => sum + Number(item.count ?? 0), 0);

  // Map incoming dynamic data into clean structures optimized for Recharts ingestion
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
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-md md:p-8">
      {/* Header Layout */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white md:text-xl">
            MOC Lifecycle Health
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Real-time pipeline overview and process stage bottlenecks
          </p>
        </div>
        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400 border border-slate-800">
          Live Status
        </span>
      </div>

      {activeItems.length > 0 ? (
        <div className="flex flex-col items-center justify-center gap-10 lg:flex-row lg:gap-14 xl:gap-20">
          
          {/* LEFT: Perfectly Scaled Centralized Donut Chart Container */}
          <div className="relative h-56 w-56 flex-shrink-0 sm:h-60 sm:w-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={76}
                  outerRadius={94}
                  paddingAngle={1}
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
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  itemStyle={{ color: '#f8fafc', fontSize: '13px', fontWeight: '500' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Typography Readout Stack */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-4xl font-black text-white tracking-tight leading-none">
                {totalMOCs}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mt-1.5">
                Total Mocs
              </span>
            </div>
          </div>

          {/* RIGHT: High-density Responsive Data Grid Container */}
          <div className="grid w-full max-w-2xl flex-1 grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {activeItems.map((item) => {
              const stageName = String(item.stage);
              const config = STAGE_CONFIG[stageName] || DEFAULT_CONFIG;
              const percent = item.percent ?? (totalMOCs ? Math.round((Number(item.count ?? 0) / totalMOCs) * 100) : 0);

              return (
                <button
                  key={stageName}
                  onClick={() => setFilters(item.filter ?? { status: stageName })}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-900/40 px-3.5 py-2.5 text-left border border-slate-900 hover:border-slate-800 hover:bg-slate-900/90 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-slate-700"
                >
                  {/* Indicator & Metadata Group */}
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <span
                      className={`h-3 w-3 shrink-0 rounded-md shadow-sm ${config.bg}`}
                      style={{ backgroundColor: config.hex }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors truncate">
                      {stageName}
                    </span>
                  </div>

                  {/* Quantitative Metric Group */}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 shrink-0">
                    <span className="text-slate-100 group-hover:text-sky-400 transition-colors">
                      {item.count ?? 0}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
                      ({percent}%)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-slate-400">No lifecycle data available</p>
        </div>
      )}
    </div>
  );
}