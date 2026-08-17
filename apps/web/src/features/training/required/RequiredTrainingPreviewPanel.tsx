import Link from 'next/link';
import type { RequiredTrainingItem } from '../types/required-training.types';
import { TrainingCard, TrainingEmptyState } from '../shared/TrainingUi';
import { RequiredTrainingStatusBadge } from '../shared/RequiredTrainingStatusBadge';
import { TrainingEvidencePolicyBadge } from '../shared/TrainingEvidencePolicyBadge';

export function RequiredTrainingPreviewPanel({ title, rows, empty }: { title: string; rows?: RequiredTrainingItem[]; empty?: string }) {
  const items = rows ?? [];
  return (
    <TrainingCard title={title}>
      {!items.length ? <TrainingEmptyState title="No records" message={empty ?? 'No required training records match this panel for the current scope.'} /> : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={`/training-competency/required-training/library/${item.id}`} className="block rounded-lg border border-[var(--psm-line)] p-3 hover:bg-[var(--psm-surface-2)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--psm-fg)]">{item.training_title}</p>
                  <p className="text-xs text-[var(--psm-muted)]">{item.training_code} / {item.training_category}</p>
                </div>
                <div className="flex flex-wrap gap-2"><RequiredTrainingStatusBadge value={item.status} /><TrainingEvidencePolicyBadge value={item.evidence_policy_status} /></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </TrainingCard>
  );
}
