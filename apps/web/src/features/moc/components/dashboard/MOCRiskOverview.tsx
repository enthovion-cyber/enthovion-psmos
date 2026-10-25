'use client';

import React from 'react';
import { AlertTriangle, ChevronRight, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

const getRiskColor = (label: string) => {
  const norm = (label ?? '').toLowerCase();
  if (norm === 'critical') return '#ef4444';
  if (norm === 'high') return '#f97316';
  if (norm === 'medium') return '#f59e0b';
  return '#10b981';
};

const riskBadgeTone = (level: string) => {
  const norm = (level ?? '').toLowerCase();
  if (norm === 'critical') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30';
  if (norm === 'high') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
  if (norm === 'medium') return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30';
  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
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
  data?: Record<string, any> | undefined;
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
    <div className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-between h-full transition-colors text-[var(--psm-fg)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--psm-fg)]">
            HAZOP & PHA Risk Distribution
          </h3>
        </div>
        <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--psm-muted)] border border-[var(--psm-line)]">
          Risk Dashboard
        </span>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {/* ROW 1: Donut Chart Viewport & Legends */}
        <div className="rounded-xl bg-[var(--psm-surface-2)] p-3 border border-[var(--psm-line)] w-full">
          {distribution.length ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-1">
              <div className="relative h-36 w-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={58}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-risk-${index}`} 
                          fill={entry.color} 
                          stroke="none" 
                          className="cursor-pointer" 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'var(--psm-surface, #1e293b)', border: '1px solid var(--psm-line, #334155)', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: 'var(--psm-fg, #f8fafc)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-black text-[var(--psm-fg)] tracking-tight leading-none">{total}</span>
                  <span className="text-[9px] uppercase tracking-widest text-[var(--psm-muted)] font-extrabold mt-1">Total</span>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="grid w-full flex-1 grid-cols-1 gap-1.5 sm:grid-cols-2">
                {distribution.map((item: any) => {
                  const label = item.risk_level ?? item.label;
                  const percent = total ? Math.round((Number(item.count ?? 0) / total) * 100) : 0;
                  const color = getRiskColor(label);

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFilters({ risk_level: label })}
                      className="flex w-full items-center justify-between rounded-lg bg-[var(--psm-surface)] px-2.5 py-1.5 text-left border border-[var(--psm-line)] hover:border-primary/50 transition-colors focus:outline-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs font-semibold text-[var(--psm-fg)] truncate">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--psm-muted)] shrink-0 ml-2">
                        <span className="text-[var(--psm-fg)]">{item.count}</span>
                        <span className="text-[10px]">({percent}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-[var(--psm-muted)]">No risk distribution data</div>
          )}
        </div>

        {/* ROW 2: Sub-lists */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-start w-full">
          {/* Top Risk Items */}
          <div className="flex flex-col rounded-xl bg-[var(--psm-surface-2)] p-3 border border-[var(--psm-line)] w-full">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--psm-fg)]">
              <AlertTriangle size={14} className="text-rose-500" /> Top Priority Risk Items
            </div>
            <div className="space-y-1.5">
              {top.slice(0, 2).map((item: any) => (
                <a
                  key={item.id}
                  href={`/moc/${item.id}`}
                  className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-xs text-[var(--psm-fg)] truncate max-w-[70%]">
                      <span className="text-primary font-mono font-bold">{item.moc_number ?? item.mocNumber}</span> · {item.title}
                    </p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${riskBadgeTone(item.risk_level ?? item.riskLevel)}`}>
                      {item.risk_level ?? item.riskLevel}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* High Risk Process Units */}
          <div className="flex flex-col rounded-xl bg-[var(--psm-surface-2)] p-3 border border-[var(--psm-line)] w-full">
            <div className="mb-2 text-xs font-bold text-[var(--psm-fg)]">Process Unit Hotspots</div>
            <div className="space-y-1.5">
              {units.slice(0, 2).map((unit: any) => (
                <button
                  key={unit.id ?? unit.name ?? unit.label}
                  type="button"
                  onClick={() => setFilters({ unit_id: unit.id ?? unit.label, risk_level: 'High' })}
                  className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 text-left hover:border-primary/50 transition-colors w-full"
                >
                  <p className="font-semibold text-xs text-[var(--psm-fg)] truncate max-w-[80%]">
                    {unit.name ?? unit.label ?? 'Unit'}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-mono font-black text-rose-500">
                      {unit.count ?? unit.High ?? unit.Critical ?? unit.total}
                    </span>
                    <ChevronRight size={12} className="text-[var(--psm-muted)]" />
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
