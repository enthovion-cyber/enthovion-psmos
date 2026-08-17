'use client';

import Link from 'next/link';
import type { TrainingSession } from '../../types/training-records.types';
import { TrainingSessionStatusBadge } from '../../shared/TrainingSessionStatusBadge';

export function TrainingSessionMobileCards({ rows }: { rows: TrainingSession[] }) {
  return <div className="grid gap-3 md:hidden">{rows.map((row) => <Link key={row.id} href={`/training-competency/training-records/sessions/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.session_title}</p><p className="text-xs text-[var(--psm-muted)]">{row.training_title ?? row.training_item_id ?? 'Library link missing'}</p></div><TrainingSessionStatusBadge status={row.session_status} /></div><div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><b>{row.rosterCount ?? 0}<span className="block font-normal text-[var(--psm-muted)]">Roster</span></b><b>{row.present ?? 0}<span className="block font-normal text-[var(--psm-muted)]">Present</span></b><b>{row.pendingVerification ?? 0}<span className="block font-normal text-[var(--psm-muted)]">Verify</span></b></div></Link>)}</div>;
}
