'use client';

import { TrainingButton, TrainingCard, TrainingEmptyState } from '../../shared/TrainingUi';
import { TrainingEvidenceStatusBadge } from '../../shared/TrainingEvidenceStatusBadge';

export function CompletionEvidencePanel({ evidence = [], onVerify, onReject, busy }: { evidence?: Record<string, any>[]; onVerify?: (id: string) => void; onReject?: (id: string) => void; busy?: boolean }) {
  return (
    <TrainingCard title="Evidence / Documents" subtitle="Evidence is linked through Document Control or storage metadata; file bytes stay out of normal DB tables.">
      {!evidence.length ? <TrainingEmptyState title="No evidence linked" message="Required evidence remains missing until a controlled document, certificate, assessment result, attendance sheet, sign-off, or other approved evidence is linked." /> : (
        <div className="space-y-3">
          {evidence.map((row) => (
            <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.document_title ?? row.file_name ?? row.evidence_title ?? row.id}</p>
                  <p className="text-sm text-[var(--psm-muted)]">{row.evidence_type ?? 'Evidence'} / {row.document_number ?? row.source_module ?? 'Uncontrolled source'}</p>
                </div>
                <TrainingEvidenceStatusBadge status={row.evidence_status ?? row.verification_status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <TrainingButton variant="secondary" onClick={() => onVerify?.(row.id)} disabled={busy} title={busy ? 'Evidence verification is already saving.' : 'Verify this evidence record.'}>Verify evidence</TrainingButton>
                <TrainingButton variant="danger" onClick={() => onReject?.(row.id)} disabled={busy} title={busy ? 'Evidence rejection is already saving.' : 'Reject requires backend reason policy.'}>Reject</TrainingButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </TrainingCard>
  );
}
