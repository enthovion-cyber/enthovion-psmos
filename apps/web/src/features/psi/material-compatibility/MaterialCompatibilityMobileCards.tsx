import Link from 'next/link';
import { CompatibilityRatingBadge, MaterialCompletenessBadge, MaterialConflictBadge } from '../shared/MaterialCompatibilityBadges';
import type { MaterialCompatibilityRow } from '../types/material-compatibility.types';

export function MaterialCompatibilityMobileCards({ rows }: { rows: MaterialCompatibilityRow[] }) {
  return <div className="grid gap-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/process-safety-information/material-compatibility/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-primary">{row.compatibility_record_number || row.compatibility_title}</p><p className="text-sm text-[var(--psm-muted)]">{row.chemical_name || 'Chemical missing'} to {row.material_family || 'material missing'}</p></div><CompatibilityRatingBadge value={row.compatibility_rating} /></div><div className="mt-3 flex flex-wrap gap-2"><MaterialCompletenessBadge value={row.completeness_status} score={row.completeness_score} /><MaterialConflictBadge value={row.conflict_status} /></div></Link>)}</div>;
}

