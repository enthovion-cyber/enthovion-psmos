import { HazopRiskBadge, HazopRiskStateCard } from './HazopRiskBadge';
import { HazopRiskMatrixCell } from './HazopRiskMatrixCell';

export function HazopRiskMatrixPanel({ data }: { data: any }) {
  const matrix = data?.matrix;
  const levels = matrix?.levels ?? [];
  const exactLevels = levels.filter((level: any) => level.severity_level && level.likelihood_level);
  const cellFor = (severity: number, likelihood: number) => exactLevels.find((level: any) => Number(level.severity_level) === severity && Number(level.likelihood_level) === likelihood);

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Risk Matrix</h3>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{matrix?.name ?? 'No risk matrix configured'} · {data?.source ?? 'Default'} · Residual risk {data?.residualEnabled ? 'enabled' : 'not enabled'}</p>
        </div>
        <span className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs text-[var(--psm-muted)]">LOPA threshold: {data?.lopaTriggerThreshold ?? 'Critical'}</span>
      </div>
      {exactLevels.length ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[520px] grid-cols-[80px_repeat(5,1fr)] gap-1 text-center text-xs">
            <div />
            {[1, 2, 3, 4, 5].map((likelihood) => <div key={likelihood} className="rounded bg-[var(--psm-surface-2)] p-2 text-[var(--psm-muted)]">L{likelihood}</div>)}
            {[5, 4, 3, 2, 1].map((severity) => (
              <MatrixRow key={severity} severity={severity} cellFor={cellFor} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-4">
          {levels.map((level: any) => <div key={level.id ?? level.level} className="rounded-lg border border-[var(--psm-line)] p-3"><HazopRiskBadge value={level.risk_level ?? level.level} /><div className="mt-2 text-xs text-[var(--psm-muted)]">Score {level.min_score ?? '-'} - {level.max_score ?? '-'}</div></div>)}
          {!levels.length ? <HazopRiskStateCard title="No matrix levels" text="Configure company/site risk matrix levels to display the full matrix." /> : null}
        </div>
      )}
    </section>
  );
}

function MatrixRow({ severity, cellFor }: { severity: number; cellFor: (severity: number, likelihood: number) => any }) {
  return (
    <>
      <div className="rounded bg-[var(--psm-surface-2)] p-2 text-[var(--psm-muted)]">S{severity}</div>
      {[1, 2, 3, 4, 5].map((likelihood) => <HazopRiskMatrixCell key={`${severity}-${likelihood}`} severity={severity} likelihood={likelihood} cell={cellFor(severity, likelihood)} />)}
    </>
  );
}
