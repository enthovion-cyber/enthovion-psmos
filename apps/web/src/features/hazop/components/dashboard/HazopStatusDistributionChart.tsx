import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

// 1. Exact color mapping for the professional dark theme
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

// 2. Define the exact order and names of your standard statuses
// This guarantees they ALWAYS appear in the legend, even if value is 0.
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
  
  // 3. Merge incoming data with the standard statuses
  const completeData = useMemo(() => {
    // Create a lookup map from the provided data for fast access
    const dataMap = new Map(data.map(item => [item.name, item.value]));

    // Map over standard statuses to ensure they all exist, defaulting to 0
    const mergedData = STANDARD_STATUSES.map(name => ({
      name,
      value: dataMap.get(name) || 0
    }));

    // If there are any custom/extra statuses not in our standard list, append them
    data.forEach(item => {
      if (!STANDARD_STATUSES.includes(item.name)) {
        mergedData.push({ name: item.name, value: item.value });
      }
    });

    return mergedData;
  }, [data]);

  // Calculate total dynamically using our completed data array
  const total = useMemo(() => completeData.reduce((sum, item) => sum + item.value, 0), [completeData]);

  return (
    <Panel title="Studies by Status">
      <div className="flex h-full flex-col sm:flex-row items-center gap-6 pb-2">
        
        {/* Left Side: Doughnut Chart */}
        <div className="relative flex h-[220px] w-full flex-1 items-center justify-center sm:max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {total === 0 ? (
                // Fallback: If total is 0, render a clean empty gray ring
                <Pie 
                  data={[{ name: 'No Data', value: 1 }]} 
                  dataKey="value" 
                  innerRadius={65} 
                  outerRadius={95} 
                  stroke="none"
                  fill="var(--psm-line, #334155)" 
                />
              ) : (
                // Normal: Render actual data
                <Pie 
                  data={completeData} 
                  dataKey="value" 
                  innerRadius={65} 
                  outerRadius={95} 
                  paddingAngle={0}
                  stroke="none"
                >
                  {completeData.map((item, index) => (
                    <Cell 
                      key={item.name} 
                      fill={STATUS_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} 
                    />
                  ))}
                </Pie>
              )}
              {total > 0 && (
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--psm-surface, #1e293b)', 
                    borderColor: 'var(--psm-line, #334155)',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }} 
                  itemStyle={{ color: '#e2e8f0' }}
                  // Only show tooltip for items that actually have a value > 0
                  filterNull={false}
                  formatter={(value: number) => value === 0 ? [null, null] : [value, '']}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Label Overlay */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
            <span className="text-[28px] font-semibold tracking-tight text-white leading-none">
              {total}
            </span>
            <span className="text-[13px] font-medium text-gray-400 mt-1">
              Total
            </span>
          </div>
        </div>

        {/* Right Side: Detailed Legend (Always renders all statuses) */}
        <div className="flex w-full flex-col justify-center space-y-2.5 sm:w-[200px]">
          {completeData.map((item, index) => {
            // Calculate percentage safely avoiding division by zero
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = STATUS_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            
            return (
              <div key={item.name} className="flex items-center justify-between text-[13px]">
                
                {/* Status Indicator & Name */}
                <div className="flex items-center gap-2.5">
                  <span 
                    className="h-2.5 w-2.5 rounded-sm shadow-sm" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="font-medium text-gray-300">
                    {item.name}
                  </span>
                </div>

                {/* Absolute Value & Percentage */}
                <div className="flex items-center text-right font-medium tracking-wide">
                  <span className="w-[28px] text-gray-200">
                    {item.value}
                  </span>
                  <span className="w-[42px] text-gray-500">
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

// --- Reusable UI Sub-components ---

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-full max-w-lg rounded-xl border border-[var(--psm-line,#1e293b)] bg-[var(--psm-surface,#0f172a)] p-5 shadow-lg">
      <h3 className="mb-4 text-base font-semibold text-white tracking-wide">
        {title}
      </h3>
      {children}
    </section>
  );
}