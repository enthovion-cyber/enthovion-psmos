import type { PsiCompletenessGap } from '../types/psi-completeness.types';
import { PsiCard } from '../shared/PsiUi';

export function PsiGapDetailPanel({ gap }: { gap?: PsiCompletenessGap | null }) {
  return <PsiCard title="Gap Detail" subtitle="Evidence expectation, source record, owner, reason, and recommended action."><dl className="grid gap-3 text-sm md:grid-cols-2">{[['Expected evidence', gap?.evidence_expected], ['Found evidence', gap?.evidence_found], ['Source module', gap?.source_module], ['Source record', gap?.source_record_title ?? gap?.source_record_id], ['Owner', gap?.owner_user_id], ['Recommended action', gap?.recommended_action]].map(([label, value]) => <div key={label} className="rounded-lg bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</dt><dd className="mt-1 font-medium">{value ?? 'Not available'}</dd></div>)}</dl></PsiCard>;
}
