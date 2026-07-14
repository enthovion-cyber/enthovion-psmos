import React, { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Permit } from '@/services/ptw.service';

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
  data?: Record<string, Permit[]>;
}

export function SafetyCriticalPanel({ data }: SafetyCriticalPanelProps) {
  // Track hover strictly for legend row highlighting styles
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  
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
    <section className="w-full max-w-lg rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-lg select-none">
      <h3 className="mb-4 text-base font-semibold text-white tracking-wide">
        Safety-Critical Work
      </h3>
      
      <div className="flex h-full flex-col sm:flex-row items-center gap-6 pb-2">
        
        {/* Left Side: Doughnut Chart Ring */}
        <div className="relative flex h-[220px] w-full flex-1 items-center justify-center sm:max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {total === 0 ? (
                <Pie 
                  data={[{ name: 'No Hazards', value: 1 }]} 
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
                      fill={RISK_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} 
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
                  // Fixed formatter mapping the label directly to the standard risk name
                  formatter={(value: number, name: string) => value === 0 ? [null, null] : [value, name]}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered Ring: Absolute Static Counter (Does Not Change on Hover) */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="text-[12px] font-bold uppercase tracking-wider text-gray-400 block">
              Total Qty
            </span>
            <span className="text-[32px] font-bold text-white leading-none mt.15">
              {total}
            </span>
          </div>
        </div>

        {/* Right Side: Legend Column */}
        <div className="flex w-full flex-col justify-center space-y-2.5 sm:w-[220px]">
          {completeData.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = RISK_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
            
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
    </section>
  );
}