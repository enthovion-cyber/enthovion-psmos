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

  const getPercentageString = (value: number) => {
    if (!totalScenarios) return '0%';
    return `${Math.round((value / totalScenarios) * 100)}%`;
  };

  const likelihoods = [
    { level: 5, label: 'Almost Certain' },
    { level: 4, label: 'Likely' },
    { level: 3, label: 'Possible' },
    { level: 2, label: 'Unlikely' },
    { level: 1, label: 'Rare' },
  ];

  const consequences = [
    { level: 1, label: 'Insignif.' },
    { level: 2, label: 'Minor' },
    { level: 3, label: 'Moderate' },
    { level: 4, label: 'Major' },
    { level: 5, label: 'Catastr.' },
  ];

  return (
    <Panel title="Risk Overview (Initial Risk)">
      <div className="grid gap-4 lg:grid-cols-[1fr_180px] items-start">
        {/* Left Side: Heatmap Grid */}
        <div className="flex flex-col w-full overflow-x-auto pb-1 select-none">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)] mb-1.5 pl-[76px]">
            Likelihood
          </div>
          
          <div className="grid grid-cols-[76px_repeat(5,minmax(34px,42px))] gap-1 items-center min-w-[270px]">
            {likelihoods.map((row) => (
              <React.Fragment key={row.level}>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--psm-muted)] font-medium pr-1 justify-end">
                  <span className="truncate text-right max-w-[56px]">{row.label}</span>
                  <span className="text-xs font-bold text-[var(--psm-text)] w-3 text-center">{row.level}</span>
                </div>
                
                {consequences.map((col) => {
                  const cell = matrix.find(
                    (item) => Number(item.severity) === col.level && Number(item.likelihood) === row.level
                  );
                  const count = Number(cell?.count ?? 0);
                  
                  return (
                    <div
                      key={`${col.level}-${row.level}`}
                      className={`flex h-8 w-full items-center justify-center rounded border text-xs font-bold shadow-sm transition-all ${getMatrixCellColors(col.level, row.level)}`}
                    >
                      {count}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            <div />
            
            {consequences.map((col) => (
              <div key={`col-label-${col.level}`} className="text-center mt-1">
                <div className="text-[11px] font-bold text-[var(--psm-text)]">{col.level}</div>
                <div className="text-[9px] text-[var(--psm-muted)] font-medium truncate leading-tight">
                  {col.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)] pl-[76px]">
            Consequence
          </div>
        </div>

        {/* Right Side: Sidebar Metric Blocks */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 w-full">
          <MetricBlock label="Total Scenarios" value={totalScenarios} />
          
          <MetricBlock 
            label={<span>High / <span className="text-rose-600 dark:text-rose-400 font-bold">Critical</span></span>} 
            value={highCriticalTotal} 
            percentage={getPercentageString(highCriticalTotal)}
            toneClass="text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10"
          />

          <MetricBlock 
            label="Medium" 
            value={mediumCount} 
            percentage={getPercentageString(mediumCount)}
            toneClass="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
          />

          <MetricBlock 
            label="Low" 
            value={lowCount} 
            percentage={getPercentageString(lowCount)}
            toneClass="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          />

          <MetricBlock 
            label="Unranked" 
            value={unrankedCount} 
            toneClass="text-[var(--psm-muted)] border-[var(--psm-line)] bg-[var(--psm-surface-2)]"
          />
        </div>
      </div>
    </Panel>
  );
}

function getMatrixCellColors(severity: number, likelihood: number): string {
  const score = severity * likelihood;

  if (score >= 16 || (likelihood === 5 && severity === 4)) {
    return 'border-rose-500/40 bg-rose-500/20 text-rose-700 dark:text-rose-300 dark:bg-rose-950/60';
  }
  if (score >= 10 || (likelihood === 4 && severity === 3) || (likelihood === 3 && severity === 4)) {
    return 'border-orange-500/40 bg-orange-500/20 text-orange-700 dark:text-orange-300 dark:bg-orange-950/50';
  }
  if (score >= 5 || (likelihood === 2 && severity === 3) || (likelihood === 3 && severity === 2)) {
    return 'border-amber-500/40 bg-amber-500/20 text-amber-700 dark:text-amber-300 dark:bg-amber-950/40';
  }
  return 'border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/40';
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-[var(--psm-text)]">{title}</h3>
        <AlertTriangle size={15} className="text-rose-500 shrink-0" />
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

function MetricBlock({ label, value, percentage, toneClass = 'text-[var(--psm-text)] border-[var(--psm-line)] bg-[var(--psm-surface-2)]', className = '' }: MetricBlockProps) {
  return (
    <div className={`rounded-lg border p-2 flex flex-col justify-between transition-all ${toneClass} ${className}`}>
      <div className="text-[10px] font-medium opacity-85 leading-none">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5 leading-none">
        <span className="text-lg font-bold tracking-tight">
          {value}
        </span>
        {percentage && (
          <span className="text-[10px] font-medium opacity-75">
            ({percentage})
          </span>
        )}
      </div>
    </div>
  );
}
