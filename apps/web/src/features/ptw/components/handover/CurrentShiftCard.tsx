import { AlertTriangle, Clock } from 'lucide-react';
import type { PermitShiftHandover } from '../../services/ptw-handover.service';

export function CurrentShiftCard({ handover, permit }: { handover?: PermitShiftHandover | null | undefined; permit: any }) {
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><Clock size={16} /> Current Shift</div>
      <div className="grid gap-3 md:grid-cols-2">
        <Info label="Shift Name" value={handover?.current_shift_name ?? 'Not recorded'} />
        <Info label="Shift Window" value={handover ? `${fmt(handover.current_shift_start)} - ${fmt(handover.current_shift_end)}` : '-'} />
        <Info label="Outgoing Supervisor" value={handover?.outgoing_supervisor_name ?? permit.issuer?.displayName ?? '-'} />
        <Info label="Permit Status" value={permit.status} tone={permit.status === 'Active' ? 'success' : 'warning'} />
        <Info label="Work Progress" value={handover?.work_progress_status ?? 'Not reviewed'} />
        <Info label="Expiry Countdown" value={handover?.permit_expiry_at ? countdown(handover.permit_expiry_at) : '-'} tone={handover?.expires_within_two_hours ? 'danger' : 'default'} />
      </div>
      {handover?.expires_within_two_hours ? <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning"><AlertTriangle size={16} className="mr-2 inline" />Permit expires within 2 hours. Incoming supervisor and permit issuer must acknowledge the risk.</div> : null}
      <p className="mt-4 text-sm text-[var(--psm-muted)]">{handover?.work_progress_notes ?? permit.work_description ?? 'No work progress summary recorded.'}</p>
    </section>
  );
}

function Info({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-[var(--psm-text)]';
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className={`mt-1 text-sm font-semibold ${color}`}>{value}</div></div>;
}

function fmt(value: string) { return new Date(value).toLocaleString(); }
function countdown(value: string) {
  const minutes = Math.max(0, Math.round((new Date(value).getTime() - Date.now()) / 60000));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
