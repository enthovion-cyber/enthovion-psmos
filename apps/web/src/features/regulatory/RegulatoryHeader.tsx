import { RefreshCw } from 'lucide-react';
import { RegulatoryButton } from './shared/RegulatoryUi';
import type { ReactNode } from 'react';

export function RegulatoryHeader({ title = 'Regulatory Register', subtitle, onRefresh, action }: { title?: string | undefined; subtitle?: string | undefined; onRefresh?: (() => void) | undefined; action?: ReactNode | undefined }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Regulatory Register Foundation</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-4xl text-sm text-[var(--psm-muted)]">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {onRefresh ? <RegulatoryButton variant="secondary" onClick={onRefresh}><RefreshCw size={16} />Refresh</RegulatoryButton> : null}
          {action ?? <RegulatoryButton href="/regulatory/new">Add Requirement</RegulatoryButton>}
        </div>
      </div>
    </header>
  );
}
