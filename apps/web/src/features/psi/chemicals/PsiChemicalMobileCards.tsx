import Link from 'next/link';
import { CompatibilityRiskBadge } from '../shared/CompatibilityRiskBadge';
import { HighHazardBadge } from '../shared/HighHazardBadge';
import { SdsStatusBadge } from '../shared/SdsStatusBadge';
import type { PsiChemical } from '../types/psi-chemical.types';

export function PsiChemicalMobileCards({ rows }: { rows: PsiChemical[] }) {
  return <div className="space-y-3 lg:hidden">{rows.map((row) => <article key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><Link href={`/process-safety-information/chemicals/${row.id}`} className="font-semibold text-primary">{row.chemical_name}</Link><p className="text-sm text-[var(--psm-muted)]">{row.cas_number ?? 'CAS missing'} | {row.formula ?? 'Formula missing'}</p></div><SdsStatusBadge status={row.sds_status} /></div><div className="mt-3 flex flex-wrap gap-2"><HighHazardBadge value={row.high_hazard} /><CompatibilityRiskBadge risk={row.compatibility_risk_level} /></div><dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-[var(--psm-muted)]">Use</dt><dd>{row.process_use ?? '-'}</dd></div><div><dt className="text-[var(--psm-muted)]">Max inventory</dt><dd>{row.max_intended_inventory ?? '-'} {row.inventory_unit ?? ''}</dd></div><div><dt className="text-[var(--psm-muted)]">Review</dt><dd>{row.review_status ?? 'Not Reviewed'}</dd></div><div><dt className="text-[var(--psm-muted)]">Emergency</dt><dd>{row.emergency_response_status ?? 'Not Reviewed'}</dd></div></dl></article>)}</div>;
}
