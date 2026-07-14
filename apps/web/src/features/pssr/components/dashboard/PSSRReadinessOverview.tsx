'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Badge, PSSRCard } from '../pssr-ui';

// Color mapping that strictly respects the specific keys found in your status distribution rows
const STATUS_COLORS: Record<string, string> = {
  'Not Ready': '#ef4444',             // Light Red
  'In Progress': '#f97316',           // Orange
  'Blocked': '#dc2626',               // Deep Red / Crimson
  'Ready Pending Signatures': '#eab308', // Yellow
  'Authorized': '#3b82f6',            // Blue
  'Released': '#22c55e',              // Green
};

// Fallback color for any generic statuses that might get passed down
const DEFAULT_COLOR = '#64748b'; 

export function PSSRReadinessOverview({ overview }: { overview: any }) {
  const distribution = overview?.distribution ?? [];

  // Calculate the live dynamic total from the code's real incoming dataset
  const totalCount = distribution.reduce((sum: number, row: any) => sum + row.count, 0);

  // Transform incoming overview data safely into valid structural format for recharts
  const chartData = distribution.map((item: any) => {
    const rawPercentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
    return {
      name: item.status,
      value: item.count,
      percentage: `${Math.round(rawPercentage)}%`,
      color: STATUS_COLORS[item.status] || DEFAULT_COLOR,
    };
  });

  return (
    <PSSRCard 
      title={
        <div className="flex items-center gap-2">
          <span>Startup Readiness Overview</span>
          <Info size={16} className="text-slate-400 cursor-help" />
        </div>
      } 
      action={
        <Badge tone={overview?.criticalBlocked ? 'red' : 'green'}>
          {overview?.averageReadinessPercent ?? 0}% avg
        </Badge>
      }
    >
      {/* Top Section: Donut Chart Layout matched with image_53eb80.png + Mini Summary Cards */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] items-center">
        
        {/* Left Side: Donut Visual Graph & Legend Layout from image_53eb80.png */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-lg border border-cyan-300/5 bg-slate-950/20 p-4">
          
          {/* Donut Chart Block */}
          <div className="relative h-44 w-44 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white tracking-tight">{totalCount}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
          </div>

          {/* Right Side Stacked Legend Rows matching image_53eb80.png exactly */}
          <div className="flex flex-col space-y-2.5 flex-grow w-full">
            {chartData.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="h-3 w-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="font-medium text-slate-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 text-right">
                  <span className="font-bold text-white">{item.value}</span>
                  <span className="text-xs font-medium text-slate-500">({item.percentage})</span>
                </div>
              </div>
            ))}
            {distribution.length === 0 && (
              <div className="text-xs text-slate-500 italic text-center w-full py-4">
                No breakdown data available
              </div>
            )}
          </div>
        </div>

        {/* Right Side Grid: Metric Milestone Tiles preserved cleanly */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 w-full">
          <Mini label="Critical blocked" value={overview?.criticalBlocked ?? 0} tone="red" />
          <Mini label="Within 24 hours" value={overview?.within24Hours ?? 0} tone="amber" />
          <Mini label="Within 7 days" value={overview?.within7Days ?? 0} tone="blue" />
        </div>
      </div>

      {/* Bottom Section: Breakdown Framework mapping your Site, Unit, and Type arrays */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Breakdown title="By Site" rows={overview?.bySite} />
        <Breakdown title="By Unit" rows={overview?.byUnit} />
        <Breakdown title="By Type" rows={overview?.byPssrType} />
      </div>
    </PSSRCard>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: any }) {
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone === 'red' ? 'text-red-400' : tone === 'amber' ? 'text-amber-400' : 'text-blue-300'}`}>
        {value}
      </p>
    </div>
  );
}

function Breakdown({ title, rows = [] }: { title: string; rows?: any[] }) {
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-slate-950/25 p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">{title}</p>
      {rows && rows.length > 0 ? (
        rows.slice(0, 4).map((row: any) => (
          <div key={row.label} className="flex items-center justify-between border-t border-white/5 py-2 text-xs">
            <span className="truncate text-slate-300 pr-2">{row.label}</span>
            <span className="font-black text-white whitespace-nowrap">{row.count} · {row.averageReadiness}%</span>
          </div>
        ))
      ) : (
        <div className="text-xs text-slate-600 italic py-1">No data parameters found</div>
      )}
    </div>
  );
}