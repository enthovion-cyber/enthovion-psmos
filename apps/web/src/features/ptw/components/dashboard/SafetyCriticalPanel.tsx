import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, ShieldAlert, Zap } from 'lucide-react';

const RISK_COLORS: Record<string, string> = {
  'Safety-Critical': '#ef4444',
  'High Risk': '#f97316',
  'Critical Equipment': '#eab308',
  'Hot Work': '#3b82f6',
  'Confined Space': '#8b5cf6',
};

const STANDARD_RISK_KEYS = [
  'Safety-Critical',
  'High Risk',
  'Critical Equipment',
  'Hot Work',
  'Confined Space'
];

const FALLBACK_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'];

interface SafetyCriticalPanelProps {
  data?: any;
}

export function SafetyCriticalPanel({ data }: SafetyCriticalPanelProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'bypasses'>('chart');
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const activeBypasses: any[] = data?.activeBypasses ?? [];

  const completeData = useMemo(() => {
    const keyMapping: Record<string, string> = {
      permits: 'Safety-Critical',
      highRisk: 'High Risk',
      criticalEquipment: 'Critical Equipment',
      hotWork: 'Hot Work',
      confinedSpace: 'Confined Space'
    };

    const rawDataMap = new Map<string, number>();

    if (data) {
      Object.entries(data).forEach(([key, val]) => {
        const uiName = keyMapping[key] || key;
        rawDataMap.set(uiName, Array.isArray(val) ? val.length : 0);
      });
    }

    return STANDARD_RISK_KEYS.map(name => ({
      name,
      value: rawDataMap.get(name) ?? 0
    }));
  }, [data]);

  const total = useMemo(() => completeData.reduce((sum, item) => sum + item.value, 0), [completeData]);

  return (
    <section className="w-full h-full flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-red-500 dark:text-red-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Safety-Critical Elements (SCE)
          </h3>
        </div>
        <div className="flex rounded-md border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-900 p-0.5 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('chart')}
            type="button"
            className={`rounded px-2 py-0.5 transition ${
              activeTab === 'chart'
                ? 'bg-blue-600 font-bold text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bypasses')}
            type="button"
            className={`rounded px-2 py-0.5 transition flex items-center gap-1 ${
              activeTab === 'bypasses'
                ? 'bg-amber-600 font-bold text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap size={11} /> Bypasses ({activeBypasses.length})
          </button>
        </div>
      </div>

      {activeTab === 'bypasses' ? (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
          {activeBypasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 size={24} className="text-emerald-500 dark:text-emerald-400/80 mb-1.5" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Active SCE / SIF Barrier Bypasses</p>
              <p className="text-[10px] text-slate-500 mt-0.5">All plant interlocks, safety valves, and SIF loops are online.</p>
            </div>
          ) : (
            activeBypasses.map((bypass, idx) => (
              <div
                key={bypass.isolationId ?? idx}
                className="flex items-center justify-between rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs hover:border-amber-400 dark:hover:border-amber-500/50 transition"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-amber-800 dark:text-amber-300 truncate">
                      {bypass.isolationPointTag}
                    </span>
                    <span className="rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 px-1 py-0.2 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                      {bypass.silRating ?? 'SIL-2'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Permit <Link href={`/ptw/${bypass.permitId}`} className="text-primary dark:text-sky-400 hover:underline font-mono">{bypass.permitNumber}</Link> • {bypass.area ?? 'Area'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    bypass.bypassStatus === 'Approved'
                      ? 'border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 animate-pulse'
                  }`}>
                    {bypass.bypassStatus ?? 'Pending'}
                  </span>
                  <div className="mt-0.5 font-mono text-[9px] text-slate-500 dark:text-slate-400">
                    Cert: {bypass.bypassCertificateNumber}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pb-1">
          {/* Left Side: Doughnut Chart Ring */}
          <div className="relative flex h-[125px] w-[125px] shrink-0 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {total === 0 ? (
                  <Pie
                    data={[{ name: 'No Hazards', value: 1 }]}
                    dataKey="value"
                    innerRadius={38}
                    outerRadius={52}
                    stroke="none"
                    fill="#94a3b8"
                  />
                ) : (
                  <Pie
                    data={completeData}
                    dataKey="value"
                    innerRadius={38}
                    outerRadius={52}
                    paddingAngle={2}
                    stroke="none"
                    onMouseEnter={(item) => {
                      if (item && item.name) setHoveredName(item.name);
                    }}
                    onMouseLeave={() => setHoveredName(null)}
                  >
                    {completeData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={(RISK_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]) as string}
                        className="cursor-pointer transition-opacity duration-200 hover:opacity-90 focus:outline-none"
                      />
                    ))}
                  </Pie>
                )}
                {total > 0 && (
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const curr = payload[0];
                        const val = Number(curr?.value ?? 0);
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return (
                          <div className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] shadow-xl backdrop-blur-md">
                            <p className="font-semibold text-white">{curr?.name}</p>
                            <p className="text-slate-300">
                              Count: <span className="font-bold text-blue-400">{val}</span> ({pct}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>

            {/* Central Counter Display Hub */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider leading-tight">
                Total
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-none mt-0.5">
                {total}
              </span>
            </div>
          </div>

          {/* Right Side: Legend Column */}
          <div className="flex w-full flex-1 flex-col justify-center space-y-1 min-w-0">
            {completeData.map((item, index) => {
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const color = RISK_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

              return (
                <div
                  key={item.name}
                  className={`flex items-center justify-between text-xs transition-all duration-150 px-2 py-1 rounded-md cursor-pointer ${
                    hoveredName === item.name ? 'bg-slate-100 dark:bg-slate-800/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                  onMouseEnter={() => setHoveredName(item.name)}
                  onMouseLeave={() => setHoveredName(null)}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1.5">
                    <span
                      className="h-2 w-2 rounded-xs shadow-xs shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-[11px] truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 font-mono text-slate-700 dark:text-slate-300 text-xs font-bold">
                    <span>{item.value}</span>
                    <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
