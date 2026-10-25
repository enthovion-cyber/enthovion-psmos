import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  'Draft': '#64748b',            // Slate
  'In Progress': '#3b82f6',      // Blue
  'In Review': '#f59e0b',        // Amber
  'Pending Approval': '#8b5cf6', // Purple
  'Approved': '#22c55e',         // Green
  'Closed': '#06b6d4',           // Cyan
  'Reopened': '#d946ef',         // Fuchsia
  'Cancelled': '#ef4444',        // Red
};

const STANDARD_STATUSES = [
  'Draft', 
  'In Progress', 
  'In Review', 
  'Pending Approval', 
  'Approved', 
  'Closed', 
  'Reopened', 
  'Cancelled'
];

const FALLBACK_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e', '#64748b', '#ef4444', '#06b6d4'];

interface ChartDataItem {
  name: string;
  value: number;
}

export function HazopStatusDistributionChart({ data = [] }: { data: ChartDataItem[] }) {
  const completeData = useMemo(() => {
    const dataMap = new Map(data.map(item => [item.name, item.value]));

    const mergedData = STANDARD_STATUSES.map(name => ({
      name,
      value: dataMap.get(name) || 0
    }));

    data.forEach(item => {
      if (!STANDARD_STATUSES.includes(item.name)) {
        mergedData.push({ name: item.name, value: item.value });
      }
    });

    return mergedData;
  }, [data]);

  const total = useMemo(() => completeData.reduce((sum, item) => sum + item.value, 0), [completeData]);

  return (
    <Panel title="Studies by Status">
      <div className="flex h-full flex-col sm:flex-row items-center gap-4 pb-1">
        {/* Left Side: Doughnut Chart */}
        <div className="relative flex h-[190px] w-full flex-1 items-center justify-center sm:max-w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {total === 0 ? (
                <Pie
                  data={[{ name: 'Empty', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  dataKey="value"
                  stroke="transparent"
                  isAnimationActive={false}
                >
                  <Cell fill="var(--psm-line)" />
                </Pie>
              ) : (
                <Pie
                  data={completeData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="transparent"
                >
                  {completeData
                    .filter(d => d.value > 0)
                    .map((entry, index) => {
                      const color = STATUS_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length] || '#3b82f6';
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

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tracking-tight text-[var(--psm-text)] leading-none">
              {total}
            </span>
            <span className="text-[11px] font-medium text-[var(--psm-muted)] mt-1">
              Total
            </span>
          </div>
        </div>

        {/* Right Side: Legend */}
        <div className="flex w-full flex-col justify-center space-y-1.5 sm:w-[200px]">
          {completeData.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = STATUS_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            
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
