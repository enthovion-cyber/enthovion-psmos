import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { PsiButton } from '../shared/PsiUi';

export function PsiHeader({ lastUpdated, canCreate, onRefresh }: { lastUpdated?: string | undefined; canCreate?: boolean | undefined; onRefresh?: (() => void) | undefined }) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Process Safety Information</p>
        <h1 className="mt-1 text-2xl font-bold">Process Safety Information</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Technical truth source for process hazards, safe limits, design basis, drawings, safeguards, and readiness.</p>
        {lastUpdated ? <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <PsiButton href="/process-safety-information/units/new" disabled={!canCreate} title="Requires psi.unit.create permission">Create Process Unit</PsiButton>
        <PsiButton href="/process-safety-information/reports" variant="secondary">Reports / Export</PsiButton>
        <PsiButton href="/process-safety-information/relief-systems" variant="secondary">Relief Systems</PsiButton>
        <PsiButton href="/process-safety-information/units?criticalGaps=true" variant="secondary">View Missing PSI</PsiButton>
        <PsiButton href="/process-safety-information/units?reviewOverdue=true" variant="secondary">View Review Overdue</PsiButton>
        <button type="button" onClick={onRefresh} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-4 text-sm font-semibold hover:bg-[var(--psm-surface-3)]">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
    </header>
  );
}
