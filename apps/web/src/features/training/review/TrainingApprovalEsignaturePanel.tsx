import { TrainingCard } from '../shared/TrainingUi';
import { TrainingEsignatureStatusBadge } from '../shared/TrainingEsignatureStatusBadge';
export function TrainingApprovalEsignaturePanel({ rows }: { rows?: any[] | undefined }) {
  return <TrainingCard title="E-Signatures" subtitle="Universal E-Signature links, signer, status, and decision references.">{rows?.length ? rows.map((row) => <div key={row.id} className="mb-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><div className="flex justify-between"><strong>{row.signer_user_id ?? row.esignature_id}</strong><TrainingEsignatureStatusBadge value={row.esignature_status} /></div><p className="text-xs text-[var(--psm-muted)]">{row.signed_at ? new Date(row.signed_at).toLocaleString() : 'Signature pending'}</p></div>) : <p className="text-sm text-[var(--psm-muted)]">No e-signature links were returned for this package.</p>}</TrainingCard>;
}
