'use client';

import type { MiCml } from '../types/cml.types';
import { CmlStatusBadge } from '../shared/CmlStatusBadge';

export function CmlMobileCards({ rows, onOpen }: { rows: MiCml[]; onOpen: (cml: MiCml) => void }) {
  return <div className="grid gap-3 lg:hidden">{rows.map((row) => <button key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left shadow-sm" onClick={() => onOpen(row)}><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[var(--psm-text)]">{row.cmlNumber ?? row.cml_number}</p><p className="text-sm text-[var(--psm-muted)]">{row.location_description ?? 'Location not set'}</p></div><CmlStatusBadge value={row.alertStatus} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--psm-muted)]"><span>Remaining: {String(row.remainingLifeYears ?? '-')}</span><span>Due: {row.nextDueDate ?? '-'}</span></div></button>)}</div>;
}
