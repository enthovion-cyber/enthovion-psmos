import { TrainingCard } from '../../shared/TrainingUi';

export function TrainingMatrixGapDetailPanel({ gap }: { gap?: Record<string, any> }) {
  if (!gap) return <TrainingCard title="Gap Detail"><p className="text-sm text-[var(--psm-muted)]">Select a gap to inspect requirement reason, evidence, blocking impact, waiver, action, and lifecycle.</p></TrainingCard>;
  return <TrainingCard title={gap.gap_title} subtitle={gap.requirement_reason}><div className="grid gap-3 md:grid-cols-2"><Info label="Evidence expected" value={gap.evidence_expected} /><Info label="Evidence found" value={gap.evidence_found} /><Info label="Recommended action" value={gap.recommended_action ?? 'Request evidence or schedule training.'} /><Info label="Closure note" value={gap.closure_note} /></div></TrainingCard>;
}

function Info({ label, value }: { label: string; value?: any }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-sm font-semibold">{value ?? 'Not provided'}</p></div>; }
