'use client';

import React from 'react';
import { Info, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Badge, PSSRCard } from '../pssr-ui';

// Palette definitions strictly matching the visual specs of the dashboard
const PUNCH_PALETTE = {
  categoryA: '#ef4444',          // Light Red / Crimson
  categoryB: '#f97316',          // Orange
  overdue: '#dc2626',            // Darker Red
  pendingVerification: '#3b82f6', // Premium Blue
  closed: '#22c55e',             // Emerald Green
};

export function PSSRPunchHealthPanel({ 
  punch,
  onViewRegister 
}: { 
  punch: any;
  onViewRegister?: () => void;
}) {
  // Extract real numbers from the incoming punch prop data object
  const catA = punch?.categoryAOpen ?? 0;
  const catB = punch?.categoryBOpen ?? 0;
  const overdue = punch?.overdue ?? 0;
  const pending = punch?.pendingVerification ?? 0;
  const closed = punch?.closed ?? 0;
  
  // Dynamic total calculation bound to active rows
  const totalPunchItems = punch?.total ?? (catA + catB + overdue + pending + closed);

  // Helper to compute a cleaner string percentage layout
  const getPercentStr = (value: number) => {
    if (!totalPunchItems) return '0%';
    return `${Math.round((value / totalPunchItems) * 100)}%`;
  };

  // Recharts data array constructed from your real code variables
  const chartData = [
    { name: 'Category A', value: catA, percentage: getPercentStr(catA), color: PUNCH_PALETTE.categoryA },
    { name: 'Category B', value: catB, percentage: getPercentStr(catB), color: PUNCH_PALETTE.categoryB },
    { name: 'Overdue', value: overdue, percentage: getPercentStr(overdue), color: PUNCH_PALETTE.overdue },
    { name: 'Pending Verification', value: pending, percentage: getPercentStr(pending), color: PUNCH_PALETTE.pendingVerification },
    { name: 'Closed', value: closed, percentage: getPercentStr(closed), color: PUNCH_PALETTE.closed },
  ].filter(item => item.value >= 0); // Keeps zero values in legend for UI layout structural symmetry

  return (
    <PSSRCard 
      title={
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-tight text-slate-200">Punch List Health</span>
          <Info size={14} className="text-slate-500 cursor-help hover:text-slate-400 transition-colors" />
        </div>
      }
      action={
        <Badge tone={catA > 0 ? 'red' : 'green'}>
          {catA > 0 ? 'Category A Blocks Startup' : 'Clear for Startup'}
        </Badge>
      }
    >
      <div className="flex flex-col justify-between h-full bg-[#070d19]/40 rounded-xl p-4 border border-slate-800/40">
        
        {/* Top Graphical Row: Donut Split View Layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-grow py-1">
          
          {/* Left Side: Donut Container */}
          <div className="relative h-36 w-36 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.value > 0)} // Strip 0-count entries to prevent clipping bugs
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={totalPunchItems > 0 ? 1.5 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Absolute Overlay Card */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white tracking-tight font-sans">
                {totalPunchItems}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total
              </span>
            </div>
          </div>

          {/* Right Side: Informational Legend rows mapping real metadata values */}
          <div className="flex flex-col space-y-2 flex-grow w-full max-w-[200px] sm:max-w-none">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="font-medium text-slate-300 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 text-right pl-2">
                  <span className="font-bold text-slate-100">{item.value}</span>
                  <span className="text-[11px] font-medium text-slate-500 font-mono">({item.percentage})</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Section: Footer Actions Link Element */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <button 
            onClick={onViewRegister}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/50 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-slate-900/90 hover:border-slate-700/80 transition-all group"
          >
            <span>View Punch List Register</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

      </div>
    </PSSRCard>
  );
}