import type { HazopSignoff } from '../../types/hazop-signoff.types';
import { Panel } from './HazopReadinessChecklist';

export function HazopElectronicSignaturePanel({ signoffs }: { signoffs: HazopSignoff[] }) {
  const signed = signoffs.filter((signoff) => signoff.status === 'Signed').length;
  const requested = signoffs.filter((signoff) => ['Requested', 'Pending Sign-Off'].includes(signoff.status ?? '')).length;
  const rejected = signoffs.filter((signoff) => signoff.status === 'Rejected').length;
  return (
    <Panel title="Electronic Signature / Sign-Off">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Signed" value={signed} tone="green" />
        <Metric label="Requested" value={requested} tone="blue" />
        <Metric label="Rejected" value={rejected} tone="red" />
      </div>
      <div className="mt-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm">
        <div className="font-semibold">Declaration used when signing</div>
        <p className="mt-2 text-[var(--psm-muted)]">I confirm that I have reviewed this HAZOP/PHA study, including nodes, deviations, risk ranking, safeguards, recommendations, linked records, and closure blockers, and approve it for my assigned role.</p>
      </div>
      <p className="mt-3 text-xs text-[var(--psm-muted)]">The backend verifies assignment and identity. Admin users cannot sign for another person; signed records are immutable and retain their electronic signature reference.</p>
    </Panel>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'green' | 'blue' | 'red' }) {
  const color = tone === 'green' ? 'text-emerald-300' : tone === 'blue' ? 'text-blue-300' : 'text-red-300';
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className={`text-2xl font-semibold ${color}`}>{value}</div><div className="text-xs text-[var(--psm-muted)]">{label}</div></div>;
}
