import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const HEALTH_COLORS: Record<string, string> = {
  'Open': '#ef4444',                 // Red
  'In Progress': '#f97316',          // Orange
  'Pending Verification': '#eab308', // Yellow
  'Closed': '#22c55e',               // Green
  'Rejected': '#64748b',             // Slate
  'Overdue': '#dc2626',              // Dark Red
  'Safety Critical': '#ea580c',      // Dark Orange
};

const STANDARD_METRICS = [
  'Open',
  'In Progress',
  'Pending Verification',
  'Closed',
  'Rejected',
  'Overdue',
  'Safety Critical'
];

const FALLBACK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#64748b', '#dc2626', '#ea580c'];

interface HealthData {
  open?: number;
  inProgress?: number;
  pendingVerification?: number;
  closed?: number;
  rejected?: number;
  overdue?: number;
  safetyCritical?: number;
  [key: string]: number | undefined;
}

export function HazopRecommendationHealthPanel({ health = {} }: { health: HealthData }) {
  const completeData = useMemo(() => {
    return [
      { name: 'Open', value: Number(health.open ?? 0) },
      { name: 'In Progress', value: Number(health.inProgress ?? 0) },
      { name: 'Pending Verification', value: Number(health.pendingVerification ?? 0) },
      { name: 'Closed', value: Number(health.closed ?? 0) },
      { name: 'Rejected', value: Number(health.rejected ?? 0) },
      { name: 'Overdue', value: Number(health.overdue ?? 0) },
      { name: 'Safety Critical', value: Number(health.safetyCritical ?? 0) }
    ];
  }, [health]);

  const total = useMemo(() => {
    return Number(health.open ?? 0) + 
           Number(health.inProgress ?? 0) + 
           Number(health.pendingVerification ?? 0) + 
           Number(health.closed ?? 0) + 
           Number(health.rejected ?? 0);
  }, [health]);

  const chartSegments = useMemo(() => {
    return completeData.filter(d => ['Open', 'In Progress', 'Pending Verification', 'Closed', 'Rejected'].includes(d.name) && d.value > 0);
  }, [completeData]);

  return (
    <Panel title="Recommendation Health">
      <div className="flex h-full flex-col sm:flex-row items-center gap-4 pb-1">
        {/* Left Side: Half-Donut Chart Gauge */}
        <div className="relative flex h-[190px] w-full flex-1 items-center justify-center sm:max-w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {chartSegments.length === 0 ? (
                <Pie
                  data={[{ name: 'Empty', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={180}
                  endAngle={0}
                  dataKey="value"
                  stroke="transparent"
                  isAnimationActive={false}
                >
                  <Cell fill="var(--psm-line)" />
                </Pie>
              ) : (
                <Pie
                  data={chartSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={180}
                  endAngle={0}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="transparent"
                >
                  {chartSegments.map((entry, index) => {
                    const color = HEALTH_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length] || '#3b82f6';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
              )}
              
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0 && payload[0]) {
                    const item = payload[0];
                    const percentage = total > 0 ? Math.round(((Number(item.value) || 0) / total) * 100) : 0;
                    return (
                      <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1.5 shadow-xl text-xs">
                        <span className="font-semibold text-[var(--psm-text)]">{item.name ?? 'Status'}: </span>
                        <span className="font-bold text-primary">{item.value ?? 0}</span>
                        <span className="text-[var(--psm-muted)] ml-1">({percentage}%)</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-8 text-center">
            <span className="text-2xl font-bold tracking-tight text-[var(--psm-text)] leading-none">
              {total}
            </span>
            <span className="text-[11px] font-medium text-[var(--psm-muted)] mt-1">
              Total
            </span>
          </div>
        </div>

        {/* Right Side: Detailed Legend */}
        <div className="flex w-full flex-col justify-center space-y-1.5 sm:w-[200px]">
          {completeData.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = HEALTH_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            
            return (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span 
                    className="h-2 w-2 rounded-sm shrink-0" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="truncate text-[var(--psm-text)] font-medium">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center text-right font-medium tracking-wide shrink-0">
                  <span className="w-[24px] text-[var(--psm-text)] font-bold">
                    {item.value}
                  </span>
                  <span className="w-[38px] text-[var(--psm-muted)] text-[10px]">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[var(--psm-text)] tracking-wide">
        {title}
      </h3>
      {children}
    </section>
  );
}
