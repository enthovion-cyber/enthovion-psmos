'use client';

import type { ReactNode } from 'react';
import { TrainingCard, TrainingProgress } from '../../shared/TrainingUi';
import { LibraryLinkMissingBadge } from '../../shared/LibraryLinkMissingBadge';
import { MatrixResolvedBadge } from '../../shared/MatrixResolvedBadge';
import { CompetencyResolvedBadge } from '../../shared/CompetencyResolvedBadge';

export function CompletionLinkedMatrixCompetencyPanel({ record, links = [] }: { record: Record<string, any>; links?: Record<string, any>[] }) {
  const completeSignals = [record.matrix_resolved, record.competency_resolved, record.blocks_cleared].filter(Boolean).length;
  return (
    <TrainingCard title="Linked Matrix / Competency / Blockers" subtitle="Verified completions feed Training Matrix, competency profile, PTW, MOC and PSSR readiness from backend state.">
      <div className="grid gap-3 md:grid-cols-3">
        <Info label="Required training item" value={record.training_item_id ? record.training_item_id : <LibraryLinkMissingBadge missing />} />
        <Info label="Matrix gap" value={<MatrixResolvedBadge resolved={Boolean(record.matrix_resolved)} />} />
        <Info label="Competency gap" value={<CompetencyResolvedBadge resolved={Boolean(record.competency_resolved)} />} />
      </div>
      <div className="mt-4"><TrainingProgress value={(completeSignals / 3) * 100} /></div>
      <div className="mt-4 grid gap-2">
        {links.length ? links.map((link) => <div key={link.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><b>{link.link_type}</b><p className="text-[var(--psm-muted)]">{link.linked_record_title ?? link.linked_record_id}</p></div>) : <p className="text-sm text-[var(--psm-muted)]">No linked matrix, competency, PTW, MOC, PSSR, SOP, PSI, HAZOP or equipment records returned by the backend.</p>}
      </div>
    </TrainingCard>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><div className="mt-1 font-semibold">{value ?? '-'}</div></div>;
}
