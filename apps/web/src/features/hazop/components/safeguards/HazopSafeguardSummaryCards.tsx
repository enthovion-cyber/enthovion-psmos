'use client';

import { AlertTriangle, CheckCircle2, ClipboardCheck, Gauge, ShieldCheck, Wrench } from 'lucide-react';

const cards = [
  { key: 'totalSafeguards', label: 'Total Safeguards', icon: ShieldCheck, tone: 'text-blue-300' },
  { key: 'creditedSafeguards', label: 'Credited', icon: CheckCircle2, tone: 'text-emerald-300' },
  { key: 'iplCandidates', label: 'IPL Candidates', icon: Gauge, tone: 'text-amber-300' },
  { key: 'iplValidated', label: 'Validated IPLs', icon: ClipboardCheck, tone: 'text-emerald-300' },
  { key: 'safeguardGaps', label: 'Open Gaps', icon: AlertTriangle, tone: 'text-red-300' },
  { key: 'proofTestsOverdue', label: 'Overdue Tests', icon: Wrench, tone: 'text-orange-300' }
];

export function HazopSafeguardSummaryCards({ summary, loading }: { summary?: Record<string, any>; loading?: boolean }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <section key={card.key} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-[var(--psm-muted)]">
              <span>{card.label}</span>
              <Icon size={16} className={card.tone} />
            </div>
            <div className={`mt-3 text-3xl font-semibold ${card.tone}`}>{loading ? '...' : summary?.[card.key] ?? 0}</div>
            <div className="mt-1 text-xs text-[var(--psm-muted)]">{card.key === 'safeguardGaps' ? 'Action engine linked' : 'Live HAZOP register'}</div>
          </section>
        );
      })}
    </div>
  );
}
