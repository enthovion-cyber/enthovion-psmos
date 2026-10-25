import { ExecutivePanel } from './ExecutivePanel';

export function ExecutiveKpiSourceTracePanel({ trace }: { trace: Record<string, unknown> | undefined }) {
  const entries = Object.entries(trace ?? {});
  return <ExecutivePanel title="Source Trace" subtitle="Backend-limited traceability; record fields remain subject to source permissions.">{entries.length ? <dl className="grid gap-3 sm:grid-cols-2">{entries.map(([key, value]) => <div className="rounded-md border border-[var(--psm-line)] p-3" key={key}><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="mt-1 break-words text-sm text-[var(--psm-text)]">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? 'Unavailable')}</dd></div>)}</dl> : <p className="text-sm text-[var(--psm-muted)]">No source trace is available for this KPI result.</p>}</ExecutivePanel>;
}
