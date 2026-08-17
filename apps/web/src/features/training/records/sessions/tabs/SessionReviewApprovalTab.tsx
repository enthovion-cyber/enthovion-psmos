'use client';

import { TrainingCard, TrainingProgress } from '../../../shared/TrainingUi';

export function SessionReviewApprovalTab({ data }: { data: Record<string, any> }) {
  const blockers = data.readiness?.blockers ?? [];
  return <TrainingCard title="Review & Approval"><div className="grid gap-3 md:grid-cols-3"><Info label="Approval status" value={data.session?.approval_status} /><Info label="Verification required" value={data.session?.verification_required ? 'Yes' : 'No'} /><Info label="E-signature required" value={data.session?.e_signature_required ? 'Yes' : 'No'} /></div><div className="mt-4"><TrainingProgress value={blockers.length ? 65 : 100} /></div>{blockers.length ? <ul className="mt-3 space-y-2 text-sm">{blockers.map((b: Record<string, any>) => <li key={b.code} className="rounded-lg border border-warning/30 bg-warning/10 p-2 text-warning">{b.message}</li>)}</ul> : <p className="mt-3 text-sm text-success">No backend blockers returned for session review.</p>}</TrainingCard>;
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 font-semibold">{String(value ?? '-')}</p></div>;
}
