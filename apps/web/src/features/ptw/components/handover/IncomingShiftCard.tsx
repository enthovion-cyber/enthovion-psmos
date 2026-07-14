import { CheckCircle2, Moon } from 'lucide-react';
import type { PermitShiftHandover } from '../../services/ptw-handover.service';

export function IncomingShiftCard({ handover, onAcknowledge, acknowledging }: { handover?: PermitShiftHandover | null | undefined; onAcknowledge: () => void; acknowledging?: boolean | undefined }) {
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><Moon size={16} /> Incoming Shift</div>
      <div className="grid gap-3 md:grid-cols-2">
        <Info label="Shift Name" value={handover?.incoming_shift_name ?? 'Not recorded'} />
        <Info label="Shift Start" value={handover?.incoming_shift_start ? new Date(handover.incoming_shift_start).toLocaleString() : '-'} />
        <Info label="Incoming Supervisor" value={handover?.incoming_supervisor_name ?? '-'} />
        <Info label="Contact" value={handover?.incoming_supervisor_contact ?? '-'} />
        <Info label="Acceptance" value={handover?.acknowledgement_status ?? 'Pending'} />
        <Info label="Signature" value={handover?.acknowledgement_signature_id ? 'Captured' : 'Missing'} />
      </div>
      <button disabled={!handover || acknowledging || handover.acknowledgement_status === 'Acknowledged'} onClick={onAcknowledge} className="psm-button psm-button-primary mt-4 w-full disabled:opacity-60"><CheckCircle2 size={16} /> {acknowledging ? 'Acknowledging...' : 'Acknowledge Incoming Shift'}</button>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}
