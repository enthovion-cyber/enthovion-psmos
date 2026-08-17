import Link from 'next/link';
import { PssrTrainingReadinessStatusBadge } from '../shared/PssrTrainingReadinessStatusBadge';
import { valueText } from './PssrTrainingPanelPrimitives';
import type { PssrTrainingReadiness } from '../types/pssr-training.types';

export function TrainingPssrReadinessMobileCards({ rows = [] }: { rows?: PssrTrainingReadiness[] }) {
  return <div className="space-y-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/training-competency/pssr-training-readiness/${row.id}`} className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{valueText(row.readiness_title)}</p><p className="text-xs text-[var(--psm-muted)]">{valueText(row.pssr?.pssr_number ?? row.pssr_id)}</p></div><PssrTrainingReadinessStatusBadge status={row.readiness_record_status ?? row.readiness_status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--psm-muted)]"><span>PSSR approval blocker: {row.pssr_approval_blocker ?? row.approval_blocker ?? 'No'}</span><span>Startup blocker: {row.startup_blocker ?? 'No'}</span></div></Link>)}</div>;
}

