import { PsiButton } from '../shared/PsiUi';

export function PsiCompletenessHeader({ title = 'PSI Completeness Engine', subtitle, onRun, isRunning }: { title?: string; subtitle?: string; onRun?: () => void; isRunning?: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Process Safety Information</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{subtitle ?? 'Central readiness, audit, PSSR blocker, MOC update, document gap, conflict, waiver, and run-history control for PSI.'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <PsiButton href="/process-safety-information/completeness/gaps" variant="secondary">Open Gaps</PsiButton>
        <PsiButton href="/process-safety-information/completeness/matrix" variant="secondary">Matrix</PsiButton>
        <PsiButton onClick={onRun} disabled={isRunning} title={isRunning ? 'Completeness run is already in progress.' : undefined}>{isRunning ? 'Running...' : 'Run Engine'}</PsiButton>
      </div>
    </div>
  );
}
