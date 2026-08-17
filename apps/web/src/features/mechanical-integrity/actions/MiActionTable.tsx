'use client';

import Link from 'next/link';
import type { MiWorkOrderRow } from '../types/work-order.types';
import { ActionButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { WorkOrderStatusBadge } from '../shared/WorkOrderStatusBadge';
import { WorkPriorityBadge } from '../shared/WorkPriorityBadge';

export function MiActionTable({ rows = [] }: { rows?: MiWorkOrderRow[] | undefined }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No MI actions found for the current filters.</div>;
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]"><table className="min-w-[1000px] w-full text-left text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Action / Work','Equipment','Source','Priority','Status','Assigned','Due','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-4 py-3 font-semibold">{cardValue(row.work_order_number)} - {cardValue(row.title)}</td><td className="px-4 py-3">{cardValue(row.equipment_tag ?? row.equipment_id)}</td><td className="px-4 py-3">{cardValue(row.source_module)}</td><td className="px-4 py-3"><WorkPriorityBadge priority={row.priority} /></td><td className="px-4 py-3"><WorkOrderStatusBadge status={row.status} /></td><td className="px-4 py-3">{cardValue(row.assigned_user_id)}</td><td className="px-4 py-3">{cardValue(row.due_date)}</td><td className="px-4 py-3"><Link href={`/mechanical-integrity/work-orders/${row.id}`}><ActionButton>Open</ActionButton></Link></td></tr>)}</tbody></table></div>;
}
