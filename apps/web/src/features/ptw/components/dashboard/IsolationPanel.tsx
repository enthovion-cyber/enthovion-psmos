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
  const pendingPermits = data?.pending ?? [];

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
    <section className="w-full max-w-lg rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-lg select-none">
      
      {/* Top Header Row */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white tracking-wide">
          Isolation Status
        </h3>
        <a 
          href="/ptw?isolationPending=true" 
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          View pending →
        </a>
      </div>

      {/* Main Chart Workspace Grid Layout */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-slate-800/60">
        
        {/* Left Side: Doughnut Ring */}
        <div className="relative flex h-[220px] w-full flex-1 items-center justify-center sm:max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {total === 0 ? (
                <Pie 
                  data={[{ name: 'Clear', value: 1 }]} 
                  dataKey="value" 
                  innerRadius={68} 
                  outerRadius={92} 
                  stroke="none"
                  fill="#334155" 
                />
              ) : (
                <Pie 
                  data={completeData} 
                  dataKey="value" 
                  innerRadius={68} 
                  outerRadius={92} 
                  paddingAngle={2}
                  stroke="none"
                  onMouseEnter={(data) => {
                    if (data && data.name) setHoveredName(data.name);
                  }}
                  onMouseLeave={() => setHoveredName(null)}
                >
                  {completeData.map((item, index) => (
                    <Cell 
                      key={item.name} 
                      fill={ISOLATION_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} 
                      className="cursor-pointer transition-opacity duration-200 hover:opacity-90 focus:outline-none"
                    />
                  ))}
                </Pie>
              )}
              {total > 0 && (
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number, name: string) => value === 0 ? [null, null] : [value, name]}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Content: Locked Grand Total Count */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400 block">
              Total Qty
            </span>
            <span className="text-[32px] font-bold text-white leading-none mt-1.5">
              {total}
            </span>
          </div>
        </div>

        {/* Right Side: Pro Legend Stack */}
        <div className="flex w-full flex-col justify-center space-y-2.5 sm:w-[220px]">
          {completeData.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = ISOLATION_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            
            return (
              <div 
                key={item.name} 
                className={`flex items-center justify-between text-[13px] transition-all duration-150 p-1 rounded-md cursor-pointer ${
                  hoveredName === item.name ? 'bg-slate-800/60 scale-[1.02]' : 'opacity-80'
                }`}
                onMouseEnter={() => setHoveredName(item.name)}
                onMouseLeave={() => setHoveredName(null)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span 
                    className="h-2.5 w-2.5 rounded-sm shadow-sm flex-shrink-0" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="font-medium text-gray-200 truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center text-right font-medium tracking-wide flex-shrink-0 ml-2">
                  <span className="w-[28px] text-gray-100 font-semibold">
                    {item.value}
                  </span>
                  <span className="w-[42px] text-gray-500 text-[11px]">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Blockers Activity Section with Custom Sleek Scrollbar */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Isolation Blockers Tracking
        </h4>
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-700">
          {pendingPermits.length > 0 ? (
            pendingPermits.map((permit) => (
              <div 
                key={permit.id} 
                className="flex items-center justify-between text-[12px] bg-slate-900/50 hover:bg-slate-800/40 p-2 rounded-md border border-slate-800/40 transition-colors"
              >
                <span className="font-medium text-slate-300 font-mono">
                  {permit.permit_number}
                </span>
                <span className="font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">
                  {permit.isolations?.length ?? 0} points
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-1">
              No isolation blockers active.
            </p>
          )}
        </div>
      </div>

    </section>
  );
}