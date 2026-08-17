'use client';

import Link from 'next/link';
import type { TrainingSession } from '../../types/training-records.types';
import { TrainingApprovalStatusBadge } from '../../shared/TrainingApprovalStatusBadge';
import { TrainingSessionStatusBadge } from '../../shared/TrainingSessionStatusBadge';
import { TrainingEmptyState } from '../../shared/TrainingUi';

export function TrainingSessionTable({ rows }: { rows: TrainingSession[] }) {
  if (!rows.length) return <TrainingEmptyState title="No training sessions" message="No backend training sessions matched this scope or filter." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>
            {['Session Title', 'Required Training Item', 'Training Version', 'Site / Unit', 'Session Date', 'Instructor', 'Roster Count', 'Present', 'Absent', 'Completed', 'Pending Verification', 'Session Status', 'Approval Status', 'Actions'].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 font-semibold"><Link className="text-primary" href={`/training-competency/training-records/sessions/${row.id}`}>{row.session_title}</Link><p className="text-xs text-[var(--psm-muted)]">{row.session_code ?? 'No code'}</p></td>
              <td className="px-3 py-3">{row.training_title ?? row.training_item_id ?? 'Library link missing'}</td>
              <td className="px-3 py-3">{row.training_item_version ?? 'Not set'}</td>
              <td className="px-3 py-3">{row.site_id ?? 'Missing'}{row.unit_id ? ` / ${row.unit_id}` : ''}</td>
              <td className="px-3 py-3">{formatDate(row.start_time)}</td>
              <td className="px-3 py-3">{row.external_instructor_name ?? row.instructor_user_id ?? row.instructor_worker_id ?? 'Missing'}</td>
              <td className="px-3 py-3">{row.rosterCount ?? 0}</td>
              <td className="px-3 py-3">{row.present ?? 0}</td>
              <td className="px-3 py-3">{row.absent ?? 0}</td>
              <td className="px-3 py-3">{row.completed ?? 0}</td>
              <td className="px-3 py-3">{row.pendingVerification ?? 0}</td>
              <td className="px-3 py-3"><TrainingSessionStatusBadge status={row.session_status} /></td>
              <td className="px-3 py-3"><TrainingApprovalStatusBadge status={row.approval_status} /></td>
              <td className="px-3 py-3"><Link className="text-primary" href={`/training-competency/training-records/sessions/${row.id}/attendance`}>Record attendance</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not scheduled';
}
