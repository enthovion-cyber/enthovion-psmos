import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

// 1. Exact color mapping matched to the mockup
const HEALTH_COLORS: Record<string, string> = {
  'Open': '#ef4444',                 // Red
  'In Progress': '#f97316',          // Orange
  'Pending Verification': '#eab308', // Yellow/Amber
  'Closed': '#22c55e',               // Green
  'Rejected': '#64748b',             // Gray/Slate
};

// 2. Strict ordering to ensure the legend layout matches the mockup exactly
const STANDARD_HEALTH_KEYS = [
  'Open',
  'In Progress',
  'Pending Verification',
  'Closed',
  'Rejected'
];

const FALLBACK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#64748b'];

interface HazopRecommendationHealthPanelProps {
  health: Record<string, number>;
}

export function HazopRecommendationHealthPanel({ health }: HazopRecommendationHealthPanelProps) {
  
  // 3. Normalize data structure: Standardize names (handle camelCase/PascalCase variations)
  // and guarantee all keys exist even if their values are 0.
  const completeData = useMemo(() => {
    const normalizeKey = (key: string) => {
      // Normalizes keys like 'inProgress' or 'pendingVerification' to 'In Progress' or 'Pending Verification'
      const spaced = key.replace(/([A-Z])/g, ' $1').trim();
      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    };

    // Create an accessible dictionary of existing values with normalized keys
    const rawDataMap = new Map<string, number>();
    Object.entries(health ?? {}).forEach(([key, val]) => {
      rawDataMap.set(normalizeKey(key), Number(val ?? 0));
    });

    // Map standard keys ensuring baseline zero values exist
    const merged = STANDARD_HEALTH_KEYS.map(name => ({
      name,
      value: rawDataMap.get(name) ?? 0
    }));

    // If there are any custom keys from the payload not in standard keys, push them
    Array.from(rawDataMap.entries()).forEach(([name, value]) => {
      if (!STANDARD_HEALTH_KEYS.includes(name)) {
        merged.push({ name, value });
      }
    });

    return merged;
  }, [health]);

  // Calculate dynamic total across all items
  const total = useMemo(() => completeData.reduce((sum, item) => sum + item.value, 0), [completeData]);

  return (
    <Panel title="Recommendation Health">
      <div className="flex h-full flex-col sm:flex-row items-center gap-6 pb-2">
        
        {/* Left Side: Doughnut Chart */}
        <div className="relative flex h-[220px] w-full flex-1 items-center justify-center sm:max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {total === 0 ? (
                // Fallback: Gray ring placeholder if no values are active
                <Pie 
                  data={[{ name: 'No Data', value: 1 }]} 
                  dataKey="value" 
                  innerRadius={65} 
                  outerRadius={95} 
                  stroke="none"
                  fill="var(--psm-line, #334155)" 
                />
              ) : (
                // Primary Chart Content
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
                      fill={HEALTH_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} 
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
                  formatter={(value: number) => value === 0 ? [null, null] : [value, '']}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered Total Typography Ring Overlay */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
            <span className="text-[28px] font-semibold tracking-tight text-white leading-none">
              {total}
            </span>
            <span className="text-[13px] font-medium text-gray-400 mt-1">
              Total
            </span>
          </div>
        </div>

        {/* Right Side: Pro Detailed Legend Alignment */}
        <div className="flex w-full flex-col justify-center space-y-2.5 sm:w-[220px]">
          {completeData.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = HEALTH_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            
            return (
              <div key={item.name} className="flex items-center justify-between text-[13px]">
                
                {/* Square Marker & Metric Name */}
                <div className="flex items-center gap-2.5">
                  <span 
                    className="h-2.5 w-2.5 rounded-sm shadow-sm flex-shrink-0" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="font-medium text-gray-300 truncate">
                    {item.name}
                  </span>
                </div>

                {/* Right-Aligned Text Column Layout */}
                <div className="flex items-center text-right font-medium tracking-wide flex-shrink-0">
                  <span className="w-[32px] text-gray-200">
                    {item.value}
                  </span>
                  <span className="w-[45px] text-gray-500">
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

// --- Layout & Panel Shell Components ---

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