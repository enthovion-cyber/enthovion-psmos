import React, { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Permit } from '@/services/ptw.service';

const ISOLATION_COLORS: Record<string, string> = {
  'Isolation Pending': '#eab308',
  'Incomplete': '#f97316',
  'De-Isolation Pending': '#3b82f6',
  'Certificate Pending': '#ef4444',
};

const STANDARD_ISOLATION_KEYS = [
  'Isolation Pending',
  'Incomplete',
  'De-Isolation Pending',
  'Certificate Pending'
];

const FALLBACK_COLORS = ['#eab308', '#f97316', '#3b82f6', '#ef4444'];

interface IsolationPanelProps {
  data?: Record<string, Permit[]>;
}

export function IsolationPanel({ data }: IsolationPanelProps) {
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const completeData = useMemo(() => {
    const keyMapping: Record<string, string> = {
      pending: 'Isolation Pending',
      incomplete: 'Incomplete',
      deIsolationPending: 'De-Isolation Pending',
      certificatePending: 'Certificate Pending'
    };

    const rawDataMap = new Map<string, number>();

    if (data) {
      Object.entries(data).forEach(([key, val]) => {
        const uiName = keyMapping[key] || key;
        if (keyMapping[key]) {
          rawDataMap.set(uiName, Array.isArray(val) ? val.length : 0);
        }
      });
    }

    return STANDARD_ISOLATION_KEYS.map(name => ({
      name,
      value: rawDataMap.get(name) ?? 0
    }));
  }, [data]);

  const total = useMemo(() => completeData.reduce((sum, item) => sum + item.value, 0), [completeData]);

  return (
    <section className="w-full h-full flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      {/* Top Header Row */}
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Isolation Status
        </h3>
        <a
          href="/ptw?isolationPending=true"
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
        >
          View pending →
        </a>
      </div>

      {/* Main Chart Workspace Grid Layout */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pb-1">
        {/* Left Side: Doughnut Ring */}
        <div className="relative flex h-[125px] w-[125px] shrink-0 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {total === 0 ? (
                <Pie
                  data={[{ name: 'Clear', value: 1 }]}
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
                      fill={(ISOLATION_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]) as string}
                      className="cursor-pointer transition-opacity duration-200 hover:opacity-90 focus:outline-none"
                    />
                  ))}
                </Pie>
              )}
              {total > 0 && (
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    padding: '6px 10px'
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: any, name: any) => value === 0 ? ['—', ''] : [value, name]}
                />
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* Center Content: Locked Grand Total Count */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block leading-tight">
              Total
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-none mt-0.5">
              {total}
            </span>
          </div>
        </div>

        {/* Right Side: Pro Legend Stack */}
        <div className="flex w-full flex-1 flex-col justify-center space-y-1 min-w-0">
          {completeData.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = ISOLATION_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

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
    </section>
  );
}
