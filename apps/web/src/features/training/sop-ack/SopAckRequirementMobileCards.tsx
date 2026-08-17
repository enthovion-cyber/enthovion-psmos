import Link from 'next/link';
import type { SopAckRequirement } from '../types/sop-acknowledgement.types';
import { SopAckRequirementStatusBadge } from '../shared/SopAckRequirementStatusBadge';
import { TrainingBadge } from '../shared/TrainingUi';

export function SopAckRequirementMobileCards({ rows }: { rows: SopAckRequirement[] }) {
  return <div className="space-y-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/training-competency/sop-acknowledgements/requirements/${row.id}`} className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.requirement_title}</p><p className="text-xs text-[var(--psm-muted)]">{row.requirement_code} / {row.sop_title ?? row.document_number ?? 'Missing document'}</p></div><SopAckRequirementStatusBadge value={row.requirement_status} /></div><div className="mt-3 flex flex-wrap gap-2"><TrainingBadge>{row.current_version_policy}</TrainingBadge>{row.safety_critical ? <TrainingBadge tone="warn">Safety-critical</TrainingBadge> : null}{row.blocks_ptw_authorization || row.blocks_moc_implementation || row.blocks_pssr_startup ? <TrainingBadge tone="danger">Blocking</TrainingBadge> : null}</div></Link>)}</div>;
}
