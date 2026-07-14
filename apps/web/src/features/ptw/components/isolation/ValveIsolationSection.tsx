'use client';

import { ShieldCheck, GitCommit, Layers } from 'lucide-react';
import type { PermitIsolationPoint } from '../../services/ptw-isolation.service';

export function ValveIsolationSection({ points }: { points: PermitIsolationPoint[] }) {
  const valves = points.filter((point) => point.valve_tag);

  return (
    <section className="psm-card p-5 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-1,inherit)] shadow-sm">
      {/* Section Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
            Valve Isolation
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--psm-surface-2)] border border-[var(--psm-line)]/30 text-[var(--psm-muted)]">
          {valves.length} {valves.length === 1 ? 'valve' : 'valves'}
        </span>
      </div>

      {/* Grid Layout */}
      {valves.length ? (
        <div className="grid gap-3 sm:grid-cols-1">
          {valves.map((point) => {
            const currentStatus = point.isolation_status ?? point.status;
            const isIsolated = currentStatus?.toLowerCase() === 'isolated' || currentStatus?.toLowerCase() === 'removal verified';

            return (
              <div 
                key={point.id} 
                className="group relative rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 transition-all duration-200"
              >
                {/* Upper Tag Row */}
                <div className="flex items-center justify-between gap-3 border-b border-[var(--psm-line)]/20 pb-3">
                  <div className="flex items-center gap-1.5">
                    <GitCommit size={14} className="text-primary/70" />
                    <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {point.valve_tag}
                    </span>
                  </div>
                  <span 
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                      isIsolated 
                        ? 'bg-success/10 border-success/30 text-success' 
                        : 'bg-[var(--psm-surface-1)] border-[var(--psm-line)]/40 text-[var(--psm-muted)]'
                    }`}
                  >
                    {currentStatus ?? 'Pending'}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-foreground/80 font-medium leading-relaxed min-h-[1.5rem]">
                  {point.isolation_point_description ?? point.source_description ?? 'Valve isolation point'}
                </p>

                {/* Parameters Matrix - Fixed Harsh White Borders Here */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Info label="Required Position" value={point.required_position} highlight="text-blue-400" />
                  <Info label="Actual Position" value={point.current_position} highlight="text-amber-500" />
                  <Info label="Confirmed At" value={point.confirmed_at ? new Date(point.confirmed_at).toLocaleString() : undefined} isTime />
                  <Info label="Verified By" value={point.confirmed_by} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty text="No valve-specific isolation points." />
      )}
    </section>
  );
}

{/* Beautiful flat metric styling with zero bright white borders */}
function Info({ 
  label, 
  value, 
  highlight = 'text-foreground',
  isTime = false 
}: { 
  label: string; 
  value?: string | null; 
  highlight?: string;
  isTime?: boolean;
}) {
  const displayValue = value && value.trim() !== '' ? value : '—';
  
  return (
    <div className="rounded-lg bg-[var(--psm-surface-1,inherit)]/60 border border-[var(--psm-line)]/10 p-2.5 flex flex-col justify-between">
      <span className="text-[10px] font-bold tracking-wider text-[var(--psm-muted)] uppercase opacity-60">
        {label}
      </span>
      <span 
        className={`mt-1 font-semibold tracking-tight block ${highlight} ${
          isTime && displayValue !== '—' ? 'text-[11px] leading-snug font-medium opacity-90' : 'text-xs'
        }`}
      >
        {displayValue}
      </span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)]/30 p-8 text-center flex flex-col items-center justify-center gap-2">
      <ShieldCheck size={22} className="text-[var(--psm-muted)]/40" />
      <span className="text-xs font-medium text-[var(--psm-muted)]">
        {text}
      </span>
    </div>
  );
}