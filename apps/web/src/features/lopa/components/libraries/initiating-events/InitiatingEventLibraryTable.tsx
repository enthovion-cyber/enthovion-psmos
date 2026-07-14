'use client';

import { Archive, CheckCircle2, CopyPlus, Eye, FileUp, Pencil, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { InitiatingEventLibraryRecord, LopaLibraryResponse } from '../../../types/lopa-library.types';
import { LibraryScopeBadge, LibraryStatusBadge } from '../LibraryShared';

export function InitiatingEventLibraryTable({
  data,
  isLoading,
  onView,
  onEdit,
  onAction
}: {
  data: LopaLibraryResponse<InitiatingEventLibraryRecord> | undefined;
  isLoading?: boolean;
  onView: (record: InitiatingEventLibraryRecord) => void;
  onEdit: (record: InitiatingEventLibraryRecord) => void;
  onAction: (record: InitiatingEventLibraryRecord, action: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive') => void;
}) {
  const rows = data?.rows ?? [];
  if (isLoading) return <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-8 text-center text-slate-300">Loading initiating event library...</div>;
  if (!rows.length) return <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-8 text-center text-slate-400">No initiating event records match the current filters.</div>;
  return (
    <section className="overflow-hidden rounded-xl border border-cyan-300/10 bg-[#071525]">
      <div className="overflow-x-auto">
        <table className="min-w-[1220px] w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#0b1d31] text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              {['Event', 'Category / Mode', 'Frequency', 'Range / Confidence', 'Source', 'Scope', 'Approval', 'Revision', 'Actions'].map((head) => <th key={head} className="border-b border-cyan-300/10 px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record.id} className="border-b border-cyan-300/10 text-slate-200 hover:bg-cyan-300/5">
                <td className="px-4 py-3">
                  <button onClick={() => onView(record)} className="font-black text-blue-300 hover:text-blue-200">{record.event_code}</button>
                  <div className="mt-1 font-semibold text-white">{record.event_name}</div>
                  <div className="line-clamp-1 text-xs text-slate-500">{record.description || 'No description'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{record.event_category}</div>
                  <div className="text-xs text-slate-500">{record.failure_mode || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-black text-amber-200">{Number(record.base_frequency).toExponential(2)}</div>
                  <div className="text-xs text-slate-500">{record.frequency_unit}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{record.low_frequency ? Number(record.low_frequency).toExponential(2) : '-'} / {record.high_frequency ? Number(record.high_frequency).toExponential(2) : '-'}</div>
                  <div className="text-xs text-slate-500">{record.confidence_level || 'No confidence set'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{record.source_type}</div>
                  <div className="line-clamp-1 max-w-[220px] text-xs text-slate-500">{record.source_reference}</div>
                </td>
                <td className="px-4 py-3"><LibraryScopeBadge scope={record.scope} /></td>
                <td className="px-4 py-3"><LibraryStatusBadge status={record.approval_status} /></td>
                <td className="px-4 py-3">Rev {record.revision}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <IconButton title="View" onClick={() => onView(record)} icon={<Eye size={14} />} />
                    <IconButton title="Edit" onClick={() => onEdit(record)} icon={<Pencil size={14} />} disabled={record.approval_status === 'Approved' || record.approval_status === 'Archived'} />
                    <IconButton title="Submit review" onClick={() => onAction(record, 'submit-review')} icon={<FileUp size={14} />} disabled={record.approval_status !== 'Draft' && record.approval_status !== 'Rejected'} />
                    <IconButton title="Approve" onClick={() => onAction(record, 'approve')} icon={<CheckCircle2 size={14} />} disabled={record.approval_status !== 'Pending Review'} />
                    <IconButton title="Reject" onClick={() => onAction(record, 'reject')} icon={<XCircle size={14} />} disabled={record.approval_status !== 'Pending Review'} />
                    <IconButton title="Create revision" onClick={() => onAction(record, 'create-revision')} icon={<CopyPlus size={14} />} disabled={record.approval_status !== 'Approved'} />
                    <IconButton title="Archive" onClick={() => onAction(record, 'archive')} icon={<Archive size={14} />} disabled={record.approval_status === 'Archived'} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-cyan-300/10 px-4 py-3 text-xs text-slate-400">
        <span>Showing {rows.length} of {data?.total ?? rows.length} records</span>
        <span>Approved records are immutable; use revision for changes.</span>
      </div>
    </section>
  );
}

function IconButton({ title, icon, onClick, disabled }: { title: string; icon: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled} className="rounded-md border border-cyan-300/10 bg-[#03101d] p-2 text-slate-300 transition hover:border-blue-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">
      {icon}
    </button>
  );
}
