import Link from 'next/link';
import type { RequiredTrainingItem } from '../types/required-training.types';
import { TrainingCategoryBadge } from '../shared/TrainingCategoryBadge';
import { RequiredTrainingStatusBadge } from '../shared/RequiredTrainingStatusBadge';
import { TrainingCompetencySyncStatusBadge } from '../shared/TrainingCompetencySyncStatusBadge';
import { TrainingCriticalityBadge } from '../shared/TrainingCriticalityBadge';
import { TrainingDocumentStatusBadge } from '../shared/TrainingDocumentStatusBadge';
import { TrainingEvidencePolicyBadge } from '../shared/TrainingEvidencePolicyBadge';
import { TrainingMatrixSyncStatusBadge } from '../shared/TrainingMatrixSyncStatusBadge';
import { TrainingReviewStatusBadge } from '../shared/TrainingReviewStatusBadge';
import { TrainingTypeBadge } from '../shared/TrainingTypeBadge';
import { TrainingVersionBadge } from '../shared/TrainingVersionBadge';
import { TrainingEmptyState } from '../shared/TrainingUi';

export function RequiredTrainingTable({ rows }: { rows: RequiredTrainingItem[] }) {
  if (!rows.length) return <TrainingEmptyState title="No required training items" message="No catalog records match your current search/filter scope." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>{['Training', 'Category', 'Type', 'Scope', 'Version', 'Status', 'Review', 'Evidence', 'Recurrence', 'Matrix', 'Competency', 'Documents', 'Owner', 'Actions'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row) => (
          <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
            <td className="px-3 py-3 font-semibold"><Link className="text-primary" href={`/training-competency/required-training/library/${row.id}`}>{row.training_title}</Link><div className="text-xs text-[var(--psm-muted)]">{row.training_code}</div></td>
            <td className="px-3 py-3"><TrainingCategoryBadge value={row.training_category} /></td>
            <td className="px-3 py-3"><TrainingTypeBadge value={row.training_type} /></td>
            <td className="px-3 py-3">{row.site_id ?? 'Company / shared'}</td>
            <td className="px-3 py-3"><TrainingVersionBadge value={row.version} /></td>
            <td className="px-3 py-3"><RequiredTrainingStatusBadge value={row.status} /></td>
            <td className="px-3 py-3"><TrainingReviewStatusBadge value={row.review_status} /></td>
            <td className="px-3 py-3"><TrainingEvidencePolicyBadge value={row.evidence_policy_status} /></td>
            <td className="px-3 py-3">{row.recurrence_interval_days ? `${row.recurrence_interval_days} days` : row.recurrence_type ?? 'One-Time'}</td>
            <td className="px-3 py-3"><TrainingMatrixSyncStatusBadge value={row.matrix_sync_status} /></td>
            <td className="px-3 py-3"><TrainingCompetencySyncStatusBadge value={row.competency_sync_status} /></td>
            <td className="px-3 py-3"><TrainingDocumentStatusBadge value={row.document_status} /></td>
            <td className="px-3 py-3">{row.owner_role ?? row.owner_user_id ?? 'Missing owner'}<div className="mt-1"><TrainingCriticalityBadge value={row.criticality} critical={row.safety_critical || row.psm_critical || row.ptw_critical} /></div></td>
            <td className="px-3 py-3"><div className="flex gap-2"><Link className="font-semibold text-primary" href={`/training-competency/required-training/library/${row.id}`}>Open</Link><Link className="font-semibold text-primary" href={`/training-competency/required-training/library/${row.id}/edit`}>Edit</Link></div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
