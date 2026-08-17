'use client';
import { RegulatoryCard, RegulatoryEmptyState } from '../shared/RegulatoryUi';
export function RegulatoryApplicabilityCriteriaBuilder({ criteria }: { criteria?: Array<Record<string, any>> }) {
  return <RegulatoryCard title="Criteria Builder" subtitle="Criteria are stored in backend profile records and drive assessment questions.">{!criteria?.length ? <RegulatoryEmptyState title="No criteria configured" message="Add criteria through the profile APIs; no fake criteria are generated." /> : <div className="grid gap-2">{criteria.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="font-semibold">{row.sequence_no}. {row.question_text}</div><div className="text-xs text-[var(--psm-muted)]">{row.question_type} / {row.effect}</div></div>)}</div>}</RegulatoryCard>;
}
