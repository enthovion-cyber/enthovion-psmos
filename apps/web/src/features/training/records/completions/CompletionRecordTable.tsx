'use client';

import Link from 'next/link';
import type { TrainingCompletionRecord } from '../../types/training-records.types';
import { CompletionStatusBadge } from '../../shared/CompletionStatusBadge';
import { TrainingApprovalStatusBadge } from '../../shared/TrainingApprovalStatusBadge';
import { TrainingEvidenceStatusBadge } from '../../shared/TrainingEvidenceStatusBadge';
import { TrainingVerificationStatusBadge } from '../../shared/TrainingVerificationStatusBadge';

export function CompletionRecordTable({ rows }: { rows: TrainingCompletionRecord[] }) {
  if (!rows.length) return <p className="rounded-lg border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">No completion records found for the selected scope.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Record', 'Worker', 'Training', 'Completion', 'Attendance', 'Evidence', 'Verification', 'Approval', 'Expiry', 'Actions'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)]">
              <td className="px-3 py-3 font-semibold"><Link className="text-primary" href={`/training-competency/training-records/records/${row.id}`}>{row.record_number ?? row.id}</Link></td>
              <td className="px-3 py-3">{row.workerName ?? row.worker_name ?? row.worker_id}</td>
              <td className="px-3 py-3"><p className="font-medium">{row.training_title ?? row.training_item_id ?? 'Library link missing'}</p><p className="text-xs text-[var(--psm-muted)]">{row.training_code ?? row.training_item_version ?? '-'}</p></td>
              <td className="px-3 py-3"><CompletionStatusBadge status={row.completion_status} /></td>
              <td className="px-3 py-3">{row.attendance_status ?? '-'}</td>
              <td className="px-3 py-3"><TrainingEvidenceStatusBadge status={row.evidence_status} /></td>
              <td className="px-3 py-3"><TrainingVerificationStatusBadge status={row.verification_status} /></td>
              <td className="px-3 py-3"><TrainingApprovalStatusBadge status={row.approval_status} /></td>
              <td className="px-3 py-3">{row.expiry_date ? new Date(row.expiry_date).toLocaleDateString() : 'Not expiring'}</td>
              <td className="px-3 py-3"><Link className="font-semibold text-primary" href={`/training-competency/training-records/records/${row.id}/edit`}>Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
