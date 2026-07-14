'use client';

import React from 'react';
import { AlertTriangle, BarChart3, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

const getRiskColor = (label: string) => {
  const norm = label.toLowerCase();
  if (norm === 'high' || norm === 'critical') return '#f87171';
  if (norm === 'medium') return '#fbbf24';
  return '#4ade80';
};

const riskTone = (level: string) => {
  const norm = level.toLowerCase();
  if (norm === 'high' || norm === 'critical') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (norm === 'medium') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-green-500/10 text-green-400 border border-green-500/20';
};

const DEFAULT_MOCK_DATA = {
  distribution: [
    { risk_level: 'Critical', count: 4 },
    { risk_level: 'High', count: 18 },
    { risk_level: 'Medium', count: 32 },
    { risk_level: 'Low', count: 56 },
  ],
  highRiskUnits: [
    { id: 'u1', name: 'Crude Distillation Unit (CDU)', count: 6 },
    { id: 'u2', name: 'Fluid Catalytic Cracker (FCCU)', count: 5 },
    { id: 'u3', name: 'Hydrotreater Block (HTU)', count: 4 },
    { id: 'u4', name: 'Amine Treating Unit', count: 2 },
  ],
  topRiskItems: [
    { id: 'moc-102', mocNumber: 'MOC-2026-089', title: 'Emergency Bypass Line Modification', riskLevel: 'Critical', status: 'Under Review', daysOpen: 14, currentWorkflowStep: 'Safety Review' },
    { id: 'moc-105', mocNumber: 'MOC-2026-112', title: 'Catalyst Changeout Procedure Alteration', riskLevel: 'High', status: 'Implementation', daysOpen: 28, currentWorkflowStep: 'Pre-Com' },
  ]
};

interface MOCRiskOverviewProps {
  data?: {
    distribution?: Array<{ risk_level?: string; label?: string; count: number }>;
    highRiskUnits?: Array<{ id?: string; name?: string; label?: string; count?: number; High?: number; Critical?: number; total?: number }>;
    byUnit?: Array<any>;
    topRiskItems?: Array<{ id: string | number; moc_number?: string; mocNumber?: string; title: string; risk_level?: string; riskLevel?: string; status: string; daysOpen?: number; ageDays?: number; age_days?: number; currentWorkflowStep?: string }>;
    plantManagerAttention?: Array<any>;
  };
}

export function MOCRiskOverview({ data = {} }: MOCRiskOverviewProps) {
  const setFilters = useMOCDashboardStore((state) => state.setFilters);

  const distribution = data.distribution && data.distribution.length > 0 ? data.distribution : DEFAULT_MOCK_DATA.distribution;
  const units = data.highRiskUnits ?? data.byUnit ?? DEFAULT_MOCK_DATA.highRiskUnits;
  const top = data.topRiskItems ?? data.plantManagerAttention ?? DEFAULT_MOCK_DATA.topRiskItems;
  
  const total = distribution.reduce((sum: number, item: any) => sum + Number(item.count ?? 0), 0);

  const chartData = distribution.map((item: any) => {
    const label = item.risk_level ?? item.label;
    return {
      name: label,
      value: Number(item.count ?? 0),
      color: getRiskColor(label),
    };
  });

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-between h-full">
      {/* Tightened Header */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Risk Overview
          </h3>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-800">
          Risk Dashboard
        </span>
      </div>

      <div className="flex flex-col gap-4 w-full content-start">
        
        {/* ROW 1: Smaller Chart Viewport & Shorter Gaps */}
        <div className="rounded-xl bg-slate-900/40 p-3 border border-slate-900 w-full">
          {distribution.length ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-1">
              
              {/* Reduced chart size from h-60/w-60 down to h-36/w-36 */}
              <div className="relative h-36 w-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={58}
                      paddingAngle={1}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-risk-${index}`} 
                          fill={entry.color} 
                          stroke="none" 
                          className="cursor-pointer" 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px' }}
                      itemStyle={{ color: '#f8fafc', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-black text-white tracking-tight leading-none">{total}</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold mt-1">Total</span>
                </div>
              </div>

              {/* Tighter Legend Grid */}
              <div className="grid w-full flex-1 grid-cols-1 gap-1.5 sm:grid-cols-2">
                {distribution.map((item: any) => {
                  const label = item.risk_level ?? item.label;
                  const percent = total ? Math.round((Number(item.count ?? 0) / total) * 100) : 0;
                  const color = getRiskColor(label);

                  return (
                    <button
                      key={label}
                      onClick={() => setFilters({ risk_level: label })}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-950 px-2.5 py-1.5 text-left border border-slate-900 hover:border-slate-800 transition-all focus:outline-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs font-semibold text-slate-300 truncate">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0 ml-2">
                        <span className="text-slate-100">{item.count}</span>
                        <span className="text-[10px] font-medium text-slate-500">({percent}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">No risk distribution data</div>
          )}
        </div>

        {/* ROW 2: Tighter Sub-lists (Sliced to display fewer items simultaneously to control maximum card height) */}
        <div className="grid gap-4 sm:grid-cols-2 items-start w-full">
          
          {/* Top Risk Items (Reduced height padding & limited to 2 max rows) */}
          <div className="flex flex-col rounded-xl bg-slate-900/40 p-3 border border-slate-900 w-full">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white">
              <AlertTriangle size={14} className="text-red-400" /> Top Risks
            </div>
            <div className="space-y-1.5">
              {top.slice(0, 2).map((item: any) => (
                <a
                  key={item.id}
                  href={`/moc/${item.id}`}
                  className="block rounded-lg border border-slate-900 bg-slate-950 p-2 hover:border-slate-800 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-xs text-slate-200 truncate max-w-[70%]">
                      <span className="text-red-400 font-bold">{item.moc_number ?? item.mocNumber}</span> · {item.title}
                    </p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${riskTone(item.risk_level ?? item.riskLevel)}`}>
                      {item.risk_level ?? item.riskLevel}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* High Risk Process Units (Limited to 2 max items to clean up space) */}
          <div className="flex flex-col rounded-xl bg-slate-900/40 p-3 border border-slate-900 w-full">
            <div className="mb-2 text-xs font-bold text-white">Process Hotspots</div>
            <div className="space-y-1.5">
              {units.slice(0, 2).map((unit: any) => (
                <button
                  key={unit.id ?? unit.name ?? unit.label}
                  onClick={() => setFilters({ unit_id: unit.id ?? unit.label, risk_level: 'High' })}
                  className="flex items-center justify-between rounded-lg border border-slate-900 bg-slate-950 p-2 text-left hover:border-slate-800 transition-all w-full"
                >
                  <p className="font-semibold text-xs text-slate-300 truncate max-w-[80%]">
                    {unit.name ?? unit.label ?? 'Unit'}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-black text-red-400">
                      {unit.count ?? unit.High ?? unit.Critical ?? unit.total}
                    </span>
                    <ChevronRight size={12} className="text-slate-700" />
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}