import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface MatrixItem {
  severity: number;
  likelihood: number;
  count: number;
}

interface DistributionItem {
  name: string;
  value: number;
}

export function HazopRiskOverviewInfographic({ 
  matrix = [], 
  distribution = [] 
}: { 
  matrix: MatrixItem[]; 
  distribution: DistributionItem[]; 
}) {
  // Calculate totals and map distribution levels dynamically
  const byLevel = useMemo(() => {
    return Object.fromEntries(
      distribution.map((item) => [item.name, Number(item.value ?? 0)])
    );
  }, [distribution]);
  
  const totalScenarios = Number(byLevel.Total ?? distribution.reduce((sum, item) => sum + Number(item.value ?? 0), 0));
  const criticalCount = byLevel.Critical ?? 0;
  const highCount = byLevel.High ?? 0;
  const highCriticalTotal = criticalCount + highCount;
  const mediumCount = byLevel.Medium ?? 0;
  const lowCount = byLevel.Low ?? 0;
  const unrankedCount = byLevel.Unranked ?? 0;

  // Percentage safe calculations
  const getPercentageString = (value: number) => {
    if (!totalScenarios) return '0%';
    return `${Math.round((value / totalScenarios) * 100)}%`;
  };

  // Matrix Axis Configuration Maps
  const likelihoods = [
    { level: 5, label: 'Almost Certain' },
    { level: 4, label: 'Likely' },
    { level: 3, label: 'Possible' },
    { level: 2, label: 'Unlikely' },
    { level: 1, label: 'Rare' },
  ];

  const consequences = [
    { level: 1, label: 'Insignificant' },
    { level: 2, label: 'Minor' },
    { level: 3, label: 'Moderate' },
    { level: 4, label: 'Major' },
    { level: 5, label: 'Catastrophic' },
  ];

  return (
    <Panel title="Risk Overview (Initial Risk)">
      <div className="grid gap-5 lg:grid-cols-[1fr_210px] items-start">
        
        {/* Left Side: Dense Compact Heatmap Grid */}
        <div className="flex flex-col w-full overflow-x-auto pb-2 scrollbar-thin select-none">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 pl-[90px]">
            Likelihood
          </div>
          
          {/* Main Matrix Board Layout - Minimalistic tight gaps */}
          <div className="grid grid-cols-[90px_repeat(5,minmax(38px,46px))] gap-1.5 items-center min-w-[280px]">
            {likelihoods.map((row) => (
              <React.Fragment key={row.level}>
                
                {/* Y-Axis Micro Labels */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium pr-1 justify-end">
                  <span className="truncate text-right max-w-[68px]">{row.label}</span>
                  <span className="text-xs font-bold text-slate-300 w-3 text-center">{row.level}</span>
                </div>
                
                {/* Small Compact Matrix Cubes */}
                {consequences.map((col) => {
                  const cell = matrix.find(
                    (item) => Number(item.severity) === col.level && Number(item.likelihood) === row.level
                  );
                  const count = Number(cell?.count ?? 0);
                  
                  return (
                    <div
                      key={`${col.level}-${row.level}`}
                      className={`flex h-9 w-full items-center justify-center rounded border text-sm font-bold shadow-inner transition-all duration-200 ${getMatrixCellColors(col.level, row.level)}`}
                    >
                      {count}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Matrix Corner Spacing Placeholder Offset */}
            <div />
            
            {/* X-Axis Horizontal Bottom Target Metric Labels */}
            {consequences.map((col) => (
              <div key={`col-label-${col.level}`} className="text-center mt-1">
                <div className="text-xs font-bold text-slate-300">{col.level}</div>
                <div className="text-[9px] text-slate-400 font-medium truncate px-0.5 leading-tight">
                  {col.label}
                </div>
              </div>
            ))}
          </div>

          {/* X-Axis Primary Label */}
          <div className="mt-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-[90px]">
            Consequence
          </div>
        </div>

        {/* Right Side: Compressed Sidebar Metric Blocks */}
        <div className="grid grid-cols-2 lg:grid-col-2 gap-2 w-full">
          <MetricBlock label="Total Scenarios" value={totalScenarios} className="flex-1 lg:flex-initial" />
          
          <MetricBlock 
            label={<span>High / <span className="text-red-400 font-semibold">Critical</span></span>} 
            value={highCriticalTotal} 
            percentage={getPercentageString(highCriticalTotal)}
            toneClass="text-red-400 border-red-950 bg-red-950/20"
            className="flex-1 lg:flex-initial"
          />

          <MetricBlock 
            label="Medium" 
            value={mediumCount} 
            percentage={getPercentageString(mediumCount)}
            toneClass="text-amber-400 border-amber-950 bg-amber-950/10"
            className="flex-1 lg:flex-initial"
          />

          <MetricBlock 
            label="Low" 
            value={lowCount} 
            percentage={getPercentageString(lowCount)}
            toneClass="text-emerald-400 border-emerald-950 bg-emerald-950/10"
            className="flex-1 lg:flex-initial"
          />

          <MetricBlock 
            label="Unranked" 
            value={unrankedCount} 
            toneClass="text-slate-400 border-slate-800 bg-slate-800/20"
            className="flex-1 lg:flex-initial"
          />
        </div>
        
      </div>
    </Panel>
  );
}

/**
 * Enhanced styling maps providing clean, high-contrast matrix color blocks 
 */
function getMatrixCellColors(severity: number, likelihood: number): string {
  const score = severity * likelihood;

  // Critical Risk Zone
  if (score >= 16 || (likelihood === 5 && severity === 4)) {
    return 'border-red-500/30 bg-red-950/50 text-red-400 shadow-red-950/50';
  }
  // High Risk Zone
  if (score >= 10 || (likelihood === 4 && severity === 3) || (likelihood === 3 && severity === 4)) {
    return 'border-orange-500/30 bg-orange-950/40 text-orange-400 shadow-orange-950/40';
  }
  // Medium Risk Zone
  if (score >= 5 || (likelihood === 2 && severity === 3) || (likelihood === 3 && severity === 2)) {
    return 'border-yellow-500/20 bg-yellow-950/25 text-yellow-400 shadow-yellow-950/20';
  }
  // Low Risk Zone
  return 'border-emerald-500/20 bg-emerald-950/30 text-emerald-400 shadow-emerald-950/25';
}

// --- Layout UI Wrappers ---

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-full max-w-4xl rounded-xl border border-[var(--psm-line,#1e293b)] bg-[var(--psm-surface,#0f172a)] p-5 shadow-xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-wide text-white">{title}</h3>
        <AlertTriangle size={17} className="text-red-400 flex-shrink-0" />
      </div>
      {children}
    </section>
  );
}

interface MetricBlockProps {
  label: React.ReactNode;
  value: number;
  percentage?: string;
  toneClass?: string;
  className?: string;
}

function MetricBlock({ label, value, percentage, toneClass = 'text-white border-slate-800 bg-[#111a2e]', className = '' }: MetricBlockProps) {
  return (
    <div className={`rounded-lg border p-3 flex flex-col justify-between min-h-[64px] transition-all duration-200 ${toneClass} ${className}`}>
      <div className="text-[11px] font-semibold text-slate-400 tracking-wide leading-none">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5 leading-none">
        <span className="text-xl font-bold tracking-tight text-white">
          {value}
        </span>
        {percentage && (
          <span className="text-[10px] font-medium text-slate-500">
            ({percentage})
          </span>
        )}
      </div>
    </div>
  );
}