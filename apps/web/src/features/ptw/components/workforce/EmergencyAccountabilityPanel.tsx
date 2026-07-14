import { ShieldAlert } from 'lucide-react';
import type { WorkforceSummary } from '../../services/ptw-workforce.service';

export function EmergencyAccountabilityPanel({ summary, onCheck }: { summary?: WorkforceSummary | undefined; onCheck: () => void }) {
  const emergency = summary?.emergency;
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><ShieldAlert size={16} /> Emergency Accountability</h3><button className="psm-button psm-button-primary" onClick={onCheck}>Run Accountability Check</button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Info label="Total People Currently Signed In" value={String(emergency?.currentlySignedIn ?? 0)} />
        <Info label="Missing Sign-Out Count" value={String(emergency?.missingSignOut ?? 0)} danger={(emergency?.missingSignOut ?? 0) > 0} />
        <Info label="Last Accountability Check" value={emergency?.lastAccountabilityCheck ? new Date(emergency.lastAccountabilityCheck).toLocaleString() : '-'} />
        <Info label="Accountability Confirmed By" value={emergency?.accountabilityConfirmedBy ?? '-'} />
        <Info label="Accountability Confirmed At" value={emergency?.accountabilityConfirmedAt ? new Date(emergency.accountabilityConfirmedAt).toLocaleString() : '-'} />
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Emergency Contacts</div>
          <div className="mt-2 space-y-1 text-sm">{emergency?.emergencyContacts.length ? emergency.emergencyContacts.map((item) => <div key={`${item.workerName}-${item.phone}`}>{item.workerName}: {item.name ?? '-'} {item.phone ? `(${item.phone})` : ''}</div>) : <div className="text-[var(--psm-muted)]">No emergency contacts recorded.</div>}</div>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className={`rounded-xl border p-4 ${danger ? 'border-danger/30 bg-danger/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}><div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</div><div className={`mt-2 font-semibold ${danger ? 'text-danger' : ''}`}>{value}</div></div>;
}
