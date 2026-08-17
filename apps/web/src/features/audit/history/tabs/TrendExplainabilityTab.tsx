import { AuditCard } from '../../shared/AuditUi';

export function TrendExplainabilityTab({ explainability, trace }: { explainability: Record<string, unknown>; trace: Record<string, unknown> }) {
  return <div className="grid gap-5 xl:grid-cols-2"><AuditCard title="Explainability"><pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(explainability, null, 2)}</pre></AuditCard><AuditCard title="Calculation Trace"><pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(trace, null, 2)}</pre></AuditCard></div>;
}
