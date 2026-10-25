'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';

const lifecycle = [
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Implementation',
  'Pending PSSR',
  'Ready For Startup',
  'Closed'
];

export function MOCLifecycleStepper({ status }: { status: string }) {
  const activeIndex = Math.max(0, lifecycle.indexOf(status));

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm transition-colors">
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {lifecycle.map((item, index) => {
          const complete = index < activeIndex || status === 'Closed';
          const active = index === activeIndex;

          return (
            <div
              key={item}
              className={`flex min-w-[125px] flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                active
                  ? 'border-primary/60 bg-primary/10 text-primary font-bold shadow-xs'
                  : complete
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
              }`}
            >
              <div className="shrink-0">
                {complete ? (
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                ) : active ? (
                  <Clock size={15} className="text-primary animate-pulse" />
                ) : (
                  <Circle size={15} className="text-[var(--psm-muted)] opacity-60" />
                )}
              </div>
              <span className="truncate">{item}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
