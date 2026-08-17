'use client';

import Link from 'next/link';
import type { MiSafeguardImpairment } from '../types/impairment.types';
import { ActionButton } from '../safeguards/SafeguardUiPrimitives';
import { BypassTypeBadge } from '../shared/BypassTypeBadge';
import { ExpiryStatusBadge } from '../shared/ExpiryStatusBadge';
import { ImpairmentRiskBadge } from '../shared/ImpairmentRiskBadge';
import { ImpairmentStatusBadge } from '../shared/ImpairmentStatusBadge';
import { StartupBlockedBadge } from '../shared/StartupBlockedBadge';

export function ImpairmentRegisterTable({ rows }: { rows?: MiSafeguardImpairment[] | undefined }) {
  if (!rows?.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No bypass / impairment records found for the current filters.</div>;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-[1500px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Record Number','Safeguard Tag','Safeguard Type','Equipment','Bypass / Impairment Type','Reason','Risk','Status','Start','Max Duration','Expiry','Time Remaining','Mitigation','Authorized By','Approved By','Restoration','MOC / PTW / LOTO','Startup','Last Updated','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
              <td className="px-4 py-3 font-semibold">{row.record_number}</td>
              <td className="px-4 py-3">{row.safeguard_tag}</td>
              <td className="px-4 py-3">{row.safeguard_type}</td>
              <td className="px-4 py-3">{row.equipment_tag ?? row.equipment_id ?? 'Not linked'}</td>
              <td className="px-4 py-3"><BypassTypeBadge type={row.impairment_type} /></td>
              <td className="px-4 py-3 max-w-[220px]">{row.reason}</td>
              <td className="px-4 py-3"><ImpairmentRiskBadge risk={row.risk_level} /></td>
              <td className="px-4 py-3"><ImpairmentStatusBadge status={row.status} /></td>
              <td className="px-4 py-3">{formatDate(row.start_at)}</td>
              <td className="px-4 py-3">{row.max_duration_value} {row.max_duration_unit}</td>
              <td className="px-4 py-3">{formatDate(row.expiry_at)}</td>
              <td className="px-4 py-3"><ExpiryStatusBadge status={row.expiryStatus ?? row.timeRemainingLabel} /></td>
              <td className="px-4 py-3">{row.temporary_mitigation_summary || 'Not recorded'}</td>
              <td className="px-4 py-3">{row.authorized_by || 'Pending'}</td>
              <td className="px-4 py-3">{row.approved_by || 'Pending'}</td>
              <td className="px-4 py-3">{row.restoration_status || 'Not started'}</td>
              <td className="px-4 py-3">{[row.moc_required ? 'MOC' : null, row.ptw_linked ? 'PTW' : null, row.loto_linked ? 'LOTO' : null].filter(Boolean).join(' / ') || 'None'}</td>
              <td className="px-4 py-3"><StartupBlockedBadge blocked={row.startup_blocked} /></td>
              <td className="px-4 py-3">{formatDate(row.updated_at)}</td>
              <td className="px-4 py-3"><Link href={`/mechanical-integrity/bypass-impairments/${row.id}`}><ActionButton>View</ActionButton></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not recorded';
}
