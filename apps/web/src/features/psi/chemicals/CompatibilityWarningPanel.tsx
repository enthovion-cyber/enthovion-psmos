import { CompatibilityRiskBadge } from '../shared/CompatibilityRiskBadge';
import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function CompatibilityWarningPanel({ checks }: { checks: Record<string, any>[] }) {
  return <PsiCard title="Compatibility Warnings" subtitle="Structured compatibility check foundation with evidence/source.">{checks.length ? <div className="space-y-2">{checks.map((check) => <div key={check.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{check.check_type}</p><CompatibilityRiskBadge risk={check.risk_level} /></div><p className="mt-1 text-sm">{check.warning_message ?? check.result_status}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">Evidence/source: {check.evidence_source ?? 'Not provided'}</p></div>)}</div> : <PsiEmptyState title="No compatibility checks yet" message="Run compatibility check to create structured warnings for storage, material, acid/base, oxidizer, water/air reactive, and listed incompatibilities." />}</PsiCard>;
}
