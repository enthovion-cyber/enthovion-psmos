import Link from 'next/link';
import { MocTrainingReadinessStatusBadge } from '../shared/MocTrainingReadinessStatusBadge';
import { MocTrainingRequirementStatusBadge } from '../shared/MocTrainingRequirementStatusBadge';
import { valueText } from './MocTrainingPanelPrimitives';
import type { MocTrainingRequirement } from '../types/moc-training.types';

export function TrainingMocRequirementMobileCards({ rows = [] }: { rows?: MocTrainingRequirement[] }) {
  return <div className="space-y-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/training-competency/moc-training-requirements/${row.id}`} className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{valueText(row.requirement_title)}</p><p className="text-xs text-[var(--psm-muted)]">{valueText(row.moc?.moc_number ?? row.moc_id)}</p></div><MocTrainingRequirementStatusBadge status={row.requirement_status} /></div><div className="mt-3"><MocTrainingReadinessStatusBadge status={row.readiness_status} /></div></Link>)}</div>;
}
